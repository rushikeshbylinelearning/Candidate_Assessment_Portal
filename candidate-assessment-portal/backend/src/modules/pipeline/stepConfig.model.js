const mongoose = require('mongoose');

const stepConfigEntrySchema = new mongoose.Schema({
  stepType: {
    type: String,
    enum: ['EVALUATION_FORM', 'LANGUAGE_ASSESSMENT', 'ROLE_BASED_ASSESSMENT',
           'INTERVIEW_INTERACTION', 'POST_INTERVIEW_FEEDBACK'],
    required: true,
  },
  order: { type: Number, required: true },
  required: { type: Boolean, default: true },
  skip: { type: Boolean, default: false },
  scoringWeight: { type: Number, default: 0 },
  timeLimitMins: { type: Number, default: null },
}, { _id: false });

const stepConfigurationSchema = new mongoose.Schema({
  roleId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Role', 
    required: true, 
    unique: true 
  },
  steps: [stepConfigEntrySchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('StepConfiguration', stepConfigurationSchema);
