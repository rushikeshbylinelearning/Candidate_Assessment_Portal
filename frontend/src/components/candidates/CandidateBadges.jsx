import React from 'react';

// ── Status config map ────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:     { label: 'Pending',     bg: '#FEF9C3', color: '#854D0E', dot: '#CA8A04' },
  invited:     { label: 'Invited',     bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6' },
  in_progress: { label: 'In Progress', bg: '#FFF7ED', color: '#C2410C', dot: '#F97316' },
  completed:   { label: 'Completed',   bg: '#F0FDF4', color: '#15803D', dot: '#22C55E' },
  expired:     { label: 'Expired',     bg: '#FEF2F2', color: '#B91C1C', dot: '#EF4444' },
  shortlisted: { label: 'Shortlisted', bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6' },
  hired:       { label: 'Hired',       bg: '#F0FDF4', color: '#15803D', dot: '#22C55E' },
  rejected:    { label: 'Rejected',    bg: '#FEF2F2', color: '#B91C1C', dot: '#EF4444' },
  on_hold:     { label: 'On Hold',     bg: '#FFF7ED', color: '#C2410C', dot: '#F97316' },
  selected:    { label: 'Selected',    bg: '#F0FDF4', color: '#15803D', dot: '#22C55E' },
  reject:      { label: 'Rejected',    bg: '#FEF2F2', color: '#B91C1C', dot: '#EF4444' },
};

const EXP_CONFIG = {
  intern:  { label: 'Intern',  bg: '#F5F3FF', color: '#6D28D9' },
  junior:  { label: 'Junior',  bg: '#EFF6FF', color: '#1D4ED8' },
  mid:     { label: 'Mid',     bg: '#FFF7ED', color: '#C2410C' },
  senior:  { label: 'Senior',  bg: '#F5F3FF', color: '#7C3AED' },
  lead:    { label: 'Lead',    bg: '#FDF4FF', color: '#9333EA' },
};

export function StatusBadge({ status, pulse = false }) {
  const cfg = STATUS_CONFIG[status] || {
    label: status ? status.replace(/_/g, ' ') : '—',
    bg: '#F1F5F9', color: '#475569', dot: '#94A3B8',
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 99,
      fontSize: 11, fontWeight: 600,
      background: cfg.bg, color: cfg.color,
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: cfg.dot, flexShrink: 0,
      }} />
      {cfg.label}
    </span>
  );
}

export function ExperienceBadge({ level }) {
  const cfg = EXP_CONFIG[level] || { label: level || '—', bg: '#F1F5F9', color: '#475569' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 9px', borderRadius: 6,
      fontSize: 11, fontWeight: 600,
      background: cfg.bg, color: cfg.color,
    }}>
      {cfg.label}
    </span>
  );
}

export function ScoreIndicator({ score }) {
  if (score == null) return <span style={{ color: '#94A3B8', fontSize: 13 }}>—</span>;
  const pct = Math.round(score);
  const color = pct >= 70 ? '#16A34A' : pct >= 50 ? '#D97706' : '#DC2626';
  const trackColor = pct >= 70 ? '#DCFCE7' : pct >= 50 ? '#FEF3C7' : '#FEE2E2';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 90 }}>
      <div style={{ flex: 1, height: 5, borderRadius: 99, background: trackColor, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 99,
          background: color, transition: 'width 0.4s ease',
        }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 32, textAlign: 'right' }}>
        {pct}%
      </span>
    </div>
  );
}

export function RoleBadge({ title }) {
  if (!title) return <span style={{ color: '#94A3B8', fontSize: 13 }}>—</span>;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 9px', borderRadius: 6,
      fontSize: 11, fontWeight: 600,
      background: '#F8FAFC', color: '#334155',
      border: '1px solid #E2E8F0',
    }}>
      {title}
    </span>
  );
}
