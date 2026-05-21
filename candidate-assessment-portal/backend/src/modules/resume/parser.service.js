const fs = require('fs').promises;
const { parseWithGemini } = require('./gemini.service');

// ─────────────────────────────────────────────────────────────────────────────
// TEXT EXTRACTION — PDF ONLY (text-based, no OCR)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract raw text from a text-based PDF using pdf-parse.
 * Returns empty string for image/scanned PDFs (no text layer).
 */
async function extractPdfText(filePath) {
  try {
    const { PDFParse } = require('pdf-parse');
    const dataBuffer = await fs.readFile(filePath);
    const parser = new PDFParse({ data: dataBuffer, verbosity: 0 });
    const result = await parser.getText({ pageJoiner: '\n' });
    return (result.text || '').trim();
  } catch (err) {
    console.warn('[extractPdfText] Extraction failed:', err.message);
    return '';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEXT PREPROCESSING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Clean raw extracted text before sending to Gemini:
 * - Collapse excessive blank lines (keep max 2 consecutive)
 * - Remove null bytes and control characters
 * - Trim each line
 * - Remove repeated header/footer patterns (lines repeated 3+ times)
 */
function preprocessText(rawText) {
  if (!rawText) return '';

  // Remove null bytes and non-printable control chars (except newlines/tabs)
  let text = rawText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Split into lines, trim each
  const lines = text.split('\n').map(l => l.trim());

  // Detect repeated lines (headers/footers) — lines appearing 3+ times
  const lineCount = {};
  lines.forEach(l => {
    if (l.length > 3) {
      lineCount[l] = (lineCount[l] || 0) + 1;
    }
  });
  const repeatedLines = new Set(
    Object.entries(lineCount)
      .filter(([, count]) => count >= 3)
      .map(([line]) => line)
  );

  // Filter out repeated lines and collapse blank lines
  const cleaned = [];
  let blankCount = 0;
  for (const line of lines) {
    if (repeatedLines.has(line)) continue;
    if (line === '') {
      blankCount++;
      if (blankCount <= 2) cleaned.push('');
    } else {
      blankCount = 0;
      cleaned.push(line);
    }
  }

  return cleaned.join('\n').trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse a resume file using Gemini AI.
 * Only accepts PDF files (text-based).
 *
 * @param {string} filePath - Absolute path to the uploaded file
 * @param {string} fileType - 'pdf' (only supported type)
 * @returns {Promise<object>} - Structured resume data matching ResumeData schema
 */
async function parseResume(filePath, fileType) {
  console.log(`[parseResume] Starting Gemini-powered parsing: ${filePath}, type: ${fileType}`);

  // Only PDF is supported
  if (fileType !== 'pdf') {
    console.warn(`[parseResume] Unsupported file type: ${fileType}. Only PDF is supported.`);
    return {
      parsingStatus: 'failed',
      parsingError: `Unsupported file type: ${fileType}. Only text-based PDF resumes are accepted.`,
    };
  }

  // Step 1: Extract raw text
  const rawText = await extractPdfText(filePath);

  if (!rawText || rawText.length < 50) {
    console.warn('[parseResume] No extractable text found — likely a scanned/image PDF');
    return {
      parsingStatus: 'failed',
      parsingError: 'Unable to extract text from this PDF. The file may be scanned or image-based. Please upload a text-based PDF.',
    };
  }

  console.log(`[parseResume] Extracted ${rawText.length} characters of text`);

  // Step 2: Preprocess text
  const cleanedText = preprocessText(rawText);
  console.log(`[parseResume] Preprocessed to ${cleanedText.length} characters`);

  // Step 3: Send to Gemini
  try {
    const { parsedData, validation } = await parseWithGemini(cleanedText);

    console.log(`[parseResume] Gemini parsing complete. Valid: ${validation.isValid}`);
    if (validation.issues.length > 0) {
      console.warn('[parseResume] Validation issues:', validation.issues.join('; '));
    }

    return {
      basicInfo: parsedData.basicInfo,
      summary: parsedData.summary,
      skills: parsedData.skills,
      experience: parsedData.experience,
      education: parsedData.education,
      certifications: parsedData.certifications,
      projects: parsedData.projects,
      aiInsights: parsedData.aiInsights,
      rawText: cleanedText.substring(0, 8000), // Store first 8k chars for reference
      parsingStatus: 'completed',
      parsingError: validation.needsManualReview
        ? `Parsed with warnings: ${validation.issues.join('; ')}`
        : null,
    };
  } catch (geminiError) {
    console.error('[parseResume] Gemini API error:', geminiError.message);
    
    // Fallback: Extract basic contact info using regex
    console.log('[parseResume] Falling back to basic extraction...');
    const basicInfo = extractBasicContactInfo(cleanedText);
    
    return {
      basicInfo,
      summary: null,
      skills: { technical: [], tools: [], soft: [], languages: [] },
      experience: [],
      education: [],
      certifications: [],
      projects: [],
      aiInsights: null,
      rawText: cleanedText.substring(0, 8000),
      parsingStatus: 'completed',
      parsingError: `Gemini AI unavailable. Only basic contact info extracted. Error: ${geminiError.message}`,
    };
  }
}

/**
 * Fallback: Extract basic contact information using regex
 */
function extractBasicContactInfo(text) {
  // Remove extra spaces from email addresses (PDF extraction artifact)
  const cleanedText = text.replace(/(\w+)\s+(\d+)\s*@\s*(\w+)/g, '$1$2@$3');
  
  const emailMatch = cleanedText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
  const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}/);
  
  // Try to find name - look for lines with 2-4 words, proper case, no special chars
  // Prioritize lines that appear after contact info but before "Professional Summary"
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  // Find the index of "Professional Summary" or similar section headers
  const summaryIndex = lines.findIndex(l => /^(professional\s+summary|summary|objective|profile)/i.test(l));
  const searchLines = summaryIndex > 0 ? lines.slice(0, summaryIndex) : lines;
  
  const nameLine = searchLines.find(l => {
    const words = l.split(/\s+/).filter(w => w.length > 1);
    return (
      words.length >= 2 && 
      words.length <= 4 &&
      l.length > 5 && 
      l.length < 50 &&
      !/[@\d(){}[\]|&]/.test(l) &&
      !/^(contact|email|phone|address|summary|experience|education|skills|links|profile|objective|top|video|social|design|editing|graphics|banner|typography|layout|motion|color|transitions|visual|high-end|retouching)/i.test(l) &&
      /^[A-Z]/.test(l) && // Starts with capital letter
      words.every(w => /^[A-Z][a-z]+$/.test(w)) // Each word is proper case (Title Case)
    );
  }) || null;

  return {
    name: nameLine,
    email: emailMatch ? emailMatch[0] : null,
    phone: phoneMatch ? phoneMatch[0] : null,
    location: null,
    linkedin: null,
    github: null,
    portfolio: null,
  };
}

module.exports = {
  parseResume,
  extractPdfText,
  preprocessText,
};
