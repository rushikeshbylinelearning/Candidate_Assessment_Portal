const Candidate = require('./candidate.model');
const Assessment = require('../assessment/assessment.model');
const ResumeData = require('../resume/resume.model');
const { scheduleResumeParse } = require('../../services/resumeParse.service');
const appLogger = require('../../utils/appLogger');
const { generateAccessCode } = require('../../utils/generateToken');
const { log } = require('../../utils/logger');
const path = require('path');

exports.getCandidates = async (req, res) => {
  const {
    role, status, interviewStatus, search, experienceLevel,
    page = 1, limit = 50,
  } = req.query;
  const filter = {};
  if (role) filter.appliedRole = role;
  if (status) filter.assessmentStatus = status;
  if (interviewStatus) filter.interviewStatus = interviewStatus;
  if (experienceLevel) filter.experienceLevel = experienceLevel;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const skip = (pageNum - 1) * limitNum;

  const [candidates, total] = await Promise.all([
    Candidate.find(filter)
      .populate('appliedRole', 'title department')
      .skip(skip)
      .limit(limitNum)
      .sort('-createdAt')
      .lean(),
    Candidate.countDocuments(filter),
  ]);

  const PipelineRecord = require('../pipeline/pipeline.model');
  const candidateIds = candidates.map((c) => c._id);
  const roleIds = [...new Set(candidates.map((c) => c.appliedRole?._id).filter(Boolean))];

  const pipelines = candidateIds.length > 0
    ? await PipelineRecord.find({
      candidateId: { $in: candidateIds },
      roleId: { $in: roleIds },
    }).lean()
    : [];

  const pipelineKey = (cid, rid) => `${cid}:${rid}`;
  const pipelineByKey = new Map();
  pipelines.forEach((p) => {
    pipelineByKey.set(pipelineKey(String(p.candidateId), String(p.roleId)), p);
  });

  const enrichedCandidates = candidates.map((c) => {
    const pipeline = pipelineByKey.get(
      pipelineKey(String(c._id), String(c.appliedRole?._id))
    );

    let assignmentCount = 0;
    let hasCompletedSteps = false;
    let allAssignedCompleted = false;

    if (pipeline?.assignedAssessments) {
      const assignedMap = pipeline.assignedAssessments;
      const entries = assignedMap instanceof Map
        ? Array.from(assignedMap.entries())
        : Object.entries(assignedMap);

      const assignedStepTypes = entries.filter(([, id]) => id).map(([stepType]) => stepType);
      assignmentCount = assignedStepTypes.length;

      if (assignmentCount > 0) {
        allAssignedCompleted = assignedStepTypes.every((stepType) => {
          const stepStatus = pipeline.stepStatus?.[stepType];
          return stepStatus?.status === 'COMPLETED' || stepStatus?.status === 'SKIPPED';
        });
      }
    }

    if (pipeline?.completedSteps?.length > 0) {
      hasCompletedSteps = true;
    }

    let computedStatus = c.assessmentStatus;
    if (allAssignedCompleted && assignmentCount > 0) {
      computedStatus = 'completed';
    } else if (pipeline?.status === 'FINISHED') {
      computedStatus = 'completed';
    }

    return {
      ...c,
      assignmentCount,
      hasCompletedSteps,
      assessmentStatus: computedStatus,
    };
  });

  res.json({
    candidates: enrichedCandidates,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
  });
};

exports.getCandidate = async (req, res) => {
  const candidate = await Candidate.findById(req.params.id).populate('appliedRole');
  if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
  res.json(candidate);
};

exports.createCandidate = async (req, res) => {
  try {
    const candidateData = { ...req.body, addedBy: req.user._id };
    
    // Generate unique 6-digit access code
    let accessCode;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!isUnique && attempts < maxAttempts) {
      accessCode = generateAccessCode();
      const existing = await Candidate.findOne({ accessCode });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }
    
    if (!isUnique) {
      return res.status(500).json({ message: 'Failed to generate unique access code. Please try again.' });
    }
    
    candidateData.accessCode = accessCode;
    
    // If resume file was uploaded, add the file path
    if (req.file) {
      candidateData.resumeUrl = `/uploads/resumes/${req.file.filename}`;
      console.log(`[createCandidate] Resume file uploaded: ${req.file.filename}`);
      console.log(`[createCandidate] File path: ${req.file.path}`);
    }
    
    const candidate = await Candidate.create(candidateData);
    candidate.timeline.push({ 
      event: 'created', 
      description: 'Candidate added to system', 
      performedBy: req.user._id 
    });
    await candidate.save();
    await log({ 
      userId: req.user._id, 
      action: 'CREATE_CANDIDATE', 
      entity: 'candidate', 
      entityId: candidate._id 
    });
    
    // If resume was uploaded, trigger parsing
    if (req.file) {
      const fileType = path.extname(req.file.filename).slice(1).toLowerCase();
      console.log(`[createCandidate] Creating ResumeData record for candidate: ${candidate._id}`);
      
      const resumeData = await ResumeData.create({
        candidateId: candidate._id,
        fileUrl: candidateData.resumeUrl,
        fileType,
        parsingStatus: 'processing',
      });
      
      console.log(`[createCandidate] ResumeData created with ID: ${resumeData._id}`);
      console.log(`[createCandidate] Triggering async parsing...`);
      
      // Parse asynchronously
      scheduleResumeParse(resumeData._id, req.file.path, fileType, candidate);
    }
    
    res.status(201).json(candidate);
  } catch (error) {
    console.error(`[createCandidate] Error:`, error);
    res.status(400).json({ message: error.message });
  }
};

exports.updateCandidate = async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // If resume file was uploaded, add the file path
    if (req.file) {
      updateData.resumeUrl = `/uploads/resumes/${req.file.filename}`;
    }
    
    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('appliedRole');
    
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    
    // If resume was uploaded, trigger parsing
    if (req.file) {
      const fileType = path.extname(req.file.filename).slice(1).toLowerCase();
      
      let resumeData = await ResumeData.findOne({ candidateId: candidate._id });
      if (resumeData) {
        resumeData.fileUrl = updateData.resumeUrl;
        resumeData.fileType = fileType;
        resumeData.uploadedAt = new Date();
        resumeData.parsingStatus = 'processing';
        await resumeData.save();
      } else {
        resumeData = await ResumeData.create({
          candidateId: candidate._id,
          fileUrl: updateData.resumeUrl,
          fileType,
          parsingStatus: 'processing',
        });
      }
      
      // Parse asynchronously
      scheduleResumeParse(resumeData._id, req.file.path, fileType, candidate);
    }
    
    res.json(candidate);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    
    await log({ 
      userId: req.user._id, 
      action: 'DELETE_CANDIDATE', 
      entity: 'candidate', 
      entityId: candidate._id 
    });
    
    res.json({ message: 'Candidate deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  const { status, interviewStatus, finalDecision, recommendation } = req.body;
  const update = {};
  if (status) update.assessmentStatus = status;
  if (interviewStatus) update.interviewStatus = interviewStatus;
  if (finalDecision) update.finalDecision = finalDecision;
  if (recommendation) update.recommendation = recommendation;

  const candidate = await Candidate.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

  candidate.timeline.push({
    event: 'status_update',
    description: `Status updated: ${JSON.stringify(update)}`,
    performedBy: req.user._id,
  });
  await candidate.save();
  res.json(candidate);
};

exports.inviteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id).populate('appliedRole');
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

    if (!candidate.appliedRole) {
      return res.status(400).json({ message: 'Candidate has no applied role assigned.' });
    }

    const PipelineRecord = require('../pipeline/pipeline.model');

    // Check if pipeline already exists
    let pipeline = await PipelineRecord.findOne({
      candidateId: candidate._id,
      roleId: candidate.appliedRole._id
    });

    // If no pipeline exists, create a single-step pipeline (ROLE_BASED_ASSESSMENT only)
    if (!pipeline) {
      pipeline = await PipelineRecord.create({
        candidateId: candidate._id,
        roleId: candidate.appliedRole._id,
        currentStep: 'ROLE_BASED_ASSESSMENT',
        stepConfigSnapshot: [
          { stepType: 'ROLE_BASED_ASSESSMENT', order: 1, required: true, skip: false, scoringWeight: 100, timeLimitMins: null },
        ],
        stepStatus: {
          ROLE_BASED_ASSESSMENT: { status: 'NOT_STARTED' },
        },
        aggregateScore: null,
      });
    }

    // Support assigning multiple assessments: { assessmentIds: { STEP_TYPE: id, ... } }
    // Also support legacy single assessmentId (assigns to ROLE_BASED_ASSESSMENT)
    const { assessmentIds, assessmentId } = req.body;

    const assignmentsToProcess = assessmentIds || (assessmentId ? { ROLE_BASED_ASSESSMENT: assessmentId } : null);

    if (assignmentsToProcess && typeof assignmentsToProcess === 'object') {
      for (const [stepType, asmId] of Object.entries(assignmentsToProcess)) {
        const assessment = await Assessment.findById(asmId);
        if (!assessment) {
          return res.status(404).json({ message: `Assessment not found: ${asmId}` });
        }
        pipeline.assignedAssessments.set(stepType, asmId);
      }
      await pipeline.save();
    }

    // Update candidate status to invited if not already further along
    if (!['in_progress', 'completed'].includes(candidate.assessmentStatus)) {
      candidate.assessmentStatus = 'invited';
    }

    const assignedCount = assignmentsToProcess ? Object.keys(assignmentsToProcess).length : 0;
    candidate.timeline.push({
      event: 'assessment_assigned',
      description: assignedCount > 0
        ? `${assignedCount} assessment(s) assigned to pipeline`
        : 'Pipeline updated',
      performedBy: req.user._id
    });
    await candidate.save();

    res.json({
      success: true,
      message: assignedCount > 0
        ? `${assignedCount} assessment(s) assigned successfully`
        : 'Pipeline updated successfully',
      pipelineId: pipeline._id,
      assignedAssessments: Object.fromEntries(pipeline.assignedAssessments || new Map()),
    });
  } catch (error) {
    console.error('[inviteCandidate] Error:', error);
    res.status(500).json({ message: error.message || 'Failed to assign assessments' });
  }
};

exports.getTimeline = async (req, res) => {
  const candidate = await Candidate.findById(req.params.id).select('timeline name email');
  if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
  res.json(candidate.timeline);
};

exports.getAssignedAssessments = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id).populate('appliedRole');
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

    const PipelineRecord = require('../pipeline/pipeline.model');
    const Assessment = require('../assessment/assessment.model');

    // Find pipeline for this candidate
    const pipeline = await PipelineRecord.findOne({
      candidateId: candidate._id,
      roleId: candidate.appliedRole?._id
    });

    if (!pipeline || !pipeline.assignedAssessments) {
      return res.json({ assignments: [] });
    }

    // Convert Map to array of { stepType, assessmentId, assessment, status }
    const assignedMap = pipeline.assignedAssessments;
    const entries = assignedMap instanceof Map 
      ? Array.from(assignedMap.entries()) 
      : Object.entries(assignedMap);

    const assignments = [];
    for (const [stepType, assessmentId] of entries) {
      if (assessmentId) {
        const assessment = await Assessment.findById(assessmentId);
        const stepStatus = pipeline.stepStatus[stepType];
        
        assignments.push({
          stepType,
          assessmentId: assessmentId.toString(),
          assessment: assessment ? {
            _id: assessment._id,
            title: assessment.title,
            duration: assessment.duration,
            totalQuestions: assessment.totalQuestions,
          } : null,
          status: stepStatus?.status || 'NOT_STARTED',
          isCompleted: stepStatus?.status === 'COMPLETED',
          isInProgress: stepStatus?.status === 'IN_PROGRESS',
        });
      }
    }

    res.json({ assignments });
  } catch (error) {
    console.error('[getAssignedAssessments] Error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch assigned assessments' });
  }
};

exports.removeAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.body;
    const candidate = await Candidate.findById(req.params.id).populate('appliedRole');
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

    const PipelineRecord = require('../pipeline/pipeline.model');
    const pipeline = await PipelineRecord.findOne({
      candidateId: candidate._id,
      roleId: candidate.appliedRole?._id
    });

    if (!pipeline) {
      return res.status(404).json({ message: 'Pipeline not found' });
    }

    // Find which step type has this assessment
    const assignedMap = pipeline.assignedAssessments;
    const entries = assignedMap instanceof Map 
      ? Array.from(assignedMap.entries()) 
      : Object.entries(assignedMap);

    let removedStepType = null;
    for (const [stepType, asmId] of entries) {
      if (asmId && asmId.toString() === assessmentId) {
        // Check if assessment is completed or in progress
        const stepStatus = pipeline.stepStatus[stepType];
        if (stepStatus?.status === 'COMPLETED') {
          return res.status(400).json({ 
            message: 'Cannot remove completed assessment',
            cannotRemove: true 
          });
        }
        if (stepStatus?.status === 'IN_PROGRESS') {
          return res.status(400).json({ 
            message: 'Assessment is in progress. Removing it will discard progress.',
            requiresConfirmation: true 
          });
        }

        // Remove the assessment
        pipeline.assignedAssessments.delete(stepType);
        removedStepType = stepType;
        break;
      }
    }

    if (!removedStepType) {
      return res.status(404).json({ message: 'Assessment not found in pipeline' });
    }

    await pipeline.save();

    candidate.timeline.push({
      event: 'assessment_removed',
      description: `Assessment removed from ${removedStepType}`,
      performedBy: req.user._id
    });
    await candidate.save();

    res.json({ 
      success: true, 
      message: 'Assessment removed successfully',
      removedStepType 
    });
  } catch (error) {
    console.error('[removeAssessment] Error:', error);
    res.status(500).json({ message: error.message || 'Failed to remove assessment' });
  }
};

