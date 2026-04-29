const Assessment = require('./assessment.model');
const Role = require('../roles/role.model');
const { log } = require('../../utils/logger');

exports.getAssessments = async (req, res) => {
  const filter = {};
  if (req.query.roleId) filter.roleId = req.query.roleId;
  if (req.query.active !== undefined) filter.active = req.query.active === 'true';
  const assessments = await Assessment.find(filter).populate('roleId', 'title department').sort('-createdAt');
  res.json(assessments);
};

exports.getAssessment = async (req, res) => {
  const assessment = await Assessment.findById(req.params.id).populate('roleId');
  if (!assessment) return res.status(404).json({ message: 'Assessment not found' });
  res.json(assessment);
};

exports.createAssessment = async (req, res) => {
  const assessment = await Assessment.create({ ...req.body, createdBy: req.user._id });
  // Link to role
  if (req.body.roleId) {
    await Role.findByIdAndUpdate(req.body.roleId, { assessmentTemplate: assessment._id });
  }
  await log({ userId: req.user._id, action: 'CREATE_ASSESSMENT', entity: 'assessment', entityId: assessment._id });
  res.status(201).json(assessment);
};

exports.updateAssessment = async (req, res) => {
  const assessment = await Assessment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!assessment) return res.status(404).json({ message: 'Assessment not found' });
  res.json(assessment);
};

exports.deleteAssessment = async (req, res) => {
  const assessment = await Assessment.findByIdAndDelete(req.params.id);
  if (!assessment) return res.status(404).json({ message: 'Assessment not found' });
  await log({ userId: req.user._id, action: 'DELETE_ASSESSMENT', entity: 'assessment', entityId: req.params.id });
  res.json({ message: 'Assessment deleted' });
};

exports.toggleAssessment = async (req, res) => {
  const assessment = await Assessment.findById(req.params.id);
  if (!assessment) return res.status(404).json({ message: 'Assessment not found' });
  assessment.active = !assessment.active;
  await assessment.save();
  res.json(assessment);
};
