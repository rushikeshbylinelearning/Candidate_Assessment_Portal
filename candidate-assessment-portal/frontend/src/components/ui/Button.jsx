import React from 'react';

const styles = {
  primary: { background: 'var(--color-accent)', color: '#fff', border: 'none' },
  secondary: { background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', border: '0.5px solid var(--color-border)' },
  ghost: { background: 'transparent', color: 'var(--color-text-secondary)', border: '0.5px solid var(--color-border)' },
  danger: { background: 'var(--color-danger-light)', color: 'var(--color-danger)', border: '0.5px solid var(--color-danger)' },
  success: { background: 'var(--color-success-light)', color: 'var(--color-success)', border: '0.5px solid var(--color-success)' },
};

export default function Button({ children, variant = 'primary', size = 'md', disabled, loading, onClick, type = 'button', style }) {
  const sz = size === 'sm' ? { padding: '6px 12px', fontSize: 13 } : size === 'lg' ? { padding: '12px 24px', fontSize: 15 } : { padding: '8px 16px', fontSize: 13 };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...styles[variant], ...sz,
        borderRadius: 8, fontWeight: 500, cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        display: 'inline-flex', alignItems: 'center', gap: 8,
        transition: 'all 0.2s', whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {loading ? '...' : children}
    </button>
  );
}
