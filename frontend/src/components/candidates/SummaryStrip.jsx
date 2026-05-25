import React from 'react';
import { Users, ClipboardList, CheckCircle, Clock } from 'lucide-react';

const STAT_CARDS = [
  { key: 'total',     label: 'Total Candidates',   icon: Users,         color: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE' },
  { key: 'active',    label: 'Active Assessments', icon: ClipboardList, color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  { key: 'completed', label: 'Completed',          icon: CheckCircle,   color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0' },
  { key: 'pending',   label: 'Pending Decisions',  icon: Clock,         color: '#F43F5E', bg: '#FFF1F2', border: '#FECDD3' },
];

export default function SummaryStrip({ candidates }) {
  const stats = {
    total:     candidates.length,
    active:    candidates.filter(c => c.assessmentStatus === 'in_progress' || c.assessmentStatus === 'invited').length,
    completed: candidates.filter(c => c.assessmentStatus === 'completed').length,
    pending:   candidates.filter(c => !c.finalDecision && c.assessmentStatus === 'completed').length,
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 12,
      marginBottom: 16,
    }}>
      {STAT_CARDS.map(({ key, label, icon: Icon, color, bg, border }) => (
        <div
          key={key}
          style={{
            background: '#fff',
            border: `1px solid ${border}`,
            borderRadius: 14,
            padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: '0 1px 3px rgba(16,24,40,0.06)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'default',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,24,40,0.1)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(16,24,40,0.06)';
          }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: bg, display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon size={18} style={{ color }} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
              {stats[key]}
            </div>
            <div style={{ fontSize: 11, fontWeight: 500, color: '#64748B', marginTop: 2 }}>
              {label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
