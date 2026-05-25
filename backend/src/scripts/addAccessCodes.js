/**
 * Migration Script: Add Access Codes to Existing Candidates
 * 
 * This script generates unique 6-digit access codes for all existing candidates
 * who don't have one yet.
 * 
 * Usage: node src/scripts/addAccessCodes.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Candidate = require('../modules/candidate/candidate.model');

/**
 * Generate a unique 6-digit access code
 */
function generateAccessCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Main migration function
 */
async function addAccessCodes() {
  try {
    // Connect to database
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('Connected to database successfully\n');

    // Find all candidates without access codes
    const candidatesWithoutCodes = await Candidate.find({ 
      $or: [
        { accessCode: { $exists: false } },
        { accessCode: null },
        { accessCode: '' }
      ]
    });

    console.log(`Found ${candidatesWithoutCodes.length} candidates without access codes\n`);

    if (candidatesWithoutCodes.length === 0) {
      console.log('All candidates already have access codes. Nothing to do.');
      process.exit(0);
    }

    let successCount = 0;
    let errorCount = 0;
    const usedCodes = new Set();

    // Get all existing access codes to avoid duplicates
    const existingCandidates = await Candidate.find({ 
      accessCode: { $exists: true, $ne: null, $ne: '' } 
    }).select('accessCode');
    
    existingCandidates.forEach(c => usedCodes.add(c.accessCode));
    console.log(`Found ${usedCodes.size} existing access codes\n`);

    // Process each candidate
    for (const candidate of candidatesWithoutCodes) {
      try {
        let accessCode;
        let attempts = 0;
        const maxAttempts = 20;

        // Generate unique code
        do {
          accessCode = generateAccessCode();
          attempts++;
          if (attempts >= maxAttempts) {
            throw new Error('Failed to generate unique access code after maximum attempts');
          }
        } while (usedCodes.has(accessCode));

        // Update candidate
        candidate.accessCode = accessCode;
        await candidate.save();
        
        usedCodes.add(accessCode);
        successCount++;
        
        console.log(`✓ ${candidate.name} (${candidate.email}) → ${accessCode}`);
      } catch (error) {
        errorCount++;
        console.error(`✗ Failed for ${candidate.name} (${candidate.email}): ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Migration Complete!');
    console.log('='.repeat(60));
    console.log(`Total candidates processed: ${candidatesWithoutCodes.length}`);
    console.log(`Successfully updated: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the migration
addAccessCodes();
