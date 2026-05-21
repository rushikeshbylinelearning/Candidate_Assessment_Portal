const PipelineRecord = require('./pipeline.model');
const StepConfiguration = require('./stepConfig.model');
const Token = require('../token/token.model');
const Candidate = require('../candidate/candidate.model');
const Role = require('../roles/role.model');
const crypto = require('crypto');
const {
  getCurrentStepData,
  savePartialData,
  advanceStep,
  resumeSession,
} = require('./workflowEngine.service');

// Map step types to their data models
const STEP_DATA_MODELS = {
  EVALUATION_FORM: require('./stepData/evaluationForm.model'),
  LANGUAGE_ASSESSMENT: require('./stepData/languageAssessment.model'),
  ROLE_BASED_ASSESSMENT: require('./stepData/roleAssessment.model'),
  INTERVIEW_INTERACTION: require('./stepData/interviewInteraction.model'),
  POST_INTERVIEW_FEEDBACK: require('./stepData/postInterviewFeedback.model'),
};

/**
 * POST /api/pipeline/session
 * Validate token, return PipelineRecord + current step data
 * Requirements: 2.1, 3.4, 4.1
 */
const createSession = async (req, res) => {
  try {
    const { pipeline, token, candidateId } = req;

    // Increment token use count
    token.useCount += 1;
    if (token.useCount === 1) {
      token.usedAt = new Date();
      token.isUsed = true;
    }
    await token.save();

    // Record session_started event in candidate timeline
    const candidate = await Candidate.findById(candidateId);
    if (candidate && candidate.timeline) {
      candidate.timeline.push({
        event: 'session_started',
        timestamp: new Date(),
        description: `Candidate started pipeline session for role ${pipeline.roleId}`,
      });
      await candidate.save();
    }

    // Get current step data
    const currentStepData = await getCurrentStepData(pipeline);

    // Get current step config
    const stepConfig = pipeline.stepConfigSnapshot.find(
      s => s.stepType === pipeline.currentStep
    );

    // Calculate remaining time if applicable
    let remainingTime = null;
    if (stepConfig && stepConfig.timeLimitMins) {
      const stepStatusEntry = pipeline.stepStatus[pipeline.currentStep];
      if (stepStatusEntry.startedAt) {
        const elapsedMins = Math.floor(
          (Date.now() - stepStatusEntry.startedAt.getTime()) / 60000
        );
        remainingTime = Math.max(0, stepConfig.timeLimitMins - elapsedMins);
      } else {
        remainingTime = stepConfig.timeLimitMins;
      }
    }

    // Fetch candidate name and role title to expose to the frontend
    const [candidateDoc, roleDoc] = await Promise.all([
      Candidate.findById(pipeline.candidateId).select('name').lean(),
      Role.findById(pipeline.roleId).select('title').lean(),
    ]);

    return res.status(200).json({
      pipelineId: pipeline._id,
      _id: pipeline._id,
      currentStep: pipeline.currentStep,
      stepStatus: pipeline.stepStatus,
      stepConfigSnapshot: pipeline.stepConfigSnapshot,
      completedSteps: pipeline.completedSteps,
      partialData: currentStepData,
      stepConfig,
      remainingTime,
      candidate: { name: candidateDoc?.name || null },
      role: { title: roleDoc?.title || null },
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to create session',
    });
  }
};

/**
 * PATCH /api/pipeline/:pipelineId/step/save
 * Auto-save partial step data
 * Requirements: 7.1
 */
const saveStep = async (req, res) => {
  try {
    const { pipelineId } = req.params;
    const { stepType, data } = req.body;

    // Verify pipeline matches authenticated pipeline
    if (req.pipeline._id.toString() !== pipelineId) {
      return res.status(403).json({
        error: 'ACCESS_DENIED',
        message: 'Pipeline ID does not match authenticated token',
      });
    }

    const pipeline = req.pipeline;

    // Validate step type
    if (!stepType || !pipeline.stepStatus[stepType]) {
      return res.status(400).json({
        error: 'INVALID_STEP_TYPE',
        message: 'Invalid or missing step type',
      });
    }

    // Save partial data
    const stepData = await savePartialData(pipeline, stepType, data);

    return res.status(200).json({
      success: true,
      message: 'Partial data saved',
      dataRef: stepData._id,
    });
  } catch (error) {
    console.error('Error saving step:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to save step data',
    });
  }
};

/**
 * POST /api/pipeline/:pipelineId/step/submit
 * Submit current step, advance pipeline
 * Requirements: 4.1, 4.3
 */
const submitStep = async (req, res) => {
  try {
    const { pipelineId } = req.params;
    const { stepType, data } = req.body;

    // Verify pipeline matches authenticated pipeline
    if (req.pipeline._id.toString() !== pipelineId) {
      return res.status(403).json({
        error: 'ACCESS_DENIED',
        message: 'Pipeline ID does not match authenticated token',
      });
    }

    const pipeline = req.pipeline;

    // Validate step type
    if (!stepType || !pipeline.stepStatus[stepType]) {
      return res.status(400).json({
        error: 'INVALID_STEP_TYPE',
        message: 'Invalid or missing step type',
      });
    }

    // Advance step
    const result = await advanceStep(pipeline, stepType, data);

    if (!result.success) {
      return res.status(422).json({
        error: result.error,
        message: 'Step validation failed',
        missingFields: result.missingFields,
      });
    }

    return res.status(200).json({
      advanced: result.advanced,
      nextStep: result.nextStep,
      pipelineStatus: result.pipelineStatus,
    });
  } catch (error) {
    console.error('Error submitting step:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to submit step',
    });
  }
};

/**
 * POST /api/pipeline/:pipelineId/resume
 * Re-enter session, return current step + partial data
 * Requirements: 7.2
 */
const resumePipeline = async (req, res) => {
  try {
    const { pipelineId } = req.params;

    // Verify pipeline matches authenticated pipeline
    if (req.pipeline._id.toString() !== pipelineId) {
      return res.status(403).json({
        error: 'ACCESS_DENIED',
        message: 'Pipeline ID does not match authenticated token',
      });
    }

    const pipeline = req.pipeline;

    // Resume session
    const sessionData = await resumeSession(pipeline);

    // Fetch candidate name and role title
    const [candidateDoc, roleDoc] = await Promise.all([
      Candidate.findById(pipeline.candidateId).select('name').lean(),
      Role.findById(pipeline.roleId).select('title').lean(),
    ]);

    return res.status(200).json({
      pipelineId: pipeline._id,
      _id: pipeline._id,
      currentStep: sessionData.currentStep,
      partialData: sessionData.partialData,
      remainingTime: sessionData.remainingTime,
      stepConfig: sessionData.stepConfig,
      stepStatus: pipeline.stepStatus,
      completedSteps: pipeline.completedSteps,
      stepConfigSnapshot: pipeline.stepConfigSnapshot,
      candidate: { name: candidateDoc?.name || null },
      role: { title: roleDoc?.title || null },
    });
  } catch (error) {
    console.error('Error resuming pipeline:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to resume pipeline',
    });
  }
};

/**
 * POST /api/pipeline/invite
 * Create PipelineRecord + Token for candidate (HR-facing)
 * Requirements: 8.1, 8.2, 8.3, 9.1, 10.5
 */
const inviteCandidate = async (req, res) => {
  try {
    const { candidateId, roleId, expiresInDays = 7, maxUses = 5 } = req.body;

    // Validate required fields
    if (!candidateId || !roleId) {
      return res.status(400).json({
        error: 'MISSING_FIELDS',
        message: 'candidateId and roleId are required',
      });
    }

    // Verify candidate exists
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({
        error: 'CANDIDATE_NOT_FOUND',
        message: 'Candidate not found',
      });
    }

    // Verify role exists and get step configuration
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        error: 'ROLE_NOT_FOUND',
        message: 'Role not found',
      });
    }

    // Check if pipeline already exists (idempotent)
    let pipeline = await PipelineRecord.findOne({ candidateId, roleId });

    if (!pipeline) {
      // Create step configuration snapshot from role
      // For now, use a default configuration - in production this would come from StepConfiguration model
      const stepConfigSnapshot = [
        { stepType: 'EVALUATION_FORM', order: 1, required: true, skip: false, scoringWeight: 20, timeLimitMins: 30 },
        { stepType: 'LANGUAGE_ASSESSMENT', order: 2, required: true, skip: false, scoringWeight: 20, timeLimitMins: 45 },
        { stepType: 'ROLE_BASED_ASSESSMENT', order: 3, required: true, skip: false, scoringWeight: 30, timeLimitMins: 60 },
        { stepType: 'INTERVIEW_INTERACTION', order: 4, required: true, skip: false, scoringWeight: 20, timeLimitMins: null },
        { stepType: 'POST_INTERVIEW_FEEDBACK', order: 5, required: true, skip: false, scoringWeight: 10, timeLimitMins: null },
      ];

      // Create pipeline record
      pipeline = new PipelineRecord({
        candidateId,
        roleId,
        stepConfigSnapshot,
        currentStep: 'EVALUATION_FORM',
        completedSteps: [],
        status: 'IN_PROGRESS',
      });

      // Initialize step status
      pipeline.stepStatus.EVALUATION_FORM.status = 'NOT_STARTED';
      pipeline.stepStatus.LANGUAGE_ASSESSMENT.status = 'NOT_STARTED';
      pipeline.stepStatus.ROLE_BASED_ASSESSMENT.status = 'NOT_STARTED';
      pipeline.stepStatus.INTERVIEW_INTERACTION.status = 'NOT_STARTED';
      pipeline.stepStatus.POST_INTERVIEW_FEEDBACK.status = 'NOT_STARTED';

      await pipeline.save();
    }

    // Create token
    const tokenValue = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const token = new Token({
      value: tokenValue,
      candidateId,
      roleId,
      assessmentId: role._id, // Using roleId as assessmentId for compatibility
      expiresAt,
      maxUses,
      useCount: 0,
      isUsed: false,
      createdBy: req.user._id,
    });

    await token.save();

    // Update pipeline with token reference
    pipeline.tokenId = token._id;
    await pipeline.save();

    // Update candidate timeline
    if (candidate.timeline) {
      candidate.timeline.push({
        event: 'pipeline_invited',
        timestamp: new Date(),
        performedBy: req.user._id,
        description: `Invited to pipeline for role ${role.title || roleId}`,
      });
      await candidate.save();
    }

    return res.status(201).json({
      pipelineId: pipeline._id,
      tokenValue,
      expiresAt,
      maxUses,
    });
  } catch (error) {
    console.error('Error inviting candidate:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to invite candidate',
    });
  }
};

/**
 * GET /api/pipeline/:pipelineId
 * Get full PipelineRecord with step statuses (HR-facing)
 * Requirements: 8.1, 8.2
 */
const getPipelineRecord = async (req, res) => {
  try {
    const { pipelineId } = req.params;

    const pipeline = await PipelineRecord.findById(pipelineId)
      .populate('candidateId', 'name email phone appliedRole')
      .populate('roleId', 'title department');

    if (!pipeline) {
      return res.status(404).json({
        error: 'PIPELINE_NOT_FOUND',
        message: 'Pipeline record not found',
      });
    }

    return res.status(200).json({
      pipelineId: pipeline._id,
      candidate: pipeline.candidateId,
      role: pipeline.roleId,
      currentStep: pipeline.currentStep,
      completedSteps: pipeline.completedSteps,
      stepStatus: pipeline.stepStatus,
      stepConfigSnapshot: pipeline.stepConfigSnapshot,
      status: pipeline.status,
      aggregateScore: pipeline.aggregateScore,
      totalTimeSpentSecs: pipeline.totalTimeSpentSecs,
      createdAt: pipeline.createdAt,
      updatedAt: pipeline.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching pipeline record:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to fetch pipeline record',
    });
  }
};

/**
 * GET /api/pipeline/candidate/:candidateId
 * Get all pipeline records for a candidate (HR-facing)
 * Requirements: 8.1
 */
const getCandidatePipelines = async (req, res) => {
  try {
    const { candidateId } = req.params;

    const pipelines = await PipelineRecord.find({ candidateId })
      .populate('roleId', 'title department')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      candidateId,
      pipelines: pipelines.map(p => ({
        pipelineId: p._id,
        role: p.roleId,
        currentStep: p.currentStep,
        completedSteps: p.completedSteps,
        status: p.status,
        aggregateScore: p.aggregateScore,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching candidate pipelines:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to fetch candidate pipelines',
    });
  }
};

/**
 * POST /api/pipeline/:pipelineId/override
 * HR override current_step (HR-facing)
 * Requirements: 9.1
 */
const overrideStep = async (req, res) => {
  try {
    const { pipelineId } = req.params;
    const { targetStep, reason } = req.body;

    // Validate reason
    if (!reason || reason.trim() === '') {
      return res.status(422).json({
        error: 'REASON_REQUIRED',
        message: 'Override reason is required and cannot be empty',
      });
    }

    // Validate target step
    const validSteps = ['EVALUATION_FORM', 'LANGUAGE_ASSESSMENT', 'ROLE_BASED_ASSESSMENT',
                        'INTERVIEW_INTERACTION', 'POST_INTERVIEW_FEEDBACK'];
    if (!targetStep || !validSteps.includes(targetStep)) {
      return res.status(400).json({
        error: 'INVALID_STEP',
        message: 'Invalid target step',
      });
    }

    const pipeline = await PipelineRecord.findById(pipelineId);
    if (!pipeline) {
      return res.status(404).json({
        error: 'PIPELINE_NOT_FOUND',
        message: 'Pipeline record not found',
      });
    }

    const previousStep = pipeline.currentStep;

    // If target step was COMPLETED, reset it
    if (pipeline.stepStatus[targetStep].status === 'COMPLETED') {
      pipeline.stepStatus[targetStep].status = 'NOT_STARTED';
      pipeline.stepStatus[targetStep].completedAt = null;
      pipeline.completedSteps = pipeline.completedSteps.filter(s => s !== targetStep);
    }

    // Set new current step
    pipeline.currentStep = targetStep;
    pipeline.stepStatus[targetStep].status = 'IN_PROGRESS';
    if (!pipeline.stepStatus[targetStep].startedAt) {
      pipeline.stepStatus[targetStep].startedAt = new Date();
    }

    await pipeline.save();

    // Update candidate timeline
    const candidate = await Candidate.findById(pipeline.candidateId);
    if (candidate && candidate.timeline) {
      candidate.timeline.push({
        event: 'hr_override',
        timestamp: new Date(),
        performedBy: req.user._id,
        description: `Override from ${previousStep || 'none'} to ${targetStep}: ${reason}`,
      });
      await candidate.save();
    }

    return res.status(200).json({
      previousStep,
      currentStep: targetStep,
      message: 'Step override successful',
    });
  } catch (error) {
    console.error('Error overriding step:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to override step',
    });
  }
};

/**
 * GET /api/pipeline/:pipelineId/step/:stepType/data
 * Retrieve step data from Step_Data_Store (HR-facing)
 * Requirements: 8.2
 */
const getStepData = async (req, res) => {
  try {
    const { pipelineId, stepType } = req.params;

    // Validate step type
    if (!STEP_DATA_MODELS[stepType]) {
      return res.status(400).json({
        error: 'INVALID_STEP_TYPE',
        message: 'Invalid step type',
      });
    }

    const pipeline = await PipelineRecord.findById(pipelineId);
    if (!pipeline) {
      return res.status(404).json({
        error: 'PIPELINE_NOT_FOUND',
        message: 'Pipeline record not found',
      });
    }

    const stepStatusEntry = pipeline.stepStatus[stepType];
    if (!stepStatusEntry || !stepStatusEntry.dataRef) {
      return res.status(404).json({
        error: 'STEP_DATA_NOT_FOUND',
        message: 'No data found for this step',
      });
    }

    const DataModel = STEP_DATA_MODELS[stepType];
    const stepData = await DataModel.findById(stepStatusEntry.dataRef);

    if (!stepData) {
      return res.status(404).json({
        error: 'STEP_DATA_NOT_FOUND',
        message: 'Step data not found',
      });
    }

    return res.status(200).json({
      stepType,
      status: stepStatusEntry.status,
      startedAt: stepStatusEntry.startedAt,
      completedAt: stepStatusEntry.completedAt,
      score: stepStatusEntry.score,
      data: stepData,
    });
  } catch (error) {
    console.error('Error fetching step data:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to fetch step data',
    });
  }
};

/**
 * GET /api/pipeline/analytics
 * Completion rates, avg scores, avg time per role (HR-facing)
 * Requirements: 10.5
 */
const getAnalytics = async (req, res) => {
  try {
    const { roleId } = req.query;

    // Build query filter
    const filter = {};
    if (roleId) {
      filter.roleId = roleId;
    }

    // Get all pipelines matching filter
    const pipelines = await PipelineRecord.find(filter).populate('roleId', 'title');

    // Group by role
    const roleStats = {};

    for (const pipeline of pipelines) {
      const roleKey = pipeline.roleId?._id?.toString() || 'unknown';
      const roleTitle = pipeline.roleId?.title || 'Unknown Role';

      if (!roleStats[roleKey]) {
        roleStats[roleKey] = {
          roleId: roleKey,
          roleTitle,
          totalPipelines: 0,
          completedPipelines: 0,
          inProgressPipelines: 0,
          totalScores: [],
          totalTimeSpentSecs: 0,
          stepStats: {},
        };
      }

      const stats = roleStats[roleKey];
      stats.totalPipelines++;

      if (pipeline.status === 'FINISHED') {
        stats.completedPipelines++;
      } else if (pipeline.status === 'IN_PROGRESS') {
        stats.inProgressPipelines++;
      }

      if (pipeline.aggregateScore != null) {
        stats.totalScores.push(pipeline.aggregateScore);
      }

      stats.totalTimeSpentSecs += pipeline.totalTimeSpentSecs || 0;

      // Per-step statistics
      for (const [stepType, stepStatus] of Object.entries(pipeline.stepStatus)) {
        if (!stats.stepStats[stepType]) {
          stats.stepStats[stepType] = {
            completed: 0,
            scores: [],
          };
        }

        if (stepStatus.status === 'COMPLETED') {
          stats.stepStats[stepType].completed++;
          if (stepStatus.score != null) {
            stats.stepStats[stepType].scores.push(stepStatus.score);
          }
        }
      }
    }

    // Compute averages
    const analytics = Object.values(roleStats).map(stats => {
      const avgScore = stats.totalScores.length > 0
        ? stats.totalScores.reduce((a, b) => a + b, 0) / stats.totalScores.length
        : null;

      const avgTimeMins = stats.totalPipelines > 0
        ? Math.round(stats.totalTimeSpentSecs / stats.totalPipelines / 60)
        : 0;

      const completionRate = stats.totalPipelines > 0
        ? (stats.completedPipelines / stats.totalPipelines) * 100
        : 0;

      const stepAnalytics = {};
      for (const [stepType, stepStat] of Object.entries(stats.stepStats)) {
        stepAnalytics[stepType] = {
          completionRate: stats.totalPipelines > 0
            ? (stepStat.completed / stats.totalPipelines) * 100
            : 0,
          avgScore: stepStat.scores.length > 0
            ? stepStat.scores.reduce((a, b) => a + b, 0) / stepStat.scores.length
            : null,
        };
      }

      return {
        roleId: stats.roleId,
        roleTitle: stats.roleTitle,
        totalPipelines: stats.totalPipelines,
        completedPipelines: stats.completedPipelines,
        inProgressPipelines: stats.inProgressPipelines,
        completionRate: Math.round(completionRate * 100) / 100,
        avgScore: avgScore ? Math.round(avgScore * 100) / 100 : null,
        avgTimeMins,
        stepAnalytics,
      };
    });

    return res.status(200).json({
      analytics,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to fetch analytics',
    });
  }
};

/**
 * POST /api/pipeline/config
 * Create StepConfiguration for a role (Admin only)
 * Requirements: 5.1, 5.2, 5.3
 */
const createStepConfiguration = async (req, res) => {
  try {
    const { roleId, steps } = req.body;

    // Validate required fields
    if (!roleId || !steps || !Array.isArray(steps)) {
      return res.status(400).json({
        error: 'MISSING_FIELDS',
        message: 'roleId and steps array are required',
      });
    }

    // Verify role exists
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        error: 'ROLE_NOT_FOUND',
        message: 'Role not found',
      });
    }

    // Check if configuration already exists
    const existingConfig = await StepConfiguration.findOne({ roleId });
    if (existingConfig) {
      return res.status(409).json({
        error: 'CONFIG_EXISTS',
        message: 'Step configuration already exists for this role. Use PUT to update.',
      });
    }

    // Validate weight sum equals 100
    const totalWeight = steps.reduce((sum, step) => sum + (step.scoringWeight || 0), 0);
    if (totalWeight !== 100) {
      return res.status(422).json({
        error: 'WEIGHT_SUM_INVALID',
        message: `Scoring weights must sum to 100. Current sum: ${totalWeight}`,
      });
    }

    // Create step configuration
    const stepConfig = new StepConfiguration({
      roleId,
      steps,
      createdBy: req.user._id,
    });

    await stepConfig.save();

    return res.status(201).json({
      message: 'Step configuration created successfully',
      config: stepConfig,
    });
  } catch (error) {
    console.error('Error creating step configuration:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to create step configuration',
    });
  }
};

/**
 * PUT /api/pipeline/config/:roleId
 * Update StepConfiguration for a role (Admin only)
 * Requirements: 5.1, 5.2, 5.3
 */
const updateStepConfiguration = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { steps } = req.body;

    // Validate required fields
    if (!steps || !Array.isArray(steps)) {
      return res.status(400).json({
        error: 'MISSING_FIELDS',
        message: 'steps array is required',
      });
    }

    // Verify role exists
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        error: 'ROLE_NOT_FOUND',
        message: 'Role not found',
      });
    }

    // Validate weight sum equals 100
    const totalWeight = steps.reduce((sum, step) => sum + (step.scoringWeight || 0), 0);
    if (totalWeight !== 100) {
      return res.status(422).json({
        error: 'WEIGHT_SUM_INVALID',
        message: `Scoring weights must sum to 100. Current sum: ${totalWeight}`,
      });
    }

    // Find and update configuration
    const stepConfig = await StepConfiguration.findOneAndUpdate(
      { roleId },
      { steps, updatedAt: new Date() },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({
      message: 'Step configuration updated successfully',
      config: stepConfig,
    });
  } catch (error) {
    console.error('Error updating step configuration:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to update step configuration',
    });
  }
};

/**
 * GET /api/pipeline/config/:roleId
 * Get StepConfiguration for a role (Admin only)
 * Requirements: 5.1, 5.2, 5.3
 */
const getStepConfiguration = async (req, res) => {
  try {
    const { roleId } = req.params;

    // Verify role exists
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        error: 'ROLE_NOT_FOUND',
        message: 'Role not found',
      });
    }

    // Find configuration
    const stepConfig = await StepConfiguration.findOne({ roleId })
      .populate('roleId', 'title department')
      .populate('createdBy', 'name email');

    if (!stepConfig) {
      return res.status(404).json({
        error: 'CONFIG_NOT_FOUND',
        message: 'No step configuration found for this role',
      });
    }

    return res.status(200).json({
      config: stepConfig,
    });
  } catch (error) {
    console.error('Error fetching step configuration:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to fetch step configuration',
    });
  }
};

/**
 * POST /api/pipeline/rms/session
 * RMS-initiated session: locate or create PipelineRecord
 * Requirements: 2.3
 */
const createRmsSession = async (req, res) => {
  try {
    const { candidateId, roleId } = req.body;

    // Validate required fields
    if (!candidateId || !roleId) {
      return res.status(400).json({
        error: 'MISSING_FIELDS',
        message: 'candidateId and roleId are required',
      });
    }

    // Verify candidate exists
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({
        error: 'CANDIDATE_NOT_FOUND',
        message: 'Candidate not found',
      });
    }

    // Verify role exists
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        error: 'ROLE_NOT_FOUND',
        message: 'Role not found',
      });
    }

    // Check if pipeline already exists (idempotent)
    let pipeline = await PipelineRecord.findOne({ candidateId, roleId });

    if (!pipeline) {
      // Create step configuration snapshot from role
      // For now, use a default configuration - in production this would come from StepConfiguration model
      const stepConfigSnapshot = [
        { stepType: 'EVALUATION_FORM', order: 1, required: true, skip: false, scoringWeight: 20, timeLimitMins: 30 },
        { stepType: 'LANGUAGE_ASSESSMENT', order: 2, required: true, skip: false, scoringWeight: 20, timeLimitMins: 45 },
        { stepType: 'ROLE_BASED_ASSESSMENT', order: 3, required: true, skip: false, scoringWeight: 30, timeLimitMins: 60 },
        { stepType: 'INTERVIEW_INTERACTION', order: 4, required: true, skip: false, scoringWeight: 20, timeLimitMins: null },
        { stepType: 'POST_INTERVIEW_FEEDBACK', order: 5, required: true, skip: false, scoringWeight: 10, timeLimitMins: null },
      ];

      // Create pipeline record
      pipeline = new PipelineRecord({
        candidateId,
        roleId,
        stepConfigSnapshot,
        currentStep: 'EVALUATION_FORM',
        completedSteps: [],
        status: 'IN_PROGRESS',
      });

      // Initialize step status
      pipeline.stepStatus.EVALUATION_FORM.status = 'NOT_STARTED';
      pipeline.stepStatus.LANGUAGE_ASSESSMENT.status = 'NOT_STARTED';
      pipeline.stepStatus.ROLE_BASED_ASSESSMENT.status = 'NOT_STARTED';
      pipeline.stepStatus.INTERVIEW_INTERACTION.status = 'NOT_STARTED';
      pipeline.stepStatus.POST_INTERVIEW_FEEDBACK.status = 'NOT_STARTED';

      await pipeline.save();
    }

    // Record session_started event in candidate timeline
    if (candidate.timeline) {
      candidate.timeline.push({
        event: 'session_started',
        timestamp: new Date(),
        description: `RMS-initiated pipeline session for role ${role.title || roleId}`,
      });
      await candidate.save();
    }

    // Get current step data
    const currentStepData = await getCurrentStepData(pipeline);

    // Get current step config
    const stepConfig = pipeline.stepConfigSnapshot.find(
      s => s.stepType === pipeline.currentStep
    );

    // Calculate remaining time if applicable
    let remainingTime = null;
    if (stepConfig && stepConfig.timeLimitMins) {
      const stepStatusEntry = pipeline.stepStatus[pipeline.currentStep];
      if (stepStatusEntry.startedAt) {
        const elapsedMins = Math.floor(
          (Date.now() - stepStatusEntry.startedAt.getTime()) / 60000
        );
        remainingTime = Math.max(0, stepConfig.timeLimitMins - elapsedMins);
      } else {
        remainingTime = stepConfig.timeLimitMins;
      }
    }

    return res.status(200).json({
      pipelineId: pipeline._id,
      _id: pipeline._id,
      currentStep: pipeline.currentStep,
      stepStatus: pipeline.stepStatus,
      stepConfigSnapshot: pipeline.stepConfigSnapshot,
      completedSteps: pipeline.completedSteps,
      partialData: currentStepData,
      stepConfig,
      remainingTime,
    });
  } catch (error) {
    console.error('Error creating RMS session:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to create RMS session',
    });
  }
};

/**
 * GET /api/pipeline/assigned-assessments
 * Returns the list of assessments assigned to the candidate's pipeline steps.
 * Candidate-facing route (Token Auth via x-pipeline-token header)
 */
const getAssignedAssessments = async (req, res) => {
  try {
    const pipeline = req.pipeline;

    const Assessment = require('../assessment/assessment.model');

    // Only return steps that have an explicitly assigned assessment
    const assignedAssessmentsMap = pipeline.assignedAssessments;

    // Collect only step types that have an assigned assessment
    const assignedStepTypes = [];
    if (assignedAssessmentsMap) {
      const entries = assignedAssessmentsMap instanceof Map
        ? Array.from(assignedAssessmentsMap.entries())
        : Object.entries(assignedAssessmentsMap);
      for (const [stepType, asmId] of entries) {
        if (asmId) assignedStepTypes.push(stepType);
      }
    }

    const assessments = [];

    for (const stepType of assignedStepTypes) {
      const stepStatus = pipeline.stepStatus[stepType] || {};
      const stepConfig = (pipeline.stepConfigSnapshot || []).find(s => s.stepType === stepType);

      // Map pipeline step status to simplified status
      let status = 'pending';
      if (stepStatus.status === 'IN_PROGRESS') status = 'in-progress';
      else if (stepStatus.status === 'COMPLETED' || stepStatus.status === 'SKIPPED') status = 'completed';

      const assignedAssessmentId = assignedAssessmentsMap instanceof Map
        ? assignedAssessmentsMap.get(stepType)
        : (assignedAssessmentsMap || {})[stepType];

      let title = stepType;
      let duration = stepConfig?.timeLimitMins ? `${stepConfig.timeLimitMins} mins` : null;
      let skills = [];
      let assessmentId = null;

      try {
        const assessment = await Assessment.findById(assignedAssessmentId).populate('roleId', 'title');
        if (assessment) {
          title = assessment.title;
          duration = duration || (assessment.duration ? `${assessment.duration} mins` : 'N/A');
          skills = (assessment.sections || []).map(s => s.name || s.category).filter(Boolean);
          assessmentId = assessment._id;
        }
      } catch (_) { /* ignore lookup errors */ }

      assessments.push({
        id: assessmentId || stepType,
        stepType,
        title,
        status,
        duration: duration || 'N/A',
        skills,
        score: stepStatus.score ?? null,
        startedAt: stepStatus.startedAt || null,
        completedAt: stepStatus.completedAt || null,
        timeLimitMins: stepConfig?.timeLimitMins || null,
        required: stepConfig?.required !== false,
      });
    }

    return res.status(200).json({ assessments });
  } catch (error) {
    console.error('Error fetching assigned assessments:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to fetch assigned assessments',
    });
  }
};

/**
 * GET /api/pipeline/assessment/:assessmentId/questions
 * Fetch questions for an assigned assessment (candidate-facing, pipeline token auth)
 * Verifies the assessment is actually assigned to this candidate's pipeline before serving questions.
 */
const getAssessmentQuestions = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const pipeline = req.pipeline;

    const Assessment = require('../assessment/assessment.model');
    const Question = require('../question/question.model');

    // Verify this assessment is actually assigned to this pipeline
    const assignedMap = pipeline.assignedAssessments;
    let isAssigned = false;
    if (assignedMap) {
      const entries = assignedMap instanceof Map
        ? Array.from(assignedMap.values())
        : Object.values(assignedMap);
      isAssigned = entries.some(id => id && id.toString() === assessmentId);
    }

    if (!isAssigned) {
      return res.status(403).json({
        error: 'ACCESS_DENIED',
        message: 'This assessment is not assigned to your pipeline',
      });
    }

    // Fetch assessment with selectedQuestions populated
    const assessment = await Assessment.findById(assessmentId)
      .populate('roleId', 'title')
      .populate({ path: 'selectedQuestions', select: '-correctAnswer -explanation' });

    if (!assessment) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Assessment not found' });
    }

    let questions = assessment.selectedQuestions || [];

    // Fallback: if no selectedQuestions, fetch by role + sections
    if (questions.length === 0 && assessment.sections && assessment.sections.length > 0) {
      for (const section of assessment.sections) {
        const sectionQs = await Question.find({
          category: section.category,
          difficulty: section.difficulty === 'mixed'
            ? { $in: ['easy', 'medium', 'hard'] }
            : section.difficulty,
          active: true,
        })
          .select('-correctAnswer -explanation')
          .limit(section.questionCount * 3);

        let picked = assessment.randomizeQuestions
          ? sectionQs.sort(() => Math.random() - 0.5).slice(0, section.questionCount)
          : sectionQs.slice(0, section.questionCount);

        if (assessment.randomizeOptions) {
          picked = picked.map(q => {
            const obj = q.toObject();
            if (obj.options && obj.options.length > 0) {
              obj.options = obj.options.sort(() => Math.random() - 0.5);
            }
            return obj;
          });
        }
        questions.push(...picked);
      }
    }

    // Randomize question order if enabled
    if (assessment.randomizeQuestions && questions.length > 0) {
      questions = [...questions].sort(() => Math.random() - 0.5);
    }

    return res.status(200).json({
      assessment: {
        _id: assessment._id,
        title: assessment.title,
        description: assessment.description,
        duration: assessment.duration,
        totalQuestions: assessment.totalQuestions || questions.length,
        allowBacktrack: assessment.allowBacktrack,
        passThreshold: assessment.passThreshold,
        sections: assessment.sections,
      },
      questions,
    });
  } catch (error) {
    console.error('Error fetching assessment questions:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to fetch assessment questions',
    });
  }
};

/**
 * POST /api/pipeline/:pipelineId/recompute-scores
 * Recompute and backfill scores for a completed pipeline (HR-facing).
 * Useful for pipelines completed before the scoring fix was deployed.
 */
const recomputePipelineScores = async (req, res) => {
  try {
    const { pipelineId } = req.params;
    const { computeRoleAssessmentScore } = require('./workflowEngine.service');
    const { computeAggregateScore } = require('./scoring.service');

    const pipeline = await PipelineRecord.findById(pipelineId);
    if (!pipeline) {
      return res.status(404).json({ error: 'PIPELINE_NOT_FOUND', message: 'Pipeline not found' });
    }

    const results = {};

    // Recompute score for ROLE_BASED_ASSESSMENT if it was completed
    const roleStepStatus = pipeline.stepStatus['ROLE_BASED_ASSESSMENT'];
    if (roleStepStatus && roleStepStatus.status === 'COMPLETED' && roleStepStatus.dataRef) {
      const RoleAssessmentData = STEP_DATA_MODELS['ROLE_BASED_ASSESSMENT'];
      const stepData = await RoleAssessmentData.findById(roleStepStatus.dataRef);
      if (stepData) {
        const score = await computeRoleAssessmentScore(stepData);
        await stepData.save();
        if (score !== null) {
          roleStepStatus.score = score;
        }
        results.ROLE_BASED_ASSESSMENT = { score, sectionScores: stepData.sectionScores };
      }
    }

    await pipeline.save();

    // Recompute aggregate score
    if (pipeline.status === 'FINISHED') {
      const aggregateScore = await computeAggregateScore(pipeline);
      results.aggregateScore = aggregateScore;
    }

    return res.status(200).json({ message: 'Scores recomputed successfully', results });
  } catch (error) {
    console.error('Error recomputing pipeline scores:', error);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to recompute scores' });
  }
};

module.exports = {
  createSession,
  saveStep,
  submitStep,
  resumePipeline,
  inviteCandidate,
  getPipelineRecord,
  getCandidatePipelines,
  overrideStep,
  getStepData,
  getAnalytics,
  createStepConfiguration,
  updateStepConfiguration,
  getStepConfiguration,
  createRmsSession,
  getAssignedAssessments,
  getAssessmentQuestions,
  recomputePipelineScores,
};
