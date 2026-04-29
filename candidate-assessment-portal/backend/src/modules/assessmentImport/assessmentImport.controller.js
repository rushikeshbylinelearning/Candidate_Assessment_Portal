const fs = require('fs');
const path = require('path');
const { parseAssessmentFromFile } = require('./assessmentImport.service');
const Question = require('../question/question.model');
const Assessment = require('../assessment/assessment.model');
const Role = require('../roles/role.model');
const { log } = require('../../utils/logger');

/**
 * POST /api/assessment-import/parse
 * Upload a PDF/DOCX and get back extracted questions for preview.
 * Does NOT save anything yet.
 */
exports.parseFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const result = await parseAssessmentFromFile(req.file.path, req.file.mimetype);

    // Clean up temp file
    fs.unlink(req.file.path, () => {});

    if (result.questions.length === 0) {
      return res.status(422).json({
        message:
          'No questions could be extracted from this file. Please ensure the PDF contains numbered questions (e.g. "1. What is...") with answer options.',
        rawTextLength: result.rawTextLength,
      });
    }

    res.json({
      questions: result.questions,
      summary: result.summary,
    });
  } catch (err) {
    // Clean up on error
    if (req.file && req.file.path) fs.unlink(req.file.path, () => {});
    console.error('Assessment import parse error:', err);
    res.status(500).json({ message: 'Failed to parse file: ' + err.message });
  }
};

/**
 * POST /api/assessment-import/create
 * Save the (possibly edited) questions and create an assessment.
 * Body: { title, roleId, duration, passThreshold, questions: [...] }
 */
exports.createFromImport = async (req, res) => {
  const { title, roleId, duration = 60, passThreshold = 60, questions = [] } = req.body;

  if (!title) return res.status(400).json({ message: 'Assessment title is required' });
  if (!roleId) return res.status(400).json({ message: 'Role is required' });
  if (questions.length === 0) return res.status(400).json({ message: 'No questions provided' });

  // 1. Bulk-insert questions
  const savedQuestions = await Question.insertMany(
    questions.map(q => ({
      text: q.text,
      type: q.type,
      category: q.category,
      difficulty: q.difficulty,
      options: q.options || [],
      correctAnswer: q.correctAnswer || null,
      explanation: q.explanation || '',
      tags: q.tags || [],
      points: q.points || 1,
      active: true,
      roles: [roleId],
      createdBy: req.user._id,
    }))
  );

  // 2. Build sections from category groupings
  const sectionMap = {};
  savedQuestions.forEach(q => {
    if (!sectionMap[q.category]) sectionMap[q.category] = [];
    sectionMap[q.category].push(q._id);
  });

  const totalWeight = 100;
  const catCount = Object.keys(sectionMap).length;
  const baseWeight = Math.floor(totalWeight / catCount);
  const remainder = totalWeight - baseWeight * catCount;

  const sections = Object.entries(sectionMap).map(([cat, ids], idx) => ({
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    category: cat,
    questionCount: ids.length,
    difficulty: 'mixed',
    weight: idx === 0 ? baseWeight + remainder : baseWeight,
  }));

  // 3. Create assessment
  const assessment = await Assessment.create({
    title,
    roleId,
    duration: parseInt(duration),
    passThreshold: parseInt(passThreshold),
    totalQuestions: savedQuestions.length,
    sections,
    randomizeQuestions: false,
    randomizeOptions: true,
    allowBacktrack: true,
    mode: 'standard',
    selectedQuestions: savedQuestions.map(q => q._id),
    createdBy: req.user._id,
    description: `Imported from PDF — ${savedQuestions.length} questions`,
  });

  // 4. Link to role
  await Role.findByIdAndUpdate(roleId, { assessmentTemplate: assessment._id });

  await log({
    userId: req.user._id,
    action: 'CREATE_ASSESSMENT_FROM_PDF',
    entity: 'assessment',
    entityId: assessment._id,
  });

  res.status(201).json({
    assessment,
    questionsCreated: savedQuestions.length,
  });
};
