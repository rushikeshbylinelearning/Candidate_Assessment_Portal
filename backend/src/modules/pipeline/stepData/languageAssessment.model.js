const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  prompt: { type: String, default: '' },
  response: { type: String, default: '' },
  score: { type: Number },
}, { _id: false });

const languageAssessmentDataSchema = new mongoose.Schema({
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
    default: 'LANGUAGE_ASSESSMENT',
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

  // Step-specific fields for LANGUAGE_ASSESSMENT
  language: { type: String, trim: true },
  writtenScore: { type: Number },
  spokenScore: { type: Number },
  grammarScore: { type: Number },
  overallBand: { type: String, trim: true },
  responses: [responseSchema],
}, { timestamps: true });

// Index for efficient querying
languageAssessmentDataSchema.index({ candidateId: 1, pipelineId: 1 });

module.exports = mongoose.model('LanguageAssessmentData', languageAssessmentDataSchema);
