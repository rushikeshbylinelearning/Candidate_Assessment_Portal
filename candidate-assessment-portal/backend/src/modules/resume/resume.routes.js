const express = require('express');
const router = express.Router();
const resumeController = require('./resume.controller');
const { protect } = require('../../middleware/auth');
const upload = require('../../config/multer');

// All routes require authentication
router.use(protect);

// Upload and parse resume
router.post('/upload/:candidateId', upload.single('resume'), resumeController.uploadAndParse);

// Trigger manual parsing
router.post('/parse/:candidateId', resumeController.triggerParsing);

// Get parsed resume data
router.get('/:candidateId', resumeController.getResumeData);

// Update resume data manually
router.put('/:candidateId', resumeController.updateResumeData);

// Delete resume data
router.delete('/:candidateId', resumeController.deleteResumeData);

// Match resume with role
router.get('/:candidateId/match/:roleId', resumeController.matchWithRole);

module.exports = router;
