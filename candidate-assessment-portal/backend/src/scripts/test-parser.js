require('dotenv').config();
const path = require('path');
const { parseResume } = require('../modules/resume/parser.service');

/**
 * Test script for resume parser
 * Usage: node src/scripts/test-parser.js <path-to-resume-file>
 */

async function testParser() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node src/scripts/test-parser.js <path-to-resume-file>');
    console.log('Example: node src/scripts/test-parser.js uploads/resumes/sample.pdf');
    process.exit(1);
  }
  
  const filePath = args[0];
  const fileType = path.extname(filePath).slice(1).toLowerCase();
  
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║        RESUME PARSER TEST SCRIPT               ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  
  console.log(`File: ${filePath}`);
  console.log(`Type: ${fileType}\n`);
  
  if (!['pdf', 'doc', 'docx'].includes(fileType)) {
    console.error('✗ Unsupported file type. Only PDF, DOC, DOCX allowed.');
    process.exit(1);
  }
  
  console.log('⟳ Parsing resume...\n');
  
  try {
    const startTime = Date.now();
    const result = await parseResume(filePath, fileType);
    const duration = Date.now() - startTime;
    
    console.log('✓ Parsing completed successfully!\n');
    console.log(`Duration: ${duration}ms\n`);
    
    console.log('═'.repeat(60));
    console.log('PARSED DATA');
    console.log('═'.repeat(60));
    
    // Basic Info
    console.log('\n📋 BASIC INFO:');
    console.log('-'.repeat(60));
    if (result.basicInfo) {
      console.log(`Name:     ${result.basicInfo.name || 'Not found'}`);
      console.log(`Email:    ${result.basicInfo.email || 'Not found'}`);
      console.log(`Phone:    ${result.basicInfo.phone || 'Not found'}`);
      console.log(`Location: ${result.basicInfo.location || 'Not found'}`);
      console.log(`LinkedIn: ${result.basicInfo.linkedin || 'Not found'}`);
      console.log(`GitHub:   ${result.basicInfo.github || 'Not found'}`);
    } else {
      console.log('No basic info extracted');
    }
    
    // Summary
    console.log('\n📝 SUMMARY:');
    console.log('-'.repeat(60));
    if (result.summary) {
      console.log(result.summary.substring(0, 200) + (result.summary.length > 200 ? '...' : ''));
    } else {
      console.log('No summary found');
    }
    
    // Skills
    console.log('\n💻 SKILLS:');
    console.log('-'.repeat(60));
    if (result.skills) {
      console.log(`Technical: ${result.skills.technical?.length || 0} skills`);
      if (result.skills.technical?.length > 0) {
        console.log(`  ${result.skills.technical.slice(0, 10).join(', ')}`);
        if (result.skills.technical.length > 10) {
          console.log(`  ... and ${result.skills.technical.length - 10} more`);
        }
      }
    } else {
      console.log('No skills found');
    }
    
    // Experience
    console.log('\n💼 EXPERIENCE:');
    console.log('-'.repeat(60));
    if (result.experience && result.experience.length > 0) {
      console.log(`Found ${result.experience.length} positions:\n`);
      result.experience.forEach((exp, idx) => {
        console.log(`${idx + 1}. ${exp.role || 'Unknown Role'}`);
        console.log(`   Company: ${exp.company || 'Unknown'}`);
        console.log(`   Duration: ${exp.duration || 'Not specified'}`);
        console.log(`   Responsibilities: ${exp.responsibilities?.length || 0}`);
        console.log('');
      });
    } else {
      console.log('No experience found');
    }
    
    // Education
    console.log('🎓 EDUCATION:');
    console.log('-'.repeat(60));
    if (result.education && result.education.length > 0) {
      console.log(`Found ${result.education.length} entries:\n`);
      result.education.forEach((edu, idx) => {
        console.log(`${idx + 1}. ${edu.degree || 'Unknown Degree'}`);
        console.log(`   Institution: ${edu.institution || 'Unknown'}`);
        console.log(`   Year: ${edu.year || 'Not specified'}`);
        console.log('');
      });
    } else {
      console.log('No education found');
    }
    
    // AI Insights
    console.log('🤖 AI INSIGHTS:');
    console.log('-'.repeat(60));
    if (result.aiInsights) {
      console.log(`Experience Years: ${result.aiInsights.experienceYears || 0}`);
      console.log(`Seniority Level:  ${result.aiInsights.seniorityLevel || 'Unknown'}`);
      console.log(`Primary Role:     ${result.aiInsights.primaryRole || 'Unknown'}`);
      console.log(`Key Strengths:    ${result.aiInsights.keyStrengths?.join(', ') || 'None'}`);
    } else {
      console.log('No AI insights generated');
    }
    
    // Raw Text Preview
    console.log('\n📄 RAW TEXT PREVIEW:');
    console.log('-'.repeat(60));
    if (result.rawText) {
      console.log(result.rawText.substring(0, 300) + '...');
      console.log(`\nTotal characters: ${result.rawText.length}`);
    } else {
      console.log('No raw text extracted');
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('TEST COMPLETE');
    console.log('═'.repeat(60));
    
    // Quality Score
    let qualityScore = 0;
    if (result.basicInfo?.email) qualityScore += 20;
    if (result.skills?.technical?.length > 0) qualityScore += 20;
    if (result.experience?.length > 0) qualityScore += 30;
    if (result.education?.length > 0) qualityScore += 15;
    if (result.summary) qualityScore += 15;
    
    console.log(`\nQuality Score: ${qualityScore}/100`);
    
    if (qualityScore >= 80) {
      console.log('✓ Excellent parsing quality');
    } else if (qualityScore >= 60) {
      console.log('⚠ Good parsing quality, some data missing');
    } else if (qualityScore >= 40) {
      console.log('⚠ Moderate parsing quality, significant data missing');
    } else {
      console.log('✗ Poor parsing quality, most data missing');
    }
    
    console.log('\nRecommendations:');
    if (!result.basicInfo?.email) console.log('- Email not found - check resume format');
    if (!result.skills?.technical?.length) console.log('- No skills found - improve skill detection');
    if (!result.experience?.length) console.log('- No experience found - check section headers');
    if (!result.education?.length) console.log('- No education found - check section headers');
    if (!result.summary) console.log('- No summary found - check for summary section');
    
    console.log('');
    
  } catch (error) {
    console.error('\n✗ Parsing failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

testParser();
