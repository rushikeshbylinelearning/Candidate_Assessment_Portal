require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/modules/auth/user.model');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ email: 'admin@byline.com' }).select('+password');
  user.password = 'Admin@123';
  await user.save();
  console.log('Password reset for admin@byline.com to Admin@123');
  await mongoose.disconnect();
}
main().catch(console.error);
