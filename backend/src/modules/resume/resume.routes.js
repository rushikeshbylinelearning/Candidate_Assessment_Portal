const express = require('express');
const router = express.Router();
const resumeController = require('./resume.controller');
const { protect } = require('../../middleware/auth');
const upload = require('../../config/multer');
const { httpCache } = require('../../middleware/httpCache');
const { invalidateOnSuccess } = require('../../middleware/cacheInvalidate');

router.use(protect);
router.use(httpCache('candidates'));

router.get('/:candidateId/status', resumeController.getParsingStatus);

router.post('/upload/:candidateId', upload.single('resume'), invalidateOnSuccess(['candidates']), resumeController.uploadAndParse);
router.post('/parse/:candidateId', invalidateOnSuccess(['candidates']), resumeController.triggerParsing);
router.put('/:candidateId', invalidateOnSuccess(['candidates']), resumeController.updateResumeData);
router.delete('/:candidateId', invalidateOnSuccess(['candidates']), resumeController.deleteResumeData);
router.post('/:candidateId/recompute-match', invalidateOnSuccess(['candidates']), resumeController.recomputeMatch);

router.get('/:candidateId', resumeController.getResumeData);
router.get('/:candidateId/match/:roleId', resumeController.matchWithRole);

module.exports = router;
