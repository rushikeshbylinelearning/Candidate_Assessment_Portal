/**
 * Assessment Import Service
 * Parses PDF/DOCX files and extracts questions of various types:
 *  - MCQ (single/multi choice)
 *  - Checkbox (multi-select)
 *  - Descriptive / short-answer
 *  - True/False
 */

const fs = require('fs').promises;
const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');

// ─── Text Extraction ──────────────────────────────────────────────────────────

async function extractText(filePath, mimetype) {
  const buf = await fs.readFile(filePath);
  if (mimetype === 'application/pdf') {
    const parser = new PDFParse({ data: buf });
    const result = await parser.getText();
    return result.text;
  }
  // Word documents
  const result = await mammoth.extractRawText({ buffer: buf });
  return result.value;
}

function normalizeText(raw) {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── Patterns ─────────────────────────────────────────────────────────────────

// Numbered question starters: "1.", "1)", "Q1.", "Q1)", "Question 1:"
const QUESTION_START = /^(?:Q(?:uestion)?\s*)?(\d+)[.):\s]/i;

// Option patterns: "a)", "A.", "(a)", "A)", "a.", "□ a)", "☐ a)"
const OPTION_PATTERN = /^(?:[□☐☑✓✗\-•*]\s*)?([A-Ea-e])[.)]\s+(.+)/;

// Checkbox patterns: "□", "☐", "[ ]", "(  )", "○"
const CHECKBOX_PATTERN = /^(?:[□☐○\[\]\(\)\s]{1,4})\s*(.+)/;

// True/False detection
const TF_PATTERN = /\b(true|false|yes|no)\b/gi;

// Answer key patterns: "Answer:", "Ans:", "Correct:", "Key:"
const ANSWER_PATTERN = /^(?:answer|ans|correct answer|key|solution)[:\s]+(.+)/i;

// Blank / fill-in patterns
const BLANK_PATTERN = /_{3,}|\[_{2,}\]|\(_{2,}\)/;

// ─── Question Type Detection ──────────────────────────────────────────────────

function detectQuestionType(questionText, options, hasCheckboxes) {
  const lower = questionText.toLowerCase();

  if (hasCheckboxes) return 'mcq_multi';

  // True/False
  if (
    options.length === 2 &&
    options.every(o => /^(true|false|yes|no)$/i.test(o.text.trim()))
  ) return 'true_false';

  if (/\b(true or false|true\/false|t\/f)\b/i.test(lower)) return 'true_false';

  // MCQ with options
  if (options.length >= 2) {
    // "select all", "choose all", "mark all" → multi
    if (/select all|choose all|mark all|all that apply/i.test(lower)) return 'mcq_multi';
    return 'mcq_single';
  }

  // Fill in the blank
  if (BLANK_PATTERN.test(questionText)) return 'short_answer';

  // Descriptive keywords
  if (/explain|describe|discuss|elaborate|write|define|what is|how does|why|compare|contrast|list|mention|state/i.test(lower)) {
    return 'short_answer';
  }

  return 'short_answer';
}

// ─── Category Detection ───────────────────────────────────────────────────────

const CATEGORY_KEYWORDS = {
  technical: [
    'code', 'program', 'algorithm', 'function', 'class', 'object', 'database',
    'sql', 'api', 'http', 'server', 'client', 'network', 'software', 'hardware',
    'debug', 'compile', 'runtime', 'syntax', 'variable', 'loop', 'array',
    'javascript', 'python', 'java', 'react', 'node', 'css', 'html', 'git',
    'framework', 'library', 'module', 'interface', 'inheritance', 'polymorphism',
  ],
  aptitude: [
    'calculate', 'compute', 'percentage', 'ratio', 'profit', 'loss', 'speed',
    'distance', 'time', 'average', 'probability', 'permutation', 'combination',
    'series', 'sequence', 'number', 'arithmetic', 'algebra', 'geometry',
    'train', 'boat', 'pipe', 'tank', 'work', 'age', 'mixture',
  ],
  reasoning: [
    'logical', 'pattern', 'analogy', 'syllogism', 'statement', 'conclusion',
    'assumption', 'argument', 'inference', 'deduction', 'induction', 'puzzle',
    'arrangement', 'seating', 'blood relation', 'direction', 'coding-decoding',
    'odd one out', 'series', 'matrix',
  ],
  communication: [
    'grammar', 'vocabulary', 'sentence', 'paragraph', 'comprehension', 'passage',
    'synonym', 'antonym', 'idiom', 'phrase', 'tense', 'preposition', 'article',
    'spelling', 'punctuation', 'reading', 'writing', 'verbal', 'language',
    'communication', 'email', 'report', 'presentation',
  ],
};

function detectCategory(text) {
  const lower = text.toLowerCase();
  const scores = {};
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    scores[cat] = keywords.filter(kw => lower.includes(kw)).length;
  }
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : 'technical';
}

// ─── Difficulty Detection ─────────────────────────────────────────────────────

function detectDifficulty(text, sectionContext) {
  const lower = (text + ' ' + sectionContext).toLowerCase();
  if (/\b(hard|difficult|advanced|complex|challenging|expert)\b/.test(lower)) return 'hard';
  if (/\b(medium|moderate|intermediate)\b/.test(lower)) return 'medium';
  if (/\b(easy|basic|simple|beginner|fundamental)\b/.test(lower)) return 'easy';
  // Heuristic: longer questions tend to be harder
  if (text.length > 300) return 'hard';
  if (text.length > 150) return 'medium';
  return 'easy';
}

// ─── Section Context Extraction ───────────────────────────────────────────────

function extractSectionHeaders(lines) {
  // Lines that look like section headers (short, no trailing punctuation, possibly ALL CAPS)
  const headers = [];
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (
      trimmed.length > 0 &&
      trimmed.length < 80 &&
      !QUESTION_START.test(trimmed) &&
      !OPTION_PATTERN.test(trimmed) &&
      (
        /^[A-Z\s\d:–\-]+$/.test(trimmed) || // ALL CAPS
        /^(section|part|chapter|unit)\s*[:\-\d]/i.test(trimmed) ||
        /^(instructions?|directions?|note)\s*:/i.test(trimmed)
      )
    ) {
      headers.push({ idx, text: trimmed });
    }
  });
  return headers;
}

// ─── Core Parser ──────────────────────────────────────────────────────────────

function parseQuestions(text) {
  const lines = text.split('\n').map(l => l.trimEnd());
  const sectionHeaders = extractSectionHeaders(lines);

  const questions = [];
  let i = 0;

  // Helper: find which section a line belongs to
  function getSectionContext(lineIdx) {
    let ctx = '';
    for (const h of sectionHeaders) {
      if (h.idx <= lineIdx) ctx = h.text;
    }
    return ctx;
  }

  while (i < lines.length) {
    const line = lines[i].trim();

    // Detect question start
    const qMatch = QUESTION_START.exec(line);
    if (!qMatch) { i++; continue; }

    // Collect full question text (may span multiple lines until options or next question)
    let questionText = line.replace(QUESTION_START, '').trim();
    let j = i + 1;

    // Accumulate continuation lines (not options, not next question)
    while (
      j < lines.length &&
      !QUESTION_START.test(lines[j].trim()) &&
      !OPTION_PATTERN.test(lines[j].trim()) &&
      !CHECKBOX_PATTERN.test(lines[j].trim()) &&
      !ANSWER_PATTERN.test(lines[j].trim()) &&
      lines[j].trim() !== ''
    ) {
      questionText += ' ' + lines[j].trim();
      j++;
    }

    // Collect options
    const options = [];
    let hasCheckboxes = false;
    let correctAnswer = null;

    while (j < lines.length) {
      const optLine = lines[j].trim();

      if (!optLine) { j++; continue; }
      if (QUESTION_START.test(optLine)) break; // next question

      // Answer key line
      const ansMatch = ANSWER_PATTERN.exec(optLine);
      if (ansMatch) {
        correctAnswer = ansMatch[1].trim();
        j++;
        continue;
      }

      // Standard option: a) text
      const optMatch = OPTION_PATTERN.exec(optLine);
      if (optMatch) {
        options.push({ id: optMatch[1].toLowerCase(), text: optMatch[2].trim() });
        j++;
        continue;
      }

      // Checkbox option: □ text
      const cbMatch = CHECKBOX_PATTERN.exec(optLine);
      if (cbMatch && optLine.match(/^[□☐○\[\]\(\)]/)) {
        hasCheckboxes = true;
        options.push({ id: String.fromCharCode(97 + options.length), text: cbMatch[1].trim() });
        j++;
        continue;
      }

      break;
    }

    // Skip if question text is too short or looks like a header
    if (questionText.length < 5) { i = j; continue; }

    const sectionCtx = getSectionContext(i);
    const qType = detectQuestionType(questionText, options, hasCheckboxes);
    const category = detectCategory(questionText + ' ' + sectionCtx);
    const difficulty = detectDifficulty(questionText, sectionCtx);

    // Build correct answer
    let finalAnswer = null;
    if (correctAnswer) {
      finalAnswer = correctAnswer;
    } else if (qType === 'true_false' && options.length === 2) {
      finalAnswer = options[0].id; // default first
    } else if (qType === 'mcq_single' && options.length > 0) {
      finalAnswer = null; // unknown
    }

    questions.push({
      text: questionText,
      type: qType,
      category,
      difficulty,
      options: options.length > 0 ? options : [],
      correctAnswer: finalAnswer,
      explanation: '',
      tags: sectionCtx ? [sectionCtx.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()] : [],
      points: qType === 'short_answer' ? 5 : 1,
      active: true,
      _sectionContext: sectionCtx,
    });

    i = j;
  }

  return questions;
}

// ─── Main Export ──────────────────────────────────────────────────────────────

async function parseAssessmentFromFile(filePath, mimetype) {
  const raw = await extractText(filePath, mimetype);
  const normalized = normalizeText(raw);
  const questions = parseQuestions(normalized);

  // Build a summary of what was found
  const summary = {
    totalQuestions: questions.length,
    byType: {},
    byCategory: {},
    byDifficulty: {},
  };

  questions.forEach(q => {
    summary.byType[q.type] = (summary.byType[q.type] || 0) + 1;
    summary.byCategory[q.category] = (summary.byCategory[q.category] || 0) + 1;
    summary.byDifficulty[q.difficulty] = (summary.byDifficulty[q.difficulty] || 0) + 1;
  });

  return { questions, summary, rawTextLength: normalized.length };
}

module.exports = { parseAssessmentFromFile };
