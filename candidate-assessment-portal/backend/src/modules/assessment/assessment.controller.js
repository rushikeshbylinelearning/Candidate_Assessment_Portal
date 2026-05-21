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
  const assessment = await Assessment.findById(req.params.id)
    .populate('roleId')
    .populate('selectedQuestions');
  if (!assessment) return res.status(404).json({ message: 'Assessment not found' });

  // Check if assessment is assigned to any candidates
  const PipelineRecord = require('../pipeline/pipeline.model');
  const pipelines = await PipelineRecord.find({});
  const isAssigned = pipelines.some(p => {
    const assessments = p.assignedAssessments || new Map();
    return Array.from(assessments.values()).some(id => id.toString() === req.params.id);
  });

  // If no selectedQuestions stored, fall back to fetching by roleId
  if (!assessment.selectedQuestions || assessment.selectedQuestions.length === 0) {
    const Question = require('../question/question.model');
    const questions = await Question.find({ roles: assessment.roleId?._id, active: true }).sort('createdAt');
    const obj = assessment.toObject();
    obj.selectedQuestions = questions;
    obj.isAssigned = isAssigned;
    return res.json(obj);
  }

  const obj = assessment.toObject();
  obj.isAssigned = isAssigned;
  res.json(obj);
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
  const assessment = await Assessment.findById(req.params.id);
  if (!assessment) return res.status(404).json({ message: 'Assessment not found' });

  // Check if assessment is assigned to any candidates
  const PipelineRecord = require('../pipeline/pipeline.model');
  const assignedCount = await PipelineRecord.countDocuments({
    'assignedAssessments': { $exists: true },
    $expr: {
      $gt: [
        { $size: { $objectToArray: { $ifNull: ['$assignedAssessments', {}] } } },
        0
      ]
    }
  }).then(async () => {
    // Check if this specific assessment is assigned
    const pipelines = await PipelineRecord.find({});
    return pipelines.filter(p => {
      const assessments = p.assignedAssessments || new Map();
      return Array.from(assessments.values()).some(id => id.toString() === req.params.id);
    }).length;
  });

  if (assignedCount > 0) {
    return res.status(403).json({ 
      message: 'Cannot update assessment that has been assigned to candidates',
      assignedCount 
    });
  }

  // Update the assessment
  Object.assign(assessment, req.body);
  await assessment.save();
  res.json(assessment);
};

exports.deleteAssessment = async (req, res) => {
  // Check if assessment is assigned to any candidates
  const PipelineRecord = require('../pipeline/pipeline.model');
  const pipelines = await PipelineRecord.find({});
  const isAssigned = pipelines.some(p => {
    const assessments = p.assignedAssessments || new Map();
    return Array.from(assessments.values()).some(id => id.toString() === req.params.id);
  });

  if (isAssigned) {
    return res.status(403).json({ 
      message: 'Cannot delete assessment that has been assigned to candidates'
    });
  }

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
