import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Users, ClipboardCheck, UserCheck, Award, Clock, Target, TrendingUp, Plus, Settings, FileText, BarChart3 } from 'lucide-react';
import '../../styles/Dashboard.css';

const COLORS = {
  aptitude: '#F43F5E',
  technical: '#2563EB',
  reasoning: '#16A34A',
  communication: '#D97706',
};

function StatCard({ icon: Icon, label, value, color = '#F43F5E', sub, delay = 0 }) {
  return (
    <Card className="stat-card" style={{ animationDelay: `${delay}s` }}>
      <div className="stat-icon" style={{ background: `${color}15` }}>
        <Icon size={16} color={color} strokeWidth={2} />
      </div>
      <div>
        <div className="stat-value">{value ?? '—'}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </Card>
  );
}

function QuickActionButton({ icon: Icon, label, onClick, color }) {
  const handleMouseEnter = (e) => {
    e.currentTarget.style.borderColor = color;
    e.currentTarget.style.color = color;
    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.borderColor = 'var(--color-border)';
    e.currentTarget.style.color = 'var(--color-text-secondary)';
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <button
      onClick={onClick}
      className="quick-action-btn"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Icon size={16} strokeWidth={2} />
      {label}
    </button>
  );
}

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [funnel, setFunnel] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/analytics/overview'),
      api.get('/analytics/funnel'),
      api.get('/analytics/performance'),
    ]).then(([ov, fn, pf]) => {
      setOverview(ov.data);
      setFunnel(fn.data);
      setPerformance(pf.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  const perfData = performance 
    ? Object.entries(performance).map(([k, v]) => ({ 
        name: k.charAt(0).toUpperCase() + k.slice(1), 
        score: v,
        color: COLORS[k] || 'var(--color-text-secondary)',
      })) 
    : [];

  // Transform funnel data for horizontal progress bars
  const funnelData = funnel.map(item => ({
    ...item,
    percentage: funnel[0]?.count ? Math.round((item.count / funnel[0].count) * 100) : 0,
  }));

  return (
    <div>
      {/* Squircle Header */}
      <div className="squircle-header">
        <div className="squircle-header-icon">
          <BarChart3 size={20} />
        </div>
        <div className="squircle-header-content">
          <h1>Dashboard</h1>
          <p>Hiring pipeline overview</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard 
          icon={Users} 
          label="Total Candidates" 
          value={overview?.totalCandidates} 
          color="#F43F5E"
          delay={0}
        />
        <StatCard 
          icon={Clock} 
          label="Pending" 
          value={overview?.pendingAssessments} 
          color="#D97706"
          sub="Invited"
          delay={0.05}
        />
        <StatCard 
          icon={ClipboardCheck} 
          label="Completed" 
          value={overview?.completedAssessments} 
          color="#2563EB"
          delay={0.1}
        />
        <StatCard 
          icon={UserCheck} 
          label="Shortlisted" 
          value={overview?.shortlisted} 
          color="#16A34A"
          delay={0.15}
        />
        <StatCard 
          icon={Award} 
          label="Hired" 
          value={overview?.hired} 
          color="#7C3AED"
          delay={0.2}
        />
        <StatCard 
          icon={Target} 
          label="Avg Score" 
          value={overview?.averageScore ? `${overview.averageScore}%` : '—'} 
          color="#F43F5E" 
          sub={`Pass rate: ${overview?.passRate ?? 0}%`}
          delay={0.25}
        />
      </div>

      {/* Charts Row */}
      <div className="charts-grid">
        {/* Hiring Funnel */}
        <Card className="chart-card" style={{ animationDelay: '0.3s' }}>
          <div className="chart-header">
            <div className="chart-icon" style={{ background: '#F43F5E15' }}>
              <TrendingUp size={16} color="#F43F5E" strokeWidth={2} />
            </div>
            <h3 className="chart-title">Hiring Funnel</h3>
          </div>
          
          <div className="funnel-container">
            {funnelData.map((item, idx) => (
              <div key={idx}>
                <div className="funnel-item-header">
                  <span className="funnel-stage">{item.stage}</span>
                  <span className="funnel-count">
                    {item.count} <span className="funnel-percentage">({item.percentage}%)</span>
                  </span>
                </div>
                <div className="funnel-bar">
                  <div className="funnel-bar-fill" style={{ width: `${item.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Skill Performance */}
        <Card className="chart-card" style={{ animationDelay: '0.35s' }}>
          <div className="chart-header">
            <div className="chart-icon" style={{ background: '#2563EB15' }}>
              <BarChart3 size={16} color="#2563EB" strokeWidth={2} />
            </div>
            <h3 className="chart-title">Skill Performance</h3>
          </div>
          
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={perfData} barGap={8}>
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)', fontWeight: 500 }} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                domain={[0, 100]} 
                tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)', fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                formatter={(v) => `${v}%`}
                contentStyle={{
                  background: 'var(--color-background-primary)',
                  border: '0.5px solid var(--color-border)',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  padding: '8px 12px',
                }}
              />
              <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                {perfData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} opacity={0.75} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="quick-actions-card" style={{ animationDelay: '0.4s' }}>
        <h3 className="quick-actions-title">Quick actions</h3>
        <div className="quick-actions-grid">
          <QuickActionButton
            icon={Plus}
            label="Add Candidate"
            onClick={() => navigate('/hr/candidates')}
            color="#F43F5E"
          />
          <QuickActionButton
            icon={Settings}
            label="Manage Roles"
            onClick={() => navigate('/hr/roles')}
            color="#2563EB"
          />
          <QuickActionButton
            icon={FileText}
            label="Question Bank"
            onClick={() => navigate('/hr/questions')}
            color="#16A34A"
          />
          <QuickActionButton
            icon={BarChart3}
            label="View Analytics"
            onClick={() => navigate('/hr/analytics')}
            color="#7C3AED"
          />
        </div>
      </Card>
    </div>
  );
}
