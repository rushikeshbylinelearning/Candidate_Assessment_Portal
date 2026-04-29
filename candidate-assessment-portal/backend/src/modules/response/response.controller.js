const Response = require('./response.model');
const Score = require('../scoring/score.model');

exports.getCandidateResponses = async (req, res) => {
  const { candidateId, assessmentId } = req.query;
  const filter = {};
  if (candidateId) filter.candidateId = candidateId;
  if (assessmentId) filter.assessmentId = assessmentId;

  const responses = await Response.find(filter).populate('questionId', 'text type category difficulty points correctAnswer options explanation');
  res.json(responses);
};

exports.getCandidateScore = async (req, res) => {
  const score = await Score.findOne({ candidateId: req.params.candidateId })
    .sort('-createdAt')
    .populate('assessmentId', 'title')
    .populate('roleId', 'title');
  res.json(score || null);
};

exports.updateInterviewerScore = async (req, res) => {
  const { interviewerScore } = req.body;
  const score = await Score.findOneAndUpdate(
    { candidateId: req.params.candidateId },
    { interviewerScore, finalScore: Math.round((score?.autoScore + interviewerScore) / 2) },
    { new: true }
  );
  res.json(score);
};

exports.saveManualScore = async (req, res) => {
  const { scoreAwarded } = req.body;
  const response = await Response.findByIdAndUpdate(
    req.params.responseId,
    { scoreAwarded: parseFloat(scoreAwarded), isAutoScored: true },
    { new: true }
  ).populate('questionId', 'category points');

  if (!response) return res.status(404).json({ message: 'Response not found' });

  // Recalculate the score doc for this candidate
  const Score = require('../scoring/score.model');
  const allResponses = await Response.find({
    candidateId: response.candidateId,
    assessmentId: response.assessmentId,
  }).populate('questionId', 'category points type');

  const sectionScores = { aptitude: { earned: 0, total: 0 }, technical: { earned: 0, total: 0 }, reasoning: { earned: 0, total: 0 }, communication: { earned: 0, total: 0 } };
  let totalEarned = 0, totalPossible = 0;

  for (const r of allResponses) {
    const cat = r.questionId?.category;
    const pts = r.questionId?.points || 1;
    if (!cat || !sectionScores[cat]) continue;
    sectionScores[cat].total += pts;
    totalPossible += pts;
    if (r.isAutoScored) {
      sectionScores[cat].earned += (r.scoreAwarded || 0);
      totalEarned += (r.scoreAwarded || 0);
    }
  }

  const scoreDoc = await Score.findOne({ candidateId: response.candidateId, assessmentId: response.assessmentId });
  if (scoreDoc) {
    const weights = scoreDoc.roleId ? (await require('../roles/role.model').findById(scoreDoc.roleId).select('scoringWeights'))?.scoringWeights : { aptitude: 20, technical: 50, reasoning: 20, communication: 10 };
    const w = weights || { aptitude: 20, technical: 50, reasoning: 20, communication: 10 };

    const newSectionPcts = {};
    for (const [cat, data] of Object.entries(sectionScores)) {
      newSectionPcts[cat] = data.total > 0 ? Math.round((data.earned / data.total) * 100) : 0;
    }

    const weighted = Math.round(
      (newSectionPcts.aptitude * w.aptitude +
       newSectionPcts.technical * w.technical +
       newSectionPcts.reasoning * w.reasoning +
       newSectionPcts.communication * w.communication) / 100
    );

    const accuracy = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0;
    const BANDS = [{ min: 85, band: 'excellent' }, { min: 70, band: 'strong' }, { min: 55, band: 'moderate' }, { min: 40, band: 'needs_review' }, { min: 0, band: 'reject' }];
    const band = BANDS.find(b => weighted >= b.min).band;

    await Score.findByIdAndUpdate(scoreDoc._id, {
      sectionScores: newSectionPcts,
      finalScore: weighted,
      weightedScore: weighted,
      autoScore: accuracy,
      accuracyPercentage: accuracy,
      performanceBand: band,
      resultStatus: weighted >= 60 ? 'pass' : 'fail',
    });

    // Update candidate overall score
    await require('../candidate/candidate.model').findByIdAndUpdate(response.candidateId, {
      overallScore: weighted,
      recommendation: band,
    });
  }

  res.json({ message: 'Score saved', response });
};
