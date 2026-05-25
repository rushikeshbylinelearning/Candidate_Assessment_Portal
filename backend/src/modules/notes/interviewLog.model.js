const mongoose = require('mongoose');

const interviewLogSchema = new mongoose.Schema({
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  interviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  round: { type: String, required: true }, // e.g. "Round 1 - Technical", "HR Round"
  stage: { type: String, enum: ['screening', 'technical', 'hr', 'final', 'offer'], required: true },
  notes: { type: String },
  rating: { type: Number, min: 1, max: 10 },
  strengths: [String],
  weaknesses: [String],
  recommendation: { type: String, enum: ['proceed', 'hold', 'reject', 'hire'] },
  nextAction: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('InterviewLog', interviewLogSchema);
