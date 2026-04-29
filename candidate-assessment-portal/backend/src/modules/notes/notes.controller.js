const InterviewLog = require('./interviewLog.model');
const Candidate = require('../candidate/candidate.model');

exports.getLogs = async (req, res) => {
  const { candidateId } = req.query;
  const filter = candidateId ? { candidateId } : {};
  const logs = await InterviewLog.find(filter)
    .populate('candidateId', 'name email appliedRole')
    .populate('interviewerId', 'name email')
    .sort('-createdAt');
  res.json(logs);
};

exports.createLog = async (req, res) => {
  const log = await InterviewLog.create({ ...req.body, interviewerId: req.user._id });
  await Candidate.findByIdAndUpdate(req.body.candidateId, {
    $push: {
      timeline: {
        event: 'interview_log',
        description: `${req.body.round} - ${req.body.recommendation}`,
        performedBy: req.user._id,
      },
    },
  });
  res.status(201).json(log);
};

exports.updateLog = async (req, res) => {
  const log = await InterviewLog.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!log) return res.status(404).json({ message: 'Log not found' });
  res.json(log);
};

exports.getLog = async (req, res) => {
  const log = await InterviewLog.findById(req.params.id)
    .populate('candidateId', 'name email appliedRole')
    .populate('interviewerId', 'name email');
  if (!log) return res.status(404).json({ message: 'Log not found' });
  res.json(log);
};
