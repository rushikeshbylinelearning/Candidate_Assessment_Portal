const router = require('express').Router();
const ctrl = require('./pipeline.controller');
const { protect, authorize } = require('../../middleware/auth');
const { validatePipelineToken } = require('../../middleware/pipelineAuth');
const { validateRmsApiKey } = require('../../middleware/rmsAuth');

// Candidate-facing routes (Token Auth via x-pipeline-token header)
router.post('/session', validatePipelineToken, ctrl.createSession);
router.patch('/:pipelineId/step/save', validatePipelineToken, ctrl.saveStep);
router.post('/:pipelineId/step/submit', validatePipelineToken, ctrl.submitStep);
router.post('/:pipelineId/resume', validatePipelineToken, ctrl.resumePipeline);

// RMS Integration routes (API Key Auth via x-rms-api-key header)
router.post('/rms/session', validateRmsApiKey, ctrl.createRmsSession);

// HR-facing routes (JWT Auth: protect + authorize)
router.post('/invite', protect, authorize('admin', 'hr'), ctrl.inviteCandidate);
router.get('/analytics', protect, authorize('admin', 'hr'), ctrl.getAnalytics);
router.get('/candidate/:candidateId', protect, authorize('admin', 'hr'), ctrl.getCandidatePipelines);
router.get('/:pipelineId', protect, authorize('admin', 'hr'), ctrl.getPipelineRecord);
router.post('/:pipelineId/override', protect, authorize('admin', 'hr'), ctrl.overrideStep);
router.get('/:pipelineId/step/:stepType/data', protect, authorize('admin', 'hr'), ctrl.getStepData);

// Step Configuration routes (Admin only)
router.post('/config', protect, authorize('admin'), ctrl.createStepConfiguration);
router.put('/config/:roleId', protect, authorize('admin'), ctrl.updateStepConfiguration);
router.get('/config/:roleId', protect, authorize('admin'), ctrl.getStepConfiguration);

module.exports = router;
