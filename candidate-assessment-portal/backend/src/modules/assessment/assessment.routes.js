const router = require('express').Router();
const ctrl = require('./assessment.controller');
const { protect, authorize } = require('../../middleware/auth');

router.use(protect);
router.get('/', ctrl.getAssessments);
router.get('/:id', ctrl.getAssessment);
router.post('/', authorize('admin', 'hr'), ctrl.createAssessment);
router.put('/:id', authorize('admin', 'hr'), ctrl.updateAssessment);
router.delete('/:id', authorize('admin', 'hr'), ctrl.deleteAssessment);
router.patch('/:id/toggle', authorize('admin', 'hr'), ctrl.toggleAssessment);

module.exports = router;
