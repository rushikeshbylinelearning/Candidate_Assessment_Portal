const router = require('express').Router();
const ctrl = require('./role.controller');
const { protect, authorize } = require('../../middleware/auth');

router.use(protect);
router.get('/', ctrl.getRoles);
router.get('/:id', ctrl.getRole);
router.post('/', authorize('admin', 'hr'), ctrl.createRole);
router.put('/:id', authorize('admin', 'hr'), ctrl.updateRole);
router.delete('/:id', authorize('admin'), ctrl.deleteRole);

module.exports = router;
