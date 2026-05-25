const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  answer: { type: mongoose.Schema.Types.Mixed },
  submittedAt: { type: Date },
  isCorrect: { type: Boolean, default: null },
  scoreAwarded: { type: Number, default: 0 },
  timeSpent: { type: Number, default: 0 }, // seconds
  isAutoScored: { type: Boolean, default: false },
}, { timestamps: true });

responseSchema.index({ candidateId: 1, assessmentId: 1 });

module.exports = mongoose.model('Response', responseSchema);
