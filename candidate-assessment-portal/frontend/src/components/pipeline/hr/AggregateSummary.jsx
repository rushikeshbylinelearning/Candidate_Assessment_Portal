import React from 'react';

function formatTime(totalSecs) {
  if (!totalSecs) return '00:00:00';
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

export default function AggregateSummary({ pipelineRecord }) {
  if (!pipelineRecord) return null;

  const { completedSteps = [], stepConfigSnapshot = [], totalTimeSpentSecs = 0, aggregateScore } = pipelineRecord;

  const total = stepConfigSnapshot.length;
  const completionPct = total > 0 ? Math.round((completedSteps.length / total) * 100) : 0;

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 20 }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#1e293b' }}>
        Aggregate Summary
      </h3>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={statCardStyle}>
          <span style={labelStyle}>Completion</span>
          <span style={valueStyle}>{completionPct}%</span>
          <div style={{ marginTop: 8, background: '#e2e8f0', borderRadius: 4, height: 6, width: '100%' }}>
            <div
              style={{
                height: 6,
                borderRadius: 4,
                background: '#2563eb',
                width: `${completionPct}%`,
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>
        <div style={statCardStyle}>
          <span style={labelStyle}>Time Spent</span>
          <span style={valueStyle}>{formatTime(totalTimeSpentSecs)}</span>
        </div>
        <div style={statCardStyle}>
          <span style={labelStyle}>Aggregate Score</span>
          <span style={valueStyle}>
            {aggregateScore != null ? aggregateScore.toFixed(1) : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

const statCardStyle = {
  flex: '1 1 140px',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: '14px 18px',
  minWidth: 140,
};

const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 500,
  color: '#64748b',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const valueStyle = {
  display: 'block',
  fontSize: 24,
  fontWeight: 700,
  color: '#1e293b',
};
