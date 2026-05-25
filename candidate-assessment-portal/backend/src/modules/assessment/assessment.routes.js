const router = require('express').Router();
const ctrl = require('./assessment.controller');
const { protect, authorize } = require('../../middleware/auth');
const { httpCache } = require('../../middleware/httpCache');
const { invalidateOnSuccess } = require('../../middleware/cacheInvalidate');

router.use(protect);
router.use(httpCache('assessments'));
router.get('/', ctrl.getAssessments);
router.get('/:id', ctrl.getAssessment);
router.post('/', authorize('admin', 'hr'), invalidateOnSuccess(['assessments']), ctrl.createAssessment);
router.put('/:id', authorize('admin', 'hr'), invalidateOnSuccess(['assessments']), ctrl.updateAssessment);
router.delete('/:id', authorize('admin', 'hr'), invalidateOnSuccess(['assessments']), ctrl.deleteAssessment);
router.patch('/:id/toggle', authorize('admin', 'hr'), invalidateOnSuccess(['assessments']), ctrl.toggleAssessment);

module.exports = router;
