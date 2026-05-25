const ResumeData = require('../modules/resume/resume.model');
const Candidate = require('../modules/candidate/candidate.model');
const Role = require('../modules/roles/role.model');
const { parseResume } = require('../modules/resume/parser.service');
const { calculateSkillMatch } = require('../utils/skillMatcher');
const appLogger = require('../utils/appLogger');
const { enqueue } = require('../utils/taskQueue');

async function runSkillMatch(candidateId, role) {
  try {
    const resumeData = await ResumeData.findOne({ candidateId });
    if (!resumeData || resumeData.parsingStatus !== 'completed') return;

    let roleDoc = role;
    if (!roleDoc?.requiredSkills) {
      roleDoc = await Role.findById(typeof role === 'object' ? role._id : role);
    }
    if (!roleDoc) return;

    const candidateSkills = resumeData.skills?.technical ? resumeData.skills.technical : [];
    const roleSkills = roleDoc.requiredSkills || [];
    const matchResult = calculateSkillMatch(candidateSkills, roleSkills);

    await Candidate.findByIdAndUpdate(candidateId, {
      skillMatchResult: { ...matchResult, computedAt: new Date() },
    });
    appLogger.info(`Skill match computed for ${candidateId}`);
  } catch (err) {
    appLogger.error('Skill match failed', err.message);
  }
}

async function parseResumeAsync(resumeDataId, filePath, fileType, candidate) {
  try {
    const parsedData = await parseResume(filePath, fileType);
    await ResumeData.findByIdAndUpdate(resumeDataId, {
      ...parsedData,
      parsingStatus: 'completed',
    });
    appLogger.info('Resume parsed', resumeDataId);

    if (candidate?.appliedRole) {
      await runSkillMatch(candidate._id, candidate.appliedRole);
    }
  } catch (error) {
    appLogger.error('Resume parsing failed', error.message);
    await ResumeData.findByIdAndUpdate(resumeDataId, {
      parsingStatus: 'failed',
      parsingError: error.message,
    });
  }
}

function scheduleResumeParse(resumeDataId, filePath, fileType, candidate) {
  return enqueue(() => parseResumeAsync(resumeDataId, filePath, fileType, candidate));
}

module.exports = { parseResumeAsync, scheduleResumeParse, runSkillMatch };
