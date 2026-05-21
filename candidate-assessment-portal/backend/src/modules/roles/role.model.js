const mongoose = require('mongoose');

const requiredSkillSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  level: { type: String, enum: ['required', 'nice-to-have'], default: 'required' },
}, { _id: false });

const roleSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  department: { type: String, required: true, trim: true },
  experienceLevel: { type: String, enum: ['intern', 'junior', 'mid', 'senior', 'lead'], required: true },
  assessmentTemplate: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment' },
  scoringWeights: {
    aptitude: { type: Number, default: 20 },
    technical: { type: Number, default: 50 },
    reasoning: { type: Number, default: 20 },
    communication: { type: Number, default: 10 },
  },
  requiredSkills: { type: [requiredSkillSchema], default: [] },
  active: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);
