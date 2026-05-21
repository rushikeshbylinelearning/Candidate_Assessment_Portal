const PipelineRecord = require('./pipeline.model');
const Candidate = require('../candidate/candidate.model');
const EvaluationFormData = require('./stepData/evaluationForm.model');
const LanguageAssessmentData = require('./stepData/languageAssessment.model');
const RoleAssessmentData = require('./stepData/roleAssessment.model');
const InterviewInteractionData = require('./stepData/interviewInteraction.model');
const PostInterviewFeedbackData = require('./stepData/postInterviewFeedback.model');
const { computeAggregateScore } = require('./scoring.service');
const Question = require('../question/question.model');

// Map step types to their data models
const STEP_DATA_MODELS = {
  EVALUATION_FORM: EvaluationFormData,
  LANGUAGE_ASSESSMENT: LanguageAssessmentData,
  ROLE_BASED_ASSESSMENT: RoleAssessmentData,
  INTERVIEW_INTERACTION: InterviewInteractionData,
  POST_INTERVIEW_FEEDBACK: PostInterviewFeedbackData,
};

// Required fields for each step type — only assessmentId is required for ROLE_BASED_ASSESSMENT
const REQUIRED_FIELDS = {
  EVALUATION_FORM: [],
  LANGUAGE_ASSESSMENT: [],
  ROLE_BASED_ASSESSMENT: ['assessmentId'],
  INTERVIEW_INTERACTION: [],
  POST_INTERVIEW_FEEDBACK: [],
};

/**
 * Get current step data from Step_Data_Store
 */
const getCurrentStepData = async (pipeline) => {
  const { currentStep, stepStatus } = pipeline;

  if (!currentStep) {
    return null;
  }

  const stepStatusEntry = stepStatus[currentStep];
  if (!stepStatusEntry || !stepStatusEntry.dataRef) {
    return null;
  }

  const DataModel = STEP_DATA_MODELS[currentStep];
  if (!DataModel) {
    return null;
  }

  const stepData = await DataModel.findById(stepStatusEntry.dataRef);
  return stepData;
};

/**
 * Save partial step data (auto-save)
 */
const savePartialData = async (pipeline, stepType, partialData) => {
  const DataModel = STEP_DATA_MODELS[stepType];
  if (!DataModel) {
    throw new Error(`Invalid step type: ${stepType}`);
  }

  const stepStatusEntry = pipeline.stepStatus[stepType];

  // Find or create step data document
  let stepData;
  if (stepStatusEntry.dataRef) {
    stepData = await DataModel.findById(stepStatusEntry.dataRef);
  }

  if (!stepData) {
    stepData = new DataModel({
      candidateId: pipeline.candidateId,
      pipelineId: pipeline._id,
      stepType,
      status: 'IN_PROGRESS',
      startedAt: new Date(),
    });
  }

  // Update with partial data
  Object.assign(stepData, partialData);
  await stepData.save();

  // Update pipeline step status
  if (!stepStatusEntry.dataRef) {
    stepStatusEntry.dataRef = stepData._id;
    stepStatusEntry.status = 'IN_PROGRESS';
    stepStatusEntry.startedAt = new Date();
    await pipeline.save();
  }

  return stepData;
};

/**
 * Compute section scores and autoScore for a ROLE_BASED_ASSESSMENT step data document.
 * Reads the responses stored in the step data, looks up each question's correctAnswer,
 * and writes sectionScores + autoScore back to the document (does NOT save — caller must save).
 *
 * @param {Object} stepData - RoleAssessmentData mongoose document
 * @returns {Promise<number|null>} - The computed autoScore (accuracy %), or null if no responses
 */
const computeRoleAssessmentScore = async (stepData) => {
  if (!stepData.responses || stepData.responses.length === 0) {
    return null;
  }

  const questionIds = stepData.responses.map(r => r.questionId);
  const questions = await Question.find({ _id: { $in: questionIds } });
  const qMap = {};
  questions.forEach(q => { qMap[q._id.toString()] = q; });

  const sectionData = {
    aptitude: { earned: 0, total: 0 },
    technical: { earned: 0, total: 0 },
    reasoning: { earned: 0, total: 0 },
    communication: { earned: 0, total: 0 },
  };
  let totalEarned = 0;
  let totalPossible = 0;

  for (const resp of stepData.responses) {
    const q = qMap[resp.questionId.toString()];
    if (!q) continue;

    const cat = q.category;
    const pts = q.points || 1;

    // Only count categories we track
    if (!sectionData[cat]) continue;

    sectionData[cat].total += pts;
    totalPossible += pts;

    let correct = false;
    if (['mcq_single', 'true_false'].includes(q.type)) {
      correct = String(resp.answer) === String(q.correctAnswer);
    } else if (q.type === 'mcq_multi') {
      const ans = Array.isArray(resp.answer) ? [...resp.answer].sort() : [];
      const cor = Array.isArray(q.correctAnswer) ? [...q.correctAnswer].sort() : [];
      correct = JSON.stringify(ans) === JSON.stringify(cor);
    }
    // short_answer, scenario, coding — manual review, no auto score

    if (correct) {
      sectionData[cat].earned += pts;
      totalEarned += pts;
    }
  }

  // Compute section percentages
  const sectionScores = {};
  for (const [cat, data] of Object.entries(sectionData)) {
    sectionScores[cat] = data.total > 0 ? Math.round((data.earned / data.total) * 100) : 0;
  }

  const autoScore = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0;
  const completionRate = stepData.responses.length > 0
    ? Math.round(
        stepData.responses.filter(r => r.answer !== null && r.answer !== undefined).length
        / stepData.responses.length * 100
      )
    : 0;

  // Write back to the document (caller must save)
  stepData.sectionScores = sectionScores;
  stepData.autoScore = autoScore;
  stepData.completionRate = completionRate;

  return autoScore;
};

/**
 * Validate step submission data
 */
const validateStepData = (stepType, data) => {
  const requiredFields = REQUIRED_FIELDS[stepType] || [];
  const missingFields = [];

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missingFields.push(field);
    }
  }

  return missingFields;
};

/**
 * Advance pipeline to next step
 */
const advanceStep = async (pipeline, submittedStepType, submittedData) => {
  // 1. Validate submitted data
  const missingFields = validateStepData(submittedStepType, submittedData);
  if (missingFields.length > 0) {
    return {
      success: false,
      error: 'VALIDATION_FAILED',
      missingFields,
    };
  }

  // 2. Persist data to Step_Data_Store
  const DataModel = STEP_DATA_MODELS[submittedStepType];
  const stepStatusEntry = pipeline.stepStatus[submittedStepType];

  let stepData;
  if (stepStatusEntry.dataRef) {
    stepData = await DataModel.findById(stepStatusEntry.dataRef);
    Object.assign(stepData, submittedData);
  } else {
    stepData = new DataModel({
      candidateId: pipeline.candidateId,
      pipelineId: pipeline._id,
      stepType: submittedStepType,
      ...submittedData,
    });
  }

  stepData.status = 'COMPLETED';
  stepData.submittedAt = new Date();
  if (!stepData.startedAt) {
    stepData.startedAt = new Date();
  }

  // Compute scores for ROLE_BASED_ASSESSMENT before saving
  let computedScore = null;
  if (submittedStepType === 'ROLE_BASED_ASSESSMENT') {
    computedScore = await computeRoleAssessmentScore(stepData);
  }

  await stepData.save();

  // 3. Update pipeline step status
  stepStatusEntry.status = 'COMPLETED';
  stepStatusEntry.completedAt = new Date();
  stepStatusEntry.dataRef = stepData._id;
  if (!stepStatusEntry.startedAt) {
    stepStatusEntry.startedAt = new Date();
  }

  // Write the computed score into the pipeline step status so computeAggregateScore can use it
  if (computedScore !== null) {
    stepStatusEntry.score = computedScore;
  }

  // 4. Add to completed steps
  if (!pipeline.completedSteps.includes(submittedStepType)) {
    pipeline.completedSteps.push(submittedStepType);
  }

  // 5. Check if all assigned assessments are now completed — if so, finish the pipeline
  const assignedMap = pipeline.assignedAssessments;
  const assignedEntries = assignedMap instanceof Map
    ? Array.from(assignedMap.entries())
    : Object.entries(assignedMap || {});
  const assignedStepTypes = assignedEntries.filter(([, id]) => id).map(([st]) => st);

  const allAssignedDone = assignedStepTypes.length > 0 && assignedStepTypes.every(st => {
    const s = pipeline.stepStatus[st];
    return s?.status === 'COMPLETED' || s?.status === 'SKIPPED';
  });

  if (allAssignedDone) {
    // All assigned assessments done — finish the pipeline
    pipeline.status = 'FINISHED';
    pipeline.currentStep = null;

    const candidate = await Candidate.findById(pipeline.candidateId);
    if (candidate) {
      candidate.assessmentStatus = 'completed';
      await candidate.save();
    }

    await computeAggregateScore(pipeline);
  } else {
    // Find the next assigned step that hasn't been completed yet
    const nextAssignedStep = assignedStepTypes.find(st => {
      const s = pipeline.stepStatus[st];
      return s?.status !== 'COMPLETED' && s?.status !== 'SKIPPED';
    });

    if (nextAssignedStep) {
      pipeline.currentStep = nextAssignedStep;
      pipeline.stepStatus[nextAssignedStep].status = 'IN_PROGRESS';
      pipeline.stepStatus[nextAssignedStep].startedAt = new Date();

      const candidateDoc = await Candidate.findById(pipeline.candidateId);
      if (candidateDoc && candidateDoc.assessmentStatus !== 'completed') {
        candidateDoc.assessmentStatus = 'in_progress';
        await candidateDoc.save();
      }
    } else {
      // No more steps — finish anyway
      pipeline.status = 'FINISHED';
      pipeline.currentStep = null;

      const candidate = await Candidate.findById(pipeline.candidateId);
      if (candidate) {
        candidate.assessmentStatus = 'completed';
        await candidate.save();
      }

      await computeAggregateScore(pipeline);
    }
  }

  await pipeline.save();

  return {
    success: true,
    advanced: true,
    nextStep: pipeline.currentStep || null,
    pipelineStatus: pipeline.status,
  };
};

/**
 * Resume session - return current step and partial data
 */
const resumeSession = async (pipeline) => {
  const { currentStep, stepStatus, stepConfigSnapshot } = pipeline;

  if (!currentStep) {
    return {
      currentStep: null,
      partialData: null,
      remainingTime: null,
      stepConfig: null,
    };
  }

  // Get partial data
  const partialData = await getCurrentStepData(pipeline);

  // Get step config
  const stepConfig = stepConfigSnapshot.find(s => s.stepType === currentStep);

  // Calculate remaining time
  let remainingTime = null;
  if (stepConfig && stepConfig.timeLimitMins) {
    const stepStatusEntry = stepStatus[currentStep];
    if (stepStatusEntry.startedAt) {
      const elapsedMins = Math.floor((Date.now() - stepStatusEntry.startedAt.getTime()) / 60000);
      remainingTime = Math.max(0, stepConfig.timeLimitMins - elapsedMins);
    } else {
      remainingTime = stepConfig.timeLimitMins;
    }
  }

  return {
    currentStep,
    partialData,
    remainingTime,
    stepConfig,
  };
};

module.exports = {
  getCurrentStepData,
  savePartialData,
  validateStepData,
  advanceStep,
  resumeSession,
  computeRoleAssessmentScore,
};
