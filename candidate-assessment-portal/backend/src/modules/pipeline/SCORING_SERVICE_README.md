# Scoring Service

## Overview

The Scoring Service computes weighted aggregate scores for candidate pipelines with automatic weight redistribution for skipped steps.

## Features

### 1. Weighted Aggregate Score Computation

Calculates the overall pipeline score using the formula:

```
aggregateScore = Σ(stepScore_i × effectiveWeight_i) / 100
```

Where:
- `stepScore_i` = score for step i (0-100)
- `effectiveWeight_i` = redistributed weight for step i

### 2. Weight Redistribution for Skipped Steps

When steps are SKIPPED, their weights are redistributed proportionally among completed steps:

```
effectiveWeight_i = (originalWeight_i / totalActiveWeight) × 100
```

**Example:**
- Original weights: [20, 20, 30, 20, 10] (sum = 100)
- Step 2 is SKIPPED (weight 20)
- Active weights: [20, 30, 20, 10] (sum = 70)
- Effective weights: [28.57%, 42.86%, 28.57%, 14.29%] (sum = 100%)

### 3. Dual Update

Updates both:
- `PipelineRecord.aggregateScore`
- `Candidate.overallScore`

## API

### `computeAggregateScore(pipeline)`

Computes the aggregate score for a pipeline.

**Parameters:**
- `pipeline` (Object): PipelineRecord Mongoose document

**Returns:**
- `Promise<number>`: The computed aggregate score (0-100), or `null` if no completed steps

**Throws:**
- Error if `stepConfigSnapshot` is missing or empty

**Example:**
```javascript
const { computeAggregateScore } = require('./scoring.service');

const pipeline = await PipelineRecord.findById(pipelineId);
const score = await computeAggregateScore(pipeline);
console.log(`Aggregate score: ${score}`);
```

### `recomputeScore(pipeline)`

Recomputes the aggregate score when a step score is updated. This function MUST be called whenever any `stepStatus[type].score` value changes after the initial pipeline completion to ensure both `PipelineRecord.aggregateScore` and `Candidate.overallScore` remain synchronized.

**When to Use:**
- After an interviewer updates their interview score
- When HR modifies a step score during review
- After any manual score adjustment by authorized users
- When a step is re-evaluated and receives a new score

**Parameters:**
- `pipeline` (Object): PipelineRecord Mongoose document (must be a Mongoose document with `.save()` method)

**Returns:**
- `Promise<number>`: The recomputed aggregate score (0-100), or `null` if no completed steps

**Important Notes:**
- Updates are atomic - both PipelineRecord and Candidate are updated in sequence
- Weight redistribution is automatically applied for skipped steps
- The function handles all edge cases (missing candidate, no completed steps, etc.)

**Example:**
```javascript
const { recomputeScore } = require('./scoring.service');

// Scenario 1: Interviewer updates their score
const pipeline = await PipelineRecord.findById(pipelineId);
pipeline.stepStatus.INTERVIEW_INTERACTION.score = 95;
const newScore = await recomputeScore(pipeline);
console.log(`Updated aggregate score: ${newScore}`);

// Scenario 2: HR adjusts a step score during review
pipeline.stepStatus.ROLE_BASED_ASSESSMENT.score = 88;
await recomputeScore(pipeline);

// Scenario 3: Multiple score updates
pipeline.stepStatus.LANGUAGE_ASSESSMENT.score = 92;
pipeline.stepStatus.POST_INTERVIEW_FEEDBACK.score = 85;
await recomputeScore(pipeline); // Recalculates using all updated scores
```

## Algorithm Details

### Step 1: Collect Active Steps

Iterates through `stepConfigSnapshot` and identifies steps that are:
- Status = `COMPLETED`
- Score is not `null`

### Step 2: Calculate Total Active Weight

Sums the `scoringWeight` of all active steps.

### Step 3: Redistribute Weights

For each active step:
```javascript
effectiveWeight = (step.weight / totalActiveWeight) × 100
```

### Step 4: Compute Weighted Sum

```javascript
weightedSum = Σ(step.score × effectiveWeight)
```

### Step 5: Calculate Aggregate

```javascript
aggregateScore = Math.round(weightedSum / 100)
```

### Step 6: Update Records

- Save `aggregateScore` to `PipelineRecord`
- Update `Candidate.overallScore`

## Edge Cases

### No Completed Steps

**Behavior:** Returns `null` and sets `aggregateScore` to `null`

```javascript
// All steps are IN_PROGRESS or NOT_STARTED
const score = await computeAggregateScore(pipeline);
// score === null
```

### All Steps Skipped

**Behavior:** Returns `null` and sets `aggregateScore` to `null`

```javascript
// All steps have status = 'SKIPPED'
const score = await computeAggregateScore(pipeline);
// score === null
```

### Partial Completion

**Behavior:** Computes score using only completed steps with weight redistribution

```javascript
// Steps 1-3 completed, steps 4-5 in progress
// Only steps 1-3 contribute to the score
const score = await computeAggregateScore(pipeline);
// score computed from steps 1-3 with redistributed weights
```

### Candidate Not Found

**Behavior:** Updates `PipelineRecord.aggregateScore` but skips `Candidate.overallScore` update

```javascript
// Candidate deleted but pipeline exists
const score = await computeAggregateScore(pipeline);
// pipeline.aggregateScore updated, but no error thrown
```

### Steps with Zero Weight

**Behavior:** Steps with zero weight are included in active steps but don't contribute to the score

```javascript
// Step has scoringWeight = 0
// Included in calculation but effectiveWeight = 0
```

## Requirements Validation

This service validates:

- **Requirement 10.1**: Weighted aggregate score computation
- **Requirement 10.2**: Updates both PipelineRecord and Candidate records
- **Requirement 10.3**: Recomputation on step score update (via `recomputeScore` function)

### Requirement 10.3 Implementation Details

**Acceptance Criteria:** "WHEN a step score is updated after initial computation, THE Workflow_Engine SHALL recompute and update the aggregate score in the Pipeline_Record."

**Implementation:**
The `recomputeScore(pipeline)` function provides the mechanism to satisfy this requirement. It MUST be called by the WorkflowEngine or PipelineController whenever:

1. An interviewer updates their interview score post-submission
2. HR modifies any step score during candidate review
3. A step is re-evaluated and receives a new score
4. Any authorized user makes a manual score adjustment

**Usage Pattern:**
```javascript
// Step 1: Retrieve pipeline
const pipeline = await PipelineRecord.findById(pipelineId);

// Step 2: Update step score
pipeline.stepStatus[stepType].score = newScore;

// Step 3: Recompute aggregate (REQUIRED)
await recomputeScore(pipeline);
```

**Atomicity:**
The function updates both `PipelineRecord.aggregateScore` and `Candidate.overallScore` atomically (sequentially) to maintain data consistency.

## Testing

### Manual Verification

Run the verification script to test the scoring logic:

```bash
node src/modules/pipeline/scoring.service.manual-test.js
```

### Test Cases

1. **All steps completed**: Verifies standard weighted calculation
2. **One step skipped**: Verifies weight redistribution
3. **Multiple steps skipped**: Verifies proportional redistribution
4. **No completed steps**: Verifies null return
5. **All steps skipped**: Verifies null return
6. **Partial completion**: Verifies score with incomplete pipeline
7. **Missing snapshot**: Verifies error handling
8. **Candidate not found**: Verifies graceful degradation

## Integration

### WorkflowEngine Integration

The WorkflowEngine calls `computeAggregateScore` when:
- Pipeline status changes to `FINISHED`
- All steps are either `COMPLETED` or `SKIPPED`

```javascript
// In workflowEngine.service.js
const { computeAggregateScore } = require('./scoring.service');

// When pipeline finishes
if (pipeline.status === 'FINISHED') {
  await computeAggregateScore(pipeline);
}
```

### Score Update Integration

When a step score is updated after initial computation, `recomputeScore` MUST be called to maintain data consistency:

```javascript
// In pipeline.controller.js or workflowEngine.service.js
const { recomputeScore } = require('./scoring.service');

// Example: Update endpoint for step score modification
async function updateStepScore(pipelineId, stepType, newScore) {
  const pipeline = await PipelineRecord.findById(pipelineId);
  
  // Update the step score
  pipeline.stepStatus[stepType].score = newScore;
  
  // CRITICAL: Recompute aggregate to keep PipelineRecord and Candidate in sync
  await recomputeScore(pipeline);
  
  return pipeline;
}
```

**Integration Checklist:**
- ✅ Call `recomputeScore` after ANY step score modification
- ✅ Ensure pipeline is a Mongoose document (not a plain object)
- ✅ Handle the returned score (may be `null` if no completed steps)
- ✅ Consider transaction boundaries for atomic updates
- ✅ Log score changes for audit trail

## Performance Considerations

- **Time Complexity**: O(n) where n = number of steps (typically 5)
- **Database Operations**: 2 saves (PipelineRecord + Candidate)
- **Optimization**: Batch updates if multiple scores change simultaneously

## Future Enhancements

1. **Async Batch Updates**: Queue score updates for batch processing
2. **Score History**: Track score changes over time
3. **Weighted Rounding**: Configurable rounding strategies
4. **Score Validation**: Validate step scores are in range [0, 100]
