const Candidate = require('../candidate/candidate.model');
const Score = require('../scoring/score.model');
const Role = require('../roles/role.model');

exports.getOverview = async (req, res) => {
  const [total, pending, completed, shortlisted, rejected, hired] = await Promise.all([
    Candidate.countDocuments(),
    Candidate.countDocuments({ assessmentStatus: { $in: ['pending', 'invited'] } }),
    Candidate.countDocuments({ assessmentStatus: 'completed' }),
    Candidate.countDocuments({ finalDecision: 'shortlisted' }),
    Candidate.countDocuments({ finalDecision: 'rejected' }),
    Candidate.countDocuments({ finalDecision: 'hired' }),
  ]);

  const scores = await Score.find({ resultStatus: { $ne: 'pending' } }).select('finalScore');
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + s.finalScore, 0) / scores.length) : 0;
  const passRate = scores.length > 0 ? Math.round((scores.filter(s => s.finalScore >= 60).length / scores.length) * 100) : 0;

  res.json({
    totalCandidates: total,
    pendingAssessments: pending,
    completedAssessments: completed,
    shortlisted,
    rejected,
    hired,
    averageScore: avgScore,
    passRate,
  });
};

exports.getRoleAnalytics = async (req, res) => {
  const roleId = req.params.roleId;
  const candidates = await Candidate.find({ appliedRole: roleId });
  const candidateIds = candidates.map(c => c._id);
  const scores = await Score.find({ candidateId: { $in: candidateIds } });

  const avgScore = scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + s.finalScore, 0) / scores.length) : 0;
  const passRate = scores.length > 0 ? Math.round((scores.filter(s => s.finalScore >= 60).length / scores.length) * 100) : 0;

  res.json({
    roleId,
    totalCandidates: candidates.length,
    completedAssessments: scores.length,
    averageScore: avgScore,
    passRate,
    candidates: candidates.length,
  });
};

exports.getFunnel = async (req, res) => {
  const stages = [
    { stage: 'Applied', count: await Candidate.countDocuments() },
    { stage: 'Invited', count: await Candidate.countDocuments({ assessmentStatus: 'invited' }) },
    { stage: 'In Progress', count: await Candidate.countDocuments({ assessmentStatus: 'in_progress' }) },
    { stage: 'Completed', count: await Candidate.countDocuments({ assessmentStatus: 'completed' }) },
    { stage: 'Shortlisted', count: await Candidate.countDocuments({ finalDecision: 'shortlisted' }) },
    { stage: 'Hired', count: await Candidate.countDocuments({ finalDecision: 'hired' }) },
  ];
  res.json(stages);
};

exports.getPerformance = async (req, res) => {
  const scores = await Score.find({ resultStatus: { $ne: 'pending' } }).select('sectionScores');
  if (scores.length === 0) return res.json({ aptitude: 0, technical: 0, reasoning: 0, communication: 0 });

  const avg = { aptitude: 0, technical: 0, reasoning: 0, communication: 0 };
  scores.forEach(s => {
    avg.aptitude += s.sectionScores.aptitude || 0;
    avg.technical += s.sectionScores.technical || 0;
    avg.reasoning += s.sectionScores.reasoning || 0;
    avg.communication += s.sectionScores.communication || 0;
  });

  Object.keys(avg).forEach(k => { avg[k] = Math.round(avg[k] / scores.length); });
  res.json(avg);
};
