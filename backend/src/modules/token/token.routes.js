const router = require('express').Router();
const ctrl = require('./token.controller');

// Public routes (candidate access via token)
router.get('/session/:token', ctrl.getSession);
router.get('/result/:token', ctrl.getResult);
router.post('/start', ctrl.startAssessment);
router.post('/answer', ctrl.saveAnswer);
router.post('/submit', ctrl.submitAssessment);
router.post('/access-code', ctrl.authenticateWithAccessCode);

module.exports = router;
