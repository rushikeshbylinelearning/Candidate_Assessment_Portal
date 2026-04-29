const router = require('express').Router();
const ctrl = require('./notes.controller');
const { protect } = require('../../middleware/auth');

router.use(protect);
router.get('/', ctrl.getLogs);
router.get('/:id', ctrl.getLog);
router.post('/', ctrl.createLog);
router.put('/:id', ctrl.updateLog);

module.exports = router;
