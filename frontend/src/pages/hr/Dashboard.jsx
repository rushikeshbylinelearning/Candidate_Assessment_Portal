import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAnalytics } from '../../hooks/useAnalytics';
import { Users, ClipboardCheck, UserCheck, Award, Clock, Target, TrendingUp, Plus, Settings, FileText, BarChart3 } from 'lucide-react';
import '../../styles/Dashboard.css';
import PageShell from '../../components/layout/PageShell';

// ─── Design tokens ────────────────────────────────────────────────────────────
const COLORS = {
  aptitude:      '#E5383B',
  technical:     '#3B82F6',
  reasoning:     '#10B981',
  communication: '#F59E0B',
};

// Per-card accent colours and icon tints
const CARD_THEMES = [
  { accent: '#3B82F6', iconBg: '#EFF6FF', iconColor: '#3B82F6' }, // Total Candidates
  { accent: '#F59E0B', iconBg: '#FFFBEB', iconColor: '#F59E0B' }, // Pending / Invited
  { accent: '#10B981', iconBg: '#ECFDF5', iconColor: '#10B981' }, // Completed
  { accent: '#8B5CF6', iconBg: '#F5F3FF', iconColor: '#8B5CF6' }, // Shortlisted
  { accent: '#E5383B', iconBg: '#FEF2F2', iconColor: '#E5383B' }, // Hired
  { accent: '#06B6D4', iconBg: '#ECFEFF', iconColor: '#06B6D4' }, // Avg Score
];

// Funnel stage colours (order matches API: Applied, Invited, In Progress, Completed, Shortlisted, Hired)
const FUNNEL_COLORS = ['#E5383B', '#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#1A1A2E'];

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, themeIndex = 0, sub, subMuted, delay = 0 }) {
  const theme = CARD_THEMES[themeIndex];
  return (
    <div
      className="stat-card"
      style={{
        borderLeft: `4px solid ${theme.accent}`,
        animationDelay: `${delay}s`,
      }}
    >
      <div className="stat-icon" style={{ background: theme.iconBg }}>
        <Icon size={15} color={theme.iconColor} strokeWidth={2} />
      </div>
      <div>
        <div className="stat-value">{value ?? '—'}</div>
        <div className="stat-label">{label}</div>
        {sub     && <div className="stat-sub">{sub}</div>}
        {subMuted && <div className="stat-sub-muted">{subMuted}</div>}
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { overview, funnel, performance, loading } = useAnalytics();
  const navigate = useNavigate();

  if (loading) {
    return (
      <PageShell>
        <div className="dashboard-loading">Loading dashboard...</div>
      </PageShell>
    );
  }

  // Skill performance chart data
  const perfData = performance
    ? Object.entries(performance).map(([k, v]) => ({
        name:  k.charAt(0).toUpperCase() + k.slice(1),
        score: v,
        color: COLORS[k] || '#6B7280',
      }))
    : [];

  // Funnel data with percentages
  const funnelData = funnel.map((item, idx) => ({
    ...item,
    percentage: funnel[0]?.count ? Math.round((item.count / funnel[0].count) * 100) : 0,
    color: FUNNEL_COLORS[idx] ?? '#6B7280',
  }));

  return (
    <PageShell>
      <div className="dashboard-page">

      {/* ── Header card ─────────────────────────────────────── */}
      <div className="dashboard-header-card">
        <div className="dashboard-header-icon">
          <BarChart3 size={22} />
        </div>
        <div className="dashboard-header-content">
          <h1>Dashboard</h1>
          <p>Hiring pipeline overview</p>
        </div>
      </div>

      {/* ── Metric cards ────────────────────────────────────── */}
      <div className="stats-grid">
        <StatCard
          icon={Users}
          label="Total Candidates"
          value={overview?.totalCandidates}
          themeIndex={0}
          delay={0}
        />
        <StatCard
          icon={Clock}
          label="Pending"
          value={overview?.pendingAssessments}
          themeIndex={1}
          sub="Invited"
          delay={0.05}
        />
        <StatCard
          icon={ClipboardCheck}
          label="Completed"
          value={overview?.completedAssessments}
          themeIndex={2}
          delay={0.1}
        />
        <StatCard
          icon={UserCheck}
          label="Shortlisted"
          value={overview?.shortlisted}
          themeIndex={3}
          delay={0.15}
        />
        <StatCard
          icon={Award}
          label="Hired"
          value={overview?.hired}
          themeIndex={4}
          delay={0.2}
        />
        <StatCard
          icon={Target}
          label="Avg Score"
          value={overview?.averageScore ? `${overview.averageScore}%` : '—'}
          themeIndex={5}
          subMuted={`Pass rate: ${overview?.passRate ?? 0}%`}
          delay={0.25}
        />
      </div>

      {/* ── Charts row ──────────────────────────────────────── */}
      <div className="charts-grid">

        {/* Hiring Funnel */}
        <div className="chart-card" style={{ animationDelay: '0.3s' }}>
          <div className="chart-header">
            <div className="chart-icon" style={{ background: '#FEF2F2' }}>
              <TrendingUp size={14} color="#E5383B" strokeWidth={2} />
            </div>
            <h3 className="chart-title">Hiring Funnel</h3>
          </div>

          <div className="funnel-container">
            {funnelData.map((item, idx) => (
              <div key={idx} className="funnel-row">
                <div className="funnel-item-header">
                  <div className="funnel-label-group">
                    <span className="funnel-dot" style={{ background: item.color }} />
                    <span className="funnel-stage">{item.stage}</span>
                  </div>
                  <span className="funnel-count">
                    {item.count}&nbsp;
                    <span className="funnel-percentage">({item.percentage}%)</span>
                  </span>
                </div>
                <div className="funnel-bar">
                  <div
                    className="funnel-bar-fill"
                    style={{ width: `${item.percentage}%`, background: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skill Performance */}
        <div className="chart-card" style={{ animationDelay: '0.35s' }}>
          <div className="chart-header">
            <div className="chart-icon" style={{ background: '#EFF6FF' }}>
              <BarChart3 size={14} color="#3B82F6" strokeWidth={2} />
            </div>
            <h3 className="chart-title">Skill Performance</h3>
          </div>

          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perfData} barGap={8}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 400 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 400 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}`}
                />
                <Tooltip
                  formatter={(v) => `${v}%`}
                  contentStyle={{
                    background: '#FFFFFF',
                    border: '1px solid #E8E4DF',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 500,
                    padding: '6px 10px',
                  }}
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {perfData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} opacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Skill legend */}
          <div className="skill-legend">
            {perfData.map((entry, i) => (
              <div key={i} className="skill-legend-item">
                <span className="skill-legend-dot" style={{ background: entry.color }} />
                {entry.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ────────────────────────────────────── */}
      <div className="quick-actions-card" style={{ animationDelay: '0.4s' }}>
        <h3 className="quick-actions-title">Quick Actions</h3>
        <div className="quick-actions-grid">
          <button
            className="quick-action-btn-primary"
            onClick={() => navigate('/hr/candidates')}
          >
            <Plus size={15} strokeWidth={2} />
            Add Candidate
          </button>
          <button
            className="quick-action-btn"
            onClick={() => navigate('/hr/roles')}
          >
            <Settings size={15} strokeWidth={2} />
            Manage Roles
          </button>
          <button
            className="quick-action-btn"
            onClick={() => navigate('/hr/assessments/create')}
          >
            <FileText size={15} strokeWidth={2} />
            Question Bank
          </button>
          <button
            className="quick-action-btn"
            onClick={() => navigate('/hr/analytics')}
          >
            <BarChart3 size={15} strokeWidth={2} />
            View Analytics
          </button>
        </div>
      </div>

    </div>
    </PageShell>
  );
}
