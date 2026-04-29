const PipelineRecord = require('./pipeline.model');
const Candidate = require('../candidate/candidate.model');
const EvaluationFormData = require('./stepData/evaluationForm.model');
const LanguageAssessmentData = require('./stepData/languageAssessment.model');
const RoleAssessmentData = require('./stepData/roleAssessment.model');
const InterviewInteractionData = require('./stepData/interviewInteraction.model');
const PostInterviewFeedbackData = require('./stepData/postInterviewFeedback.model');
const { computeAggregateScore } = require('./scoring.service');

// Map step types to their data models
const STEP_DATA_MODELS = {
  EVALUATION_FORM: EvaluationFormData,
  LANGUAGE_ASSESSMENT: LanguageAssessmentData,
  ROLE_BASED_ASSESSMENT: RoleAssessmentData,
  INTERVIEW_INTERACTION: InterviewInteractionData,
  POST_INTERVIEW_FEEDBACK: PostInterviewFeedbackData,
};

// Required fields for each step type
const REQUIRED_FIELDS = {
  EVALUATION_FORM: ['yearsExperience', 'currentTitle', 'noticePeriodDays'],
  LANGUAGE_ASSESSMENT: ['language', 'responses'],
  ROLE_BASED_ASSESSMENT: ['assessmentId', 'responses'],
  INTERVIEW_INTERACTION: ['interviewerId', 'conductedAt', 'questions'],
  POST_INTERVIEW_FEEDBACK: ['submittedBy', 'recommendation'],
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
  await stepData.save();

  // 3. Update pipeline step status
  stepStatusEntry.status = 'COMPLETED';
  stepStatusEntry.completedAt = new Date();
  stepStatusEntry.dataRef = stepData._id;
  if (!stepStatusEntry.startedAt) {
    stepStatusEntry.startedAt = new Date();
  }

  // 4. Add to completed steps
  if (!pipeline.completedSteps.includes(submittedStepType)) {
    pipeline.completedSteps.push(submittedStepType);
  }

  // 5. Find next step
  const sortedSteps = [...pipeline.stepConfigSnapshot].sort((a, b) => a.order - b.order);
  const currentIndex = sortedSteps.findIndex(s => s.stepType === submittedStepType);
  
  let nextStep = null;
  let nextIndex = currentIndex + 1;

  // 6. Auto-skip logic
  while (nextIndex < sortedSteps.length) {
    const candidate = sortedSteps[nextIndex];
    
    if (candidate.skip && !candidate.required) {
      // Auto-skip this step
      pipeline.stepStatus[candidate.stepType].status = 'SKIPPED';
      nextIndex++;
    } else {
      nextStep = candidate;
      break;
    }
  }

  // 7. Set next step or finish pipeline
  if (nextStep) {
    pipeline.currentStep = nextStep.stepType;
    pipeline.stepStatus[nextStep.stepType].status = 'IN_PROGRESS';
    pipeline.stepStatus[nextStep.stepType].startedAt = new Date();
  } else {
    // Pipeline finished
    pipeline.status = 'FINISHED';
    pipeline.currentStep = null;

    // Update candidate status
    const candidate = await Candidate.findById(pipeline.candidateId);
    if (candidate) {
      candidate.assessmentStatus = 'completed';
      await candidate.save();
    }

    // Compute aggregate score
    await computeAggregateScore(pipeline);
  }

  await pipeline.save();

  return {
    success: true,
    advanced: true,
    nextStep: nextStep ? nextStep.stepType : null,
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
};
