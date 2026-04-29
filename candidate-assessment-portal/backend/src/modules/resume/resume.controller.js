const ResumeData = require('./resume.model');
const Candidate = require('../candidate/candidate.model');
const { parseResume } = require('./parser.service');
const path = require('path');

/**
 * Upload and parse resume
 * POST /api/resume/upload/:candidateId
 */
exports.uploadAndParse = async (req, res) => {
  try {
    const { candidateId } = req.params;
    
    // Verify candidate exists
    const candidate = await Candidate.findById(candidateId);
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
      // Update existing
      resumeData.fileUrl = fileUrl;
      resumeData.fileType = fileType;
      resumeData.uploadedAt = new Date();
      resumeData.parsingStatus = 'processing';
      await resumeData.save();
    } else {
      // Create new
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
    
    // Parse resume asynchronously (in background)
    parseResumeAsync(resumeData._id, filePath, fileType);
    
    res.status(200).json({
      message: 'Resume uploaded successfully. Parsing in progress.',
      resumeData: {
        _id: resumeData._id,
        fileUrl: resumeData.fileUrl,
        parsingStatus: resumeData.parsingStatus,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Failed to upload resume', error: error.message });
  }
};

/**
 * Parse resume asynchronously
 */
async function parseResumeAsync(resumeDataId, filePath, fileType) {
  try {
    const parsedData = await parseResume(filePath, fileType);
    
    await ResumeData.findByIdAndUpdate(resumeDataId, {
      ...parsedData,
      parsingStatus: 'completed',
    });
    
    console.log(`Resume parsed successfully: ${resumeDataId}`);
  } catch (error) {
    console.error('Parsing error:', error);
    await ResumeData.findByIdAndUpdate(resumeDataId, {
      parsingStatus: 'failed',
      parsingError: error.message,
    });
  }
}

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
    
    // Update status
    resumeData.parsingStatus = 'processing';
    await resumeData.save();
    
    // Get file path
    const filePath = path.join(__dirname, '../../../', resumeData.fileUrl);
    
    // Parse asynchronously
    parseResumeAsync(resumeData._id, filePath, resumeData.fileType);
    
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
    
    const resumeData = await ResumeData.findOne({ candidateId });
    if (!resumeData) {
      return res.status(404).json({ message: 'Resume data not found' });
    }
    
    // For now, return basic match data
    // In future, this can be enhanced with actual role requirements matching
    const candidateSkills = [
      ...(resumeData.skills?.technical || []),
      ...(resumeData.skills?.tools || []),
    ];
    
    // Mock role requirements (in real implementation, fetch from Role model)
    const roleRequirements = ['JavaScript', 'React', 'Node', 'MongoDB'];
    
    const matchedSkills = candidateSkills.filter(skill => 
      roleRequirements.some(req => req.toLowerCase() === skill.toLowerCase())
    );
    
    const missingSkills = roleRequirements.filter(req => 
      !candidateSkills.some(skill => skill.toLowerCase() === req.toLowerCase())
    );
    
    const matchPercentage = roleRequirements.length > 0 
      ? Math.round((matchedSkills.length / roleRequirements.length) * 100)
      : 0;
    
    res.json({
      matchPercentage,
      matchedSkills,
      missingSkills,
      candidateSkills,
      roleRequirements,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to match resume with role', error: error.message });
  }
};
