import React from 'react';

const variants = {
  default: { bg: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)' },
  success: { bg: 'var(--color-success-light)', color: 'var(--color-success)' },
  danger: { bg: 'var(--color-danger-light)', color: 'var(--color-danger)' },
  warning: { bg: 'var(--color-warning-light)', color: 'var(--color-warning)' },
  info: { bg: 'var(--color-info-light)', color: 'var(--color-info)' },
  purple: { bg: '#FAF5FF', color: '#7C3AED' },
};

const statusMap = {
  pending: 'default', invited: 'info', in_progress: 'warning',
  completed: 'success', expired: 'danger',
  excellent: 'success', strong: 'success', moderate: 'warning',
  needs_review: 'warning', reject: 'danger',
  shortlisted: 'info', hired: 'success', rejected: 'danger', on_hold: 'warning',
  pass: 'success', fail: 'danger',
};

export default function Badge({ label, variant, status }) {
  const v = variant || statusMap[status] || 'default';
  const style = variants[v] || variants.default;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
      borderRadius: 6, fontSize: 11, fontWeight: 500,
      background: style.bg, color: style.color,
    }}>
      {label || status?.replace(/_/g, ' ')}
    </span>
  );
}
