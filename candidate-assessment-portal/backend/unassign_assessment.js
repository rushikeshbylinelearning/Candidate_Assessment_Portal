/**
 * Script to unassign a specific assessment from all candidates
 * Usage: node unassign_assessment.js <assessmentId>
 */

const mongoose = require('mongoose');
require('dotenv').config();

const assessmentId = process.argv[2];

if (!assessmentId) {
  console.error('Usage: node unassign_assessment.js <assessmentId>');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const PipelineRecord = require('./src/modules/pipeline/pipeline.model');
    
    // Find all pipelines with this assessment assigned
    const pipelines = await PipelineRecord.find({});
    
    let unassignedCount = 0;
    
    for (const pipeline of pipelines) {
      const assessments = pipeline.assignedAssessments || new Map();
      let modified = false;
      
      // Check each step's assigned assessment
      for (const [stepKey, assignedId] of assessments.entries()) {
        if (assignedId && assignedId.toString() === assessmentId) {
          console.log(`Removing assessment from candidate ${pipeline.candidateId}, step ${stepKey}`);
          assessments.delete(stepKey);
          modified = true;
          unassignedCount++;
        }
      }
      
      if (modified) {
        pipeline.assignedAssessments = assessments;
        await pipeline.save();
      }
    }
    
    console.log(`\nUnassigned assessment from ${unassignedCount} pipeline step(s)`);
    console.log('Assessment can now be deleted');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
