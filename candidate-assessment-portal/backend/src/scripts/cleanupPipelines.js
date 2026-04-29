/**
 * Cleanup Script: Remove Existing Pipelines
 * 
 * This script removes all existing pipeline records so they can be
 * recreated with the new configuration (without EVALUATION_FORM).
 * 
 * Usage: node src/scripts/cleanupPipelines.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const PipelineRecord = require('../modules/pipeline/pipeline.model');
const Candidate = require('../modules/candidate/candidate.model');

async function cleanupPipelines() {
  try {
    // Connect to database
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('Connected to database successfully\n');

    // Find all pipelines
    const pipelines = await PipelineRecord.find({}).populate('candidateId', 'name email');
    
    console.log(`Found ${pipelines.length} existing pipelines\n`);

    if (pipelines.length === 0) {
      console.log('No pipelines to clean up.');
      process.exit(0);
    }

    console.log('Pipelines to be deleted:');
    console.log('─'.repeat(60));
    pipelines.forEach(p => {
      const candidateName = p.candidateId ? p.candidateId.name : 'Unknown';
      console.log(`  • ${candidateName} - Current Step: ${p.currentStep} - Status: ${p.status}`);
    });
    console.log('');

    // Delete all pipelines
    const result = await PipelineRecord.deleteMany({});
    
    console.log('='.repeat(60));
    console.log('Cleanup Complete!');
    console.log('='.repeat(60));
    console.log(`Pipelines deleted: ${result.deletedCount}`);
    console.log('='.repeat(60));
    console.log('\nℹ️  New pipelines will be created automatically when candidates');
    console.log('   access the portal using their access codes.');
    console.log('');

  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the cleanup
cleanupPipelines();
