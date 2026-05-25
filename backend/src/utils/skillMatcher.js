/**
 * Skill Matching Engine
 * Compares candidate skills against role required skills with fuzzy matching and alias support.
 */

// Common skill aliases — each group maps to the same concept
const SKILL_ALIASES = [
  ['js', 'javascript'],
  ['node', 'node.js', 'nodejs'],
  ['mongo', 'mongodb'],
  ['postgres', 'postgresql'],
  ['k8s', 'kubernetes'],
  ['tf', 'tensorflow'],
  ['react', 'reactjs', 'react.js'],
  ['vue', 'vuejs', 'vue.js'],
  ['angular', 'angularjs', 'angular.js'],
  ['ts', 'typescript'],
  ['py', 'python'],
  ['rb', 'ruby'],
  ['go', 'golang'],
  ['c#', 'csharp', 'dotnet', '.net'],
  ['aws', 'amazon web services'],
  ['gcp', 'google cloud', 'google cloud platform'],
  ['azure', 'microsoft azure'],
  ['docker', 'containerization'],
  ['ci/cd', 'cicd', 'continuous integration'],
  ['rest', 'restful', 'rest api'],
  ['graphql', 'graph ql'],
  ['sql', 'structured query language'],
  ['nosql', 'no-sql'],
  ['redis', 'redis cache'],
  ['elastic', 'elasticsearch'],
  ['kafka', 'apache kafka'],
  ['git', 'github', 'gitlab', 'version control'],
  ['html', 'html5'],
  ['css', 'css3'],
  ['sass', 'scss'],
  ['tailwind', 'tailwindcss'],
  ['bootstrap', 'bootstrap css'],
  ['jest', 'jest testing'],
  ['cypress', 'cypress testing'],
  ['selenium', 'selenium webdriver'],
  ['agile', 'scrum', 'kanban'],
  ['ml', 'machine learning'],
  ['ai', 'artificial intelligence'],
  ['nlp', 'natural language processing'],
  ['cv', 'computer vision'],
  ['llm', 'large language model'],
];

/**
 * Normalize a skill string: lowercase, trim, remove special chars except . and #
 */
function normalizeSkill(skill) {
  return skill
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9.#/\s-]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Get the canonical alias group for a skill (returns the group array or null)
 */
function getAliasGroup(normalizedSkill) {
  return SKILL_ALIASES.find(group =>
    group.some(alias => alias === normalizedSkill)
  ) || null;
}

/**
 * Check if two normalized skills match (exact, contains, or alias)
 */
function skillsMatch(candidateSkill, roleSkill) {
  const cs = normalizeSkill(candidateSkill);
  const rs = normalizeSkill(roleSkill);

  // Exact match
  if (cs === rs) return true;

  // Contains match (one contains the other)
  if (cs.includes(rs) || rs.includes(cs)) return true;

  // Alias match
  const csGroup = getAliasGroup(cs);
  const rsGroup = getAliasGroup(rs);

  if (csGroup && rsGroup) {
    // Both belong to alias groups — check if they share any alias
    return csGroup.some(a => rsGroup.includes(a));
  }

  if (csGroup && csGroup.includes(rs)) return true;
  if (rsGroup && rsGroup.includes(cs)) return true;

  return false;
}

/**
 * Calculate skill match between candidate skills and role required skills.
 *
 * @param {string[]} candidateSkills - flat array of skill strings from parsed resume
 * @param {Array<{name: string, level: 'required'|'nice-to-have'}>} roleSkills - role's required skills
 * @returns {{
 *   matchedSkills: string[],
 *   missingSkills: string[],
 *   partialSkills: string[],
 *   matchPercentage: number,
 *   matchLabel: 'LOW'|'MEDIUM'|'HIGH'|'EXCELLENT'
 * }}
 */
function calculateSkillMatch(candidateSkills, roleSkills) {
  if (!Array.isArray(candidateSkills)) candidateSkills = [];
  if (!Array.isArray(roleSkills)) roleSkills = [];

  const requiredSkills = roleSkills.filter(s => s.level === 'required');
  const niceToHaveSkills = roleSkills.filter(s => s.level === 'nice-to-have');

  const matchedSkills = [];
  const missingSkills = [];
  const partialSkills = [];

  // Check required skills
  for (const roleSkill of requiredSkills) {
    const matched = candidateSkills.some(cs => skillsMatch(cs, roleSkill.name));
    if (matched) {
      matchedSkills.push(roleSkill.name);
    } else {
      missingSkills.push(roleSkill.name);
    }
  }

  // Check nice-to-have skills (missing ones go to partialSkills)
  for (const roleSkill of niceToHaveSkills) {
    const matched = candidateSkills.some(cs => skillsMatch(cs, roleSkill.name));
    if (matched) {
      matchedSkills.push(roleSkill.name);
    } else {
      partialSkills.push(roleSkill.name);
    }
  }

  // Match percentage is based on required skills only
  const matchPercentage = requiredSkills.length > 0
    ? Math.round((matchedSkills.filter(s => requiredSkills.some(rs => rs.name === s)).length / requiredSkills.length) * 100)
    : (candidateSkills.length > 0 ? 100 : 0);

  let matchLabel;
  if (matchPercentage >= 90) matchLabel = 'EXCELLENT';
  else if (matchPercentage >= 70) matchLabel = 'HIGH';
  else if (matchPercentage >= 40) matchLabel = 'MEDIUM';
  else matchLabel = 'LOW';

  return {
    matchedSkills,
    missingSkills,
    partialSkills,
    matchPercentage,
    matchLabel,
  };
}

module.exports = { calculateSkillMatch, normalizeSkill, skillsMatch };
