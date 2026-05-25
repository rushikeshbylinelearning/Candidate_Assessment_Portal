import React, { useState } from 'react';
import {
  GraduationCap, Award, ExternalLink,
  FileText, Loader, CheckCircle, Sparkles
} from 'lucide-react';
import './StructuredResume.css';

const NAV_ITEMS = [
  { key: 'summary', label: 'Summary' },
  { key: 'experience', label: 'Experience' },
  { key: 'education', label: 'Education' },
  { key: 'skills', label: 'Skills' },
  { key: 'projects', label: 'Projects' },
  { key: 'certifications', label: 'Certifications' },
];

/**
 * Badge to indicate AI-extracted data
 */
function AutoFilledBadge() {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '4px',
        background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
        color: '#fff',
        fontSize: '10px',
        fontWeight: 600,
        letterSpacing: '0.3px',
        textTransform: 'uppercase',
        marginLeft: '8px',
      }}
    >
      <Sparkles size={10} />
      Auto-filled from Resume
    </span>
  );
}

/**
 * Determine skill tag style based on role match
 * @param {string} skillName
 * @param {string[]} requiredSkills - role required skill names
 * @param {string[]} niceToHaveSkills - role nice-to-have skill names
 */
function getSkillStyle(skillName, requiredSkills = [], niceToHaveSkills = []) {
  const lower = skillName.toLowerCase();
  const isRequired = requiredSkills.some(s => s.toLowerCase() === lower || lower.includes(s.toLowerCase()) || s.toLowerCase().includes(lower));
  const isNice = niceToHaveSkills.some(s => s.toLowerCase() === lower || lower.includes(s.toLowerCase()) || s.toLowerCase().includes(lower));

  if (isRequired) {
    return { background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' };
  }
  if (isNice) {
    return { background: '#FEF9C3', color: '#92400E', border: '1px solid #FDE68A' };
  }
  return { background: '#F3F4F6', color: '#374151', border: '1px solid transparent' };
}

function EmptySection({ section, onViewOriginal }) {
  return (
    <div className="sr-empty-section">
      <p className="sr-empty-section-text">
        Could not extract {section} from resume. View original resume for details.
      </p>
      {onViewOriginal && (
        <button className="sr-view-original" onClick={onViewOriginal}>
          <ExternalLink size={12} />
          View Original
        </button>
      )}
    </div>
  );
}

export default function StructuredResume({ resumeData, candidate, roleData, onViewOriginal, showOriginal, onHideOriginal, hasResume }) {
  const [activeTab, setActiveTab] = useState('summary');

  // Derive role skill lists for colour-coding
  const requiredSkillNames = (roleData?.requiredSkills || [])
    .filter(s => s.level === 'required')
    .map(s => s.name);
  const niceToHaveSkillNames = (roleData?.requiredSkills || [])
    .filter(s => s.level === 'nice-to-have')
    .map(s => s.name);

  // No resume uploaded
  if (!resumeData && !hasResume) {
    return (
      <div className="sr-layout">
        <nav className="sr-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              className={`sr-nav-item${activeTab === item.key ? ' active' : ''}`}
              onClick={() => setActiveTab(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sr-content-area">
          <div className="sr-empty">
            <FileText size={36} color="#D1D5DB" />
            <p className="sr-empty-title">No resume uploaded</p>
            <p className="sr-empty-sub">Upload a resume to see structured data.</p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state — candidate has resumeUrl but resumeData not yet fetched
  if (!resumeData && hasResume) {
    return (
      <div className="sr-layout">
        <nav className="sr-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              className={`sr-nav-item${activeTab === item.key ? ' active' : ''}`}
              onClick={() => setActiveTab(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sr-content-area">
          <div className="sr-loading">
            <Loader size={24} className="sr-spinner" />
            <p className="sr-loading-title">Loading resume...</p>
            <p className="sr-loading-sub">Please wait while we fetch the resume data.</p>
          </div>
        </div>
      </div>
    );
  }

  if (resumeData.parsingStatus === 'processing') {
    return (
      <div className="sr-layout">
        <nav className="sr-nav">
          {NAV_ITEMS.map(item => (
            <button key={item.key} className="sr-nav-item">{item.label}</button>
          ))}
        </nav>
        <div className="sr-content-area">
          <div className="sr-loading">
            <Loader size={28} className="sr-spinner" />
            <p className="sr-loading-title">Parsing resume…</p>
            <p className="sr-loading-sub">Gemini AI is extracting structured data from your resume. This takes a few seconds.</p>
          </div>
        </div>
      </div>
    );
  }

  if (resumeData.parsingStatus === 'failed') {
    return (
      <div className="sr-layout">
        <nav className="sr-nav">
          {NAV_ITEMS.map(item => (
            <button key={item.key} className="sr-nav-item">{item.label}</button>
          ))}
        </nav>
        <div className="sr-content-area">
          <div className="sr-error">
            <FileText size={36} color="#D1D5DB" />
            <p className="sr-error-title">Failed to Parse Resume</p>
            <p className="sr-error-sub">{resumeData.parsingError || 'Unable to extract structured data'}</p>
            <div className="sr-parse-fail-banner">
              Resume could not be read. Please enter candidate details manually using the fields below, or upload a different file format.
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              {onViewOriginal && (
                <button onClick={onViewOriginal} className="sr-view-original">
                  View Original Resume
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normalise data — support both old model format and new Gemini format
  const summary = resumeData.summary || null;

  // Experience: support both {role, company} and {title, company} formats
  const experience = (resumeData.experience || []).map(exp => ({
    company: exp.company || '',
    title: exp.role || exp.title || '',
    startDate: exp.startDate || '',
    endDate: exp.endDate || '',
    duration: exp.duration || '',  // AI-calculated duration
    durationMonths: exp.durationMonths || 0,
    description: exp.responsibilities
      ? (Array.isArray(exp.responsibilities) ? exp.responsibilities.join(' ') : exp.responsibilities)
      : (exp.description || null),
    technologies: exp.technologies || [],
  }));

  // Education
  const education = (resumeData.education || []).map(edu => ({
    institution: edu.institution || '',
    degree: edu.degree || '',
    field: edu.field || edu.major || '',
    year: edu.year || '',
    gpa: edu.gpa || null,
  }));

  // Skills — flat array from technical, or combined
  let allSkills = [];
  if (resumeData.skills) {
    if (Array.isArray(resumeData.skills)) {
      allSkills = resumeData.skills;
    } else {
      allSkills = [
        ...(resumeData.skills.technical || []),
        ...(resumeData.skills.tools || []),
        ...(resumeData.skills.languages || []),
        ...(resumeData.skills.soft || []),
      ];
    }
  }

  // Projects
  const projects = (resumeData.projects || []).map(proj => ({
    name: proj.name || '',
    description: proj.description || null,
    technologies: proj.technologies || [],
    link: proj.link || null,
  }));

  // Certifications — support both string array and object array
  const certifications = (resumeData.certifications || []).map(cert =>
    typeof cert === 'string' ? { name: cert, issuer: null, date: null } : cert
  );

  const aiInsights = resumeData.aiInsights || null;

  return (
    <div className="sr-layout">
      {/* Vertical Nav */}
      <nav className="sr-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.key}
            className={`sr-nav-item${activeTab === item.key ? ' active' : ''}`}
            onClick={() => setActiveTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Content Area */}
      <div className="sr-content-area">

        {/* SUMMARY */}
        {activeTab === 'summary' && (
          <div className="sr-section">
            <p className="sr-section-heading">
              Professional Summary
              {summary && <AutoFilledBadge />}
            </p>
            {summary ? (
              <p className="sr-summary-text">{summary}</p>
            ) : (
              <p className="sr-muted-text">No summary found in resume.</p>
            )}

            {aiInsights && (
              <div className="sr-insights-row">
                {aiInsights.experienceYears > 0 && (
                  <div className="sr-insight-pill">
                    <span className="sr-insight-label">Experience</span>
                    <span className="sr-insight-val">{aiInsights.experienceYears}y</span>
                  </div>
                )}
                {aiInsights.seniorityLevel && (
                  <div className="sr-insight-pill">
                    <span className="sr-insight-label">Level</span>
                    <span className="sr-insight-val">{aiInsights.seniorityLevel}</span>
                  </div>
                )}
                {aiInsights.primaryRole && (
                  <div className="sr-insight-pill">
                    <span className="sr-insight-label">Role</span>
                    <span className="sr-insight-val">{aiInsights.primaryRole}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* EXPERIENCE */}
        {activeTab === 'experience' && (
          <div className="sr-section">
            <p className="sr-section-heading">
              Experience {experience.length > 0 ? `(${experience.length})` : ''}
              {experience.length > 0 && <AutoFilledBadge />}
            </p>
            {experience.length > 0 ? (
              <div className="sr-exp-list">
                {experience.map((exp, idx) => (
                  <div key={idx} className="sr-exp-item">
                    <div className="sr-exp-dot" />
                    {idx < experience.length - 1 && <div className="sr-exp-line" />}
                    <div className="sr-exp-body">
                      <div className="sr-exp-header">
                        <div>
                          <p className="sr-exp-company">{exp.company}</p>
                          <p className="sr-exp-role">{exp.title}</p>
                        </div>
                        <div className="sr-exp-date-block">
                          <span className="sr-exp-dates">
                            {[exp.startDate, exp.endDate].filter(Boolean).join(' – ')}
                          </span>
                          {exp.duration && (
                            <span className="sr-exp-duration-calc">
                              ({exp.duration})
                            </span>
                          )}
                        </div>
                      </div>
                      {exp.description && (
                        <p className="sr-exp-description">{exp.description}</p>
                      )}
                      {exp.technologies && exp.technologies.length > 0 && (
                        <div className="sr-tech-tags">
                          {exp.technologies.map((t, i) => <span key={i} className="sr-tech-tag">{t}</span>)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptySection section="experience" onViewOriginal={onViewOriginal} />
            )}
          </div>
        )}

        {/* EDUCATION */}
        {activeTab === 'education' && (
          <div className="sr-section">
            <p className="sr-section-heading">
              Education
              {education.length > 0 && <AutoFilledBadge />}
            </p>
            {education.length > 0 ? (
              <div className="sr-edu-list">
                {education.map((edu, idx) => (
                  <div key={idx} className="sr-edu-item">
                    <div className="sr-edu-icon">
                      <GraduationCap size={16} />
                    </div>
                    <div>
                      <p className="sr-edu-inst">{edu.institution}</p>
                      <p className="sr-edu-degree">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</p>
                      <div className="sr-edu-meta">
                        {edu.year && <span>{edu.year}</span>}
                        {edu.gpa && <span>• GPA: {edu.gpa}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptySection section="education" onViewOriginal={onViewOriginal} />
            )}
          </div>
        )}

        {/* SKILLS */}
        {activeTab === 'skills' && (
          <div className="sr-section">
            <p className="sr-section-heading">
              Skills
              {allSkills.length > 0 && <AutoFilledBadge />}
            </p>
            {allSkills.length > 0 ? (
              <>
                {requiredSkillNames.length > 0 || niceToHaveSkillNames.length > 0 ? (
                  <div className="sr-skill-legend">
                    <span className="sr-skill-legend-item" style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>● Required match</span>
                    <span className="sr-skill-legend-item" style={{ background: '#FEF9C3', color: '#92400E', border: '1px solid #FDE68A' }}>● Nice-to-have</span>
                    <span className="sr-skill-legend-item" style={{ background: '#F3F4F6', color: '#374151' }}>● Other</span>
                  </div>
                ) : null}
                <div className="sr-skill-tags">
                  {allSkills.map((skill, i) => (
                    <span
                      key={i}
                      className="sr-skill-tag"
                      style={getSkillStyle(skill, requiredSkillNames, niceToHaveSkillNames)}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <EmptySection section="skills" onViewOriginal={onViewOriginal} />
            )}
          </div>
        )}

        {/* PROJECTS */}
        {activeTab === 'projects' && (
          <div className="sr-section">
            <p className="sr-section-heading">
              Projects
              {projects.length > 0 && <AutoFilledBadge />}
            </p>
            {projects.length > 0 ? (
              <div className="sr-projects-list">
                {projects.map((proj, idx) => (
                  <div key={idx} className="sr-project-card">
                    <div className="sr-project-header">
                      <p className="sr-project-name">{proj.name}</p>
                      {proj.link && (
                        <a href={proj.link} target="_blank" rel="noreferrer" className="sr-project-link">
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                    {proj.description && <p className="sr-project-desc">{proj.description}</p>}
                    {proj.technologies && proj.technologies.length > 0 && (
                      <div className="sr-tech-tags">
                        {proj.technologies.map((t, i) => <span key={i} className="sr-tech-tag">{t}</span>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptySection section="projects" onViewOriginal={onViewOriginal} />
            )}
          </div>
        )}

        {/* CERTIFICATIONS */}
        {activeTab === 'certifications' && (
          <div className="sr-section">
            <p className="sr-section-heading">
              Certifications
              {certifications.length > 0 && <AutoFilledBadge />}
            </p>
            {certifications.length > 0 ? (
              <div className="sr-cert-list">
                {certifications.map((cert, idx) => (
                  <div key={idx} className="sr-cert-item">
                    <div className="sr-cert-icon">
                      <CheckCircle size={16} color="#059669" />
                    </div>
                    <div>
                      <p className="sr-cert-name">{cert.name}</p>
                      {cert.issuer && <p className="sr-cert-issuer">{cert.issuer}</p>}
                      {cert.date && <span className="sr-cert-date">{cert.date}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptySection section="certifications" onViewOriginal={onViewOriginal} />
            )}
          </div>
        )}

      </div>
    </div>
  );
}
