const Question = require('./question.model');

exports.getQuestions = async (req, res) => {
  const { category, difficulty, type, role, active = 'true', page = 1, limit = 50 } = req.query;
  const filter = {};
  if (active !== 'all') filter.active = active === 'true';
  if (category) filter.category = category;
  if (difficulty) filter.difficulty = difficulty;
  if (type) filter.type = type;
  if (role) filter.roles = role;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [questions, total] = await Promise.all([
    Question.find(filter).skip(skip).limit(parseInt(limit)).sort('-createdAt'),
    Question.countDocuments(filter),
  ]);
  res.json({ questions, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
};

exports.createQuestion = async (req, res) => {
  const question = await Question.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json(question);
};

exports.updateQuestion = async (req, res) => {
  // If changing to a text-based question type, clear options and correctAnswer
  const textBasedTypes = ['short_answer', 'scenario', 'logic', 'coding'];
  if (req.body.type && textBasedTypes.includes(req.body.type)) {
    req.body.options = [];
    req.body.correctAnswer = null;
  }
  
  const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!question) return res.status(404).json({ message: 'Question not found' });
  res.json(question);
};

exports.deleteQuestion = async (req, res) => {
  const question = await Question.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!question) return res.status(404).json({ message: 'Question not found' });
  res.json({ message: 'Question deactivated' });
};

exports.getQuestion = async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) return res.status(404).json({ message: 'Question not found' });
  res.json(question);
};

exports.bulkCreate = async (req, res) => {
  const questions = await Question.insertMany(
    req.body.questions.map(q => ({ ...q, createdBy: req.user._id }))
  );
  res.status(201).json({ created: questions.length, questions });
};
