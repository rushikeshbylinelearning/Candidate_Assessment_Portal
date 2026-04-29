const Role = require('./role.model');
const { log } = require('../../utils/logger');

exports.getRoles = async (req, res) => {
  const filter = {};
  if (req.query.active !== undefined) filter.active = req.query.active === 'true';
  const roles = await Role.find(filter).populate('assessmentTemplate', 'title duration').sort('-createdAt');
  res.json(roles);
};

exports.createRole = async (req, res) => {
  const role = await Role.create({ ...req.body, createdBy: req.user._id });
  await log({ userId: req.user._id, action: 'CREATE_ROLE', entity: 'role', entityId: role._id });
  res.status(201).json(role);
};

exports.updateRole = async (req, res) => {
  const role = await Role.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!role) return res.status(404).json({ message: 'Role not found' });
  await log({ userId: req.user._id, action: 'UPDATE_ROLE', entity: 'role', entityId: role._id });
  res.json(role);
};

exports.deleteRole = async (req, res) => {
  const role = await Role.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!role) return res.status(404).json({ message: 'Role not found' });
  res.json({ message: 'Role deactivated' });
};

exports.getRole = async (req, res) => {
  const role = await Role.findById(req.params.id).populate('assessmentTemplate');
  if (!role) return res.status(404).json({ message: 'Role not found' });
  res.json(role);
};
