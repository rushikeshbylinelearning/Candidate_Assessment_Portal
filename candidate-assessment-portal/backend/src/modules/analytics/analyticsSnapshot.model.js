const mongoose = require('mongoose');

const analyticsSnapshotSchema = new mongoose.Schema({
  snapshotDate: { type: Date, default: Date.now },
  totalCandidates: Number,
  pendingAssessments: Number,
  completedAssessments: Number,
  shortlisted: Number,
  rejected: Number,
  hired: Number,
  averageScore: Number,
  passRate: Number,
  dropOffRate: Number,
  byRole: [{ roleId: mongoose.Schema.Types.ObjectId, roleName: String, count: Number, avgScore: Number }],
}, { timestamps: true });

module.exports = mongoose.model('AnalyticsSnapshot', analyticsSnapshotSchema);
