const Candidate = require('../candidate/candidate.model');
const Score = require('../scoring/score.model');

exports.getOverview = async (req, res) => {
  const [counts, scoreAgg] = await Promise.all([
    Candidate.aggregate([
      {
        $facet: {
          total: [{ $count: 'n' }],
          pending: [{ $match: { assessmentStatus: { $in: ['pending', 'invited'] } } }, { $count: 'n' }],
          completed: [{ $match: { assessmentStatus: 'completed' } }, { $count: 'n' }],
          shortlisted: [{ $match: { finalDecision: 'shortlisted' } }, { $count: 'n' }],
          rejected: [{ $match: { finalDecision: 'rejected' } }, { $count: 'n' }],
          hired: [{ $match: { finalDecision: 'hired' } }, { $count: 'n' }],
        },
      },
    ]),
    Score.aggregate([
      { $match: { resultStatus: { $ne: 'pending' } } },
      {
        $group: {
          _id: null,
          avg: { $avg: '$finalScore' },
          pass: { $sum: { $cond: [{ $gte: ['$finalScore', 60] }, 1, 0] } },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const facet = counts[0] || {};
  const pick = (key) => (facet[key]?.[0]?.n) || 0;
  const scoreRow = scoreAgg[0];
  const scoreCount = scoreRow?.count || 0;

  res.json({
    totalCandidates: pick('total'),
    pendingAssessments: pick('pending'),
    completedAssessments: pick('completed'),
    shortlisted: pick('shortlisted'),
    rejected: pick('rejected'),
    hired: pick('hired'),
    averageScore: scoreCount > 0 ? Math.round(scoreRow.avg) : 0,
    passRate: scoreCount > 0 ? Math.round((scoreRow.pass / scoreCount) * 100) : 0,
  });
};

exports.getRoleAnalytics = async (req, res) => {
  const roleId = req.params.roleId;
  const candidateIds = await Candidate.find({ appliedRole: roleId }).distinct('_id');
  const [candidateCount, scores] = await Promise.all([
    Candidate.countDocuments({ appliedRole: roleId }),
    Score.find({ candidateId: { $in: candidateIds } }).select('finalScore'),
  ]);

  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((sum, s) => sum + s.finalScore, 0) / scores.length)
    : 0;
  const passRate = scores.length > 0
    ? Math.round((scores.filter(s => s.finalScore >= 60).length / scores.length) * 100)
    : 0;

  res.json({
    roleId,
    totalCandidates: candidateCount,
    completedAssessments: scores.length,
    averageScore: avgScore,
    passRate,
    candidates: candidateCount,
  });
};

exports.getFunnel = async (req, res) => {
  const [applied, invited, inProgress, completed, shortlisted, hired] = await Promise.all([
    Candidate.countDocuments(),
    Candidate.countDocuments({ assessmentStatus: 'invited' }),
    Candidate.countDocuments({ assessmentStatus: 'in_progress' }),
    Candidate.countDocuments({ assessmentStatus: 'completed' }),
    Candidate.countDocuments({ finalDecision: 'shortlisted' }),
    Candidate.countDocuments({ finalDecision: 'hired' }),
  ]);

  res.json([
    { stage: 'Applied', count: applied },
    { stage: 'Invited', count: invited },
    { stage: 'In Progress', count: inProgress },
    { stage: 'Completed', count: completed },
    { stage: 'Shortlisted', count: shortlisted },
    { stage: 'Hired', count: hired },
  ]);
};

exports.getPerformance = async (req, res) => {
  const result = await Score.aggregate([
    { $match: { resultStatus: { $ne: 'pending' } } },
    {
      $group: {
        _id: null,
        aptitude: { $avg: '$sectionScores.aptitude' },
        technical: { $avg: '$sectionScores.technical' },
        reasoning: { $avg: '$sectionScores.reasoning' },
        communication: { $avg: '$sectionScores.communication' },
        n: { $sum: 1 },
      },
    },
  ]);

  if (!result[0]?.n) {
    return res.json({ aptitude: 0, technical: 0, reasoning: 0, communication: 0 });
  }

  const row = result[0];
  res.json({
    aptitude: Math.round(row.aptitude || 0),
    technical: Math.round(row.technical || 0),
    reasoning: Math.round(row.reasoning || 0),
    communication: Math.round(row.communication || 0),
  });
};
