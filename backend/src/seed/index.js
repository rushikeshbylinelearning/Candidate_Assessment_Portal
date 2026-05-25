require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../modules/auth/user.model');
const Role = require('../modules/roles/role.model');
const Question = require('../modules/question/question.model');
const Assessment = require('../modules/assessment/assessment.model');
const Candidate = require('../modules/candidate/candidate.model');

const seed = async () => {
  await connectDB();
  console.log('Seeding database...');

  await Promise.all([
    User.deleteMany({}), Role.deleteMany({}), Question.deleteMany({}),
    Assessment.deleteMany({}), Candidate.deleteMany({}),
  ]);

  // Users
  const admin = await User.create({ name: 'Admin', email: 'Admin@byline.com', password: 'admin@2026', role: 'admin' });
  const hr = await User.create({ name: 'HR Manager', email: 'hr@cap.com', password: 'Hr@12345', role: 'hr' });
  await User.create({ name: 'Tech Interviewer', email: 'interviewer@cap.com', password: 'Inter@123', role: 'interviewer' });

  // Roles
  const swRole = await Role.create({
    title: 'Software Engineer', department: 'Engineering', experienceLevel: 'mid',
    scoringWeights: { aptitude: 15, technical: 55, reasoning: 20, communication: 10 },
    createdBy: admin._id,
  });
  const hrRole = await Role.create({
    title: 'HR Executive', department: 'Human Resources', experienceLevel: 'junior',
    scoringWeights: { aptitude: 20, technical: 10, reasoning: 30, communication: 40 },
    createdBy: admin._id,
  });

  // Questions
  const questions = await Question.insertMany([
    // Aptitude
    { type: 'mcq_single', category: 'aptitude', difficulty: 'easy', text: 'If a train travels 60 km in 1 hour, how far will it travel in 2.5 hours?', options: [{ id: 'a', text: '120 km' }, { id: 'b', text: '150 km' }, { id: 'c', text: '180 km' }, { id: 'd', text: '90 km' }], correctAnswer: 'b', points: 1, active: true, createdBy: admin._id },
    { type: 'mcq_single', category: 'aptitude', difficulty: 'medium', text: 'A store sells apples at $2 each and oranges at $3 each. If you buy 4 apples and 3 oranges, what is the total cost?', options: [{ id: 'a', text: '$15' }, { id: 'b', text: '$17' }, { id: 'c', text: '$18' }, { id: 'd', text: '$20' }], correctAnswer: 'b', points: 1, active: true, createdBy: admin._id },
    { type: 'true_false', category: 'aptitude', difficulty: 'easy', text: 'The square root of 144 is 12.', options: [{ id: 'true', text: 'True' }, { id: 'false', text: 'False' }], correctAnswer: 'true', points: 1, active: true, createdBy: admin._id },
    // Technical
    { type: 'mcq_single', category: 'technical', difficulty: 'medium', text: 'What is the time complexity of binary search?', options: [{ id: 'a', text: 'O(n)' }, { id: 'b', text: 'O(log n)' }, { id: 'c', text: 'O(n²)' }, { id: 'd', text: 'O(1)' }], correctAnswer: 'b', points: 2, active: true, createdBy: admin._id },
    { type: 'mcq_single', category: 'technical', difficulty: 'hard', text: 'Which HTTP status code indicates a resource was not found?', options: [{ id: 'a', text: '200' }, { id: 'b', text: '301' }, { id: 'c', text: '404' }, { id: 'd', text: '500' }], correctAnswer: 'c', points: 2, active: true, createdBy: admin._id },
    { type: 'mcq_multi', category: 'technical', difficulty: 'medium', text: 'Which of the following are JavaScript data types?', options: [{ id: 'a', text: 'String' }, { id: 'b', text: 'Integer' }, { id: 'c', text: 'Boolean' }, { id: 'd', text: 'Float' }], correctAnswer: ['a', 'c'], points: 2, active: true, createdBy: admin._id },
    { type: 'mcq_single', category: 'technical', difficulty: 'easy', text: 'What does CSS stand for?', options: [{ id: 'a', text: 'Computer Style Sheets' }, { id: 'b', text: 'Cascading Style Sheets' }, { id: 'c', text: 'Creative Style System' }, { id: 'd', text: 'Colorful Style Sheets' }], correctAnswer: 'b', points: 1, active: true, createdBy: admin._id },
    // Reasoning
    { type: 'mcq_single', category: 'reasoning', difficulty: 'medium', text: 'All roses are flowers. Some flowers fade quickly. Therefore:', options: [{ id: 'a', text: 'All roses fade quickly' }, { id: 'b', text: 'Some roses may fade quickly' }, { id: 'c', text: 'No roses fade quickly' }, { id: 'd', text: 'All flowers are roses' }], correctAnswer: 'b', points: 1, active: true, createdBy: admin._id },
    { type: 'mcq_single', category: 'reasoning', difficulty: 'easy', text: 'What comes next in the sequence: 2, 4, 8, 16, ?', options: [{ id: 'a', text: '24' }, { id: 'b', text: '32' }, { id: 'c', text: '20' }, { id: 'd', text: '18' }], correctAnswer: 'b', points: 1, active: true, createdBy: admin._id },
    // Communication
    { type: 'short_answer', category: 'communication', difficulty: 'medium', text: 'Describe a situation where you had to explain a complex technical concept to a non-technical stakeholder. How did you approach it?', points: 3, active: true, createdBy: admin._id },
    { type: 'scenario', category: 'communication', difficulty: 'medium', text: 'A client is unhappy with a project delay. How would you communicate this situation and manage their expectations?', points: 3, active: true, createdBy: admin._id },
  ]);

  // Assessment for SW Engineer
  const swAssessment = await Assessment.create({
    roleId: swRole._id,
    title: 'Software Engineer Assessment',
    description: 'Comprehensive assessment for mid-level software engineers',
    duration: 60,
    totalQuestions: 10,
    sections: [
      { name: 'Aptitude', category: 'aptitude', questionCount: 2, difficulty: 'mixed', weight: 15 },
      { name: 'Technical', category: 'technical', questionCount: 4, difficulty: 'mixed', weight: 55 },
      { name: 'Reasoning', category: 'reasoning', questionCount: 2, difficulty: 'medium', weight: 20 },
      { name: 'Communication', category: 'communication', questionCount: 2, difficulty: 'medium', weight: 10 },
    ],
    randomizeQuestions: true,
    randomizeOptions: true,
    allowBacktrack: true,
    passThreshold: 60,
    active: true,
    createdBy: admin._id,
  });

  await Role.findByIdAndUpdate(swRole._id, { assessmentTemplate: swAssessment._id });

  // Sample candidates
  await Candidate.insertMany([
    { name: 'Alice Johnson', email: 'alice@example.com', phone: '+1-555-0101', appliedRole: swRole._id, experienceLevel: 'mid', assessmentStatus: 'completed', overallScore: 78, recommendation: 'strong', finalDecision: 'shortlisted', addedBy: hr._id },
    { name: 'Bob Smith', email: 'bob@example.com', phone: '+1-555-0102', appliedRole: swRole._id, experienceLevel: 'junior', assessmentStatus: 'invited', addedBy: hr._id },
    { name: 'Carol White', email: 'carol@example.com', phone: '+1-555-0103', appliedRole: hrRole._id, experienceLevel: 'junior', assessmentStatus: 'pending', addedBy: hr._id },
    { name: 'David Lee', email: 'david@example.com', phone: '+1-555-0104', appliedRole: swRole._id, experienceLevel: 'senior', assessmentStatus: 'completed', overallScore: 91, recommendation: 'excellent', finalDecision: 'hired', addedBy: hr._id },
  ]);

  console.log('\n✅ Seed complete!');
  console.log('─────────────────────────────');
  console.log('Admin:       Admin@byline.com / admin@2026');
  console.log('HR:          hr@cap.com / Hr@12345');
  console.log('Interviewer: interviewer@cap.com / Inter@123');
  console.log('─────────────────────────────');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
