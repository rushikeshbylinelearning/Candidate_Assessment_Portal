const router = require('express').Router();
const ctrl = require('./candidate.controller');
const { protect, authorize } = require('../../middleware/auth');
const upload = require('../../config/multer');
const { httpCache } = require('../../middleware/httpCache');
const { invalidateOnSuccess } = require('../../middleware/cacheInvalidate');

const writeInvalidate = invalidateOnSuccess(['candidates', 'analytics', 'responses']);

router.use(protect);
router.use(httpCache('candidates'));
router.get('/', ctrl.getCandidates);
router.get('/:id', ctrl.getCandidate);
router.get('/:id/timeline', ctrl.getTimeline);
router.get('/:id/assigned-assessments', authorize('admin', 'hr'), ctrl.getAssignedAssessments);
router.post('/', authorize('admin', 'hr'), upload.single('resume'), writeInvalidate, ctrl.createCandidate);
router.put('/:id', authorize('admin', 'hr'), upload.single('resume'), writeInvalidate, ctrl.updateCandidate);
router.delete('/:id', authorize('admin', 'hr'), writeInvalidate, ctrl.deleteCandidate);
router.put('/:id/status', authorize('admin', 'hr', 'interviewer'), writeInvalidate, ctrl.updateStatus);
router.post('/:id/invite', authorize('admin', 'hr'), writeInvalidate, ctrl.inviteCandidate);
router.post('/:id/remove-assessment', authorize('admin', 'hr'), writeInvalidate, ctrl.removeAssessment);

module.exports = router;
