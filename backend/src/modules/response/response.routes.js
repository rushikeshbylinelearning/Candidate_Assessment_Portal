const router = require('express').Router();
const ctrl = require('./response.controller');
const { protect } = require('../../middleware/auth');
const { httpCache } = require('../../middleware/httpCache');
const { invalidateOnSuccess } = require('../../middleware/cacheInvalidate');

router.use(protect);
router.use(httpCache('responses'));
router.get('/', ctrl.getCandidateResponses);
router.get('/score/:candidateId', ctrl.getCandidateScore);
router.put('/score/:candidateId', invalidateOnSuccess(['responses', 'candidates', 'analytics']), ctrl.updateInterviewerScore);
router.put('/:responseId/manual-score', invalidateOnSuccess(['responses', 'candidates', 'analytics']), ctrl.saveManualScore);

module.exports = router;
