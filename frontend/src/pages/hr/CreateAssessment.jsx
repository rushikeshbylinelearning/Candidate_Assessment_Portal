import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap, List, FileUp, ChevronRight, ClipboardList,
  Clock, Users, CheckCircle, XCircle, Search,
  LayoutGrid, LayoutList, Plus,
} from 'lucide-react';
import api from '../../utils/api';
import PageShell from '../../components/layout/PageShell';
import '../../styles/CreateAssessment.css';

// ── Mode definitions ──────────────────────────────────────────────────────────
const MODES = [
  {
    key: 'adaptive',
    icon: Zap,
    iconBg: '#EFF6FF',
    iconColor: '#2563EB',
    accentColor: '#2563EB',
    badge: 'AI-Powered',
    badgeBg: '#DBEAFE',
    badgeColor: '#1D4ED8',
    title: 'Adaptive Mode',
    subtitle: 'Difficulty adjusts in real-time based on candidate responses.',
    path: '/hr/assessments/create/adaptive',
  },
  {
    key: 'standard',
    icon: List,
    iconBg: '#F0FDF4',
    iconColor: '#16A34A',
    accentColor: '#16A34A',
    badge: 'Fixed Set',
    badgeBg: '#DCFCE7',
    badgeColor: '#15803D',
    title: 'Standard Mode',
    subtitle: 'Hand-pick questions from the bank. Every candidate gets the same set.',
    path: '/hr/assessments/create/standard',
  },
  {
    key: 'pdf',
    icon: FileUp,
    iconBg: '#FDF4FF',
    iconColor: '#9333EA',
    accentColor: '#9333EA',
    badge: 'New',
    badgeBg: '#FAE8FF',
    badgeColor: '#7E22CE',
    title: 'Import from PDF',
    subtitle: 'Upload a document and auto-generate questions from its content.',
    path: '/hr/assessments/create/pdf',
  },
];

// ── Status pill ───────────────────────────────────────────────────────────────
function StatusPill({ active }) {
  return (
    <span className={`ca-status-pill ${active ? 'ca-status-pill--active' : 'ca-status-pill--inactive'}`}>
      {active ? <CheckCircle size={11} /> : <XCircle size={11} />}
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

// ── Mode badge ────────────────────────────────────────────────────────────────
function ModeBadge({ mode }) {
  const map = {
    adaptive: { bg: '#DBEAFE', color: '#1D4ED8', label: 'Adaptive' },
    standard: { bg: '#DCFCE7', color: '#15803D', label: 'Standard' },
    pdf:      { bg: '#FAE8FF', color: '#7E22CE', label: 'PDF Import' },
  };
  const s = map[mode] || { bg: '#F1F5F9', color: '#64748B', label: mode || '—' };
  return (
    <span
      className="ca-mode-badge"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

export default function CreateAssessment() {
  const navigate = useNavigate();
  const [assessments, setAssessments]   = useState([]);
  const [filtered, setFiltered]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | inactive
  const [viewMode, setViewMode]         = useState('table'); // table | grid

  useEffect(() => {
    api.get('/assessments')
      .then(res => { setAssessments(res.data); setFiltered(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Filter whenever search or status changes
  useEffect(() => {
    let list = assessments;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.title?.toLowerCase().includes(q) ||
        a.roleId?.title?.toLowerCase().includes(q) ||
        a.roleId?.department?.toLowerCase().includes(q)
      );
    }
    if (statusFilter === 'active')   list = list.filter(a => a.active);
    if (statusFilter === 'inactive') list = list.filter(a => !a.active);
    setFiltered(list);
  }, [search, statusFilter, assessments]);

  const activeCount   = assessments.filter(a => a.active).length;
  const inactiveCount = assessments.filter(a => !a.active).length;

  const STATS = [
    { label: 'Total',    value: assessments.length, color: 'rgba(255,255,255,0.9)' },
    { label: 'Active',   value: activeCount,        color: '#4ADE80' },
    { label: 'Inactive', value: inactiveCount,      color: 'rgba(255,255,255,0.4)' },
  ];

  const FILTERS = [
    { key: 'all',      label: 'All' },
    { key: 'active',   label: 'Active' },
    { key: 'inactive', label: 'Inactive' },
  ];

  return (
    <PageShell scrollable noPad>
      <div className="ca-page">

        {/* ══ PAGE HEADER ══════════════════════════════════════════════════ */}
        <div className="ca-header">
          {/* Icon bubble */}
          <div className="ca-header__icon">
            <ClipboardList size={20} />
          </div>

          {/* Title + subtitle */}
          <div className="ca-header__text">
            <h1 className="ca-header__title">Assessments</h1>
            <p className="ca-header__subtitle">
              Create and manage assessments for your candidates
            </p>
          </div>

          {/* Stats */}
          <div className="ca-header__stats">
            {STATS.map(s => (
              <div key={s.label} className="ca-stat-chip">
                <div className="ca-stat-chip__value" style={{ color: s.color }}>{s.value}</div>
                <div className="ca-stat-chip__label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="ca-header__actions">
            <button
              className="ca-btn-ghost"
              onClick={() => navigate('/hr/questions')}
            >
              <List size={14} /> Questions
            </button>
            <button
              className="ca-btn-primary"
              onClick={() => navigate('/hr/assessments/create/adaptive')}
            >
              <Plus size={14} /> New Assessment
            </button>
          </div>
        </div>

        {/* ══ CREATE NEW — 3 MODE CARDS ════════════════════════════════════ */}
        <div className="ca-create-section">
          <div className="ca-section-label">Create New Assessment</div>
          <div className="ca-mode-grid">
            {MODES.map(mode => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.key}
                  className="ca-mode-card"
                  onClick={() => navigate(mode.path)}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = mode.accentColor + '66';
                    e.currentTarget.style.boxShadow = `0 4px 16px ${mode.accentColor}18`;
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#E2E8F0';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Left accent bar */}
                  <div
                    className="ca-mode-card__accent-bar"
                    style={{ background: mode.accentColor }}
                  />

                  {/* Icon */}
                  <div
                    className="ca-mode-card__icon"
                    style={{ background: mode.iconBg }}
                  >
                    <Icon size={20} color={mode.iconColor} strokeWidth={2} />
                  </div>

                  {/* Text */}
                  <div className="ca-mode-card__body">
                    <div className="ca-mode-card__title-row">
                      <span className="ca-mode-card__title">{mode.title}</span>
                      <span
                        className="ca-mode-card__badge"
                        style={{ background: mode.badgeBg, color: mode.badgeColor }}
                      >
                        {mode.badge}
                      </span>
                    </div>
                    <p className="ca-mode-card__subtitle">{mode.subtitle}</p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight size={15} color="#CBD5E1" style={{ flexShrink: 0 }} />
                </button>
              );
            })}
          </div>
        </div>

        {/* ══ ASSESSMENTS TABLE ════════════════════════════════════════════ */}
        <div className="ca-table-container">

          {/* Toolbar */}
          <div className="ca-toolbar">
            <span className="ca-toolbar__title">Created Assessments</span>

            {/* Search */}
            <div className="ca-search-wrap">
              <Search size={13} className="ca-search-wrap__icon" />
              <input
                className="ca-search-input"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or role…"
              />
            </div>

            {/* Status filter pills */}
            <div className="ca-filter-pills">
              {FILTERS.map(f => (
                <button
                  key={f.key}
                  className={`ca-filter-pill ${statusFilter === f.key ? 'ca-filter-pill--active' : 'ca-filter-pill--inactive'}`}
                  onClick={() => setStatusFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="ca-toolbar__spacer" />

            {/* Result count */}
            {!loading && (
              <span className="ca-toolbar__count">
                {filtered.length} of {assessments.length}
              </span>
            )}

            {/* View toggle */}
            <div className="ca-view-toggle">
              {[
                { key: 'table', Icon: LayoutList },
                { key: 'grid',  Icon: LayoutGrid },
              ].map(({ key, Icon }) => (
                <button
                  key={key}
                  className={`ca-view-toggle__btn ${viewMode === key ? 'ca-view-toggle__btn--active' : 'ca-view-toggle__btn--inactive'}`}
                  onClick={() => setViewMode(key)}
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="ca-loading">
              <div className="ca-spinner" />
              Loading assessments…
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div className="ca-empty">
              <ClipboardList size={32} color="#CBD5E1" className="ca-empty__icon" />
              <p className="ca-empty__title">
                {assessments.length === 0 ? 'No assessments yet' : 'No results match your filters'}
              </p>
              <p className="ca-empty__hint">
                {assessments.length === 0
                  ? 'Choose a mode above to create your first one'
                  : 'Try adjusting your search or filter'}
              </p>
            </div>
          )}

          {/* TABLE VIEW */}
          {!loading && filtered.length > 0 && viewMode === 'table' && (
            <table className="ca-table">
              <thead className="ca-table__head">
                <tr>
                  {['Assessment', 'Role', 'Mode', 'Duration', 'Questions', 'Status', ''].map((col, i) => (
                    <th key={i} className="ca-table__th">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, idx) => (
                  <tr
                    key={a._id}
                    className="ca-table__row"
                    style={{ borderBottom: idx < filtered.length - 1 ? '1px solid #F8FAFC' : 'none' }}
                    onClick={() => navigate(`/hr/assessments/${a._id}`)}
                  >
                    {/* Assessment name */}
                    <td className="ca-table__td">
                      <div className="ca-assessment-name">
                        <div className="ca-assessment-name__icon">
                          <ClipboardList size={15} color="#2563EB" />
                        </div>
                        <span className="ca-assessment-name__text">{a.title}</span>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="ca-table__td">
                      <div className="ca-role-title">
                        {a.roleId?.title || <span className="ca-role-empty">—</span>}
                      </div>
                      {a.roleId?.department && (
                        <div className="ca-role-dept">{a.roleId.department}</div>
                      )}
                    </td>

                    {/* Mode */}
                    <td className="ca-table__td">
                      <ModeBadge mode={a.mode} />
                    </td>

                    {/* Duration */}
                    <td className="ca-table__td">
                      <div className="ca-meta-cell">
                        <Clock size={12} /> {a.duration} min
                      </div>
                    </td>

                    {/* Questions */}
                    <td className="ca-table__td">
                      <div className="ca-meta-cell">
                        <Users size={12} /> {a.totalQuestions}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="ca-table__td">
                      <StatusPill active={a.active} />
                    </td>

                    {/* Arrow */}
                    <td className="ca-table__td--right">
                      <ChevronRight size={14} color="#CBD5E1" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* GRID VIEW */}
          {!loading && filtered.length > 0 && viewMode === 'grid' && (
            <div className="ca-grid">
              {filtered.map(a => (
                <div
                  key={a._id}
                  className="ca-grid-card"
                  onClick={() => navigate(`/hr/assessments/${a._id}`)}
                >
                  <div className="ca-grid-card__header">
                    <div className="ca-grid-card__icon">
                      <ClipboardList size={16} color="#2563EB" />
                    </div>
                    <StatusPill active={a.active} />
                  </div>
                  <div className="ca-grid-card__title">{a.title}</div>
                  <div className="ca-grid-card__role">
                    {a.roleId?.title || 'No role'}
                    {a.roleId?.department ? ` · ${a.roleId.department}` : ''}
                  </div>
                  <div className="ca-grid-card__footer">
                    <div className="ca-grid-card__meta">
                      <Clock size={11} /> {a.duration} min
                    </div>
                    <div className="ca-grid-card__meta">
                      <Users size={11} /> {a.totalQuestions} q
                    </div>
                    <ModeBadge mode={a.mode} />
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </PageShell>
  );
}
