import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Edit2, Trash2, ClipboardList, Award, MoreVertical, Copy, UserCircle } from 'lucide-react';
import { StatusBadge, ExperienceBadge, ScoreIndicator, RoleBadge } from './CandidateBadges';
import toast from 'react-hot-toast';

const AVATAR_COLORS = [
  { bg: '#FEE2E2', color: '#DC2626' },
  { bg: '#DBEAFE', color: '#2563EB' },
  { bg: '#D1FAE5', color: '#059669' },
  { bg: '#EDE9FE', color: '#7C3AED' },
  { bg: '#FEF3C7', color: '#D97706' },
  { bg: '#FCE7F3', color: '#DB2777' },
];

const MENU_WIDTH = 190;

function ActionDropdown({ candidate, onView, onEdit, onDelete, onAssign, onResults }) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  // Close on outside click or scroll
  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const closeOnScroll = () => setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('scroll', closeOnScroll, true);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('scroll', closeOnScroll, true);
    };
  }, [open]);

  const handleToggle = (e) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      // Prefer opening upward so it doesn't get clipped by the table row
      const spaceBelow = window.innerHeight - rect.bottom;
      const menuHeight = 220; // approximate
      const openUpward = spaceBelow < menuHeight + 8;

      setMenuPos({
        top: openUpward ? rect.top - menuHeight - 6 : rect.bottom + 6,
        left: rect.right - MENU_WIDTH,
      });
    }
    setOpen(o => !o);
  };

  const items = [
    { icon: UserCircle, label: 'View Profile', action: onView, color: '#475569' },
    { icon: Award,      label: 'View Results', action: onResults, color: '#7C3AED', hidden: !candidate.hasCompletedSteps },
    { icon: Edit2,      label: 'Edit',         action: onEdit,    color: '#2563EB' },
    {
      icon: ClipboardList,
      label: candidate.assignmentCount > 0 ? 'Update Assessment' : 'Assign Assessment',
      action: onAssign,
      color: '#0EA5E9',
    },
    { divider: true },
    { icon: Trash2, label: 'Delete', action: onDelete, color: '#E11D48', danger: true },
  ].filter(item => !item.hidden);

  const menu = open ? createPortal(
    <div
      ref={menuRef}
      onClick={e => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: menuPos.top,
        left: menuPos.left,
        width: MENU_WIDTH,
        zIndex: 9999,
        background: '#fff',
        border: '1px solid #E4E7EC',
        borderRadius: 12,
        boxShadow: '0 8px 24px rgba(16,24,40,0.14), 0 2px 8px rgba(16,24,40,0.08)',
        padding: '6px',
        animation: 'dropdownFadeIn 0.12s ease-out',
      }}
    >
      <style>{`
        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: scale(0.96) translateY(-4px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
      {items.map((item, i) =>
        item.divider ? (
          <div key={i} style={{ height: 1, background: '#F1F5F9', margin: '4px 0' }} />
        ) : (
          <button
            key={i}
            onClick={() => { setOpen(false); item.action(); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 9,
              padding: '8px 10px', borderRadius: 8, border: 'none',
              background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
              color: item.danger ? '#E11D48' : '#334155',
              transition: 'background 0.12s', textAlign: 'left',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = item.danger ? '#FFF1F2' : '#F8FAFC'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
          >
            <item.icon size={14} style={{ color: item.color, flexShrink: 0 }} />
            {item.label}
          </button>
        )
      )}
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        title="More actions"
        style={{
          width: 30, height: 30, borderRadius: 7,
          border: `1px solid ${open ? '#CBD5E1' : '#E2E8F0'}`,
          background: open ? '#F1F5F9' : '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#64748B', transition: 'all 0.15s',
          flexShrink: 0,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#E2E8F0'; } }}
      >
        <MoreVertical size={14} />
      </button>
      {menu}
    </>
  );
}

export default function CandidateRow({ candidate, onEdit, onDelete, onAssign, onResults }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const initials = candidate.name
    ? candidate.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  const avatarColor = AVATAR_COLORS[(candidate.name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

  return (
    <tr
      onClick={() => navigate(`/hr/candidates/${candidate._id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderBottom: '1px solid #F1F5F9',
        cursor: 'pointer',
        background: hovered ? '#FAFBFC' : '#fff',
        transition: 'background 0.15s',
      }}
    >
      {/* Candidate */}
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: avatarColor.bg, color: avatarColor.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, flexShrink: 0,
            border: `1.5px solid ${avatarColor.color}33`,
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: '#0F172A',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160,
            }}>
              {candidate.name}
            </div>
            <div style={{
              fontSize: 11, color: '#94A3B8', marginTop: 1,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160,
            }}>
              {candidate.email}
            </div>
          </div>
        </div>
      </td>

      {/* Role */}
      <td style={{ padding: '12px 16px' }}>
        <RoleBadge title={candidate.appliedRole?.title} />
      </td>

      {/* Experience */}
      <td style={{ padding: '12px 16px' }}>
        <ExperienceBadge level={candidate.experienceLevel} />
      </td>

      {/* Access Code */}
      <td style={{ padding: '12px 16px' }}>
        {candidate.accessCode ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontFamily: 'monospace', fontSize: 12, fontWeight: 700,
              color: '#E11D48', letterSpacing: '0.08em',
              background: '#FFF1F2', padding: '2px 7px', borderRadius: 5,
            }}>
              {candidate.accessCode}
            </span>
            <button
              onClick={e => {
                e.stopPropagation();
                navigator.clipboard.writeText(candidate.accessCode);
                toast.success('Copied!');
              }}
              title="Copy access code"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#94A3B8', display: 'flex', padding: 2,
                borderRadius: 4, transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#475569'}
              onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
            >
              <Copy size={12} />
            </button>
          </div>
        ) : (
          <span style={{ color: '#CBD5E1', fontSize: 13 }}>—</span>
        )}
      </td>

      {/* Assessment */}
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <StatusBadge status={candidate.assessmentStatus} pulse />
          {candidate.assignmentCount > 0 && (
            <span style={{ fontSize: 10, color: '#64748B', fontWeight: 500 }}>
              {candidate.assignmentCount} assigned
            </span>
          )}
        </div>
      </td>

      {/* Score */}
      <td style={{ padding: '12px 16px', minWidth: 120 }}>
        <ScoreIndicator score={candidate.overallScore} />
      </td>

      {/* Decision */}
      <td style={{ padding: '12px 16px' }}>
        {candidate.finalDecision ? (
          <StatusBadge status={candidate.finalDecision} />
        ) : (
          <span style={{
            fontSize: 11, fontWeight: 500, color: '#94A3B8',
            background: '#F8FAFC', padding: '3px 9px',
            borderRadius: 99, border: '1px solid #E2E8F0',
          }}>
            Pending
          </span>
        )}
      </td>

      {/* Actions */}
      <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {candidate.hasCompletedSteps && (
            <button
              onClick={e => { e.stopPropagation(); onResults(candidate); }}
              title="View Assessment Results"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 7,
                border: '1px solid #BFDBFE', background: '#EFF6FF',
                color: '#2563EB', fontSize: 11, fontWeight: 600,
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#DBEAFE'}
              onMouseLeave={e => e.currentTarget.style.background = '#EFF6FF'}
            >
              <Award size={12} /> Results
            </button>
          )}

          <button
            onClick={e => { e.stopPropagation(); onAssign(candidate); }}
            title={candidate.assignmentCount > 0 ? 'Update Assessments' : 'Assign Assessment'}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 7,
              border: '1px solid #FECDD3', background: '#FFF1F2',
              color: '#E11D48', fontSize: 11, fontWeight: 600,
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#FFE4E6'}
            onMouseLeave={e => e.currentTarget.style.background = '#FFF1F2'}
          >
            <ClipboardList size={12} />
            {candidate.assignmentCount > 0 ? 'Update' : 'Assign'}
          </button>

          <ActionDropdown
            candidate={candidate}
            onView={() => navigate(`/hr/candidates/${candidate._id}`)}
            onEdit={() => onEdit(candidate)}
            onDelete={() => onDelete(candidate)}
            onAssign={() => onAssign(candidate)}
            onResults={() => onResults(candidate)}
          />
        </div>
      </td>
    </tr>
  );
}
