const Role = require('./role.model');
const Candidate = require('../candidate/candidate.model');
const { log } = require('../../utils/logger');

exports.getRoles = async (req, res) => {
  const filter = {};
  if (req.query.active !== undefined) filter.active = req.query.active === 'true';
  const roles = await Role.find(filter).populate('assessmentTemplate', 'title duration').sort('-createdAt');
  res.json(roles);
};

exports.createRole = async (req, res) => {
  try {
    const role = await Role.create({ ...req.body, createdBy: req.user._id });
    await log({ userId: req.user._id, action: 'CREATE_ROLE', entity: 'role', entityId: role._id });
    res.status(201).json(role);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const role = await Role.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!role) return res.status(404).json({ message: 'Role not found' });
    await log({ userId: req.user._id, action: 'UPDATE_ROLE', entity: 'role', entityId: role._id });

    // If requiredSkills changed, recompute skill matches for all candidates with this role
    if (req.body.requiredSkills !== undefined) {
      recomputeAllCandidateMatches(role._id, role).catch(err =>
        console.error('[updateRole] Recompute error:', err.message)
      );
    }

    res.json(role);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
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

/**
 * Recompute skill matches for all candidates assigned to a role
 * Called asynchronously after role skills are updated
 */
async function recomputeAllCandidateMatches(roleId, role) {
  try {
    const { runSkillMatch } = require('../resume/resume.controller');
    const candidates = await Candidate.find({ appliedRole: roleId }).select('_id');
    console.log(`[recomputeAllCandidateMatches] Recomputing for ${candidates.length} candidates in role ${roleId}`);
    for (const candidate of candidates) {
      await runSkillMatch(candidate._id, role);
    }
  } catch (err) {
    console.error('[recomputeAllCandidateMatches] Error:', err.message);
  }
}
