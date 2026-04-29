const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['mcq_single', 'mcq_multi', 'true_false', 'short_answer', 'scenario', 'logic', 'coding'],
    required: true,
  },
  category: {
    type: String,
    enum: ['aptitude', 'technical', 'reasoning', 'communication'],
    required: true,
  },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  text: { type: String, required: true },
  options: [{ id: String, text: String }],
  correctAnswer: { type: mongoose.Schema.Types.Mixed }, // string or array
  explanation: { type: String },
  tags: [String],
  roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }],
  points: { type: Number, default: 1 },
  active: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);
