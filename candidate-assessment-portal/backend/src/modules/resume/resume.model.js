const mongoose = require('mongoose');

const resumeDataSchema = new mongoose.Schema({
  candidateId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Candidate', 
    required: true,
    unique: true,
    index: true
  },
  
  // File metadata
  fileUrl: { type: String, required: true },
  fileType: { type: String, enum: ['pdf', 'doc', 'docx'], required: true },
  uploadedAt: { type: Date, default: Date.now },
  
  // Parsing status
  parsingStatus: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed'], 
    default: 'pending' 
  },
  parsingError: { type: String },
  
  // Basic Info
  basicInfo: {
    name: String,
    email: String,
    phone: String,
    location: String,
    linkedin: String,
    github: String,
    portfolio: String,
  },
  
  // Professional Summary
  summary: { type: String },
  
  // Skills
  skills: {
    technical: [String],
    tools: [String],
    soft: [String],
    languages: [String],
  },
  
  // Experience
  experience: [{
    company: String,
    role: String,
    duration: String,
    startDate: String,
    endDate: String,
    location: String,
    responsibilities: [String],
    achievements: [String],
    technologies: [String],
  }],
  
  // Education
  education: [{
    degree: String,
    institution: String,
    year: String,
    startYear: String,
    endYear: String,
    location: String,
    gpa: String,
    major: String,
  }],
  
  // Projects
  projects: [{
    name: String,
    description: String,
    technologies: [String],
    link: String,
    duration: String,
  }],
  
  // Certifications
  certifications: [{
    name: String,
    issuer: String,
    date: String,
    expiryDate: String,
    credentialId: String,
  }],
  
  // AI-generated insights
  aiInsights: {
    generatedSummary: String,
    experienceYears: Number,
    seniorityLevel: { type: String, enum: ['intern', 'junior', 'mid', 'senior', 'lead', 'executive'] },
    primaryRole: String,
    keyStrengths: [String],
    industryExperience: [String],
  },
  
  // Raw extracted text (for reference)
  rawText: { type: String },
  
}, { timestamps: true });

module.exports = mongoose.model('ResumeData', resumeDataSchema);
