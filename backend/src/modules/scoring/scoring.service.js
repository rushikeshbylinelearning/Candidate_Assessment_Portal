const Response = require('../response/response.model');
const Question = require('../question/question.model');
const Score = require('./score.model');

const BANDS = [
  { min: 85, band: 'excellent' },
  { min: 70, band: 'strong' },
  { min: 55, band: 'moderate' },
  { min: 40, band: 'needs_review' },
  { min: 0, band: 'reject' },
];

const getBand = (score) => BANDS.find(b => score >= b.min).band;

const computeScore = async (candidateId, assessmentDoc, roleDoc) => {
  const assessmentId = assessmentDoc._id || assessmentDoc;
  const roleId = roleDoc._id || roleDoc;
  const weights = roleDoc.scoringWeights || { aptitude: 20, technical: 50, reasoning: 20, communication: 10 };

  const responses = await Response.find({ candidateId, assessmentId });
  const questionIds = responses.map(r => r.questionId);
  const questions = await Question.find({ _id: { $in: questionIds } });
  const qMap = {};
  questions.forEach(q => { qMap[q._id.toString()] = q; });

  const sectionData = { aptitude: { earned: 0, total: 0 }, technical: { earned: 0, total: 0 }, reasoning: { earned: 0, total: 0 }, communication: { earned: 0, total: 0 } };
  let totalEarned = 0, totalPossible = 0, totalTime = 0;

  for (const resp of responses) {
    const q = qMap[resp.questionId.toString()];
    if (!q) continue;
    const cat = q.category;
    const pts = q.points || 1;
    sectionData[cat].total += pts;
    totalPossible += pts;
    totalTime += resp.timeSpent || 0;

    let correct = false;
    if (['mcq_single', 'true_false'].includes(q.type)) {
      correct = String(resp.answer) === String(q.correctAnswer);
    } else if (q.type === 'mcq_multi') {
      const ans = Array.isArray(resp.answer) ? resp.answer.sort() : [];
      const cor = Array.isArray(q.correctAnswer) ? q.correctAnswer.sort() : [];
      correct = JSON.stringify(ans) === JSON.stringify(cor);
    }
    // short_answer, scenario, coding — manual review, no auto score

    if (correct) {
      sectionData[cat].earned += pts;
      totalEarned += pts;
      resp.isCorrect = true;
      resp.scoreAwarded = pts;
      resp.isAutoScored = true;
    } else if (['mcq_single', 'true_false', 'mcq_multi'].includes(q.type)) {
      resp.isCorrect = false;
      resp.isAutoScored = true;
    }
    await resp.save();
  }

  // Section percentages
  const sectionScores = {};
  for (const [cat, data] of Object.entries(sectionData)) {
    sectionScores[cat] = data.total > 0 ? Math.round((data.earned / data.total) * 100) : 0;
  }

  // Weighted score
  const weightedScore = Math.round(
    (sectionScores.aptitude * weights.aptitude +
      sectionScores.technical * weights.technical +
      sectionScores.reasoning * weights.reasoning +
      sectionScores.communication * weights.communication) / 100
  );

  const accuracyPct = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0;
  const completionRate = responses.length > 0 ? Math.round((responses.filter(r => r.answer !== null && r.answer !== undefined).length / responses.length) * 100) : 0;
  const band = getBand(weightedScore);

  const scoreDoc = await Score.findOneAndUpdate(
    { candidateId, assessmentId },
    {
      roleId,
      sectionScores,
      autoScore: accuracyPct,
      finalScore: weightedScore,
      weightedScore,
      accuracyPercentage: accuracyPct,
      completionRate,
      performanceBand: band,
      resultStatus: weightedScore >= 60 ? 'pass' : 'fail',
      submittedAt: new Date(),
      totalTimeSpent: totalTime,
    },
    { upsert: true, new: true }
  );

  return scoreDoc;
};

module.exports = { computeScore };
