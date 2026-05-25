const mongoose = require('mongoose');

const stepStatusSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'],
    default: 'NOT_STARTED',
  },
  startedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  dataRef: { type: mongoose.Schema.Types.ObjectId, default: null },
  score: { type: Number, default: null },
}, { _id: false });

const stepConfigEntrySchema = new mongoose.Schema({
  stepType: {
    type: String,
    enum: ['EVALUATION_FORM', 'LANGUAGE_ASSESSMENT', 'ROLE_BASED_ASSESSMENT',
           'INTERVIEW_INTERACTION', 'POST_INTERVIEW_FEEDBACK'],
    required: true,
  },
  order: { type: Number, required: true },
  required: { type: Boolean, default: true },
  skip: { type: Boolean, default: false },
  scoringWeight: { type: Number, default: 0 },
  timeLimitMins: { type: Number, default: null },
}, { _id: false });

const pipelineRecordSchema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true,
  },
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true,
  },
  tokenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Token',
  },
  assignedAssessments: {
    type: Map,
    of: mongoose.Schema.Types.ObjectId,
    default: {}
  },
  stepConfigSnapshot: [stepConfigEntrySchema],
  currentStep: {
    type: String,
    enum: ['EVALUATION_FORM', 'LANGUAGE_ASSESSMENT', 'ROLE_BASED_ASSESSMENT',
           'INTERVIEW_INTERACTION', 'POST_INTERVIEW_FEEDBACK'],
  },
  completedSteps: [{ type: String }],
  stepStatus: {
    EVALUATION_FORM: { type: stepStatusSchema, default: () => ({}) },
    LANGUAGE_ASSESSMENT: { type: stepStatusSchema, default: () => ({}) },
    ROLE_BASED_ASSESSMENT: { type: stepStatusSchema, default: () => ({}) },
    INTERVIEW_INTERACTION: { type: stepStatusSchema, default: () => ({}) },
    POST_INTERVIEW_FEEDBACK: { type: stepStatusSchema, default: () => ({}) },
  },
  status: {
    type: String,
    enum: ['IN_PROGRESS', 'FINISHED', 'EXPIRED'],
    default: 'IN_PROGRESS',
  },
  aggregateScore: { type: Number, default: null },
  totalTimeSpentSecs: { type: Number, default: 0 },
}, { timestamps: true });

// Unique constraint: one active pipeline per candidate+role
pipelineRecordSchema.index({ candidateId: 1, roleId: 1 }, { unique: true });

module.exports = mongoose.model('PipelineRecord', pipelineRecordSchema);
