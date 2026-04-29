const router = require('express').Router();
const ctrl = require('./question.controller');
const { protect, authorize } = require('../../middleware/auth');

router.use(protect);
router.get('/', ctrl.getQuestions);
router.get('/:id', ctrl.getQuestion);
router.post('/', authorize('admin', 'hr'), ctrl.createQuestion);
router.post('/bulk', authorize('admin', 'hr'), ctrl.bulkCreate);
router.put('/:id', authorize('admin', 'hr'), ctrl.updateQuestion);
router.delete('/:id', authorize('admin'), ctrl.deleteQuestion);

module.exports = router;
