const router = require('express').Router();
const ctrl = require('./question.controller');
const { protect, authorize } = require('../../middleware/auth');
const { httpCache } = require('../../middleware/httpCache');
const { invalidateOnSuccess } = require('../../middleware/cacheInvalidate');

router.use(protect);
router.use(httpCache('questions'));
router.get('/', ctrl.getQuestions);
router.get('/:id', ctrl.getQuestion);
router.post('/', authorize('admin', 'hr'), invalidateOnSuccess(['questions']), ctrl.createQuestion);
router.post('/bulk', authorize('admin', 'hr'), invalidateOnSuccess(['questions']), ctrl.bulkCreate);
router.put('/:id', authorize('admin', 'hr'), invalidateOnSuccess(['questions']), ctrl.updateQuestion);
router.delete('/:id', authorize('admin'), invalidateOnSuccess(['questions']), ctrl.deleteQuestion);

module.exports = router;
