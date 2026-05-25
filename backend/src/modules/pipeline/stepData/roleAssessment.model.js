const mongoose = require('mongoose');

const roleAssessmentDataSchema = new mongoose.Schema({
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
    default: 'ROLE_BASED_ASSESSMENT',
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

  // Step-specific fields for ROLE_BASED_ASSESSMENT
  assessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
  },
  responses: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    answer: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  }],
  sectionScores: {
    aptitude: { type: Number },
    technical: { type: Number },
    reasoning: { type: Number },
    communication: { type: Number },
  },
  autoScore: { type: Number },
  completionRate: { type: Number },
}, { timestamps: true });

// Index for efficient querying
roleAssessmentDataSchema.index({ candidateId: 1, pipelineId: 1 });

module.exports = mongoose.model('RoleAssessmentData', roleAssessmentDataSchema);
