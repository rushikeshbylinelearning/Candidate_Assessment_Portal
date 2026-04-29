const Candidate = require('../candidate/candidate.model');

/**
 * Compute aggregate score for a pipeline with weight redistribution for skipped steps.
 * 
 * Algorithm:
 * 1. Identify all steps that are COMPLETED (have scores)
 * 2. Identify all steps that are SKIPPED
 * 3. Calculate total weight of active (non-skipped) steps
 * 4. Redistribute weights proportionally: effectiveWeight_i = (weight_i / totalActiveWeight) * 100
 * 5. Compute weighted aggregate: sum(stepScore_i × effectiveWeight_i) / 100
 * 6. Update both PipelineRecord.aggregateScore and Candidate.overallScore
 * 
 * @param {Object} pipeline - PipelineRecord document (must be a Mongoose document with .save())
 * @returns {Promise<number>} - The computed aggregate score
 */
const computeAggregateScore = async (pipeline) => {
  const { stepConfigSnapshot, stepStatus } = pipeline;

  if (!stepConfigSnapshot || stepConfigSnapshot.length === 0) {
    throw new Error('Pipeline has no step configuration snapshot');
  }

  // Collect active steps (not SKIPPED) with their scores and weights
  const activeSteps = [];
  let totalActiveWeight = 0;

  for (const configEntry of stepConfigSnapshot) {
    const { stepType, scoringWeight } = configEntry;
    const stepStatusEntry = stepStatus[stepType];

    if (!stepStatusEntry) {
      continue; // Step not initialized yet
    }

    // Only include steps that are COMPLETED and have a score
    if (stepStatusEntry.status === 'COMPLETED' && stepStatusEntry.score != null) {
      activeSteps.push({
        stepType,
        score: stepStatusEntry.score,
        weight: scoringWeight,
      });
      totalActiveWeight += scoringWeight;
    }
  }

  // If no active steps with scores, return null (no score to compute)
  if (activeSteps.length === 0 || totalActiveWeight === 0) {
    pipeline.aggregateScore = null;
    await pipeline.save();
    return null;
  }

  // Compute weighted aggregate with redistributed weights
  let weightedSum = 0;

  for (const step of activeSteps) {
    // Redistribute weight proportionally among active steps
    const effectiveWeight = (step.weight / totalActiveWeight) * 100;
    weightedSum += step.score * effectiveWeight;
  }

  const aggregateScore = Math.round(weightedSum / 100);

  // Update PipelineRecord
  pipeline.aggregateScore = aggregateScore;
  await pipeline.save();

  // Update Candidate.overallScore
  const candidate = await Candidate.findById(pipeline.candidateId);
  if (candidate) {
    candidate.overallScore = aggregateScore;
    await candidate.save();
  }

  return aggregateScore;
};

/**
 * Recompute aggregate score when a step score is updated.
 * This is a convenience wrapper around computeAggregateScore.
 * 
 * @param {Object} pipeline - PipelineRecord document
 * @returns {Promise<number>} - The recomputed aggregate score
 */
const recomputeScore = async (pipeline) => {
  return await computeAggregateScore(pipeline);
};

module.exports = {
  computeAggregateScore,
  recomputeScore,
};
