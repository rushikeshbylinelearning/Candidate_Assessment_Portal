const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  name: String,
  category: { type: String, enum: ['aptitude', 'technical', 'reasoning', 'communication'] },
  questionCount: Number,
  difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'mixed'] },
  weight: Number,
}, { _id: false });

const assessmentSchema = new mongoose.Schema({
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
  title: { type: String, required: true },
  description: { type: String },
  duration: { type: Number, required: true }, // minutes
  totalQuestions: { type: Number, required: true },
  sections: [sectionSchema],
  randomizeQuestions: { type: Boolean, default: true },
  randomizeOptions: { type: Boolean, default: true },
  allowBacktrack: { type: Boolean, default: true },
  allowPause: { type: Boolean, default: false },
  passThreshold: { type: Number, default: 60 }, // percentage
  active: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Assessment', assessmentSchema);
