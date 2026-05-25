const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, default: '' },
  response: { type: String },
  score: { type: Number },
  notes: { type: String },
}, { _id: false });

const interviewInteractionDataSchema = new mongoose.Schema({
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
    default: 'INTERVIEW_INTERACTION',
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

  // Step-specific fields for INTERVIEW_INTERACTION
  interviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  scheduledAt: { type: Date },
  conductedAt: { type: Date },
  durationMins: { type: Number },
  questions: [questionSchema],
  overallInterviewScore: { type: Number },
  interviewerNotes: { type: String, trim: true },
}, { timestamps: true });

// Index for efficient querying
interviewInteractionDataSchema.index({ candidateId: 1, pipelineId: 1 });

module.exports = mongoose.model('InterviewInteractionData', interviewInteractionDataSchema);
