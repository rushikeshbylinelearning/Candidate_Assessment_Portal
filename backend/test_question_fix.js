/**
 * Test script to verify the question fetching fix
 * 
 * Run with: node test_question_fix.js
 * 
 * This script:
 * 1. Connects to MongoDB
 * 2. Finds assessments with selectedQuestions
 * 3. Simulates the getSession logic
 * 4. Verifies correct questions are returned
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Assessment = require('./src/modules/assessment/assessment.model');
const Question = require('./src/modules/question/question.model');

async function testQuestionFetching() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.error('❌ Error: MONGODB_URI not found in .env file');
      console.error('   Make sure your .env file has MONGODB_URI defined');
      process.exit(1);
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Find all assessments
    const assessments = await Assessment.find({}).populate('selectedQuestions');
    console.log(`Found ${assessments.length} assessments\n`);

    for (const assessment of assessments) {
      console.log('─'.repeat(80));
      console.log(`Assessment: ${assessment.title}`);
      console.log(`ID: ${assessment._id}`);
      console.log(`Total Questions: ${assessment.totalQuestions}`);
      console.log(`Selected Questions: ${assessment.selectedQuestions?.length || 0}`);
      console.log(`Sections: ${assessment.sections?.length || 0}`);

      let questions = [];

      // SIMULATE THE FIX
      if (assessment.selectedQuestions && assessment.selectedQuestions.length > 0) {
        console.log('\n✅ Using PRE-SELECTED questions (correct path)');
        
        questions = await Question.find({
          _id: { $in: assessment.selectedQuestions },
          active: true,
        }).select('-correctAnswer -explanation');

        console.log(`   Fetched ${questions.length} questions`);
        
        // Show first 3 questions
        questions.slice(0, 3).forEach((q, i) => {
          console.log(`   ${i + 1}. [${q.type}] ${q.text.substring(0, 60)}...`);
        });

        // Verify count matches
        if (questions.length !== assessment.totalQuestions) {
          console.log(`\n⚠️  WARNING: Question count mismatch!`);
          console.log(`   Expected: ${assessment.totalQuestions}`);
          console.log(`   Got: ${questions.length}`);
        } else {
          console.log(`\n✅ Question count matches!`);
        }

      } else if (assessment.sections && assessment.sections.length > 0) {
        console.log('\n⚠️  Using SECTION-BASED selection (fallback)');
        
        for (const section of assessment.sections) {
          const sectionQuestions = await Question.find({
            category: section.category,
            difficulty: section.difficulty === 'mixed' 
              ? { $in: ['easy', 'medium', 'hard'] } 
              : section.difficulty,
            active: true,
          }).select('-correctAnswer -explanation').limit(section.questionCount);

          console.log(`   Section: ${section.category} (${section.difficulty})`);
          console.log(`   Found ${sectionQuestions.length} questions`);
          
          questions.push(...sectionQuestions);
        }

        console.log(`\n   Total fetched: ${questions.length} questions`);

      } else {
        console.log('\n❌ ERROR: No selectedQuestions AND no sections!');
        console.log('   This assessment is misconfigured.');
      }

      // Check for question type diversity
      if (questions.length > 0) {
        const types = {};
        questions.forEach(q => {
          types[q.type] = (types[q.type] || 0) + 1;
        });
        console.log('\nQuestion Types:');
        Object.entries(types).forEach(([type, count]) => {
          console.log(`   ${type}: ${count}`);
        });
      }

      console.log('');
    }

    console.log('─'.repeat(80));
    console.log('\n✅ Test complete!\n');

    // Summary
    const withSelected = assessments.filter(a => a.selectedQuestions?.length > 0).length;
    const withSections = assessments.filter(a => !a.selectedQuestions?.length && a.sections?.length > 0).length;
    const misconfigured = assessments.filter(a => !a.selectedQuestions?.length && !a.sections?.length).length;

    console.log('Summary:');
    console.log(`  ${withSelected} assessments with pre-selected questions (will use fix)`);
    console.log(`  ${withSections} assessments with section-based selection (fallback)`);
    if (misconfigured > 0) {
      console.log(`  ⚠️  ${misconfigured} misconfigured assessments (need attention)`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the test
testQuestionFetching();
