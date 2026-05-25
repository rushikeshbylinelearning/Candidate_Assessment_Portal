import React from 'react';
import { Target, Info, ExternalLink, FileText, Loader } from 'lucide-react';
import './RoleMatchCard.css';

const MATCH_CONFIG = {
  LOW: {
    ring: '#EF4444',
    label: '#EF4444',
    bg: '#FEF2F2',
    text: 'LOW MATCH',
    bannerBg: '#FEF2F2',
    bannerBorder: '#EF4444',
    bannerColor: '#991B1B',
    bannerText: 'Significant skill gaps identified. Additional training or experience may be required.',
  },
  MEDIUM: {
    ring: '#F59E0B',
    label: '#92400E',
    bg: '#FFFBEB',
    text: 'MODERATE MATCH',
    bannerBg: '#FEF2F2',
    bannerBorder: '#EF4444',
    bannerColor: '#991B1B',
    bannerText: 'Significant skill gaps identified. Additional training or experience may be required.',
  },
  HIGH: {
    ring: '#10B981',
    label: '#065F46',
    bg: '#ECFDF5',
    text: 'STRONG MATCH',
    bannerBg: '#ECFDF5',
    bannerBorder: '#10B981',
    bannerColor: '#065F46',
    bannerText: 'Strong skill match. Candidate meets most requirements.',
  },
  EXCELLENT: {
    ring: '#8B5CF6',
    label: '#5B21B6',
    bg: '#F5F3FF',
    text: 'EXCELLENT MATCH',
    bannerBg: '#F5F3FF',
    bannerBorder: '#8B5CF6',
    bannerColor: '#5B21B6',
    bannerText: 'Excellent match. Candidate meets all role requirements.',
  },
};

export default function RoleMatchCard({ matchData, isAnalysing }) {
  // Analysing state — resume just uploaded, skill match computing
  if (isAnalysing) {
    return (
      <div className="rmc-card rmc-empty">
        <Loader size={28} className="rmc-spinner" />
        <p className="rmc-empty-title">Analysing resume...</p>
        <p className="rmc-empty-sub">Computing skill match against role requirements.</p>
      </div>
    );
  }

  // No resume uploaded yet
  if (!matchData) {
    return (
      <div className="rmc-card rmc-empty">
        <FileText size={36} color="#D1D5DB" />
        <p className="rmc-empty-title">No resume uploaded yet</p>
        <p className="rmc-empty-sub">Upload a resume to see role match analysis.</p>
      </div>
    );
  }

  const percentage = matchData.matchPercentage ?? 0;
  const matchLabel = matchData.matchLabel || (
    percentage >= 90 ? 'EXCELLENT' :
    percentage >= 70 ? 'HIGH' :
    percentage >= 40 ? 'MEDIUM' : 'LOW'
  );

  const config = MATCH_CONFIG[matchLabel] || MATCH_CONFIG.LOW;

  const matchedSkills = matchData.matchedSkills || [];
  const missingSkills = matchData.missingSkills || [];
  const partialSkills = matchData.partialSkills || [];

  // SVG circle progress
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="rmc-card">
      {/* Header */}
      <div className="rmc-header">
        <div className="rmc-title-row">
          <div className="rmc-icon">
            <Target size={18} />
          </div>
          <h3 className="rmc-title">Role Match Analysis</h3>
        </div>
      </div>

      {/* Body: circle + insights */}
      <div className="rmc-body">
        {/* Circular Progress */}
        <div className="rmc-circle-container">
          <svg width="120" height="120" className="rmc-svg">
            {/* Background ring */}
            <circle cx="60" cy="60" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="8" />
            {/* Progress ring */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={config.ring}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 60 60)"
              className="rmc-progress-ring"
            />
          </svg>
          <div className="rmc-circle-text" style={{ background: config.bg, borderRadius: '50%' }}>
            <span className="rmc-percent" style={{ color: config.ring }}>{percentage}%</span>
            <span className="rmc-good-label" style={{ color: config.label }}>{config.text}</span>
          </div>
        </div>

        {/* Insights */}
        <div className="rmc-insights">
          <p className="rmc-insights-title">Matching Insights</p>
          <div className="rmc-stats-row">
            <div className="rmc-stat-col">
              <div className="rmc-stat-label">
                <span className="rmc-dot green" />
                Matched
              </div>
              <span className="rmc-stat-num">{matchedSkills.length}</span>
            </div>
            <div className="rmc-stat-col">
              <div className="rmc-stat-label">
                <span className="rmc-dot red" />
                Missing
              </div>
              <span className="rmc-stat-num">{missingSkills.length}</span>
            </div>
            <div className="rmc-stat-col">
              <div className="rmc-stat-label">
                <span className="rmc-dot orange" />
                Partial
              </div>
              <span className="rmc-stat-num">{partialSkills.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Missing Skills Tags */}
      {missingSkills.length > 0 && (
        <div className="rmc-missing-row">
          <p className="rmc-missing-label">Missing Skills ({missingSkills.length})</p>
          <div className="rmc-missing-tags">
            {missingSkills.map((skill, idx) => (
              <span key={idx} className="rmc-missing-tag">{skill}</span>
            ))}
          </div>
        </div>
      )}

      {/* Matched Skills Tags */}
      {matchedSkills.length > 0 && (
        <div className="rmc-matched-row">
          <p className="rmc-matched-label">Matched Skills ({matchedSkills.length})</p>
          <div className="rmc-matched-tags">
            {matchedSkills.map((skill, idx) => (
              <span key={idx} className="rmc-matched-tag">{skill}</span>
            ))}
          </div>
        </div>
      )}

      {/* Insight Banner */}
      <div
        className="rmc-info-banner"
        style={{
          background: config.bannerBg,
          borderLeft: `4px solid ${config.bannerBorder}`,
          color: config.bannerColor,
        }}
      >
        <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>{config.bannerText}</span>
      </div>
    </div>
  );
}
