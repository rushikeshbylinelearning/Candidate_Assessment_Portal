const Token = require('./token.model');
const Candidate = require('../candidate/candidate.model');
const Assessment = require('../assessment/assessment.model');
const Question = require('../question/question.model');
const Response = require('../response/response.model');
const Score = require('../scoring/score.model');
const { computeScore } = require('../scoring/scoring.service');
const { generateAssessmentToken } = require('../../utils/generateToken');

// GET /api/tokens/session/:token — validate token and return session data
exports.getSession = async (req, res) => {
  const token = await Token.findOne({ value: req.params.token })
    .populate('candidateId', 'name email appliedRole assessmentStatus')
    .populate('assessmentId')
    .populate('roleId', 'title department scoringWeights');

  if (!token) return res.status(404).json({ message: 'Invalid assessment link' });
  if (token.expiresAt < new Date()) return res.status(410).json({ message: 'This assessment link has expired' });
  if (token.isUsed && token.useCount >= token.maxUses) {
    return res.status(409).json({ message: 'This assessment has already been submitted' });
  }

  // Check if already completed
  const existingScore = await Score.findOne({ candidateId: token.candidateId._id, assessmentId: token.assessmentId._id });
  if (existingScore && existingScore.resultStatus !== 'pending') {
    return res.status(409).json({ message: 'Assessment already completed', score: existingScore });
  }

  // Get questions for this assessment
  const assessment = token.assessmentId;
  let questions = [];

  for (const section of assessment.sections) {
    const sectionQuestions = await Question.find({
      category: section.category,
      difficulty: section.difficulty === 'mixed' ? { $in: ['easy', 'medium', 'hard'] } : section.difficulty,
      active: true,
    }).select('-correctAnswer -explanation').limit(section.questionCount * 3);

    let picked = sectionQuestions;
    if (assessment.randomizeQuestions) {
      picked = sectionQuestions.sort(() => Math.random() - 0.5).slice(0, section.questionCount);
    } else {
      picked = sectionQuestions.slice(0, section.questionCount);
    }

    if (assessment.randomizeOptions) {
      picked = picked.map(q => {
        const qObj = q.toObject();
        if (qObj.options && qObj.options.length > 0) {
          qObj.options = qObj.options.sort(() => Math.random() - 0.5);
        }
        return qObj;
      });
    }
    questions.push(...picked);
  }

  // Recover existing answers
  const existingResponses = await Response.find({
    candidateId: token.candidateId._id,
    assessmentId: assessment._id,
  }).select('questionId answer timeSpent');

  res.json({
    token: token.value,
    candidate: token.candidateId,
    assessment: {
      _id: assessment._id,
      title: assessment.title,
      description: assessment.description,
      duration: assessment.duration,
      totalQuestions: assessment.totalQuestions,
      allowBacktrack: assessment.allowBacktrack,
      sections: assessment.sections,
    },
    role: token.roleId,
    questions,
    existingResponses,
    expiresAt: token.expiresAt,
  });
};

// POST /api/tokens/start
exports.startAssessment = async (req, res) => {
  const { tokenValue } = req.body;
  const token = await Token.findOne({ value: tokenValue });
  if (!token) return res.status(404).json({ message: 'Invalid token' });
  if (token.expiresAt < new Date()) return res.status(410).json({ message: 'Token expired' });

  // Create or update score record with start time
  await Score.findOneAndUpdate(
    { candidateId: token.candidateId, assessmentId: token.assessmentId },
    { $setOnInsert: { candidateId: token.candidateId, assessmentId: token.assessmentId, roleId: token.roleId, startedAt: new Date() } },
    { upsert: true, new: true }
  );

  await Candidate.findByIdAndUpdate(token.candidateId, { assessmentStatus: 'in_progress' });
  res.json({ message: 'Assessment started', startedAt: new Date() });
};

// POST /api/tokens/answer — auto-save answer
exports.saveAnswer = async (req, res) => {
  const { tokenValue, questionId, answer, timeSpent } = req.body;
  const token = await Token.findOne({ value: tokenValue });
  if (!token) return res.status(404).json({ message: 'Invalid token' });
  if (token.expiresAt < new Date()) return res.status(410).json({ message: 'Token expired' });

  await Response.findOneAndUpdate(
    { candidateId: token.candidateId, assessmentId: token.assessmentId, questionId },
    { answer, timeSpent, submittedAt: new Date() },
    { upsert: true, new: true }
  );
  res.json({ message: 'Answer saved' });
};

// POST /api/tokens/submit
exports.submitAssessment = async (req, res) => {
  const { tokenValue } = req.body;
  const token = await Token.findOne({ value: tokenValue })
    .populate('assessmentId')
    .populate('roleId', 'scoringWeights');

  if (!token) return res.status(404).json({ message: 'Invalid token' });

  // Mark token as used
  token.isUsed = true;
  token.useCount += 1;
  token.usedAt = new Date();
  await token.save();

  // Score the assessment
  const score = await computeScore(token.candidateId, token.assessmentId, token.roleId);

  // Update candidate status
  await Candidate.findByIdAndUpdate(token.candidateId, {
    assessmentStatus: 'completed',
    overallScore: score.finalScore,
    recommendation: score.performanceBand,
    $push: { timeline: { event: 'assessment_completed', description: `Score: ${score.finalScore}` } },
  });

  res.json({ message: 'Assessment submitted successfully', score });
};

// GET /api/tokens/result/:token — public result for candidate completion page
exports.getResult = async (req, res) => {
  const token = await Token.findOne({ value: req.params.token });
  if (!token) return res.status(404).json({ message: 'Invalid token' });

  const score = await Score.findOne({ candidateId: token.candidateId, assessmentId: token.assessmentId });
  if (!score) return res.status(404).json({ message: 'Score not available yet' });

  res.json(score);
};

// POST /api/tokens/access-code — authenticate using 6-digit access code
exports.authenticateWithAccessCode = async (req, res) => {
  try {
    const { accessCode } = req.body;
    
    console.log('[authenticateWithAccessCode] Received accessCode:', accessCode);
    
    if (!accessCode) {
      return res.status(400).json({ message: 'Please enter your access code' });
    }
    
    const trimmedCode = String(accessCode).trim();
    
    if (trimmedCode.length !== 6 || !/^\d{6}$/.test(trimmedCode)) {
      return res.status(400).json({ message: 'Please enter a valid 6-digit access code' });
    }
    
    // Find candidate by access code
    const candidate = await Candidate.findOne({ accessCode: trimmedCode })
      .populate('appliedRole', 'title department scoringWeights');
    
    if (!candidate) {
      return res.status(404).json({ message: 'Invalid access code. Please check and try again.' });
    }
    
    if (!candidate.appliedRole) {
      return res.status(400).json({ message: 'No role assigned to this candidate. Please contact HR.' });
    }
    
    console.log('[authenticateWithAccessCode] Found candidate:', candidate.name, 'Role:', candidate.appliedRole.title);
    
    // Check if candidate has an active pipeline
    const PipelineRecord = require('../pipeline/pipeline.model');
    let pipeline = await PipelineRecord.findOne({
      candidateId: candidate._id,
      roleId: candidate.appliedRole._id
    });
    
    // If no pipeline exists, create one
    if (!pipeline) {
      const StepConfig = require('../pipeline/stepConfig.model');
      const stepConfig = await StepConfig.findOne({ roleId: candidate.appliedRole._id });
      
      if (!stepConfig || !stepConfig.steps || stepConfig.steps.length === 0) {
        return res.status(400).json({ 
          message: 'No evaluation pipeline configured for your role. Please contact HR.' 
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
      
      console.log('[authenticateWithAccessCode] Created new pipeline:', pipeline._id);
    } else {
      console.log('[authenticateWithAccessCode] Found existing pipeline:', pipeline._id);
    }
    
    // Find or create token for this pipeline
    let token = await Token.findOne({
      candidateId: candidate._id,
      roleId: candidate.appliedRole._id,
      expiresAt: { $gt: new Date() }
    });
    
    if (!token) {
      // Create a new token
      const tokenValue = generateAssessmentToken();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      
      token = await Token.create({
        value: tokenValue,
        candidateId: candidate._id,
        roleId: candidate.appliedRole._id,
        expiresAt,
        maxUses: 999, // Allow multiple uses for pipeline
      });
      
      console.log('[authenticateWithAccessCode] Created new token:', tokenValue);
    } else {
      console.log('[authenticateWithAccessCode] Reusing existing token:', token.value);
    }
    
    // Update candidate status if not already invited
    if (candidate.assessmentStatus === 'pending') {
      candidate.assessmentStatus = 'invited';
      candidate.timeline.push({ 
        event: 'accessed', 
        description: 'Candidate accessed portal using access code' 
      });
      await candidate.save();
    }
    
    console.log('[authenticateWithAccessCode] Success! Returning token for pipeline:', pipeline._id);
    
    // Return the token value for the candidate to proceed
    res.json({
      token: token.value,
      pipelineId: pipeline._id,
      candidate: {
        _id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        assessmentStatus: candidate.assessmentStatus
      },
      role: candidate.appliedRole
    });
  } catch (error) {
    console.error('[authenticateWithAccessCode] Error:', error);
    console.error('[authenticateWithAccessCode] Stack:', error.stack);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};
