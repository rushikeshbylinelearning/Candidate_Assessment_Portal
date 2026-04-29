const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  value: { type: String, required: true, unique: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment' },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
  expiresAt: { type: Date, required: true },
  usedAt: { type: Date, default: null },
  isUsed: { type: Boolean, default: false },
  maxUses: { type: Number, default: 1 },
  useCount: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Token', tokenSchema);
