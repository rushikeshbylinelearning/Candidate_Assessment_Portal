require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const Candidate = require('../modules/candidate/candidate.model');
const ResumeData = require('../modules/resume/resume.model');
const { parseResume } = require('../modules/resume/parser.service');

// Connect to database
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', () => {
  console.log('✓ Connected to MongoDB\n');
  runMigration();
});

async function parseResumeAsync(resumeDataId, filePath, fileType) {
  try {
    const parsedData = await parseResume(filePath, fileType);
    
    await ResumeData.findByIdAndUpdate(resumeDataId, {
      ...parsedData,
      parsingStatus: 'completed',
    });
    
    return { success: true };
  } catch (error) {
    await ResumeData.findByIdAndUpdate(resumeDataId, {
      parsingStatus: 'failed',
      parsingError: error.message,
    });
    
    return { success: false, error: error.message };
  }
}

async function runMigration() {
  try {
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║   RESUME INTELLIGENCE MIGRATION SCRIPT         ║');
    console.log('╚════════════════════════════════════════════════╝\n');
    
    // Find all candidates with resumes
    const candidates = await Candidate.find({ 
      resumeUrl: { $exists: true, $ne: null } 
    });
    
    if (candidates.length === 0) {
      console.log('No candidates with resumes found. Nothing to migrate.\n');
      process.exit(0);
    }
    
    console.log(`Found ${candidates.length} candidates with resumes\n`);
    console.log('Starting migration...\n');
    
    let processed = 0;
    let successful = 0;
    let failed = 0;
    let skipped = 0;
    const errors = [];
    
    for (const candidate of candidates) {
      processed++;
      const progress = `[${processed}/${candidates.length}]`;
      console.log(`${progress} ${candidate.name}`);
      
      try {
        // Check if already parsed
        const existing = await ResumeData.findOne({ 
          candidateId: candidate._id 
        });
        
        if (existing && existing.parsingStatus === 'completed') {
          console.log(`  ⊘ Already parsed - skipping\n`);
          skipped++;
          continue;
        }
        
        // Extract file info
        const fileType = path.extname(candidate.resumeUrl)
          .slice(1)
          .toLowerCase();
        
        if (!['pdf', 'doc', 'docx'].includes(fileType)) {
          const error = `Unsupported file type: ${fileType}`;
          console.log(`  ✗ ${error}\n`);
          errors.push({ candidate: candidate.name, error });
          failed++;
          continue;
        }
        
        const filePath = path.join(__dirname, '../../', candidate.resumeUrl);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
          const error = `File not found: ${filePath}`;
          console.log(`  ✗ ${error}\n`);
          errors.push({ candidate: candidate.name, error });
          failed++;
          continue;
        }
        
        // Create or update resume data record
        let resumeData;
        if (existing) {
          resumeData = existing;
          resumeData.parsingStatus = 'processing';
          await resumeData.save();
        } else {
          resumeData = await ResumeData.create({
            candidateId: candidate._id,
            fileUrl: candidate.resumeUrl,
            fileType,
            parsingStatus: 'processing',
          });
        }
        
        // Parse resume
        console.log(`  ⟳ Parsing ${fileType.toUpperCase()}...`);
        const result = await parseResumeAsync(
          resumeData._id, 
          filePath, 
          fileType
        );
        
        if (result.success) {
          console.log(`  ✓ Successfully parsed\n`);
          successful++;
        } else {
          console.log(`  ✗ Parsing failed: ${result.error}\n`);
          errors.push({ candidate: candidate.name, error: result.error });
          failed++;
        }
        
        // Add delay to avoid overloading server (adjust as needed)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`  ✗ Error: ${error.message}\n`);
        errors.push({ candidate: candidate.name, error: error.message });
        failed++;
      }
    }
    
    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('MIGRATION SUMMARY');
    console.log('═'.repeat(60));
    console.log(`Total candidates:     ${candidates.length}`);
    console.log(`Processed:            ${processed}`);
    console.log(`✓ Successful:         ${successful} (${Math.round(successful/processed*100)}%)`);
    console.log(`✗ Failed:             ${failed} (${Math.round(failed/processed*100)}%)`);
    console.log(`⊘ Skipped:            ${skipped}`);
    console.log('═'.repeat(60));
    
    // Show errors if any
    if (errors.length > 0) {
      console.log('\nERRORS:');
      console.log('-'.repeat(60));
      errors.forEach((err, idx) => {
        console.log(`${idx + 1}. ${err.candidate}`);
        console.log(`   ${err.error}`);
      });
      console.log('-'.repeat(60));
    }
    
    console.log('\n✓ Migration complete!\n');
    
    // Show next steps
    console.log('NEXT STEPS:');
    console.log('1. Review failed parses (if any)');
    console.log('2. Test structured resume view in UI');
    console.log('3. Verify data quality for sample candidates');
    console.log('4. Monitor system performance');
    console.log('5. Gather user feedback\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n⚠ Migration interrupted by user');
  console.log('Partial data may exist. Run migration again to continue.\n');
  process.exit(0);
});
