import React from 'react';

const STEP_TYPE_LABELS = {
  EVALUATION_FORM: 'Evaluation Form',
  LANGUAGE_ASSESSMENT: 'Language Assessment',
  ROLE_BASED_ASSESSMENT: 'Role-Based Assessment',
  INTERVIEW_INTERACTION: 'Interview Interaction',
  POST_INTERVIEW_FEEDBACK: 'Post-Interview Feedback',
};

const STATUS_STYLES = {
  NOT_STARTED: { background: '#e5e7eb', color: '#6b7280' },
  IN_PROGRESS: { background: '#dbeafe', color: '#1d4ed8' },
  COMPLETED: { background: '#dcfce7', color: '#15803d' },
  SKIPPED: { background: '#fef9c3', color: '#a16207' },
};

function formatTimestamp(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString();
}

export default function StepStatusOverview({ pipelineRecord }) {
  if (!pipelineRecord) return null;

  const { stepStatus = {}, stepConfigSnapshot = [] } = pipelineRecord;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
            {['Step', 'Status', 'Started At', 'Completed At', 'Score'].map((h) => (
              <th
                key={h}
                style={{
                  padding: '10px 14px',
                  textAlign: 'left',
                  fontWeight: 600,
                  color: '#475569',
                  whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stepConfigSnapshot.map((step, i) => {
            const stepType = step.stepType || step.type;
            const info = stepStatus[stepType] || {};
            const status = info.status || 'NOT_STARTED';
            const badgeStyle = STATUS_STYLES[status] || STATUS_STYLES.NOT_STARTED;

            return (
              <tr
                key={stepType || i}
                style={{ borderBottom: '1px solid #e2e8f0' }}
              >
                <td style={{ padding: '10px 14px', color: '#1e293b' }}>
                  {STEP_TYPE_LABELS[stepType] || stepType}
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <span
                    style={{
                      ...badgeStyle,
                      padding: '3px 10px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600,
                      display: 'inline-block',
                    }}
                  >
                    {status.replace('_', ' ')}
                  </span>
                </td>
                <td style={{ padding: '10px 14px', color: '#64748b' }}>
                  {formatTimestamp(info.startedAt)}
                </td>
                <td style={{ padding: '10px 14px', color: '#64748b' }}>
                  {formatTimestamp(info.completedAt)}
                </td>
                <td style={{ padding: '10px 14px', color: '#64748b' }}>
                  {info.score != null ? info.score : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
