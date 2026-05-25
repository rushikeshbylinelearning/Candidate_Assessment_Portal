import React, { useState } from 'react';

const STEP_TYPES = [
  'EVALUATION_FORM',
  'LANGUAGE_ASSESSMENT',
  'ROLE_BASED_ASSESSMENT',
  'INTERVIEW_INTERACTION',
  'POST_INTERVIEW_FEEDBACK',
];

const STEP_LABELS = {
  EVALUATION_FORM: 'Evaluation Form',
  LANGUAGE_ASSESSMENT: 'Language Assessment',
  ROLE_BASED_ASSESSMENT: 'Role-Based Assessment',
  INTERVIEW_INTERACTION: 'Interview Interaction',
  POST_INTERVIEW_FEEDBACK: 'Post-Interview Feedback',
};

export default function OverrideControls({ pipelineId, onOverrideSuccess }) {
  const [targetStep, setTargetStep] = useState(STEP_TYPES[0]);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Reason is required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/pipeline/${pipelineId}/override`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetStep, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Override failed.');
      } else {
        setReason('');
        if (onOverrideSuccess) onOverrideSuccess(data);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 20 }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#1e293b' }}>
        HR Override
      </h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 6 }}>
            Target Step
          </label>
          <select
            value={targetStep}
            onChange={(e) => setTargetStep(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              fontSize: 14,
              color: '#1e293b',
              background: '#f8fafc',
            }}
          >
            {STEP_TYPES.map((s) => (
              <option key={s} value={s}>{STEP_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 6 }}>
            Reason <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Provide a reason for the override..."
            style={{
              width: '100%',
              padding: '8px 10px',
              border: `1px solid ${error ? '#ef4444' : '#cbd5e1'}`,
              borderRadius: 6,
              fontSize: 14,
              color: '#1e293b',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
          {error && (
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#ef4444' }}>{error}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '8px 20px',
            background: loading ? '#94a3b8' : '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Applying...' : 'Apply Override'}
        </button>
      </form>
    </div>
  );
}
