const mongoose = require('mongoose');

const timelineEventSchema = new mongoose.Schema({
  event: String,
  description: String,
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const skillMatchResultSchema = new mongoose.Schema({
  matchedSkills: [String],
  missingSkills: [String],
  partialSkills: [String],
  matchPercentage: { type: Number, default: 0 },
  matchLabel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'EXCELLENT'], default: 'LOW' },
  computedAt: { type: Date, default: Date.now },
}, { _id: false });

const candidateSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  resumeUrl: { type: String },
  appliedRole: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
  experienceLevel: { type: String, enum: ['intern', 'junior', 'mid', 'senior', 'lead'] },
  accessCode: { type: String, unique: true, sparse: true, index: true },
  assessmentStatus: {
    type: String,
    enum: ['pending', 'invited', 'in_progress', 'completed', 'expired'],
    default: 'pending',
  },
  interviewStatus: {
    type: String,
    enum: ['not_scheduled', 'scheduled', 'completed', 'cancelled'],
    default: 'not_scheduled',
  },
  overallScore: { type: Number, default: null },
  recommendation: {
    type: String,
    enum: ['excellent', 'strong', 'moderate', 'needs_review', 'reject', null],
    default: null,
  },
  finalDecision: {
    type: String,
    enum: ['shortlisted', 'rejected', 'hired', 'on_hold', null],
    default: null,
  },
  timeline: [timelineEventSchema],
  notesSummary: { type: String },
  riskFlags: [String],
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  skillMatchResult: { type: skillMatchResultSchema, default: null },
}, { timestamps: true });

candidateSchema.index({ appliedRole: 1, assessmentStatus: 1 });
candidateSchema.index({ assessmentStatus: 1 });
candidateSchema.index({ finalDecision: 1 });
candidateSchema.index({ email: 1 });
candidateSchema.index({ name: 'text', email: 'text' });

module.exports = mongoose.model('Candidate', candidateSchema);
