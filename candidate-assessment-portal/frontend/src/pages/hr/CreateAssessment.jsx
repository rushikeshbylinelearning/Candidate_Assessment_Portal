import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Zap, List, ChevronRight, ClipboardList,
  Clock, Users, CheckCircle, XCircle, FileUp,
} from 'lucide-react';
import api from '../../utils/api';

export default function CreateAssessment() {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/assessments')
      .then(res => setAssessments(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const modes = [
    {
      key: 'adaptive',
      icon: Zap,
      iconBg: 'linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%)',
      iconColor: '#2563eb',
      accentColor: '#2563eb',
      badgeBg: '#dbeafe',
      badgeColor: '#1d4ed8',
      badge: 'AI-Powered',
      title: 'Adaptive Mode',
      subtitle: 'Dynamic question selection',
      description:
        "Questions are selected dynamically based on candidate responses. Difficulty adjusts automatically to match the candidate's performance level.",
      cta: 'Select Adaptive Mode',
      path: '/hr/assessments/create/adaptive',
    },
    {
      key: 'standard',
      icon: List,
      iconBg: 'linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%)',
      iconColor: '#16a34a',
      accentColor: '#16a34a',
      badgeBg: '#dcfce7',
      badgeColor: '#15803d',
      badge: 'Fixed Set',
      title: 'Standard Mode',
      subtitle: 'Pre-selected questions',
      description:
        'Questions are pre-selected from the question bank. All candidates receive the same set of questions in a fixed order.',
      cta: 'Select Standard Mode',
      path: '/hr/assessments/create/standard',
    },
    {
      key: 'pdf',
      icon: FileUp,
      iconBg: 'linear-gradient(135deg,#fdf4ff 0%,#fae8ff 100%)',
      iconColor: '#9333ea',
      accentColor: '#9333ea',
      badgeBg: '#fae8ff',
      badgeColor: '#7e22ce',
      badge: 'New',
      title: 'Import from PDF',
      subtitle: 'Upload & auto-generate',
      description:
        'Upload a PDF or Word document (evaluation form, question paper, etc.) and the system will automatically extract and create questions — MCQ, checkbox, or descriptive.',
      cta: 'Import from PDF',
      path: '/hr/assessments/create/pdf',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>

        {/* Back */}
        <button
          onClick={() => navigate('/hr/questions')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            color: '#64748b', background: 'none', border: 'none',
            cursor: 'pointer', fontSize: 14, marginBottom: 32,
            padding: '6px 0',
          }}
        >
          <ArrowLeft size={16} /> Back to Question Bank
        </button>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
            Create New Assessment
          </h1>
          <p style={{ color: '#64748b', marginTop: 8, fontSize: 15 }}>
            Choose how you'd like to build your assessment
          </p>
        </div>

        {/* Mode Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 52 }}>
          {modes.map(mode => {
            const Icon = mode.icon;
            return (
              <div
                key={mode.key}
                onClick={() => navigate(mode.path)}
                style={{
                  background: '#fff',
                  borderRadius: 20,
                  border: '1.5px solid #e2e8f0',
                  padding: '28px 24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  cursor: 'pointer',
                  transition: 'all 0.22s cubic-bezier(.4,0,.2,1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0,
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = `0 12px 32px rgba(0,0,0,0.12)`;
                  e.currentTarget.style.borderColor = mode.accentColor + '55';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Decorative top bar */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                  background: mode.accentColor, borderRadius: '20px 20px 0 0',
                }} />

                {/* Badge */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.5px',
                    background: mode.badgeBg, color: mode.badgeColor,
                    padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase',
                  }}>
                    {mode.badge}
                  </span>
                </div>

                {/* Icon + title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: mode.iconBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    boxShadow: `0 4px 12px ${mode.accentColor}22`,
                  }}>
                    <Icon size={26} color={mode.iconColor} />
                  </div>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>{mode.title}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3, fontWeight: 500 }}>{mode.subtitle}</div>
                  </div>
                </div>

                {/* Description */}
                <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.75, marginBottom: 24, flexGrow: 1 }}>
                  {mode.description}
                </p>

                {/* CTA */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  color: mode.accentColor, fontWeight: 700, fontSize: 14,
                  paddingTop: 16, borderTop: '1px solid #f1f5f9',
                }}>
                  {mode.cta} <ChevronRight size={16} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Created Assessments */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Created Assessments</h2>
            {assessments.length > 0 && (
              <span style={{
                fontSize: 12, fontWeight: 600, background: '#f1f5f9',
                color: '#64748b', padding: '4px 12px', borderRadius: 20,
              }}>
                {assessments.length} total
              </span>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8', fontSize: 14 }}>
              <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              Loading assessments...
            </div>
          ) : assessments.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '56px 0',
              background: '#fff', borderRadius: 20,
              border: '1.5px dashed #e2e8f0',
            }}>
              <ClipboardList size={40} color="#cbd5e1" style={{ margin: '0 auto 14px' }} />
              <p style={{ color: '#94a3b8', fontSize: 14, fontWeight: 500 }}>No assessments created yet</p>
              <p style={{ color: '#cbd5e1', fontSize: 13, marginTop: 4 }}>Choose a mode above to get started</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {assessments.map(a => (
                <div
                  key={a._id}
                  style={{
                    background: '#fff',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: 14,
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.18s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.09)';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                  onClick={() => navigate(`/hr/assessments/${a._id}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 11,
                      background: 'linear-gradient(135deg,#eff6ff,#dbeafe)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <ClipboardList size={20} color="#2563eb" />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{a.title}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                        {a.roleId?.title || 'No role'}{a.roleId?.department ? ` · ${a.roleId.department}` : ''}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748b', fontSize: 13 }}>
                      <Clock size={13} /> {a.duration} min
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748b', fontSize: 13 }}>
                      <Users size={13} /> {a.totalQuestions} questions
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 5, fontSize: 12,
                      fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                      background: a.active ? '#dcfce7' : '#f1f5f9',
                      color: a.active ? '#15803d' : '#94a3b8',
                    }}>
                      {a.active ? <><CheckCircle size={12} /> Active</> : <><XCircle size={12} /> Inactive</>}
                    </div>
                    <ChevronRight size={15} color="#cbd5e1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
