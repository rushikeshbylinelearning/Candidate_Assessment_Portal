const router = require('express').Router();
const ctrl = require('./candidate.controller');
const { protect, authorize } = require('../../middleware/auth');
const upload = require('../../config/multer');

router.use(protect);
router.get('/', ctrl.getCandidates);
router.get('/:id', ctrl.getCandidate);
router.get('/:id/timeline', ctrl.getTimeline);
router.post('/', authorize('admin', 'hr'), upload.single('resume'), ctrl.createCandidate);
router.put('/:id', authorize('admin', 'hr'), upload.single('resume'), ctrl.updateCandidate);
router.delete('/:id', authorize('admin', 'hr'), ctrl.deleteCandidate);
router.put('/:id/status', authorize('admin', 'hr', 'interviewer'), ctrl.updateStatus);
router.post('/:id/invite', authorize('admin', 'hr'), ctrl.inviteCandidate);

module.exports = router;
