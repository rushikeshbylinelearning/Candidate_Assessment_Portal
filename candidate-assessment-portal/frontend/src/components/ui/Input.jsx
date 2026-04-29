import React from 'react';

export default function Input({ label, error, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{label}</label>}
      <input
        {...props}
        style={{
          padding: '9px 14px', borderRadius: 8, fontSize: 14,
          border: `1px solid ${error ? '#e11d48' : '#e2e8f0'}`,
          outline: 'none', background: '#fff', color: '#0f172a',
          transition: 'border-color 0.15s',
          width: '100%',
          ...props.style,
        }}
        onFocus={e => e.target.style.borderColor = '#e11d48'}
        onBlur={e => e.target.style.borderColor = error ? '#e11d48' : '#e2e8f0'}
      />
      {error && <span style={{ fontSize: 12, color: '#e11d48' }}>{error}</span>}
    </div>
  );
}

export function Select({ label, error, children, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{label}</label>}
      <select
        {...props}
        style={{
          padding: '9px 14px', borderRadius: 8, fontSize: 14,
          border: `1px solid ${error ? '#e11d48' : '#e2e8f0'}`,
          outline: 'none', background: '#fff', color: '#0f172a', width: '100%',
          ...props.style,
        }}
      >
        {children}
      </select>
      {error && <span style={{ fontSize: 12, color: '#e11d48' }}>{error}</span>}
    </div>
  );
}
