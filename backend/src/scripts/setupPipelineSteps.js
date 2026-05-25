/**
 * Setup Script: Configure Pipeline Steps for Roles
 * 
 * This script creates default step configurations for all roles
 * that don't have pipeline steps configured yet.
 * 
 * Usage: node src/scripts/setupPipelineSteps.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Role = require('../modules/roles/role.model');
const StepConfig = require('../modules/pipeline/stepConfig.model');

/**
 * Default step configuration template
 */
const DEFAULT_STEPS = [
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
    required: false, // Optional - only if HR assigns
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
    timeLimitMins: null, // No time limit for interviews
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

/**
 * Main setup function
 */
async function setupPipelineSteps() {
  try {
    // Connect to database
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('Connected to database successfully\n');

    // Get all roles
    const roles = await Role.find({});
    console.log(`Found ${roles.length} roles\n`);

    if (roles.length === 0) {
      console.log('No roles found. Please create roles first.');
      process.exit(0);
    }

    let totalCreated = 0;
    let totalSkipped = 0;

    // Process each role
    for (const role of roles) {
      console.log(`\nProcessing role: ${role.title} (${role.department})`);
      console.log('─'.repeat(60));

      // Check if steps already exist for this role
      const existingConfig = await StepConfig.findOne({ roleId: role._id });
      
      if (existingConfig) {
        console.log(`✓ Already has ${existingConfig.steps.length} steps configured. Skipping.`);
        totalSkipped++;
        continue;
      }

      // Create step configuration for this role
      try {
        const stepConfig = await StepConfig.create({
          roleId: role._id,
          steps: DEFAULT_STEPS
        });
        
        console.log(`✓ Created step configuration with ${stepConfig.steps.length} steps`);
        stepConfig.steps.forEach(step => {
          console.log(`  ${step.order}. ${step.stepType} (Weight: ${step.scoringWeight}%)`);
        });
        totalCreated++;
      } catch (error) {
        console.error(`✗ Failed to create configuration: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Setup Complete!');
    console.log('='.repeat(60));
    console.log(`Roles processed: ${roles.length}`);
    console.log(`Roles configured: ${totalCreated}`);
    console.log(`Roles skipped (already configured): ${totalSkipped}`);
    console.log('='.repeat(60) + '\n');

    // Display summary
    console.log('Step Configuration Summary:');
    console.log('─'.repeat(60));
    DEFAULT_STEPS.forEach(step => {
      console.log(`${step.order}. ${step.stepType}`);
      console.log(`   Weight: ${step.scoringWeight}% | Time: ${step.timeLimitMins || 'No limit'} mins`);
      console.log(`   Required: ${step.required ? 'Yes' : 'No'}`);
      console.log('');
    });

  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the setup
setupPipelineSteps();
