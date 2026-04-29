# Score Recomputation Integration Guide

## Overview

This guide provides implementation patterns for integrating the `recomputeScore` function into the WorkflowEngine and PipelineController to satisfy **Requirement 10.3**.

## Requirement 10.3

**Acceptance Criteria:** "WHEN a step score is updated after initial computation, THE Workflow_Engine SHALL recompute and update the aggregate score in the Pipeline_Record."

## The recomputeScore Function

**Location:** `src/modules/pipeline/scoring.service.js`

**Signature:**
```javascript
async function recomputeScore(pipeline: PipelineRecord): Promise<number | null>
```

**What it does:**
1. Recalculates the weighted aggregate score using current step scores
2. Applies weight redistribution for skipped steps
3. Updates `PipelineRecord.aggregateScore`
4. Updates `Candidate.overallScore`
5. Saves both documents to the database

## When to Call recomputeScore

### ✅ MUST Call In These Scenarios:

1. **Interviewer updates interview score post-submission**
2. **HR modifies any step score during review**
3. **Step is re-evaluated and receives new score**
4. **Manual score adjustment by authorized user**
5. **Score correction after data entry error**

### ❌ DO NOT Call In These Scenarios:

1. **Initial step completion** (use `computeAggregateScore` instead)
2. **Pipeline creation** (no scores exist yet)
3. **Step status changes without score changes**
4. **Reading/displaying scores** (no modification)

## Integration Patterns

### Pattern 1: Direct Score Update

**Use Case:** Simple score update endpoint

```javascript
// In pipeline.controller.js
const { recomputeScore } = require('./scoring.service');

async function updateStepScore(req, res) {
  try {
    const { pipelineId, stepType } = req.params;
    const { score } = req.body;
    
    // Validate score range
    if (score < 0 || score > 100) {
      return res.status(400).json({ error: 'Score must be between 0 and 100' });
    }
    
    // Retrieve pipeline
    const pipeline = await PipelineRecord.findById(pipelineId);
    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }
    
    // Validate step exists and is completed
    if (!pipeline.stepStatus[stepType] || pipeline.stepStatus[stepType].status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Step must be completed before scoring' });
    }
    
    // Store old score for audit
    const oldScore = pipeline.stepStatus[stepType].score;
    
    // Update step score
    pipeline.stepStatus[stepType].score = score;
    
    // CRITICAL: Recompute aggregate
    const newAggregateScore = await recomputeScore(pipeline);
    
    // Log the change
    await ActivityLog.create({
      action: 'SCORE_UPDATED',
      pipelineId,
      stepType,
      oldScore,
      newScore: score,
      oldAggregate: pipeline.aggregateScore,
      newAggregate: newAggregateScore,
      updatedBy: req.user._id,
    });
    
    res.json({
      success: true,
      stepType,
      stepScore: score,
      aggregateScore: newAggregateScore,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

### Pattern 2: Batch Score Update

**Use Case:** Update multiple step scores at once

```javascript
async function batchUpdateScores(req, res) {
  try {
    const { pipelineId } = req.params;
    const { scores } = req.body; // { STEP_TYPE: score, ... }
    
    const pipeline = await PipelineRecord.findById(pipelineId);
    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }
    
    // Update all step scores
    for (const [stepType, score] of Object.entries(scores)) {
      if (pipeline.stepStatus[stepType]?.status === 'COMPLETED') {
        pipeline.stepStatus[stepType].score = score;
      }
    }
    
    // Recompute once after all updates
    const newAggregateScore = await recomputeScore(pipeline);
    
    res.json({
      success: true,
      updatedSteps: Object.keys(scores),
      aggregateScore: newAggregateScore,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

### Pattern 3: WorkflowEngine Integration

**Use Case:** Score update as part of workflow logic

```javascript
// In workflowEngine.service.js
const { recomputeScore } = require('./scoring.service');

async function updateInterviewScore(pipeline, interviewScore, interviewerNotes) {
  // Update interview step data
  const interviewData = await InterviewInteractionData.findById(
    pipeline.stepStatus.INTERVIEW_INTERACTION.dataRef
  );
  
  interviewData.overallInterviewScore = interviewScore;
  interviewData.interviewerNotes = interviewerNotes;
  await interviewData.save();
  
  // Update pipeline step score
  pipeline.stepStatus.INTERVIEW_INTERACTION.score = interviewScore;
  
  // Recompute aggregate
  await recomputeScore(pipeline);
  
  return pipeline;
}
```

### Pattern 4: HR Override with Score Adjustment

**Use Case:** HR overrides step and adjusts score

```javascript
async function hrOverrideWithScoreAdjustment(pipeline, targetStep, reason, newScore, hrUserId) {
  // Perform override logic
  const previousStep = pipeline.currentStep;
  pipeline.currentStep = targetStep;
  
  // Reset target step if previously completed
  if (pipeline.stepStatus[targetStep].status === 'COMPLETED') {
    pipeline.stepStatus[targetStep].status = 'NOT_STARTED';
    pipeline.stepStatus[targetStep].completedAt = null;
    pipeline.completedSteps = pipeline.completedSteps.filter(s => s !== targetStep);
  }
  
  // If new score provided, update it
  if (newScore !== undefined && newScore !== null) {
    pipeline.stepStatus[targetStep].score = newScore;
    
    // Recompute aggregate with new score
    await recomputeScore(pipeline);
  }
  
  // Log override event
  await Candidate.findByIdAndUpdate(pipeline.candidateId, {
    $push: {
      timeline: {
        event: 'hr_override',
        performedBy: hrUserId,
        description: `Override from ${previousStep} to ${targetStep}: ${reason}`,
        timestamp: new Date(),
      },
    },
  });
  
  return pipeline;
}
```

### Pattern 5: Automated Score Calculation with Recomputation

**Use Case:** Auto-score a step then recompute aggregate

```javascript
async function autoScoreRoleAssessment(pipeline, assessmentResponses) {
  // Calculate auto-score based on responses
  const autoScore = calculateAssessmentScore(assessmentResponses);
  
  // Update step score
  pipeline.stepStatus.ROLE_BASED_ASSESSMENT.score = autoScore;
  
  // Recompute aggregate
  const aggregateScore = await recomputeScore(pipeline);
  
  return { autoScore, aggregateScore };
}

function calculateAssessmentScore(responses) {
  // Implementation of scoring logic
  const totalQuestions = responses.length;
  const correctAnswers = responses.filter(r => r.isCorrect).length;
  return Math.round((correctAnswers / totalQuestions) * 100);
}
```

## API Endpoint Examples

### Endpoint 1: Update Single Step Score

```javascript
// PATCH /api/pipeline/:pipelineId/step/:stepType/score
router.patch(
  '/:pipelineId/step/:stepType/score',
  protect,
  authorize('admin', 'hr', 'interviewer'),
  async (req, res) => {
    const { pipelineId, stepType } = req.params;
    const { score } = req.body;
    
    const pipeline = await PipelineRecord.findById(pipelineId);
    pipeline.stepStatus[stepType].score = score;
    
    const aggregateScore = await recomputeScore(pipeline);
    
    res.json({ success: true, stepScore: score, aggregateScore });
  }
);
```

### Endpoint 2: Bulk Score Update

```javascript
// PATCH /api/pipeline/:pipelineId/scores
router.patch(
  '/:pipelineId/scores',
  protect,
  authorize('admin', 'hr'),
  async (req, res) => {
    const { pipelineId } = req.params;
    const { scores } = req.body; // { STEP_TYPE: score, ... }
    
    const pipeline = await PipelineRecord.findById(pipelineId);
    
    for (const [stepType, score] of Object.entries(scores)) {
      pipeline.stepStatus[stepType].score = score;
    }
    
    const aggregateScore = await recomputeScore(pipeline);
    
    res.json({ success: true, aggregateScore });
  }
);
```

## Error Handling

### Handle Null Return Value

```javascript
const aggregateScore = await recomputeScore(pipeline);

if (aggregateScore === null) {
  // No completed steps with scores
  return res.json({
    success: true,
    message: 'Score updated, but no aggregate score available (no completed steps)',
    stepScore: score,
    aggregateScore: null,
  });
}
```

### Handle Missing Candidate

```javascript
try {
  const aggregateScore = await recomputeScore(pipeline);
  
  // Check if candidate was updated
  const candidate = await Candidate.findById(pipeline.candidateId);
  if (!candidate) {
    console.warn(`Candidate ${pipeline.candidateId} not found, pipeline score updated only`);
  }
  
  res.json({ success: true, aggregateScore });
} catch (error) {
  console.error('Score recomputation failed:', error);
  res.status(500).json({ error: 'Failed to recompute score' });
}
```

## Best Practices

### ✅ DO:

1. **Always call after score updates**
   ```javascript
   pipeline.stepStatus[stepType].score = newScore;
   await recomputeScore(pipeline); // REQUIRED
   ```

2. **Validate score range before update**
   ```javascript
   if (score < 0 || score > 100) {
     throw new Error('Score must be between 0 and 100');
   }
   ```

3. **Log score changes for audit trail**
   ```javascript
   await ActivityLog.create({
     action: 'SCORE_UPDATED',
     oldScore,
     newScore,
     updatedBy: req.user._id,
   });
   ```

4. **Use transactions for critical updates**
   ```javascript
   const session = await mongoose.startSession();
   session.startTransaction();
   try {
     pipeline.stepStatus[stepType].score = score;
     await recomputeScore(pipeline);
     await session.commitTransaction();
   } catch (error) {
     await session.abortTransaction();
     throw error;
   } finally {
     session.endSession();
   }
   ```

5. **Handle concurrent updates**
   ```javascript
   // Use optimistic locking with version field
   pipeline.stepStatus[stepType].score = score;
   pipeline.__v++; // Increment version
   await recomputeScore(pipeline);
   ```

### ❌ DON'T:

1. **Don't forget to call recomputeScore**
   ```javascript
   // BAD: Score updated but aggregate not recomputed
   pipeline.stepStatus[stepType].score = newScore;
   await pipeline.save(); // Missing recomputeScore!
   ```

2. **Don't call on plain objects**
   ```javascript
   // BAD: pipeline is a plain object, not a Mongoose document
   const pipeline = await PipelineRecord.findById(id).lean();
   await recomputeScore(pipeline); // Will fail!
   ```

3. **Don't call unnecessarily**
   ```javascript
   // BAD: No score changed, unnecessary recomputation
   pipeline.currentStep = 'NEXT_STEP';
   await recomputeScore(pipeline); // Wasteful!
   ```

4. **Don't ignore return value**
   ```javascript
   // BAD: Not checking if score is null
   await recomputeScore(pipeline);
   // Should check: if (aggregateScore === null) { ... }
   ```

## Testing Integration

### Unit Test Example

```javascript
describe('Score Update Integration', () => {
  test('should recompute aggregate when step score is updated', async () => {
    const pipeline = await PipelineRecord.findById(testPipelineId);
    const oldAggregate = pipeline.aggregateScore;
    
    // Update score
    pipeline.stepStatus.INTERVIEW_INTERACTION.score = 95;
    
    // Recompute
    const newAggregate = await recomputeScore(pipeline);
    
    // Verify
    expect(newAggregate).not.toBe(oldAggregate);
    expect(pipeline.aggregateScore).toBe(newAggregate);
    
    // Verify candidate updated
    const candidate = await Candidate.findById(pipeline.candidateId);
    expect(candidate.overallScore).toBe(newAggregate);
  });
});
```

### Integration Test Example

```javascript
describe('PATCH /api/pipeline/:id/step/:type/score', () => {
  test('should update step score and recompute aggregate', async () => {
    const response = await request(app)
      .patch(`/api/pipeline/${pipelineId}/step/INTERVIEW_INTERACTION/score`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ score: 95 })
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.stepScore).toBe(95);
    expect(response.body.aggregateScore).toBeGreaterThan(0);
    
    // Verify database updated
    const pipeline = await PipelineRecord.findById(pipelineId);
    expect(pipeline.stepStatus.INTERVIEW_INTERACTION.score).toBe(95);
    expect(pipeline.aggregateScore).toBe(response.body.aggregateScore);
  });
});
```

## Performance Considerations

### Optimization Tips

1. **Batch updates when possible**
   - Update multiple scores, call `recomputeScore` once
   - Reduces database operations from O(n) to O(1)

2. **Use lean queries when reading**
   - Only use full Mongoose documents when updating
   - `findById(id).lean()` for read-only operations

3. **Consider caching**
   - Cache aggregate scores with TTL
   - Invalidate cache on score updates

4. **Monitor performance**
   - Log recomputation time
   - Alert if recomputation takes > 1 second

## Checklist for Implementation

When implementing score update functionality:

- [ ] Import `recomputeScore` from scoring.service
- [ ] Validate score is in range [0, 100]
- [ ] Verify step is COMPLETED before allowing score update
- [ ] Update `pipeline.stepStatus[stepType].score`
- [ ] Call `await recomputeScore(pipeline)`
- [ ] Handle null return value (no completed steps)
- [ ] Log score change for audit trail
- [ ] Add authorization checks (HR/admin only)
- [ ] Write unit tests for score update logic
- [ ] Write integration tests for API endpoints
- [ ] Document the endpoint in API documentation
- [ ] Add error handling for edge cases

## Summary

The `recomputeScore` function is the **required mechanism** for satisfying Requirement 10.3. It MUST be called whenever any step score is updated after initial pipeline completion to ensure:

1. ✅ `PipelineRecord.aggregateScore` is recalculated
2. ✅ `Candidate.overallScore` is synchronized
3. ✅ Weight redistribution is applied for skipped steps
4. ✅ Data consistency is maintained across documents

**Key Takeaway:** Every score update = call `recomputeScore(pipeline)`

