const User = require('./user.model');
const { generateJWT } = require('../../utils/generateToken');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  if (user.status !== 'active') return res.status(403).json({ message: 'Account inactive' });

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  res.json({ token: generateJWT(user._id), user: user.toJSON() });
};

exports.getMe = async (req, res) => {
  res.json(req.user);
};

exports.logout = (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

exports.createUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: 'Email already registered' });
  const user = await User.create({ name, email, password, role });
  res.status(201).json(user);
};

exports.getUsers = async (req, res) => {
  const users = await User.find().sort('-createdAt');
  res.json(users);
};

exports.updateUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};
