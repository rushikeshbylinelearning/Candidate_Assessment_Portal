/**
 * Cleanup Script: Remove Invalid Step Configurations
 * 
 * This script removes step configurations that have empty or invalid steps arrays
 * 
 * Usage: node src/scripts/cleanupStepConfigs.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Role = require('../modules/roles/role.model');
const StepConfig = require('../modules/pipeline/stepConfig.model');

async function cleanupStepConfigs() {
  try {
    // Connect to database
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('Connected to database successfully\n');

    // Find all step configurations
    const allConfigs = await StepConfig.find({}).populate('roleId', 'title department');
    
    console.log(`Found ${allConfigs.length} step configurations\n`);
    
    let deletedCount = 0;
    
    for (const config of allConfigs) {
      const stepsCount = config.steps ? config.steps.length : 0;
      const roleName = config.roleId ? `${config.roleId.title} (${config.roleId.department})` : 'Unknown Role';
      
      console.log(`Config for ${roleName}: ${stepsCount} steps`);
      
      if (stepsCount === 0) {
        console.log(`  ✗ Deleting empty configuration...`);
        await StepConfig.findByIdAndDelete(config._id);
        deletedCount++;
      } else {
        console.log(`  ✓ Valid configuration`);
        config.steps.forEach(step => {
          console.log(`    ${step.order}. ${step.stepType}`);
        });
      }
      console.log('');
    }
    
    console.log('='.repeat(60));
    console.log('Cleanup Complete!');
    console.log('='.repeat(60));
    console.log(`Total configurations: ${allConfigs.length}`);
    console.log(`Deleted: ${deletedCount}`);
    console.log(`Remaining: ${allConfigs.length - deletedCount}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the cleanup
cleanupStepConfigs();
