const Candidate = require('./candidate.model');
const Token = require('../token/token.model');
const Assessment = require('../assessment/assessment.model');
const ResumeData = require('../resume/resume.model');
const { parseResume } = require('../resume/parser.service');
const { generateAssessmentToken, generateAccessCode } = require('../../utils/generateToken');
const { log } = require('../../utils/logger');
const path = require('path');

exports.getCandidates = async (req, res) => {
  const { role, status, interviewStatus, search, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (role) filter.appliedRole = role;
  if (status) filter.assessmentStatus = status;
  if (interviewStatus) filter.interviewStatus = interviewStatus;
  if (search) filter.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
  ];

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [candidates, total] = await Promise.all([
    Candidate.find(filter)
      .populate('appliedRole', 'title department')
      .skip(skip).limit(parseInt(limit))
      .sort('-createdAt'),
    Candidate.countDocuments(filter),
  ]);
  res.json({ candidates, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
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
      parseResumeAsync(resumeData._id, req.file.path, fileType);
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
    );
    
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
      parseResumeAsync(resumeData._id, req.file.path, fileType);
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
  const candidate = await Candidate.findById(req.params.id).populate('appliedRole');
  if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

  // Block re-inviting candidates who are actively in progress or already completed
  if (['in_progress', 'completed'].includes(candidate.assessmentStatus)) {
    return res.status(400).json({ message: `Cannot assign assessment to a candidate with status "${candidate.assessmentStatus}"` });
  }

  const PipelineRecord = require('../pipeline/pipeline.model');
  const StepConfig = require('../pipeline/stepConfig.model');
  
  // Check if pipeline already exists
  let pipeline = await PipelineRecord.findOne({
    candidateId: candidate._id,
    roleId: candidate.appliedRole._id
  });
  
  // If no pipeline exists, create one
  if (!pipeline) {
    const stepConfig = await StepConfig.findOne({ roleId: candidate.appliedRole._id });
    
    if (!stepConfig || !stepConfig.steps || stepConfig.steps.length === 0) {
      return res.status(400).json({ 
        message: 'No evaluation pipeline configured for this role. Please configure steps first.' 
      });
    }
    
    // Build step status map
    const stepStatus = {};
    stepConfig.steps.forEach(sc => {
      stepStatus[sc.stepType] = {
        status: 'NOT_STARTED',
        score: null,
        submittedAt: null,
        dataId: null
      };
    });
    
    // Create pipeline
    pipeline = await PipelineRecord.create({
      candidateId: candidate._id,
      roleId: candidate.appliedRole._id,
      currentStep: stepConfig.steps[0].stepType,
      stepConfigSnapshot: stepConfig.steps.map((s, i) => ({
        stepType: s.stepType,
        order: s.order || i + 1,
        required: s.required,
        skip: s.skip,
        scoringWeight: s.scoringWeight,
        timeLimitMins: s.timeLimitMins || null,
      })),
      stepStatus,
      aggregateScore: null
    });
  }
  
  // Allow passing a specific assessmentId for the ROLE_BASED_ASSESSMENT step
  if (req.body.assessmentId) {
    const assessment = await Assessment.findById(req.body.assessmentId);
    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });
    
    // Store the assessment ID in the pipeline for later use
    if (!pipeline.assignedAssessments) {
      pipeline.assignedAssessments = {};
    }
    pipeline.assignedAssessments.ROLE_BASED_ASSESSMENT = req.body.assessmentId;
    await pipeline.save();
  }

  // Find or create token for this pipeline
  let token = await Token.findOne({
    candidateId: candidate._id,
    roleId: candidate.appliedRole._id,
    expiresAt: { $gt: new Date() }
  });
  
  if (!token) {
    const tokenValue = generateAssessmentToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    token = await Token.create({
      value: tokenValue,
      candidateId: candidate._id,
      roleId: candidate.appliedRole._id,
      expiresAt,
      maxUses: 999, // Allow multiple uses for pipeline
      createdBy: req.user._id,
    });
  }

  candidate.assessmentStatus = 'invited';
  candidate.timeline.push({ 
    event: 'invited', 
    description: req.body.assessmentId ? 'Assessment assigned and invitation sent' : 'Pipeline invitation sent', 
    performedBy: req.user._id 
  });
  await candidate.save();

  const assessmentLink = `${process.env.CLIENT_URL}/pipeline/${token.value}`;
  res.json({ token: token.value, assessmentLink, expiresAt });
};

exports.getTimeline = async (req, res) => {
  const candidate = await Candidate.findById(req.params.id).select('timeline name email');
  if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
  res.json(candidate.timeline);
};

/**
 * Parse resume asynchronously (helper function)
 */
async function parseResumeAsync(resumeDataId, filePath, fileType) {
  try {
    console.log(`[parseResumeAsync] Starting parsing for resumeDataId: ${resumeDataId}`);
    console.log(`[parseResumeAsync] File path: ${filePath}`);
    console.log(`[parseResumeAsync] File type: ${fileType}`);
    
    const parsedData = await parseResume(filePath, fileType);
    
    console.log(`[parseResumeAsync] Parsing completed. Status: ${parsedData.parsingStatus}`);
    
    await ResumeData.findByIdAndUpdate(resumeDataId, {
      ...parsedData,
      parsingStatus: 'completed',
    });
    
    console.log(`[parseResumeAsync] Resume data updated successfully: ${resumeDataId}`);
  } catch (error) {
    console.error(`[parseResumeAsync] Parsing error:`, error);
    await ResumeData.findByIdAndUpdate(resumeDataId, {
      parsingStatus: 'failed',
      parsingError: error.message,
    });
  }
}
