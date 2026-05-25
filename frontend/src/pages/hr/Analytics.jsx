import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAnalytics } from '../../hooks/useAnalytics';
import { fetchAllWorkflowData } from '../../services/workflowApi';
import Card from '../../components/ui/Card';
import { BarChart3, RefreshCw, AlertCircle } from 'lucide-react';
import '../../styles/Analytics.css';
import '../../styles/SquircleHeader.css';
import PageShell from '../../components/layout/PageShell';

const COLORS = ['#e11d48', '#2563eb', '#16a34a', '#d97706', '#7c3aed', '#0891b2'];

export default function Analytics() {
  const { overview, funnel, performance, loading, refresh } = useAnalytics();
  const [workflowData, setWorkflowData] = useState(null);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [workflowError, setWorkflowError] = useState(null);

  useEffect(() => {
    loadWorkflowData();
  }, []);

  const loadAnalytics = async () => {
    await refresh();
    await loadWorkflowData();
  };

  const loadWorkflowData = async () => {
    setWorkflowLoading(true);
    setWorkflowError(null);
    try {
      const data = await fetchAllWorkflowData();
      setWorkflowData(data);
    } catch (error) {
      console.error('Failed to load workflow data:', error);
      setWorkflowError(error.message || 'Failed to load workflow data');
    } finally {
      setWorkflowLoading(false);
    }
  };

  if (loading) return <PageShell><div className="analytics-loading">Loading analytics...</div></PageShell>;

  const perfData = performance ? Object.entries(performance).map(([k, v]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: v })) : [];
  const statusData = overview ? [
    { name: 'Pending', value: overview.pendingAssessments },
    { name: 'Completed', value: overview.completedAssessments },
    { name: 'Shortlisted', value: overview.shortlisted },
    { name: 'Hired', value: overview.hired },
    { name: 'Rejected', value: overview.rejected },
  ] : [];

  const insights = [];
  if (overview?.passRate < 40) insights.push({ type: 'warning', text: 'Low pass rate detected — assessment may be too difficult or candidates need better screening.' });
  if (performance?.technical < 50) insights.push({ type: 'danger', text: 'Candidates are scoring low on technical questions — consider reviewing question difficulty.' });
  if (performance?.communication > performance?.technical) insights.push({ type: 'info', text: 'Candidates are stronger in communication than technical skills.' });
  if (overview?.completedAssessments > 0 && overview?.shortlisted / overview?.completedAssessments < 0.2) insights.push({ type: 'warning', text: 'Low shortlisting rate — review assessment pass threshold.' });

  return (
    <PageShell scrollable>
      <div>
      {/* Squircle Header */}
      <div className="squircle-header">
        <div className="squircle-header-icon">
          <BarChart3 size={20} />
        </div>
        <div className="squircle-header-content">
          <h1>Analytics</h1>
          <p>Performance insights and trends</p>
        </div>
        <button 
          onClick={loadWorkflowData} 
          disabled={workflowLoading}
          style={{
            marginLeft: 'auto',
            padding: '8px 16px',
            background: '#e11d48',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: workflowLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          <RefreshCw size={16} className={workflowLoading ? 'spin' : ''} />
          {workflowLoading ? 'Loading...' : 'Refresh Workflow Data'}
        </button>
      </div>

      {/* KPI Row */}
      <div className="analytics-kpi-grid">
        {[
          ['Total Candidates', overview?.totalCandidates, '#e11d48'],
          ['Completed', overview?.completedAssessments, '#2563eb'],
          ['Pass Rate', `${overview?.passRate ?? 0}%`, '#16a34a'],
          ['Avg Score', `${overview?.averageScore ?? 0}%`, '#d97706'],
          ['Hired', overview?.hired, '#7c3aed'],
        ].map(([label, value, color]) => (
          <Card key={label} className="analytics-kpi-card">
            <div className="analytics-kpi-value" style={{ color }}>{value ?? '—'}</div>
            <div className="analytics-kpi-label">{label}</div>
          </Card>
        ))}
      </div>

      {/* Workflow Data Section */}
      {workflowError && (
        <Card style={{ marginBottom: 20, background: '#fef2f2', border: '1px solid #fecaca' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#991b1b' }}>
            <AlertCircle size={20} />
            <div>
              <strong>Workflow API Error:</strong> {workflowError}
            </div>
          </div>
        </Card>
      )}

      {workflowData && (
        <>
          <Card style={{ marginBottom: 20, background: '#f0f9ff', border: '1px solid #bae6fd' }}>
            <h3 className="analytics-chart-title" style={{ color: '#0369a1', marginBottom: 16 }}>
              Workflow Analytics Data
            </h3>
            
            {workflowData.overview && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#0c4a6e' }}>Overview</h4>
                <div className="analytics-kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                  {Object.entries(workflowData.overview).map(([key, value]) => (
                    <div key={key} style={{ 
                      padding: '12px', 
                      background: 'white', 
                      borderRadius: '8px',
                      border: '1px solid #e0f2fe'
                    }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#0369a1' }}>
                        {typeof value === 'number' ? value : value}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {workflowData.funnel && workflowData.funnel.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#0c4a6e' }}>Workflow Funnel</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={workflowData.funnel} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="stage" type="category" tick={{ fontSize: 12 }} width={100} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0369a1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {workflowData.performance && (
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#0c4a6e' }}>Workflow Performance</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                  {Object.entries(workflowData.performance).map(([key, value]) => (
                    <div key={key} style={{ 
                      padding: '12px', 
                      background: 'white', 
                      borderRadius: '8px',
                      border: '1px solid #e0f2fe',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#0369a1' }}>
                        {value}%
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, textTransform: 'capitalize' }}>
                        {key}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </>
      )}

      {/* Charts */}
      <div className="analytics-charts-grid">
        <Card>
          <h3 className="analytics-chart-title">Hiring Funnel</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={funnel} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="stage" type="category" tick={{ fontSize: 12 }} width={100} />
              <Tooltip />
              <Bar dataKey="count" fill="#e11d48" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="analytics-chart-title">Candidate Status Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <h3 className="analytics-chart-title">Average Score by Skill Category</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={perfData}>
            <XAxis dataKey="name" tick={{ fontSize: 13 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
            <Tooltip formatter={v => `${v}%`} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {perfData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Insights */}
      {insights.length > 0 && (
        <Card>
          <h3 className="analytics-insights-title">AI-Ready Insights</h3>
          <div className="analytics-insights-list">
            {insights.map((ins, i) => (
              <div key={i} className={`analytics-insight-item ${ins.type}`}>
                {ins.text}
              </div>
            ))}
          </div>
        </Card>
      )}
      </div>
    </PageShell>
  );
}
