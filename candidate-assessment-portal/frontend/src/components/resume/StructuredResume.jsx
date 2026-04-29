import React, { useState } from 'react';
import {
  Mail, Phone, MapPin, Linkedin, Github, Globe, Briefcase,
  GraduationCap, Code, Award, FolderGit2, Calendar, ExternalLink,
  FileText, Loader
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

export default function StructuredResume({ resumeData, candidate, onViewOriginal, showOriginal, onHideOriginal, hasResume }) {
  const [activeTab, setActiveTab] = useState('summary');

  // No resume uploaded — candidate has no resumeUrl
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
            <p className="sr-loading-title">Processing Resume...</p>
            <p className="sr-loading-sub">Extracting and structuring data.</p>
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
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              {onViewOriginal && (
                <button onClick={onViewOriginal} className="sr-view-original">
                  View Original Resume
                </button>
              )}
              <button 
                onClick={() => window.location.reload()} 
                className="sr-view-original"
                style={{ background: '#EFF6FF', borderColor: '#DBEAFE', color: '#3B82F6' }}
              >
                Retry Parsing
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { basicInfo, summary, skills, experience, education, projects, certifications, aiInsights } = resumeData;

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
            <p className="sr-section-heading">Professional Summary</p>
            {summary ? (
              <p className="sr-summary-text">{summary}</p>
            ) : (
              <p className="sr-empty-text">No summary available.</p>
            )}

            {/* AI insights compact row */}
            {aiInsights && (
              <div className="sr-insights-row">
                {aiInsights.experienceYears && (
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
              </div>
            )}
          </div>
        )}

        {/* EXPERIENCE */}
        {activeTab === 'experience' && (
          <div className="sr-section">
            <p className="sr-section-heading">
              Experience {experience?.length ? `(${experience.length})` : ''}
            </p>
            {experience && experience.length > 0 ? (
              <div className="sr-exp-list">
                {experience.map((exp, idx) => (
                  <div key={idx} className="sr-exp-item">
                    <div className="sr-exp-dot" />
                    {idx < experience.length - 1 && <div className="sr-exp-line" />}
                    <div className="sr-exp-body">
                      <div className="sr-exp-header">
                        <div>
                          <p className="sr-exp-role">{exp.role}</p>
                          <p className="sr-exp-company">{exp.company}</p>
                        </div>
                        <span className="sr-exp-duration">{exp.duration}</span>
                      </div>
                      {exp.responsibilities && exp.responsibilities.length > 0 && (
                        <ul className="sr-exp-bullets">
                          {exp.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
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
              <p className="sr-empty-text">No experience data available.</p>
            )}
          </div>
        )}

        {/* EDUCATION */}
        {activeTab === 'education' && (
          <div className="sr-section">
            <p className="sr-section-heading">Education</p>
            {education && education.length > 0 ? (
              <div className="sr-edu-list">
                {education.map((edu, idx) => (
                  <div key={idx} className="sr-edu-item">
                    <div className="sr-edu-icon">
                      <GraduationCap size={16} />
                    </div>
                    <div>
                      <p className="sr-edu-degree">{edu.degree}</p>
                      <p className="sr-edu-inst">{edu.institution}</p>
                      <div className="sr-edu-meta">
                        {edu.year && <span>{edu.year}</span>}
                        {edu.location && <span>• {edu.location}</span>}
                        {edu.gpa && <span>• GPA: {edu.gpa}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="sr-empty-text">No education data available.</p>
            )}
          </div>
        )}

        {/* SKILLS */}
        {activeTab === 'skills' && (
          <div className="sr-section">
            <p className="sr-section-heading">Skills</p>
            {skills ? (
              <>
                {skills.technical?.length > 0 && (
                  <div className="sr-skill-group">
                    <p className="sr-skill-group-label">Technical Skills</p>
                    <div className="sr-skill-tags">
                      {skills.technical.map((s, i) => <span key={i} className="sr-skill-tag">{s}</span>)}
                    </div>
                  </div>
                )}
                {skills.tools?.length > 0 && (
                  <div className="sr-skill-group">
                    <p className="sr-skill-group-label">Tools & Technologies</p>
                    <div className="sr-skill-tags">
                      {skills.tools.map((s, i) => <span key={i} className="sr-skill-tag">{s}</span>)}
                    </div>
                  </div>
                )}
                {skills.languages?.length > 0 && (
                  <div className="sr-skill-group">
                    <p className="sr-skill-group-label">Languages</p>
                    <div className="sr-skill-tags">
                      {skills.languages.map((s, i) => <span key={i} className="sr-skill-tag">{s}</span>)}
                    </div>
                  </div>
                )}
                {skills.soft?.length > 0 && (
                  <div className="sr-skill-group">
                    <p className="sr-skill-group-label">Soft Skills</p>
                    <div className="sr-skill-tags">
                      {skills.soft.map((s, i) => <span key={i} className="sr-skill-tag">{s}</span>)}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="sr-empty-text">No skills data available.</p>
            )}
          </div>
        )}

        {/* PROJECTS */}
        {activeTab === 'projects' && (
          <div className="sr-section">
            <p className="sr-section-heading">Projects</p>
            {projects && projects.length > 0 ? (
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
                    {proj.technologies?.length > 0 && (
                      <div className="sr-tech-tags">
                        {proj.technologies.map((t, i) => <span key={i} className="sr-tech-tag">{t}</span>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="sr-empty-text">No projects available.</p>
            )}
          </div>
        )}

        {/* CERTIFICATIONS */}
        {activeTab === 'certifications' && (
          <div className="sr-section">
            <p className="sr-section-heading">Certifications</p>
            {certifications && certifications.length > 0 ? (
              <div className="sr-cert-list">
                {certifications.map((cert, idx) => (
                  <div key={idx} className="sr-cert-item">
                    <div className="sr-cert-icon">
                      <Award size={14} />
                    </div>
                    <div>
                      <p className="sr-cert-name">{cert.name}</p>
                      <p className="sr-cert-issuer">{cert.issuer}</p>
                      {cert.date && <span className="sr-cert-date">{cert.date}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="sr-empty-text">No certifications available.</p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}