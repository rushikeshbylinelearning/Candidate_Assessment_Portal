const router = require('express').Router();
const ctrl = require('./response.controller');
const { protect } = require('../../middleware/auth');

router.use(protect);
router.get('/', ctrl.getCandidateResponses);
router.get('/score/:candidateId', ctrl.getCandidateScore);
router.put('/score/:candidateId', ctrl.updateInterviewerScore);
router.put('/:responseId/manual-score', ctrl.saveManualScore);

module.exports = router;
