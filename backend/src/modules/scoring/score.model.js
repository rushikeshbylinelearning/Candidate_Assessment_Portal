const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
  sectionScores: {
    aptitude: { type: Number, default: 0 },
    technical: { type: Number, default: 0 },
    reasoning: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
  },
  autoScore: { type: Number, default: 0 },
  interviewerScore: { type: Number, default: null },
  finalScore: { type: Number, default: 0 },
  weightedScore: { type: Number, default: 0 },
  accuracyPercentage: { type: Number, default: 0 },
  completionRate: { type: Number, default: 0 },
  timeEfficiency: { type: Number, default: 0 }, // 0-100
  performanceBand: {
    type: String,
    enum: ['excellent', 'strong', 'moderate', 'needs_review', 'reject'],
    default: 'needs_review',
  },
  recommendation: { type: String },
  rankingPosition: { type: Number, default: null },
  resultStatus: { type: String, enum: ['pass', 'fail', 'pending'], default: 'pending' },
  startedAt: { type: Date },
  submittedAt: { type: Date },
  totalTimeSpent: { type: Number, default: 0 }, // seconds
}, { timestamps: true });

module.exports = mongoose.model('Score', scoreSchema);
