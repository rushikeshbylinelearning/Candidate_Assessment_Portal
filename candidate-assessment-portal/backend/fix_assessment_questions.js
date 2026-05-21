/**
 * Script to fix an assessment by converting it from section-based to pre-selected questions
 * 
 * This script:
 * 1. Takes an assessment ID
 * 2. Asks which questions should be selected
 * 3. Updates the assessment with selectedQuestions
 * 
 * Run with: node fix_assessment_questions.js <assessment_id>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Assessment = require('./src/modules/assessment/assessment.model');
const Question = require('./src/modules/question/question.model');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

async function fixAssessment(assessmentId) {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const assessment = await Assessment.findById(assessmentId);
    
    if (!assessment) {
      console.log('❌ Assessment not found');
      return;
    }

    console.log('═'.repeat(80));
    console.log(`Assessment: ${assessment.title}`);
    console.log(`Current selectedQuestions: ${assessment.selectedQuestions?.length || 0}`);
    console.log('═'.repeat(80));
    console.log('');

    // Option 1: Show all questions and let user select
    console.log('Fetching all available questions...\n');
    
    const allQuestions = await Question.find({ active: true }).sort('category createdAt');
    
    console.log(`Found ${allQuestions.length} active questions in the database\n`);
    console.log('Questions by type:');
    
    const byType = {};
    allQuestions.forEach(q => {
      byType[q.type] = (byType[q.type] || 0) + 1;
    });
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    console.log('');

    // Filter to descriptive questions
    const descriptiveQuestions = allQuestions.filter(q => 
      q.type === 'descriptive' || 
      q.type === 'short_answer' || 
      q.type === 'essay' ||
      q.type === 'text'
    );

    console.log(`Found ${descriptiveQuestions.length} descriptive/text-based questions:\n`);
    
    descriptiveQuestions.forEach((q, i) => {
      console.log(`${i + 1}. [${q.type}] ${q.text.substring(0, 70)}...`);
      console.log(`   Category: ${q.category}, Difficulty: ${q.difficulty}, Points: ${q.points}`);
      console.log(`   ID: ${q._id}`);
      console.log('');
    });

    console.log('═'.repeat(80));
    console.log('OPTIONS:');
    console.log('═'.repeat(80));
    console.log('1. Use ALL descriptive questions listed above');
    console.log('2. Enter specific question IDs (comma-separated)');
    console.log('3. Keep current section-based configuration (no changes)');
    console.log('');

    const choice = await question('Enter your choice (1-3): ');

    let selectedQuestionIds = [];

    if (choice === '1') {
      selectedQuestionIds = descriptiveQuestions.map(q => q._id);
      console.log(`\n✅ Selected ${selectedQuestionIds.length} descriptive questions`);
      
    } else if (choice === '2') {
      const ids = await question('\nEnter question IDs (comma-separated): ');
      selectedQuestionIds = ids.split(',').map(id => id.trim()).filter(id => id);
      console.log(`\n✅ Selected ${selectedQuestionIds.length} questions`);
      
    } else {
      console.log('\n❌ No changes made');
      rl.close();
      return;
    }

    // Verify the questions exist
    const verifiedQuestions = await Question.find({ 
      _id: { $in: selectedQuestionIds },
      active: true 
    });

    if (verifiedQuestions.length !== selectedQuestionIds.length) {
      console.log(`\n⚠️  WARNING: Only ${verifiedQuestions.length} of ${selectedQuestionIds.length} questions found`);
    }

    console.log('\nQuestions to be saved:');
    verifiedQuestions.forEach((q, i) => {
      console.log(`  ${i + 1}. [${q.type}] ${q.text.substring(0, 60)}...`);
    });
    console.log('');

    const confirm = await question(`\nUpdate assessment with these ${verifiedQuestions.length} questions? (yes/no): `);

    if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
      console.log('\n❌ Cancelled');
      rl.close();
      return;
    }

    // Update the assessment
    assessment.selectedQuestions = verifiedQuestions.map(q => q._id);
    assessment.totalQuestions = verifiedQuestions.length;
    assessment.mode = 'standard'; // Mark as standard mode
    await assessment.save();

    console.log('\n✅ Assessment updated successfully!');
    console.log(`   Selected Questions: ${assessment.selectedQuestions.length}`);
    console.log(`   Total Questions: ${assessment.totalQuestions}`);
    console.log(`   Mode: ${assessment.mode}`);
    console.log('');
    console.log('Candidates will now see these specific questions when taking the assessment.');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    rl.close();
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Get assessment ID from command line
const assessmentId = process.argv[2];

if (!assessmentId) {
  console.log('Usage: node fix_assessment_questions.js <assessment_id>');
  console.log('Example: node fix_assessment_questions.js 69e9b74093b4e6ffed365a7c');
  process.exit(1);
}

fixAssessment(assessmentId);
