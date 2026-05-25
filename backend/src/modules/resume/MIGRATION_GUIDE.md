# Resume Intelligence System - Migration Guide

## Overview
This guide helps migrate existing candidates with uploaded resumes to the new Resume Intelligence System.

---

## Pre-Migration Checklist

- [ ] Backup database
- [ ] Verify all resume files exist in `/uploads/resumes/`
- [ ] Check disk space for parsing operations
- [ ] Test parsing on sample resumes
- [ ] Notify users of maintenance window (if needed)

---

## Migration Strategies

### Strategy 1: Lazy Migration (Recommended)
**When**: Resumes parsed on-demand when viewed

**Pros**:
- No downtime
- Gradual resource usage
- No bulk processing needed

**Cons**:
- First view may be slow
- Inconsistent experience initially

**Implementation**:
```javascript
// Already implemented in CandidateDetail.jsx
// Automatically fetches parsed data when available
// Falls back to PDF view if not parsed yet
```

### Strategy 2: Background Batch Migration
**When**: Parse all existing resumes in background

**Pros**:
- All resumes ready immediately
- Consistent experience
- Can schedule during off-hours

**Cons**:
- Resource intensive
- May take hours for large datasets

**Implementation**:
```javascript
// Create migration script
const migrateExistingResumes = async () => {
  const candidates = await Candidate.find({ 
    resumeUrl: { $exists: true, $ne: null } 
  });
  
  console.log(`Found ${candidates.length} candidates with resumes`);
  
  for (const candidate of candidates) {
    try {
      // Check if already parsed
      const existing = await ResumeData.findOne({ 
        candidateId: candidate._id 
      });
      
      if (existing && existing.parsingStatus === 'completed') {
        console.log(`Skipping ${candidate.name} - already parsed`);
        continue;
      }
      
      // Extract file info
      const fileType = path.extname(candidate.resumeUrl)
        .slice(1)
        .toLowerCase();
      const filePath = path.join(__dirname, '../../../', candidate.resumeUrl);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        continue;
      }
      
      // Create resume data record
      const resumeData = await ResumeData.create({
        candidateId: candidate._id,
        fileUrl: candidate.resumeUrl,
        fileType,
        parsingStatus: 'processing',
      });
      
      // Parse (with delay to avoid overload)
      await parseResumeAsync(resumeData._id, filePath, fileType);
      
      console.log(`✓ Parsed resume for ${candidate.name}`);
      
      // Add delay between parses (adjust based on server capacity)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`Error parsing resume for ${candidate.name}:`, error);
    }
  }
  
  console.log('Migration complete!');
};

// Run migration
migrateExistingResumes();
```

### Strategy 3: Manual Trigger
**When**: HR team manually triggers parsing per candidate

**Pros**:
- Full control
- Can prioritize important candidates
- No automated errors

**Cons**:
- Time-consuming
- Requires manual work

**Implementation**:
```javascript
// Add button in UI
<button onClick={() => triggerParsing(candidateId)}>
  Parse Resume
</button>

// API call
const triggerParsing = async (candidateId) => {
  await api.post(`/resume/parse/${candidateId}`);
  toast.success('Parsing started');
};
```

---

## Migration Script

### Create Migration File
```bash
touch candidate-assessment-portal/backend/src/scripts/migrate-resumes.js
```

### Migration Script Content
```javascript
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
  console.log('Connected to MongoDB');
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
    console.log('Starting resume migration...\n');
    
    // Find all candidates with resumes
    const candidates = await Candidate.find({ 
      resumeUrl: { $exists: true, $ne: null } 
    });
    
    console.log(`Found ${candidates.length} candidates with resumes\n`);
    
    let processed = 0;
    let successful = 0;
    let failed = 0;
    let skipped = 0;
    
    for (const candidate of candidates) {
      processed++;
      console.log(`[${processed}/${candidates.length}] Processing: ${candidate.name}`);
      
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
          console.log(`  ✗ Unsupported file type: ${fileType}\n`);
          failed++;
          continue;
        }
        
        const filePath = path.join(__dirname, '../../', candidate.resumeUrl);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
          console.log(`  ✗ File not found: ${filePath}\n`);
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
        console.log(`  ⟳ Parsing...`);
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
          failed++;
        }
        
        // Add delay to avoid overloading server
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`  ✗ Error: ${error.message}\n`);
        failed++;
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('MIGRATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total candidates: ${candidates.length}`);
    console.log(`Processed: ${processed}`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${failed}`);
    console.log(`Skipped: ${skipped}`);
    console.log('='.repeat(50) + '\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}
```

### Run Migration
```bash
cd candidate-assessment-portal/backend
node src/scripts/migrate-resumes.js
```

---

## Monitoring Migration

### Check Progress
```javascript
// In MongoDB shell or Compass
db.resumedatas.aggregate([
  {
    $group: {
      _id: "$parsingStatus",
      count: { $sum: 1 }
    }
  }
])

// Output:
// { _id: "completed", count: 150 }
// { _id: "processing", count: 10 }
// { _id: "failed", count: 5 }
```

### Check Failed Parses
```javascript
db.resumedatas.find({ 
  parsingStatus: "failed" 
}).forEach(doc => {
  print(`Candidate: ${doc.candidateId}`);
  print(`Error: ${doc.parsingError}`);
  print('---');
})
```

---

## Rollback Plan

### If Migration Fails

1. **Stop Migration Script**
```bash
Ctrl+C
```

2. **Restore Database Backup**
```bash
mongorestore --db candidate_assessment_portal backup/
```

3. **Remove Partial Data**
```javascript
// Remove all resume data
db.resumedatas.deleteMany({});

// Or remove only failed/processing
db.resumedatas.deleteMany({ 
  parsingStatus: { $in: ["processing", "failed"] } 
});
```

4. **Investigate Issues**
- Check error logs
- Test with sample resume
- Fix parser issues
- Retry migration

---

## Post-Migration Tasks

### 1. Verify Data Quality
```javascript
// Check sample of parsed resumes
const samples = await ResumeData.find({ 
  parsingStatus: "completed" 
}).limit(10);

samples.forEach(resume => {
  console.log(`Candidate: ${resume.candidateId}`);
  console.log(`Skills: ${resume.skills.technical.length}`);
  console.log(`Experience: ${resume.experience.length}`);
  console.log(`Education: ${resume.education.length}`);
  console.log('---');
});
```

### 2. Update Analytics
```javascript
// Recalculate candidate statistics
// Update dashboard metrics
// Refresh role match scores
```

### 3. Notify Users
```
Subject: New Resume Intelligence System Live!

Hi Team,

We've upgraded our candidate resume viewing experience!

What's New:
- Structured, easy-to-scan resume display
- AI-powered insights (experience, skills, level)
- Automatic role matching with percentage
- 12-30x faster candidate screening

All existing resumes have been processed and are ready to view.

Check it out: [Link to Candidates Page]

Questions? Contact HR Tech Team
```

### 4. Monitor Performance
- Track parsing success rate
- Monitor server load
- Check user feedback
- Measure time-to-hire improvement

---

## Troubleshooting

### Issue: High Failure Rate
**Symptoms**: Many resumes fail to parse

**Causes**:
- Non-standard resume formats
- Image-based PDFs
- Corrupted files

**Solutions**:
1. Review failed resumes manually
2. Improve parser for common formats
3. Add fallback to PDF view
4. Allow manual data entry

### Issue: Slow Migration
**Symptoms**: Migration takes too long

**Causes**:
- Large files
- Complex PDFs
- Server resource limits

**Solutions**:
1. Increase delay between parses
2. Run during off-hours
3. Process in smaller batches
4. Upgrade server resources

### Issue: Missing Data
**Symptoms**: Parsed data incomplete

**Causes**:
- Parser limitations
- Unusual resume structure
- Non-English content

**Solutions**:
1. Enhance parser logic
2. Add manual edit capability
3. Improve section detection
4. Support more formats

---

## Best Practices

### Before Migration
1. ✅ Test on staging environment
2. ✅ Backup production database
3. ✅ Verify file storage integrity
4. ✅ Schedule during low-traffic period
5. ✅ Prepare rollback plan

### During Migration
1. ✅ Monitor progress continuously
2. ✅ Check error logs
3. ✅ Verify sample results
4. ✅ Keep stakeholders informed
5. ✅ Be ready to pause/stop

### After Migration
1. ✅ Verify data quality
2. ✅ Test user experience
3. ✅ Monitor performance
4. ✅ Gather feedback
5. ✅ Document lessons learned

---

## FAQ

**Q: Do I need to migrate all resumes at once?**
A: No, lazy migration (on-demand) is recommended for most cases.

**Q: What happens to candidates without resumes?**
A: No change - they continue to work as before.

**Q: Can I re-parse a resume?**
A: Yes, use the manual trigger endpoint: `POST /api/resume/parse/:candidateId`

**Q: What if parsing fails?**
A: The system falls back to PDF view automatically.

**Q: How long does migration take?**
A: Depends on volume. Estimate 2-3 seconds per resume.

**Q: Can I customize the parser?**
A: Yes, see `/backend/src/modules/resume/README.md` for extension guide.

---

## Support

For migration assistance:
- **Technical Issues**: DevOps team
- **Data Quality**: HR Tech team
- **Parser Improvements**: Development team

---

**Version**: 1.0
**Last Updated**: April 2026
