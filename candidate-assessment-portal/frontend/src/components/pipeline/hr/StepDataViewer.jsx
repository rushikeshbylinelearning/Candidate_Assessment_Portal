import React, { useEffect, useState } from 'react';

export default function StepDataViewer({ pipelineId, stepType }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!pipelineId || !stepType) return;

    let cancelled = false;
    setLoading(true);
    setError('');
    setData(null);

    const token = localStorage.getItem('token');
    fetch(`/api/pipeline/${pipelineId}/step/${stepType}/data`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) return res.json().then((d) => Promise.reject(d));
        return res.json();
      })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load step data.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [pipelineId, stepType]);

  if (!stepType) {
    return (
      <div style={containerStyle}>
        <p style={{ color: '#64748b', fontSize: 14 }}>Select a step to view its data.</p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 600, color: '#1e293b' }}>
        Step Data — {stepType.replace(/_/g, ' ')}
      </h3>
      {loading && <p style={{ color: '#64748b', fontSize: 14 }}>Loading...</p>}
      {error && <p style={{ color: '#ef4444', fontSize: 14 }}>{error}</p>}
      {data && !loading && (
        <div>
          {Object.entries(data).map(([key, value]) => (
            <div
              key={key}
              style={{
                display: 'flex',
                gap: 12,
                padding: '8px 0',
                borderBottom: '1px solid #f1f5f9',
                fontSize: 14,
              }}
            >
              <span style={{ minWidth: 180, fontWeight: 500, color: '#475569', flexShrink: 0 }}>
                {key}
              </span>
              <span style={{ color: '#1e293b', wordBreak: 'break-all' }}>
                {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value ?? '—')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const containerStyle = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: 20,
};
