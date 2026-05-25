/**
 * Diagnostic script to check a specific assessment
 * 
 * Run with: node diagnose_assessment.js "69e9b74093b4e6ffed365a7c"
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Assessment = require('./src/modules/assessment/assessment.model');
const Question = require('./src/modules/question/question.model');

async function diagnoseAssessment(assessmentId) {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const assessment = await Assessment.findById(assessmentId).populate('selectedQuestions');
    
    if (!assessment) {
      console.log('❌ Assessment not found');
      return;
    }

    console.log('═'.repeat(80));
    console.log('ASSESSMENT DETAILS');
    console.log('═'.repeat(80));
    console.log(`Title: ${assessment.title}`);
    console.log(`ID: ${assessment._id}`);
    console.log(`Mode: ${assessment.mode || 'not set'}`);
    console.log(`Created: ${assessment.createdAt}`);
    console.log(`Total Questions: ${assessment.totalQuestions}`);
    console.log(`Selected Questions: ${assessment.selectedQuestions?.length || 0}`);
    console.log(`Sections: ${assessment.sections?.length || 0}`);
    console.log(`Randomize Questions: ${assessment.randomizeQuestions}`);
    console.log(`Randomize Options: ${assessment.randomizeOptions}`);
    console.log('');

    // Show sections
    if (assessment.sections && assessment.sections.length > 0) {
      console.log('SECTIONS:');
      assessment.sections.forEach((s, i) => {
        console.log(`  ${i + 1}. ${s.name || 'Unnamed'}`);
        console.log(`     Category: ${s.category}`);
        console.log(`     Difficulty: ${s.difficulty}`);
        console.log(`     Question Count: ${s.questionCount}`);
        console.log(`     Weight: ${s.weight}%`);
      });
      console.log('');
    }

    // Show selected questions
    if (assessment.selectedQuestions && assessment.selectedQuestions.length > 0) {
      console.log('SELECTED QUESTIONS:');
      assessment.selectedQuestions.forEach((q, i) => {
        console.log(`  ${i + 1}. [${q.type}] ${q.text.substring(0, 60)}...`);
        console.log(`     Category: ${q.category}, Difficulty: ${q.difficulty}, Points: ${q.points}`);
      });
      console.log('');
    }

    // Simulate what getSession would return
    console.log('═'.repeat(80));
    console.log('WHAT CANDIDATES WILL SEE (Simulating getSession)');
    console.log('═'.repeat(80));

    let questions = [];

    if (assessment.selectedQuestions && assessment.selectedQuestions.length > 0) {
      console.log('✅ Using PRE-SELECTED questions\n');
      
      questions = await Question.find({
        _id: { $in: assessment.selectedQuestions },
        active: true,
      }).select('-correctAnswer -explanation');

      console.log(`Fetched ${questions.length} questions:`);
      questions.forEach((q, i) => {
        console.log(`  ${i + 1}. [${q.type}] ${q.text.substring(0, 60)}...`);
      });

    } else if (assessment.sections && assessment.sections.length > 0) {
      console.log('⚠️  Using SECTION-BASED selection (fallback)\n');
      
      for (const section of assessment.sections) {
        console.log(`Section: ${section.category} (${section.difficulty})`);
        
        const sectionQuestions = await Question.find({
          category: section.category,
          difficulty: section.difficulty === 'mixed' 
            ? { $in: ['easy', 'medium', 'hard'] } 
            : section.difficulty,
          active: true,
        }).select('-correctAnswer -explanation').limit(section.questionCount);

        console.log(`  Found ${sectionQuestions.length} questions:`);
        sectionQuestions.forEach((q, i) => {
          console.log(`    ${i + 1}. [${q.type}] ${q.text.substring(0, 50)}...`);
        });
        console.log('');
        
        questions.push(...sectionQuestions);
      }

      console.log(`Total: ${questions.length} questions`);
    } else {
      console.log('❌ ERROR: No selectedQuestions AND no sections!');
    }

    // Summary
    console.log('');
    console.log('═'.repeat(80));
    console.log('DIAGNOSIS');
    console.log('═'.repeat(80));

    if (assessment.selectedQuestions && assessment.selectedQuestions.length > 0) {
      console.log('✅ This assessment is configured correctly');
      console.log('   It has pre-selected questions and will show the same questions to all candidates');
      
      if (questions.length !== assessment.totalQuestions) {
        console.log('');
        console.log('⚠️  WARNING: Question count mismatch!');
        console.log(`   Expected: ${assessment.totalQuestions}`);
        console.log(`   Got: ${questions.length}`);
        console.log('   Some questions may be inactive or deleted');
      }
    } else if (assessment.sections && assessment.sections.length > 0) {
      console.log('⚠️  This assessment uses SECTION-BASED selection');
      console.log('   Questions are fetched dynamically from the pool');
      console.log('   Different candidates may see different questions (if randomization enabled)');
      console.log('');
      console.log('💡 RECOMMENDATION:');
      console.log('   If you want candidates to see specific questions:');
      console.log('   1. Edit this assessment');
      console.log('   2. Select specific questions');
      console.log('   3. Save with selectedQuestions populated');
    } else {
      console.log('❌ This assessment is MISCONFIGURED');
      console.log('   It has no selectedQuestions AND no sections');
      console.log('   Candidates will see an error when trying to take it');
    }

    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Get assessment ID from command line
const assessmentId = process.argv[2];

if (!assessmentId) {
  console.log('Usage: node diagnose_assessment.js <assessment_id>');
  console.log('Example: node diagnose_assessment.js 69e9b74093b4e6ffed365a7c');
  process.exit(1);
}

diagnoseAssessment(assessmentId);
