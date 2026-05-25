const ResumeData = require('./resume.model');
const Candidate = require('../candidate/candidate.model');
const Role = require('../roles/role.model');
const path = require('path');
const appLogger = require('../../utils/appLogger');
const { scheduleResumeParse, runSkillMatch } = require('../../services/resumeParse.service');

/**
 * Get parsing status (lightweight poll endpoint)
 * GET /api/resume/:candidateId/status
 */
exports.getParsingStatus = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const resumeData = await ResumeData.findOne({ candidateId }).select(
      'parsingStatus parsingError fileUrl uploadedAt'
    );
    if (!resumeData) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    res.json({
      parsingStatus: resumeData.parsingStatus,
      parsingError: resumeData.parsingError || null,
      fileUrl: resumeData.fileUrl,
      uploadedAt: resumeData.uploadedAt,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch parsing status', error: error.message });
  }
};

/**
 * Upload and parse resume
 * POST /api/resume/upload/:candidateId
 */
exports.uploadAndParse = async (req, res) => {
  try {
    const { candidateId } = req.params;

    // Verify candidate exists
    const candidate = await Candidate.findById(candidateId).populate('appliedRole');
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/resumes/${req.file.filename}`;
    const fileType = path.extname(req.file.filename).slice(1).toLowerCase();
    const filePath = req.file.path;

    // Create or update resume data record
    let resumeData = await ResumeData.findOne({ candidateId });

    if (resumeData) {
      resumeData.fileUrl = fileUrl;
      resumeData.fileType = fileType;
      resumeData.uploadedAt = new Date();
      resumeData.parsingStatus = 'processing';
      await resumeData.save();
    } else {
      resumeData = await ResumeData.create({
        candidateId,
        fileUrl,
        fileType,
        parsingStatus: 'processing',
      });
    }

    // Update candidate record
    candidate.resumeUrl = fileUrl;
    await candidate.save();

    scheduleResumeParse(resumeData._id, filePath, fileType, candidate);

    res.status(200).json({
      message: 'Resume uploaded successfully. Parsing in progress.',
      resumeData: {
        _id: resumeData._id,
        fileUrl: resumeData.fileUrl,
        parsingStatus: resumeData.parsingStatus,
      },
    });
  } catch (error) {
    appLogger.error('Upload error', error.message);
    res.status(500).json({ message: 'Failed to upload resume', error: error.message });
  }
};

/**
 * Trigger manual parsing for existing resume
 * POST /api/resume/parse/:candidateId
 */
exports.triggerParsing = async (req, res) => {
  try {
    const { candidateId } = req.params;

    const resumeData = await ResumeData.findOne({ candidateId });
    if (!resumeData) {
      return res.status(404).json({ message: 'Resume not found for this candidate' });
    }

    if (resumeData.parsingStatus === 'processing') {
      return res.status(400).json({ message: 'Parsing already in progress' });
    }

    resumeData.parsingStatus = 'processing';
    await resumeData.save();

    const filePath = path.join(__dirname, '../../../', resumeData.fileUrl);
    const candidate = await Candidate.findById(candidateId).populate('appliedRole');

    scheduleResumeParse(resumeData._id, filePath, resumeData.fileType, candidate);

    res.json({ message: 'Parsing triggered successfully', status: 'processing' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to trigger parsing', error: error.message });
  }
};

/**
 * Get parsed resume data
 * GET /api/resume/:candidateId
 */
exports.getResumeData = async (req, res) => {
  try {
    const { candidateId } = req.params;

    const resumeData = await ResumeData.findOne({ candidateId }).populate('candidateId', 'name email phone');

    if (!resumeData) {
      return res.status(404).json({ message: 'Resume data not found' });
    }

    res.json(resumeData);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch resume data', error: error.message });
  }
};

/**
 * Update parsed resume data manually
 * PUT /api/resume/:candidateId
 */
exports.updateResumeData = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const updates = req.body;

    const resumeData = await ResumeData.findOneAndUpdate(
      { candidateId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!resumeData) {
      return res.status(404).json({ message: 'Resume data not found' });
    }

    res.json({ message: 'Resume data updated successfully', resumeData });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update resume data', error: error.message });
  }
};

/**
 * Delete resume data
 * DELETE /api/resume/:candidateId
 */
exports.deleteResumeData = async (req, res) => {
  try {
    const { candidateId } = req.params;

    const resumeData = await ResumeData.findOneAndDelete({ candidateId });

    if (!resumeData) {
      return res.status(404).json({ message: 'Resume data not found' });
    }

    res.json({ message: 'Resume data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete resume data', error: error.message });
  }
};

/**
 * Match resume with role requirements
 * GET /api/resume/:candidateId/match/:roleId
 */
exports.matchWithRole = async (req, res) => {
  try {
    const { candidateId, roleId } = req.params;

    const [resumeData, role] = await Promise.all([
      ResumeData.findOne({ candidateId }),
      Role.findById(roleId),
    ]);

    if (!resumeData) {
      return res.status(404).json({ message: 'Resume data not found' });
    }
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    const candidateSkills = resumeData.skills && resumeData.skills.technical
      ? resumeData.skills.technical
      : [];
    const roleSkills = role.requiredSkills || [];

    const matchResult = calculateSkillMatch(candidateSkills, roleSkills);

    // Persist result to candidate
    await Candidate.findByIdAndUpdate(candidateId, {
      skillMatchResult: { ...matchResult, computedAt: new Date() },
    });

    res.json({
      ...matchResult,
      candidateSkills,
      roleRequirements: roleSkills,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to match resume with role', error: error.message });
  }
};

/**
 * Recompute skill match for a candidate (called when role skills change)
 * POST /api/resume/:candidateId/recompute-match
 */
exports.recomputeMatch = async (req, res) => {
  try {
    const { candidateId } = req.params;

    const candidate = await Candidate.findById(candidateId).populate('appliedRole');
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    await runSkillMatch(candidateId, candidate.appliedRole);

    const updated = await Candidate.findById(candidateId).select('skillMatchResult');
    res.json({ message: 'Skill match recomputed', skillMatchResult: updated.skillMatchResult });
  } catch (error) {
    res.status(500).json({ message: 'Failed to recompute match', error: error.message });
  }
};

// Export runSkillMatch for use in other modules
exports.runSkillMatch = runSkillMatch;
