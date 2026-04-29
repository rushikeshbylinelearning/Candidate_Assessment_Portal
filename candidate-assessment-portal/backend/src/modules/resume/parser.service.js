const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extract raw text from PDF file
 */
async function extractPdfText(filePath) {
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
}

/**
 * Extract raw text from DOCX file
 */
async function extractDocxText(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

/**
 * Extract raw text from resume file based on type
 */
async function extractRawText(filePath, fileType) {
  try {
    if (fileType === 'pdf') {
      return await extractPdfText(filePath);
    } else if (fileType === 'docx' || fileType === 'doc') {
      return await extractDocxText(filePath);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    throw new Error(`Failed to extract text: ${error.message}`);
  }
}

/**
 * Clean and normalize extracted text
 */
function cleanText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[^\x20-\x7E\n]/g, '')
    .trim();
}

/**
 * Extract email addresses from text
 */
function extractEmails(text) {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const matches = text.match(emailRegex);
  return matches ? matches[0] : null;
}

/**
 * Extract phone numbers from text
 */
function extractPhones(text) {
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const matches = text.match(phoneRegex);
  return matches ? matches[0] : null;
}

/**
 * Extract URLs from text
 */
function extractUrls(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

/**
 * Identify section headers in resume
 */
function identifySections(text) {
  const lines = text.split('\n');
  const sections = {};
  
  const sectionKeywords = {
    summary: ['summary', 'profile', 'objective', 'about', 'professional summary', 'career objective'],
    experience: ['experience', 'employment', 'work history', 'professional experience', 'work experience', 'career history'],
    education: ['education', 'academic', 'qualification', 'educational background'],
    skills: ['skills', 'technical skills', 'competencies', 'expertise', 'core competencies', 'technical competencies'],
    projects: ['projects', 'portfolio', 'key projects'],
    certifications: ['certifications', 'certificates', 'licenses', 'professional certifications'],
  };
  
  let currentSection = null;
  let currentContent = [];
  
  lines.forEach((line, index) => {
    const lowerLine = line.toLowerCase().trim();
    
    // Skip empty lines
    if (!lowerLine) {
      if (currentSection && currentContent.length > 0) {
        currentContent.push('');
      }
      return;
    }
    
    // Check if line is a section header (more flexible matching)
    let foundSection = null;
    for (const [section, keywords] of Object.entries(sectionKeywords)) {
      if (keywords.some(keyword => {
        // Exact match or starts with keyword
        return lowerLine === keyword || 
               lowerLine.startsWith(keyword + ':') ||
               lowerLine.startsWith(keyword + ' ') ||
               (lowerLine.length < 30 && lowerLine.includes(keyword));
      })) {
        foundSection = section;
        break;
      }
    }
    
    if (foundSection) {
      // Save previous section
      if (currentSection && currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n').trim();
      }
      // Start new section
      currentSection = foundSection;
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line.trim());
    }
  });
  
  // Save last section
  if (currentSection && currentContent.length > 0) {
    sections[currentSection] = currentContent.join('\n').trim();
  }
  
  return sections;
}

/**
 * Extract skills from text
 */
function extractSkills(text) {
  const commonTechnicalSkills = [
    'javascript', 'python', 'java', 'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin', 'go', 'rust',
    'react', 'angular', 'vue', 'node', 'express', 'django', 'flask', 'spring', 'laravel',
    'html', 'css', 'sass', 'less', 'tailwind', 'bootstrap',
    'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'github', 'gitlab',
    'rest', 'graphql', 'api', 'microservices', 'agile', 'scrum', 'ci/cd',
    'typescript', 'webpack', 'babel', 'jest', 'mocha', 'cypress', 'selenium',
  ];
  
  const lowerText = text.toLowerCase();
  const foundSkills = [];
  
  commonTechnicalSkills.forEach(skill => {
    const regex = new RegExp(`\\b${skill}\\b`, 'i');
    if (regex.test(lowerText)) {
      foundSkills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
    }
  });
  
  return [...new Set(foundSkills)];
}

/**
 * Parse experience section
 */
function parseExperience(experienceText) {
  if (!experienceText) return [];
  
  const experiences = [];
  
  // Split by double newlines or look for patterns that indicate new job entries
  const blocks = experienceText.split(/\n\s*\n/);
  
  blocks.forEach(block => {
    const lines = block.split('\n').filter(l => l.trim());
    if (lines.length < 1) return;
    
    const experience = {
      role: '',
      company: '',
      duration: '',
      startDate: '',
      endDate: '',
      responsibilities: [],
      technologies: [],
    };
    
    // First line is usually the role/title
    experience.role = lines[0].trim();
    
    // Second line is usually company
    if (lines.length > 1) {
      experience.company = lines[1].trim();
    }
    
    // Try to extract duration from any line
    const durationRegex = /(\d{4}|[A-Za-z]+\s+\d{4})\s*[-–—to]+\s*(\d{4}|[A-Za-z]+\s+\d{4}|present|current)/i;
    for (const line of lines) {
      const durationMatch = line.match(durationRegex);
      if (durationMatch) {
        experience.duration = durationMatch[0];
        // Extract years
        const yearMatches = durationMatch[0].match(/\d{4}/g);
        if (yearMatches && yearMatches.length > 0) {
          experience.startDate = yearMatches[0];
          experience.endDate = yearMatches[1] || 'present';
        }
        break;
      }
    }
    
    // Extract responsibilities (lines starting with bullet points or dashes)
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.match(/^[•\-\*\u2022\u2023\u2043]/)) {
        experience.responsibilities.push(trimmed.replace(/^[•\-\*\u2022\u2023\u2043]\s*/, ''));
      }
    });
    
    // Only add if we have at least a role
    if (experience.role) {
      experiences.push(experience);
    }
  });
  
  return experiences;
}

/**
 * Parse education section
 */
function parseEducation(educationText) {
  if (!educationText) return [];
  
  const education = [];
  const blocks = educationText.split(/\n\s*\n/);
  
  blocks.forEach(block => {
    const lines = block.split('\n').filter(l => l.trim());
    if (lines.length < 1) return;
    
    const edu = {
      degree: '',
      institution: '',
      year: '',
      location: '',
      gpa: '',
    };
    
    // First line is usually the degree
    edu.degree = lines[0].trim();
    
    // Second line is usually institution
    if (lines.length > 1) {
      edu.institution = lines[1].trim();
    }
    
    // Try to extract year from any line
    const yearRegex = /(\d{4})\s*[-–—to]*\s*(\d{4})?/g;
    for (const line of lines) {
      const years = line.match(yearRegex);
      if (years && years.length > 0) {
        edu.year = years.join(' - ');
        break;
      }
    }
    
    // Try to extract GPA
    const gpaRegex = /GPA[:\s]*(\d+\.?\d*)/i;
    for (const line of lines) {
      const gpaMatch = line.match(gpaRegex);
      if (gpaMatch) {
        edu.gpa = gpaMatch[1];
        break;
      }
    }
    
    // Only add if we have at least a degree
    if (edu.degree) {
      education.push(edu);
    }
  });
  
  return education;
}

/**
 * Calculate years of experience
 */
function calculateExperienceYears(experiences) {
  if (!experiences || experiences.length === 0) return 0;
  
  let totalMonths = 0;
  const currentYear = new Date().getFullYear();
  
  experiences.forEach(exp => {
    if (exp.startDate) {
      const startYear = parseInt(exp.startDate);
      const endYear = exp.endDate && exp.endDate.match(/\d{4}/) 
        ? parseInt(exp.endDate) 
        : currentYear;
      
      if (!isNaN(startYear) && !isNaN(endYear)) {
        totalMonths += (endYear - startYear) * 12;
      }
    }
  });
  
  return Math.round(totalMonths / 12);
}

/**
 * Determine seniority level based on experience
 */
function determineSeniorityLevel(experienceYears) {
  if (experienceYears === 0) return 'intern';
  if (experienceYears <= 2) return 'junior';
  if (experienceYears <= 5) return 'mid';
  if (experienceYears <= 10) return 'senior';
  return 'lead';
}

/**
 * Main parsing function - orchestrates all extraction
 */
async function parseResume(filePath, fileType) {
  try {
    console.log(`Starting resume parsing: ${filePath}, type: ${fileType}`);
    
    // Step 1: Extract raw text
    const rawText = await extractRawText(filePath, fileType);
    console.log(`Extracted raw text length: ${rawText.length}`);
    
    const cleanedText = cleanText(rawText);
    console.log(`Cleaned text length: ${cleanedText.length}`);
    
    // Step 2: Identify sections
    const sections = identifySections(cleanedText);
    console.log(`Identified sections:`, Object.keys(sections));
    
    // Step 3: Extract basic info
    const basicInfo = {
      email: extractEmails(cleanedText),
      phone: extractPhones(cleanedText),
    };
    
    // Extract URLs and categorize them
    const urls = extractUrls(cleanedText);
    urls.forEach(url => {
      if (url.includes('linkedin.com')) basicInfo.linkedin = url;
      else if (url.includes('github.com')) basicInfo.github = url;
      else if (!basicInfo.portfolio) basicInfo.portfolio = url;
    });
    
    console.log(`Extracted basic info:`, basicInfo);
    
    // Step 4: Extract skills
    const skills = {
      technical: extractSkills(sections.skills || cleanedText),
      tools: [],
      soft: [],
      languages: [],
    };
    
    console.log(`Extracted ${skills.technical.length} technical skills`);
    
    // Step 5: Parse experience
    const experience = parseExperience(sections.experience);
    console.log(`Parsed ${experience.length} experience entries`);
    
    // Step 6: Parse education
    const education = parseEducation(sections.education);
    console.log(`Parsed ${education.length} education entries`);
    
    // Step 7: Generate AI insights
    const experienceYears = calculateExperienceYears(experience);
    const aiInsights = {
      experienceYears,
      seniorityLevel: determineSeniorityLevel(experienceYears),
      primaryRole: experience.length > 0 ? experience[0].role : '',
      keyStrengths: skills.technical.slice(0, 5),
    };
    
    console.log(`AI Insights:`, aiInsights);
    
    const result = {
      rawText: cleanedText.substring(0, 5000), // Limit raw text storage
      basicInfo,
      summary: sections.summary || '',
      skills,
      experience,
      education,
      projects: [],
      certifications: [],
      aiInsights,
      parsingStatus: 'completed',
    };
    
    console.log(`Resume parsing completed successfully`);
    return result;
  } catch (error) {
    console.error(`Resume parsing failed:`, error);
    return {
      parsingStatus: 'failed',
      parsingError: error.message,
    };
  }
}

module.exports = {
  parseResume,
  extractRawText,
  cleanText,
};
