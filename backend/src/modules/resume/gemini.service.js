const { GoogleGenerativeAI } = require('@google/generative-ai');

// ─────────────────────────────────────────────────────────────────────────────
// GEMINI CLIENT
// ─────────────────────────────────────────────────────────────────────────────

let genAI = null;

function getClient() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_INSTRUCTION = `You are a resume parsing engine.
Extract structured information from the given resume text and return ONLY valid JSON.
Do NOT hallucinate. Do NOT add extra fields. If data is missing, return empty string or empty array.
Map all content into the predefined schema strictly.
Never wrap the JSON in markdown code blocks.`;

function buildPrompt(resumeText) {
  return `Extract the following information from this resume and return ONLY a valid JSON object.

Schema to fill:
{
  "name": "",
  "email": "",
  "phone": "",
  "location": "",
  "linkedin": "",
  "github": "",
  "summary": "",
  "skills": {
    "technical": [],
    "tools": [],
    "soft": [],
    "languages": []
  },
  "experience": [
    {
      "company": "",
      "role": "",
      "startDate": "",
      "endDate": "",
      "location": "",
      "responsibilities": [],
      "technologies": []
    }
  ],
  "education": [
    {
      "degree": "",
      "institution": "",
      "year": "",
      "startYear": "",
      "endYear": "",
      "major": "",
      "gpa": ""
    }
  ],
  "certifications": [
    {
      "name": "",
      "issuer": "",
      "date": ""
    }
  ],
  "projects": [
    {
      "name": "",
      "description": "",
      "technologies": [],
      "link": ""
    }
  ],
  "aiInsights": {
    "generatedSummary": "",
    "experienceYears": 0,
    "seniorityLevel": "",
    "primaryRole": "",
    "keyStrengths": [],
    "industryExperience": []
  }
}

Rules:
- Convert unstructured paragraphs into structured fields
- Extract skills even if embedded in paragraph text
- Infer section names (e.g. "Work History" = experience, "Academic Background" = education)
- Dates must be normalized to YYYY-MM format where possible (e.g. "Jan 2022" → "2022-01"). Use "Present" for current roles.
- Duration calculation: The system will automatically calculate work duration from startDate and endDate, so you don't need to include duration in the response
- seniorityLevel must be one of: intern, junior, mid, senior, lead, executive
- experienceYears must be a number (integer or decimal)
- skills.technical: programming languages, frameworks, libraries
- skills.tools: software tools, platforms, IDEs, cloud services
- skills.soft: communication, leadership, teamwork, etc.
- skills.languages: spoken/written languages (e.g. English, Arabic)
- Return ONLY the JSON object, no markdown, no explanation

Resume Text:
"""
${resumeText}
"""`;
}

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZATION
// ─────────────────────────────────────────────────────────────────────────────

// Common skill aliases → canonical names
const SKILL_ALIASES = {
  'js': 'JavaScript',
  'javascript': 'JavaScript',
  'ts': 'TypeScript',
  'typescript': 'TypeScript',
  'reactjs': 'React',
  'react.js': 'React',
  'react js': 'React',
  'vuejs': 'Vue.js',
  'vue js': 'Vue.js',
  'angularjs': 'Angular',
  'angular js': 'Angular',
  'nodejs': 'Node.js',
  'node js': 'Node.js',
  'node': 'Node.js',
  'expressjs': 'Express.js',
  'express js': 'Express.js',
  'express': 'Express.js',
  'nextjs': 'Next.js',
  'next js': 'Next.js',
  'mongodb': 'MongoDB',
  'mongo': 'MongoDB',
  'postgresql': 'PostgreSQL',
  'postgres': 'PostgreSQL',
  'mysql': 'MySQL',
  'mssql': 'SQL Server',
  'ms sql': 'SQL Server',
  'sql server': 'SQL Server',
  'py': 'Python',
  'python3': 'Python',
  'cpp': 'C++',
  'c plus plus': 'C++',
  'csharp': 'C#',
  'c sharp': 'C#',
  'dotnet': '.NET',
  '.net core': '.NET Core',
  'aws': 'AWS',
  'amazon web services': 'AWS',
  'gcp': 'Google Cloud',
  'google cloud platform': 'Google Cloud',
  'azure': 'Microsoft Azure',
  'ms azure': 'Microsoft Azure',
  'docker': 'Docker',
  'kubernetes': 'Kubernetes',
  'k8s': 'Kubernetes',
  'git': 'Git',
  'github': 'GitHub',
  'gitlab': 'GitLab',
  'ci/cd': 'CI/CD',
  'cicd': 'CI/CD',
  'rest api': 'REST API',
  'restful': 'REST API',
  'graphql': 'GraphQL',
  'html5': 'HTML',
  'html': 'HTML',
  'css3': 'CSS',
  'css': 'CSS',
  'sass': 'SASS',
  'scss': 'SCSS',
  'tailwind': 'Tailwind CSS',
  'tailwindcss': 'Tailwind CSS',
  'redux': 'Redux',
  'redux toolkit': 'Redux Toolkit',
  'jest': 'Jest',
  'mocha': 'Mocha',
  'figma': 'Figma',
  'jira': 'Jira',
  'linux': 'Linux',
  'bash': 'Bash',
  'shell': 'Shell Scripting',
  'ml': 'Machine Learning',
  'ai': 'Artificial Intelligence',
  'nlp': 'NLP',
  'dl': 'Deep Learning',
  'tensorflow': 'TensorFlow',
  'pytorch': 'PyTorch',
  'pandas': 'Pandas',
  'numpy': 'NumPy',
  'scikit-learn': 'Scikit-learn',
  'sklearn': 'Scikit-learn',
};

function normalizeSkill(skill) {
  if (!skill || typeof skill !== 'string') return null;
  const trimmed = skill.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  return SKILL_ALIASES[lower] || trimmed;
}

function normalizeSkillArray(arr) {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  return arr
    .map(normalizeSkill)
    .filter(Boolean)
    .filter(skill => {
      const key = skill.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function normalizeDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const trimmed = dateStr.trim();
  if (!trimmed || trimmed.toLowerCase() === 'present' || trimmed.toLowerCase() === 'current') {
    return 'Present';
  }

  // Already in YYYY-MM format
  if (/^\d{4}-\d{2}$/.test(trimmed)) return trimmed;

  // YYYY only
  if (/^\d{4}$/.test(trimmed)) return trimmed;

  // Month Year formats: "Jan 2022", "January 2022", "01/2022", "2022/01"
  const monthNames = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    january: '01', february: '02', march: '03', april: '04', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
  };

  // "Jan 2022" or "January 2022"
  const monthYearMatch = trimmed.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (monthYearMatch) {
    const month = monthNames[monthYearMatch[1].toLowerCase()];
    if (month) return `${monthYearMatch[2]}-${month}`;
  }

  // "2022/01" or "01/2022"
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{4})$/) || trimmed.match(/^(\d{4})\/(\d{1,2})$/);
  if (slashMatch) {
    const [, a, b] = slashMatch;
    if (a.length === 4) return `${a}-${b.padStart(2, '0')}`;
    return `${b}-${a.padStart(2, '0')}`;
  }

  return trimmed;
}

/**
 * Calculate duration between two dates
 * @param {string} startDate - Start date in YYYY-MM, YYYY, or "Present" format
 * @param {string} endDate - End date in YYYY-MM, YYYY, or "Present" format
 * @returns {object} - { months: number, formatted: string }
 */
function calculateDuration(startDate, endDate) {
  if (!startDate) return { months: 0, formatted: '' };

  // Parse dates to get year and month
  const parseDate = (dateStr) => {
    if (!dateStr || dateStr === 'Present') {
      const now = new Date();
      return { year: now.getFullYear(), month: now.getMonth() + 1 };
    }
    
    // YYYY-MM format
    const monthMatch = dateStr.match(/^(\d{4})-(\d{2})$/);
    if (monthMatch) {
      return { year: parseInt(monthMatch[1]), month: parseInt(monthMatch[2]) };
    }
    
    // YYYY format - assume January
    const yearMatch = dateStr.match(/^(\d{4})$/);
    if (yearMatch) {
      return { year: parseInt(yearMatch[1]), month: 1 };
    }
    
    return null;
  };

  const start = parseDate(startDate);
  const end = parseDate(endDate || 'Present');

  if (!start || !end) return { months: 0, formatted: '' };

  // Calculate total months
  const totalMonths = (end.year - start.year) * 12 + (end.month - start.month);
  
  if (totalMonths < 0) return { months: 0, formatted: '' };
  if (totalMonths === 0) return { months: 1, formatted: '1 month' };

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  let formatted = '';
  if (years > 0) {
    formatted += `${years} year${years > 1 ? 's' : ''}`;
  }
  if (months > 0) {
    if (formatted) formatted += ' ';
    formatted += `${months} month${months > 1 ? 's' : ''}`;
  }

  return { months: totalMonths, formatted };
}

function normalizeExperience(expArray) {
  if (!Array.isArray(expArray)) return [];
  return expArray.map(exp => {
    const startDate = normalizeDate(exp.startDate || exp.start_date || '');
    const endDate = normalizeDate(exp.endDate || exp.end_date || '');
    
    // Calculate duration
    const duration = calculateDuration(startDate, endDate);
    
    return {
      company: (exp.company || '').trim(),
      role: (exp.role || exp.title || '').trim(),
      startDate,
      endDate,
      duration: duration.formatted,
      durationMonths: duration.months,
      location: (exp.location || '').trim(),
      responsibilities: Array.isArray(exp.responsibilities)
        ? exp.responsibilities.filter(Boolean)
        : (exp.description ? [exp.description] : []),
      technologies: normalizeSkillArray(exp.technologies || []),
    };
  }).filter(exp => exp.company || exp.role);
}

function normalizeEducation(eduArray) {
  if (!Array.isArray(eduArray)) return [];
  return eduArray.map(edu => ({
    degree: (edu.degree || '').trim(),
    institution: (edu.institution || '').trim(),
    year: (edu.year || edu.endYear || '').trim(),
    startYear: (edu.startYear || '').trim(),
    endYear: (edu.endYear || edu.year || '').trim(),
    major: (edu.major || edu.field || '').trim(),
    gpa: (edu.gpa || '').trim(),
  })).filter(edu => edu.degree || edu.institution);
}

function normalizeCertifications(certArray) {
  if (!Array.isArray(certArray)) return [];
  return certArray.map(cert => {
    if (typeof cert === 'string') {
      return { name: cert.trim(), issuer: '', date: '' };
    }
    return {
      name: (cert.name || '').trim(),
      issuer: (cert.issuer || cert.provider || '').trim(),
      date: normalizeDate(cert.date || cert.year || ''),
    };
  }).filter(cert => cert.name);
}

function normalizeProjects(projArray) {
  if (!Array.isArray(projArray)) return [];
  return projArray.map(proj => ({
    name: (proj.name || '').trim(),
    description: (proj.description || '').trim(),
    technologies: normalizeSkillArray(proj.technologies || []),
    link: (proj.link || proj.url || '').trim(),
  })).filter(proj => proj.name);
}

function normalizeAiInsights(insights, experience) {
  if (!insights) return null;

  // Validate seniorityLevel
  const validLevels = ['intern', 'junior', 'mid', 'senior', 'lead', 'executive'];
  const level = (insights.seniorityLevel || '').toLowerCase();

  // Auto-infer seniority from experience years if not valid
  let seniorityLevel = validLevels.includes(level) ? level : null;
  if (!seniorityLevel) {
    const years = insights.experienceYears || 0;
    if (years === 0) seniorityLevel = 'intern';
    else if (years <= 2) seniorityLevel = 'junior';
    else if (years <= 5) seniorityLevel = 'mid';
    else if (years <= 8) seniorityLevel = 'senior';
    else seniorityLevel = 'lead';
  }

  return {
    generatedSummary: (insights.generatedSummary || '').trim(),
    experienceYears: typeof insights.experienceYears === 'number' ? insights.experienceYears : 0,
    seniorityLevel,
    primaryRole: (insights.primaryRole || '').trim(),
    keyStrengths: Array.isArray(insights.keyStrengths)
      ? insights.keyStrengths.filter(Boolean).slice(0, 10)
      : [],
    industryExperience: Array.isArray(insights.industryExperience)
      ? insights.industryExperience.filter(Boolean).slice(0, 10)
      : [],
  };
}

/**
 * Normalize the full Gemini response into the ResumeData schema
 */
function normalizeGeminiOutput(raw) {
  const skills = raw.skills || {};

  return {
    basicInfo: {
      name: (raw.name || '').trim() || null,
      email: (raw.email || '').trim() || null,
      phone: (raw.phone || '').trim() || null,
      location: (raw.location || '').trim() || null,
      linkedin: (raw.linkedin || '').trim() || null,
      github: (raw.github || '').trim() || null,
      portfolio: (raw.portfolio || '').trim() || null,
    },
    summary: (raw.summary || '').trim() || null,
    skills: {
      technical: normalizeSkillArray(skills.technical || []),
      tools: normalizeSkillArray(skills.tools || []),
      soft: normalizeSkillArray(skills.soft || []),
      languages: normalizeSkillArray(skills.languages || []),
    },
    experience: normalizeExperience(raw.experience || []),
    education: normalizeEducation(raw.education || []),
    certifications: normalizeCertifications(raw.certifications || []),
    projects: normalizeProjects(raw.projects || []),
    aiInsights: normalizeAiInsights(raw.aiInsights || null, raw.experience || []),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

function validateParsedData(data) {
  const issues = [];

  // Email format
  if (data.basicInfo.email) {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(data.basicInfo.email)) {
      issues.push(`Invalid email format: ${data.basicInfo.email}`);
      data.basicInfo.email = null;
    }
  }

  // Phone format — basic sanity check
  if (data.basicInfo.phone) {
    const cleaned = data.basicInfo.phone.replace(/[\s\-().+]/g, '');
    if (cleaned.length < 7 || cleaned.length > 15 || !/^\d+$/.test(cleaned)) {
      issues.push(`Suspicious phone format: ${data.basicInfo.phone}`);
      // Keep it but flag it — don't null it out
    }
  }

  // Minimum content check
  const hasSkills = (
    data.skills.technical.length > 0 ||
    data.skills.tools.length > 0 ||
    data.skills.soft.length > 0
  );
  const hasExperience = data.experience.length > 0;
  const hasEducation = data.education.length > 0;

  if (!data.basicInfo.name && !hasSkills && !hasExperience && !hasEducation) {
    issues.push('Insufficient data extracted — resume may be image-based or empty');
  }

  return {
    isValid: issues.length === 0,
    issues,
    needsManualReview: issues.length > 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN GEMINI PARSE FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse resume text using Gemini API
 * @param {string} rawText - Extracted text from PDF
 * @returns {Promise<{parsedData: object, validation: object, rawText: string}>}
 */
async function parseWithGemini(rawText) {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      temperature: 0.1,       // Low temperature for deterministic extraction
      topP: 0.8,
      maxOutputTokens: 8192,  // Increased to handle full resume JSON
    },
  });

  const prompt = buildPrompt(rawText);

  let responseText = '';
  let attempt = 0;
  const maxAttempts = 3;  // Increased from 2 to 3

  while (attempt < maxAttempts) {
    attempt++;
    try {
      console.log(`[Gemini] Attempt ${attempt}: Sending resume text (${rawText.length} chars) to Gemini...`);
      const result = await model.generateContent(prompt);
      const response = result.response;
      responseText = response.text().trim();
      console.log(`[Gemini] Response received (${responseText.length} chars)`);
      
      // Check if response was truncated
      const finishReason = response.candidates?.[0]?.finishReason;
      if (finishReason && finishReason !== 'STOP') {
        console.warn(`[Gemini] Response may be incomplete. Finish reason: ${finishReason}`);
      }
      
      break;
    } catch (err) {
      console.error(`[Gemini] Attempt ${attempt} failed:`, err.message);
      if (attempt >= maxAttempts) {
        throw new Error(`Gemini API failed after ${maxAttempts} attempts: ${err.message}`);
      }
      // Exponential backoff: 2s, 4s, 8s
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`[Gemini] Retrying in ${delay/1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Strip markdown code fences if Gemini wrapped the JSON anyway
  responseText = responseText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  // Parse JSON
  let rawParsed;
  try {
    rawParsed = JSON.parse(responseText);
  } catch (parseErr) {
    // Try to extract JSON from the response if there's surrounding text
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        rawParsed = JSON.parse(jsonMatch[0]);
      } catch {
        throw new Error(`Failed to parse Gemini JSON response: ${parseErr.message}`);
      }
    } else {
      throw new Error(`Gemini returned non-JSON response: ${responseText.substring(0, 200)}`);
    }
  }

  // Normalize and validate
  const parsedData = normalizeGeminiOutput(rawParsed);
  const validation = validateParsedData(parsedData);

  if (validation.issues.length > 0) {
    console.warn('[Gemini] Validation issues:', validation.issues);
  }

  return { parsedData, validation };
}

module.exports = {
  parseWithGemini,
  normalizeGeminiOutput,
  validateParsedData,
};
