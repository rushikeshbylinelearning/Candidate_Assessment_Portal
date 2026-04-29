const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: { type: String, default: '' },
  answer: { type: String, default: '' },
}, { _id: false });

const evaluationFormDataSchema = new mongoose.Schema({
  // Base fields shared by all Step_Data_Store models
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true,
  },
  pipelineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PipelineRecord',
    required: true,
  },
  stepType: {
    type: String,
    enum: ['EVALUATION_FORM', 'LANGUAGE_ASSESSMENT', 'ROLE_BASED_ASSESSMENT', 
           'INTERVIEW_INTERACTION', 'POST_INTERVIEW_FEEDBACK'],
    default: 'EVALUATION_FORM',
    required: true,
  },
  status: {
    type: String,
    enum: ['IN_PROGRESS', 'COMPLETED'],
    default: 'IN_PROGRESS',
  },
  startedAt: { type: Date, default: Date.now },
  submittedAt: { type: Date, default: null },
  timeSpentSecs: { type: Number, default: 0 },

  // Step-specific fields for EVALUATION_FORM
  yearsExperience: { type: Number },
  currentTitle: { type: String, trim: true },
  noticePeriodDays: { type: Number },
  salaryExpectation: { type: Number },
  availableFrom: { type: Date },
  linkedinUrl: { type: String, trim: true },
  portfolioUrl: { type: String, trim: true },
  answers: [answerSchema],
}, { timestamps: true });

// Index for efficient querying
evaluationFormDataSchema.index({ candidateId: 1, pipelineId: 1 });

module.exports = mongoose.model('EvaluationFormData', evaluationFormDataSchema);
