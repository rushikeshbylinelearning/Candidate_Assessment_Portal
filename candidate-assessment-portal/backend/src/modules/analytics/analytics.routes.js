const router = require('express').Router();
const ctrl = require('./analytics.controller');
const { protect } = require('../../middleware/auth');
const { httpCache } = require('../../middleware/httpCache');

router.use(protect);
router.use(httpCache('analytics'));
router.get('/overview', ctrl.getOverview);
router.get('/funnel', ctrl.getFunnel);
router.get('/performance', ctrl.getPerformance);
router.get('/role/:roleId', ctrl.getRoleAnalytics);

module.exports = router;
