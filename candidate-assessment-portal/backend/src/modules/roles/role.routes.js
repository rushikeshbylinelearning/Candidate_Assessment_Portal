const router = require('express').Router();
const ctrl = require('./role.controller');
const { protect, authorize } = require('../../middleware/auth');
const { httpCache } = require('../../middleware/httpCache');
const { invalidateOnSuccess } = require('../../middleware/cacheInvalidate');

router.use(protect);
router.use(httpCache('roles'));
router.get('/', ctrl.getRoles);
router.get('/:id', ctrl.getRole);
router.post('/', authorize('admin', 'hr'), invalidateOnSuccess(['roles', 'analytics']), ctrl.createRole);
router.put('/:id', authorize('admin', 'hr'), invalidateOnSuccess(['roles', 'analytics', 'candidates']), ctrl.updateRole);
router.delete('/:id', authorize('admin'), invalidateOnSuccess(['roles', 'analytics']), ctrl.deleteRole);

module.exports = router;
