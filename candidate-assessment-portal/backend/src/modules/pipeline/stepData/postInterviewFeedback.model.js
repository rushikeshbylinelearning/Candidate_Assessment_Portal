const mongoose = require('mongoose');

const postInterviewFeedbackDataSchema = new mongoose.Schema({
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
    default: 'POST_INTERVIEW_FEEDBACK',
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

  // Step-specific fields for POST_INTERVIEW_FEEDBACK
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  recommendation: {
    type: String,
    enum: ['excellent', 'strong', 'moderate', 'needs_review', 'reject'],
  },
  strengths: [{ type: String, trim: true }],
  concerns: [{ type: String, trim: true }],
  finalNotes: { type: String, trim: true },
  hrScore: { type: Number },
}, { timestamps: true });

// Index for efficient querying
postInterviewFeedbackDataSchema.index({ candidateId: 1, pipelineId: 1 });

module.exports = mongoose.model('PostInterviewFeedbackData', postInterviewFeedbackDataSchema);
