const { computeAggregateScore, recomputeScore } = require('./scoring.service');
const Candidate = require('../candidate/candidate.model');

// Mock the Candidate model
jest.mock('../candidate/candidate.model');

describe('ScoringService', () => {
  let mockPipeline;
  let mockCandidate;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock candidate
    mockCandidate = {
      _id: 'candidate123',
      overallScore: null,
      save: jest.fn().mockResolvedValue(true),
    };

    Candidate.findById = jest.fn().mockResolvedValue(mockCandidate);

    // Mock pipeline with standard configuration
    mockPipeline = {
      candidateId: 'candidate123',
      stepConfigSnapshot: [
        { stepType: 'EVALUATION_FORM', scoringWeight: 20 },
        { stepType: 'LANGUAGE_ASSESSMENT', scoringWeight: 20 },
        { stepType: 'ROLE_BASED_ASSESSMENT', scoringWeight: 30 },
        { stepType: 'INTERVIEW_INTERACTION', scoringWeight: 20 },
        { stepType: 'POST_INTERVIEW_FEEDBACK', scoringWeight: 10 },
      ],
      stepStatus: {
        EVALUATION_FORM: { status: 'COMPLETED', score: 80 },
        LANGUAGE_ASSESSMENT: { status: 'COMPLETED', score: 90 },
        ROLE_BASED_ASSESSMENT: { status: 'COMPLETED', score: 75 },
        INTERVIEW_INTERACTION: { status: 'COMPLETED', score: 85 },
        POST_INTERVIEW_FEEDBACK: { status: 'COMPLETED', score: 70 },
      },
      aggregateScore: null,
      save: jest.fn().mockResolvedValue(true),
    };
  });

  describe('computeAggregateScore', () => {
    test('should compute weighted aggregate score correctly with all steps completed', async () => {
      const result = await computeAggregateScore(mockPipeline);

      // Expected: (80*20 + 90*20 + 75*30 + 85*20 + 70*10) / 100
      // = (1600 + 1800 + 2250 + 1700 + 700) / 100 = 8050 / 100 = 80.5 ≈ 81
      expect(result).toBe(81);
      expect(mockPipeline.aggregateScore).toBe(81);
      expect(mockPipeline.save).toHaveBeenCalled();
      expect(mockCandidate.overallScore).toBe(81);
      expect(mockCandidate.save).toHaveBeenCalled();
    });

    test('should redistribute weights when a step is SKIPPED', async () => {
      // Skip LANGUAGE_ASSESSMENT (weight 20)
      mockPipeline.stepStatus.LANGUAGE_ASSESSMENT.status = 'SKIPPED';
      mockPipeline.stepStatus.LANGUAGE_ASSESSMENT.score = null;

      const result = await computeAggregateScore(mockPipeline);

      // Active steps: EVALUATION_FORM(20), ROLE_BASED_ASSESSMENT(30), INTERVIEW_INTERACTION(20), POST_INTERVIEW_FEEDBACK(10)
      // Total active weight: 80
      // Effective weights: 25%, 37.5%, 25%, 12.5%
      // Expected: (80*25 + 75*37.5 + 85*25 + 70*12.5) / 100
      // = (2000 + 2812.5 + 2125 + 875) / 100 = 7812.5 / 100 = 78.125 ≈ 78
      expect(result).toBe(78);
      expect(mockPipeline.aggregateScore).toBe(78);
    });

    test('should redistribute weights when multiple steps are SKIPPED', async () => {
      // Skip LANGUAGE_ASSESSMENT and POST_INTERVIEW_FEEDBACK
      mockPipeline.stepStatus.LANGUAGE_ASSESSMENT.status = 'SKIPPED';
      mockPipeline.stepStatus.LANGUAGE_ASSESSMENT.score = null;
      mockPipeline.stepStatus.POST_INTERVIEW_FEEDBACK.status = 'SKIPPED';
      mockPipeline.stepStatus.POST_INTERVIEW_FEEDBACK.score = null;

      const result = await computeAggregateScore(mockPipeline);

      // Active steps: EVALUATION_FORM(20), ROLE_BASED_ASSESSMENT(30), INTERVIEW_INTERACTION(20)
      // Total active weight: 70
      // Effective weights: 28.57%, 42.86%, 28.57%
      // Expected: (80*28.57 + 75*42.86 + 85*28.57) / 100
      // = (2285.6 + 3214.5 + 2428.45) / 100 = 7928.55 / 100 = 79.29 ≈ 79
      expect(result).toBe(79);
      expect(mockPipeline.aggregateScore).toBe(79);
    });

    test('should return null when no steps are completed', async () => {
      mockPipeline.stepStatus.EVALUATION_FORM.status = 'IN_PROGRESS';
      mockPipeline.stepStatus.LANGUAGE_ASSESSMENT.status = 'NOT_STARTED';
      mockPipeline.stepStatus.ROLE_BASED_ASSESSMENT.status = 'NOT_STARTED';
      mockPipeline.stepStatus.INTERVIEW_INTERACTION.status = 'NOT_STARTED';
      mockPipeline.stepStatus.POST_INTERVIEW_FEEDBACK.status = 'NOT_STARTED';

      const result = await computeAggregateScore(mockPipeline);

      expect(result).toBeNull();
      expect(mockPipeline.aggregateScore).toBeNull();
    });

    test('should return null when all steps are skipped', async () => {
      mockPipeline.stepStatus.EVALUATION_FORM.status = 'SKIPPED';
      mockPipeline.stepStatus.EVALUATION_FORM.score = null;
      mockPipeline.stepStatus.LANGUAGE_ASSESSMENT.status = 'SKIPPED';
      mockPipeline.stepStatus.LANGUAGE_ASSESSMENT.score = null;
      mockPipeline.stepStatus.ROLE_BASED_ASSESSMENT.status = 'SKIPPED';
      mockPipeline.stepStatus.ROLE_BASED_ASSESSMENT.score = null;
      mockPipeline.stepStatus.INTERVIEW_INTERACTION.status = 'SKIPPED';
      mockPipeline.stepStatus.INTERVIEW_INTERACTION.score = null;
      mockPipeline.stepStatus.POST_INTERVIEW_FEEDBACK.status = 'SKIPPED';
      mockPipeline.stepStatus.POST_INTERVIEW_FEEDBACK.score = null;

      const result = await computeAggregateScore(mockPipeline);

      expect(result).toBeNull();
      expect(mockPipeline.aggregateScore).toBeNull();
    });

    test('should handle partial completion with some steps IN_PROGRESS', async () => {
      // Only first 3 steps completed
      mockPipeline.stepStatus.INTERVIEW_INTERACTION.status = 'IN_PROGRESS';
      mockPipeline.stepStatus.INTERVIEW_INTERACTION.score = null;
      mockPipeline.stepStatus.POST_INTERVIEW_FEEDBACK.status = 'NOT_STARTED';
      mockPipeline.stepStatus.POST_INTERVIEW_FEEDBACK.score = null;

      const result = await computeAggregateScore(mockPipeline);

      // Active steps: EVALUATION_FORM(20), LANGUAGE_ASSESSMENT(20), ROLE_BASED_ASSESSMENT(30)
      // Total active weight: 70
      // Effective weights: 28.57%, 28.57%, 42.86%
      // Expected: (80*28.57 + 90*28.57 + 75*42.86) / 100
      // = (2285.6 + 2571.3 + 3214.5) / 100 = 8071.4 / 100 = 80.71 ≈ 81
      expect(result).toBe(81);
      expect(mockPipeline.aggregateScore).toBe(81);
    });

    test('should throw error when stepConfigSnapshot is missing', async () => {
      mockPipeline.stepConfigSnapshot = null;

      await expect(computeAggregateScore(mockPipeline)).rejects.toThrow(
        'Pipeline has no step configuration snapshot'
      );
    });

    test('should throw error when stepConfigSnapshot is empty', async () => {
      mockPipeline.stepConfigSnapshot = [];

      await expect(computeAggregateScore(mockPipeline)).rejects.toThrow(
        'Pipeline has no step configuration snapshot'
      );
    });

    test('should handle candidate not found gracefully', async () => {
      Candidate.findById = jest.fn().mockResolvedValue(null);

      const result = await computeAggregateScore(mockPipeline);

      // Should still compute and save pipeline score
      expect(result).toBe(81);
      expect(mockPipeline.aggregateScore).toBe(81);
      expect(mockPipeline.save).toHaveBeenCalled();
      // But candidate save should not be called
      expect(mockCandidate.save).not.toHaveBeenCalled();
    });

    test('should handle steps with zero weight', async () => {
      mockPipeline.stepConfigSnapshot[4].scoringWeight = 0; // POST_INTERVIEW_FEEDBACK weight = 0
      mockPipeline.stepConfigSnapshot[3].scoringWeight = 30; // Adjust INTERVIEW_INTERACTION to 30 to keep sum = 100

      const result = await computeAggregateScore(mockPipeline);

      // Active steps with non-zero weights: EVALUATION_FORM(20), LANGUAGE_ASSESSMENT(20), ROLE_BASED_ASSESSMENT(30), INTERVIEW_INTERACTION(30)
      // Total active weight: 100
      // Expected: (80*20 + 90*20 + 75*30 + 85*30) / 100
      // = (1600 + 1800 + 2250 + 2550) / 100 = 8200 / 100 = 82
      expect(result).toBe(82);
    });
  });

  describe('recomputeScore', () => {
    test('should recompute score when called', async () => {
      // Set initial aggregate score
      mockPipeline.aggregateScore = 75;

      // Update a step score
      mockPipeline.stepStatus.ROLE_BASED_ASSESSMENT.score = 95;

      const result = await recomputeScore(mockPipeline);

      // Expected: (80*20 + 90*20 + 95*30 + 85*20 + 70*10) / 100
      // = (1600 + 1800 + 2850 + 1700 + 700) / 100 = 8650 / 100 = 86.5 ≈ 87
      expect(result).toBe(87);
      expect(mockPipeline.aggregateScore).toBe(87);
      expect(mockCandidate.overallScore).toBe(87);
    });

    test('should update both PipelineRecord and Candidate on recompute', async () => {
      await recomputeScore(mockPipeline);

      expect(mockPipeline.save).toHaveBeenCalled();
      expect(Candidate.findById).toHaveBeenCalledWith('candidate123');
      expect(mockCandidate.save).toHaveBeenCalled();
    });
  });
});
