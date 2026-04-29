const router = require('express').Router();
const ctrl = require('./auth.controller');
const { protect, authorize } = require('../../middleware/auth');

router.post('/login', ctrl.login);
router.post('/logout', protect, ctrl.logout);
router.get('/me', protect, ctrl.getMe);
router.post('/users', protect, authorize('admin'), ctrl.createUser);
router.get('/users', protect, authorize('admin'), ctrl.getUsers);
router.put('/users/:id', protect, authorize('admin'), ctrl.updateUser);

module.exports = router;
