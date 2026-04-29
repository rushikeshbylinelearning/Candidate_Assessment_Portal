require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/modules/auth/user.model');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
  
  // List existing users
  const users = await User.find({}).select('email role status');
  console.log('Existing users:', JSON.stringify(users, null, 2));
  
  // Check if admin already exists
  const existing = await User.findOne({ role: 'admin' });
  if (existing) {
    console.log('Admin exists:', existing.email);
  } else {
    const admin = await User.create({ name: 'Admin', email: 'admin@test.com', password: 'Admin@123', role: 'admin', status: 'active' });
    console.log('Created admin:', admin.email);
  }
  
  await mongoose.disconnect();
}
main().catch(console.error);
