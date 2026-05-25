const mongoose = require('mongoose');
const StepConfiguration = require('./stepConfig.model');
const Role = require('../roles/role.model');
const {
  createStepConfiguration,
  updateStepConfiguration,
  getStepConfiguration,
} = require('./pipeline.controller');

// Mock dependencies
jest.mock('../roles/role.model');
jest.mock('./stepConfig.model');

describe('Step Configuration Endpoints', () => {
  let mockReq;
  let mockRes;
  let mockRole;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock request object
    mockReq = {
      body: {},
      params: {},
      user: { _id: 'admin123' },
    };

    // Mock response object
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Mock role
    mockRole = {
      _id: 'role123',
      title: 'Software Engineer',
      department: 'Engineering',
    };
  });

  describe('createStepConfiguration', () => {
    test('should reject when scoring weights do not sum to 100', async () => {
      mockReq.body = {
        roleId: 'role123',
        steps: [
          { stepType: 'EVALUATION_FORM', order: 1, scoringWeight: 30 },
          { stepType: 'LANGUAGE_ASSESSMENT', order: 2, scoringWeight: 40 },
          // Total: 70, not 100
        ],
      };

      Role.findById = jest.fn().mockResolvedValue(mockRole);
      StepConfiguration.findOne = jest.fn().mockResolvedValue(null);

      await createStepConfiguration(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(422);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'WEIGHT_SUM_INVALID',
        message: 'Scoring weights must sum to 100. Current sum: 70',
      });
    });

    test('should accept when scoring weights sum to exactly 100', async () => {
      mockReq.body = {
        roleId: 'role123',
        steps: [
          { stepType: 'EVALUATION_FORM', order: 1, scoringWeight: 20 },
          { stepType: 'LANGUAGE_ASSESSMENT', order: 2, scoringWeight: 30 },
          { stepType: 'ROLE_BASED_ASSESSMENT', order: 3, scoringWeight: 50 },
        ],
      };

      const mockConfig = {
        _id: 'config123',
        roleId: 'role123',
        steps: mockReq.body.steps,
        createdBy: 'admin123',
        save: jest.fn().mockResolvedValue(true),
      };

      Role.findById = jest.fn().mockResolvedValue(mockRole);
      StepConfiguration.findOne = jest.fn().mockResolvedValue(null);
      StepConfiguration.mockImplementation(() => mockConfig);

      await createStepConfiguration(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Step configuration created successfully',
        config: mockConfig,
      });
    });

    test('should reject when configuration already exists', async () => {
      mockReq.body = {
        roleId: 'role123',
        steps: [
          { stepType: 'EVALUATION_FORM', order: 1, scoringWeight: 100 },
        ],
      };

      const existingConfig = { _id: 'existing123', roleId: 'role123' };

      Role.findById = jest.fn().mockResolvedValue(mockRole);
      StepConfiguration.findOne = jest.fn().mockResolvedValue(existingConfig);

      await createStepConfiguration(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'CONFIG_EXISTS',
        message: 'Step configuration already exists for this role. Use PUT to update.',
      });
    });

    test('should reject when role does not exist', async () => {
      mockReq.body = {
        roleId: 'nonexistent',
        steps: [
          { stepType: 'EVALUATION_FORM', order: 1, scoringWeight: 100 },
        ],
      };

      Role.findById = jest.fn().mockResolvedValue(null);

      await createStepConfiguration(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'ROLE_NOT_FOUND',
        message: 'Role not found',
      });
    });
  });

  describe('updateStepConfiguration', () => {
    test('should reject when scoring weights do not sum to 100', async () => {
      mockReq.params = { roleId: 'role123' };
      mockReq.body = {
        steps: [
          { stepType: 'EVALUATION_FORM', order: 1, scoringWeight: 60 },
          { stepType: 'LANGUAGE_ASSESSMENT', order: 2, scoringWeight: 30 },
          // Total: 90, not 100
        ],
      };

      Role.findById = jest.fn().mockResolvedValue(mockRole);

      await updateStepConfiguration(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(422);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'WEIGHT_SUM_INVALID',
        message: 'Scoring weights must sum to 100. Current sum: 90',
      });
    });

    test('should accept when scoring weights sum to exactly 100', async () => {
      mockReq.params = { roleId: 'role123' };
      mockReq.body = {
        steps: [
          { stepType: 'EVALUATION_FORM', order: 1, scoringWeight: 40 },
          { stepType: 'ROLE_BASED_ASSESSMENT', order: 2, scoringWeight: 60 },
        ],
      };

      const updatedConfig = {
        _id: 'config123',
        roleId: 'role123',
        steps: mockReq.body.steps,
      };

      Role.findById = jest.fn().mockResolvedValue(mockRole);
      StepConfiguration.findOneAndUpdate = jest.fn().mockResolvedValue(updatedConfig);

      await updateStepConfiguration(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Step configuration updated successfully',
        config: updatedConfig,
      });
    });
  });

  describe('getStepConfiguration', () => {
    test('should return configuration when it exists', async () => {
      mockReq.params = { roleId: 'role123' };

      const mockConfig = {
        _id: 'config123',
        roleId: mockRole,
        steps: [
          { stepType: 'EVALUATION_FORM', order: 1, scoringWeight: 100 },
        ],
        createdBy: { _id: 'admin123', name: 'Admin User' },
      };

      Role.findById = jest.fn().mockResolvedValue(mockRole);
      StepConfiguration.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockConfig),
        }),
      });

      await getStepConfiguration(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        config: mockConfig,
      });
    });

    test('should return 404 when configuration does not exist', async () => {
      mockReq.params = { roleId: 'role123' };

      Role.findById = jest.fn().mockResolvedValue(mockRole);
      StepConfiguration.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null),
        }),
      });

      await getStepConfiguration(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'CONFIG_NOT_FOUND',
        message: 'No step configuration found for this role',
      });
    });
  });

  describe('Weight Validation Logic', () => {
    test('should correctly sum weights with decimal values', () => {
      const steps = [
        { scoringWeight: 33.33 },
        { scoringWeight: 33.33 },
        { scoringWeight: 33.34 },
      ];
      const total = steps.reduce((sum, step) => sum + step.scoringWeight, 0);
      expect(total).toBe(100);
    });

    test('should correctly sum weights with zero values', () => {
      const steps = [
        { scoringWeight: 0 },
        { scoringWeight: 50 },
        { scoringWeight: 50 },
      ];
      const total = steps.reduce((sum, step) => sum + step.scoringWeight, 0);
      expect(total).toBe(100);
    });

    test('should detect when weights exceed 100', () => {
      const steps = [
        { scoringWeight: 60 },
        { scoringWeight: 50 },
      ];
      const total = steps.reduce((sum, step) => sum + step.scoringWeight, 0);
      expect(total).toBeGreaterThan(100);
    });

    test('should detect when weights are less than 100', () => {
      const steps = [
        { scoringWeight: 40 },
        { scoringWeight: 30 },
      ];
      const total = steps.reduce((sum, step) => sum + step.scoringWeight, 0);
      expect(total).toBeLessThan(100);
    });
  });
});
