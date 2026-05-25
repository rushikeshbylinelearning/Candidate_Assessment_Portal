/**
 * Update Script: Remove EVALUATION_FORM Step
 * 
 * This script removes the EVALUATION_FORM step from all role configurations
 * and updates the weights accordingly.
 * 
 * Usage: node src/scripts/removeEvaluationForm.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Role = require('../modules/roles/role.model');
const StepConfig = require('../modules/pipeline/stepConfig.model');

/**
 * Updated step configuration without EVALUATION_FORM
 */
const UPDATED_STEPS = [
  {
    stepType: 'LANGUAGE_ASSESSMENT',
    order: 1,
    required: true,
    skip: false,
    scoringWeight: 25,
    timeLimitMins: 45,
  },
  {
    stepType: 'ROLE_BASED_ASSESSMENT',
    order: 2,
    required: false,
    skip: false,
    scoringWeight: 45,
    timeLimitMins: 60,
  },
  {
    stepType: 'INTERVIEW_INTERACTION',
    order: 3,
    required: true,
    skip: false,
    scoringWeight: 20,
    timeLimitMins: null,
  },
  {
    stepType: 'POST_INTERVIEW_FEEDBACK',
    order: 4,
    required: true,
    skip: false,
    scoringWeight: 10,
    timeLimitMins: null,
  }
];

async function removeEvaluationForm() {
  try {
    // Connect to database
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('Connected to database successfully\n');

    // Get all step configurations
    const configs = await StepConfig.find({}).populate('roleId', 'title department');
    
    console.log(`Found ${configs.length} step configurations\n`);

    let updatedCount = 0;

    for (const config of configs) {
      const roleName = config.roleId ? `${config.roleId.title} (${config.roleId.department})` : 'Unknown Role';
      
      console.log(`Processing: ${roleName}`);
      console.log('─'.repeat(60));
      
      // Check if EVALUATION_FORM exists
      const hasEvalForm = config.steps.some(s => s.stepType === 'EVALUATION_FORM');
      
      if (hasEvalForm) {
        console.log('  ✓ Found EVALUATION_FORM step, removing...');
        
        // Update with new steps
        config.steps = UPDATED_STEPS;
        await config.save();
        
        console.log('  ✓ Updated to 4 steps (removed EVALUATION_FORM)');
        console.log('  ✓ Adjusted weights: LANGUAGE_ASSESSMENT 25%, ROLE_BASED 45%');
        updatedCount++;
      } else {
        console.log('  ℹ No EVALUATION_FORM found, skipping');
      }
      
      console.log('');
    }

    console.log('='.repeat(60));
    console.log('Update Complete!');
    console.log('='.repeat(60));
    console.log(`Total configurations: ${configs.length}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Skipped: ${configs.length - updatedCount}`);
    console.log('='.repeat(60) + '\n');

    // Display new configuration
    console.log('New Step Configuration:');
    console.log('─'.repeat(60));
    UPDATED_STEPS.forEach(step => {
      console.log(`${step.order}. ${step.stepType}`);
      console.log(`   Weight: ${step.scoringWeight}% | Time: ${step.timeLimitMins || 'No limit'} mins`);
      console.log(`   Required: ${step.required ? 'Yes' : 'No'}`);
      console.log('');
    });

  } catch (error) {
    console.error('Update failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the update
removeEvaluationForm();
