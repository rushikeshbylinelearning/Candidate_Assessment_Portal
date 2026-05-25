/**
 * Test Script: Verify Access Code
 * 
 * This script checks if a candidate with a specific access code exists
 * and displays their information.
 * 
 * Usage: node src/scripts/testAccessCode.js [accessCode]
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Candidate = require('../modules/candidate/candidate.model');
const Role = require('../modules/roles/role.model');

async function testAccessCode() {
  try {
    // Connect to database
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('Connected to database successfully\n');

    // Get access code from command line or use a test code
    const accessCode = process.argv[2];
    
    if (!accessCode) {
      console.log('Usage: node src/scripts/testAccessCode.js [accessCode]');
      console.log('\nListing all candidates with access codes:\n');
      
      const candidates = await Candidate.find({ 
        accessCode: { $exists: true, $ne: null, $ne: '' } 
      }).populate('appliedRole', 'title department').limit(10);
      
      if (candidates.length === 0) {
        console.log('No candidates with access codes found.');
        console.log('Run: node src/scripts/addAccessCodes.js');
      } else {
        console.log('Found', candidates.length, 'candidates:\n');
        candidates.forEach(c => {
          console.log(`Code: ${c.accessCode} | Name: ${c.name} | Email: ${c.email} | Role: ${c.appliedRole?.title || 'N/A'}`);
        });
      }
      
      process.exit(0);
    }

    // Test specific access code
    console.log(`Testing access code: ${accessCode}\n`);
    
    const candidate = await Candidate.findOne({ accessCode })
      .populate('appliedRole', 'title department scoringWeights');
    
    if (!candidate) {
      console.log('❌ No candidate found with this access code');
      process.exit(1);
    }
    
    console.log('✅ Candidate found!');
    console.log('─'.repeat(60));
    console.log('Name:', candidate.name);
    console.log('Email:', candidate.email);
    console.log('Phone:', candidate.phone || 'N/A');
    console.log('Access Code:', candidate.accessCode);
    console.log('Assessment Status:', candidate.assessmentStatus);
    console.log('Applied Role:', candidate.appliedRole?.title || 'N/A');
    console.log('Department:', candidate.appliedRole?.department || 'N/A');
    console.log('Experience Level:', candidate.experienceLevel || 'N/A');
    console.log('─'.repeat(60));
    
    // Check for pipeline
    const PipelineRecord = require('../modules/pipeline/pipeline.model');
    const pipeline = await PipelineRecord.findOne({
      candidateId: candidate._id,
      roleId: candidate.appliedRole?._id
    });
    
    if (pipeline) {
      console.log('\n✅ Pipeline exists');
      console.log('Current Step:', pipeline.currentStep);
      console.log('Status:', pipeline.status);
      console.log('Aggregate Score:', pipeline.aggregateScore || 'N/A');
    } else {
      console.log('\n⚠️  No pipeline found (will be created on first access)');
    }
    
    // Check for step configs
    const StepConfig = require('../modules/pipeline/stepConfig.model');
    const stepConfig = await StepConfig.findOne({ 
      roleId: candidate.appliedRole?._id 
    });
    
    if (stepConfig && stepConfig.steps && stepConfig.steps.length > 0) {
      console.log('\n✅ Step configurations found:', stepConfig.steps.length);
      stepConfig.steps.forEach(sc => {
        console.log(`  ${sc.order}. ${sc.stepType} (Weight: ${sc.scoringWeight}%)`);
      });
    } else {
      console.log('\n❌ No step configurations found for this role');
      console.log('Run: node src/scripts/setupPipelineSteps.js');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('Test Complete!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the test
testAccessCode();
