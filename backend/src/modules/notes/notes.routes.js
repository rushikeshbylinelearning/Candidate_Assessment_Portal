const router = require('express').Router();
const ctrl = require('./notes.controller');
const { protect } = require('../../middleware/auth');
const { httpCache } = require('../../middleware/httpCache');
const { invalidateOnSuccess } = require('../../middleware/cacheInvalidate');

router.use(protect);
router.use(httpCache('candidates'));
router.get('/', ctrl.getLogs);
router.get('/:id', ctrl.getLog);
router.post('/', invalidateOnSuccess(['candidates']), ctrl.createLog);
router.put('/:id', invalidateOnSuccess(['candidates']), ctrl.updateLog);

module.exports = router;
