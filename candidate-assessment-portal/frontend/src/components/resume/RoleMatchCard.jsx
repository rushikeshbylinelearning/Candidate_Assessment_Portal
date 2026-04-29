import React from 'react';
import { Target, Info, ExternalLink, FileText } from 'lucide-react';
import './RoleMatchCard.css';

export default function RoleMatchCard({ matchData }) {
  // If no matchData, show empty state
  if (!matchData) {
    return (
      <div className="rmc-card rmc-empty">
        <FileText size={36} color="#D1D5DB" />
        <p className="rmc-empty-title">No resume uploaded yet</p>
        <p className="rmc-empty-sub">Upload a resume to see role match analysis.</p>
      </div>
    );
  }

  const percentage = matchData?.matchPercentage ?? 0;
  const matchedSkills = matchData?.matchedSkills ?? [];
  const missingSkills = matchData?.missingSkills || [];
  const partialMatch = matchData?.partialMatch ?? [];

  const matchedCount = matchedSkills.length;
  const missingCount = missingSkills.length;
  const partialCount = partialMatch.length;

  const getLabel = (pct) => {
    if (pct >= 80) return 'EXCELLENT MATCH';
    if (pct >= 60) return 'GOOD MATCH';
    if (pct >= 40) return 'MODERATE MATCH';
    return 'LOW MATCH';
  };

  const getInsightText = (pct) => {
    if (pct >= 80) return 'Candidate has excellent match for this role.';
    if (pct >= 60) return 'Candidate has good match for this role.';
    return 'Significant skill gaps identified for this role.';
  };

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
        <button className="rmc-view-btn">
          View Details
          <ExternalLink size={12} />
        </button>
      </div>

      {/* Body: circle + insights */}
      <div className="rmc-body">
        {/* Circular Progress */}
        <div className="rmc-circle-container">
          <svg width="120" height="120" className="rmc-svg">
            {/* Background ring */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="8"
            />
            {/* Progress ring */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 60 60)"
              className="rmc-progress-ring"
            />
          </svg>
          <div className="rmc-circle-text">
            <span className="rmc-percent">{percentage}%</span>
            <span className="rmc-good-label">{getLabel(percentage)}</span>
          </div>
        </div>

        {/* Insights */}
        <div className="rmc-insights">
          <p className="rmc-insights-title">Matching Insights</p>
          <p className="rmc-insights-sub">{getInsightText(percentage)}</p>
          <div className="rmc-stats-row">
            <div className="rmc-stat-col">
              <div className="rmc-stat-label">
                <span className="rmc-dot green" />
                Matched Skills
              </div>
              <span className="rmc-stat-num">{matchedCount}</span>
            </div>
            <div className="rmc-stat-col">
              <div className="rmc-stat-label">
                <span className="rmc-dot red" />
                Missing Skills
              </div>
              <span className="rmc-stat-num">{missingCount}</span>
            </div>
            <div className="rmc-stat-col">
              <div className="rmc-stat-label">
                <span className="rmc-dot orange" />
                Partial Match
              </div>
              <span className="rmc-stat-num">{partialCount}</span>
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

      {/* Info Banner */}
      <div className="rmc-info-banner">
        <Info size={14} />
        <span>
          {percentage < 70
            ? 'Significant skill gaps identified. Additional training or experience may be required.'
            : 'Strong candidate profile. Recommend proceeding to next round.'}
        </span>
      </div>
    </div>
  );
}