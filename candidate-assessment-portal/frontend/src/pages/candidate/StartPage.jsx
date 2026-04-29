import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Clock, BookOpen, CheckCircle, AlertTriangle, ArrowRight, User } from 'lucide-react';

export default function StartPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get(`/api/tokens/session/${token}`)
      .then(r => setSession(r.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load assessment'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleStart = async () => {
    setStarting(true);
    try {
      await axios.post('/api/tokens/start', { tokenValue: token });
      navigate(`/assessment/${token}/run`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start assessment');
      setStarting(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#64748b' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#e11d48', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        Loading your assessment...
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <AlertTriangle size={48} color="#e11d48" style={{ margin: '0 auto 16px', display: 'block' }} />
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Access Denied</h2>
        <p style={{ color: '#64748b', marginBottom: 24 }}>{error}</p>
        <button onClick={() => navigate('/')} style={{ padding: '10px 24px', borderRadius: 8, background: '#e11d48', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
          Go Back
        </button>
      </div>
    </div>
  );

  const { candidate, assessment, role } = session;
  const expiresIn = Math.floor((new Date(session.expiresAt) - Date.now()) / (1000 * 60 * 60));

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .start-page-container { padding: 16px !important; }
          .start-header { margin-bottom: 24px !important; }
          .start-icon { width: 48px !important; height: 48px !important; margin-bottom: 12px !important; }
          .start-title { font-size: 22px !important; }
          .start-subtitle { font-size: 13px !important; }
          .candidate-card { padding: 14px 16px !important; gap: 10px !important; flex-wrap: wrap; }
          .candidate-avatar { width: 36px !important; height: 36px !important; font-size: 16px !important; }
          .candidate-name { font-size: 14px !important; }
          .candidate-email { font-size: 12px !important; }
          .expires-badge { font-size: 11px !important; width: 100%; margin-left: 0 !important; justify-content: flex-start; }
          .details-card { padding: 18px !important; }
          .details-title { font-size: 14px !important; margin-bottom: 12px !important; }
          .details-grid { grid-template-columns: 1fr !important; gap: 10px !important; }
          .detail-item { padding: 10px 12px !important; }
          .detail-label { font-size: 11px !important; }
          .detail-value { font-size: 14px !important; }
          .sections-title { font-size: 12px !important; }
          .section-badge { padding: 5px 12px !important; font-size: 12px !important; }
          .instructions-card { padding: 18px !important; }
          .instructions-title { font-size: 14px !important; margin-bottom: 12px !important; }
          .instruction-item { gap: 8px !important; }
          .instruction-text { font-size: 13px !important; }
          .start-button { padding: 14px !important; font-size: 15px !important; }
          .start-note { font-size: 12px !important; margin-top: 12px !important; }
        }
      `}</style>
      <div className="start-page-container" style={{ width: '100%', maxWidth: 600 }}>
        {/* Header */}
        <div className="start-header" style={{ textAlign: 'center', marginBottom: 32 }}>
          <div className="start-icon" style={{ width: 56, height: 56, borderRadius: 14, background: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <BookOpen size={28} color="#fff" />
          </div>
          <h1 className="start-title" style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>{assessment.title}</h1>
          <p className="start-subtitle" style={{ color: '#64748b', marginTop: 6 }}>{role?.title} · {role?.department}</p>
        </div>

        {/* Candidate greeting */}
        <div className="candidate-card" style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '18px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div className="candidate-avatar" style={{ width: 44, height: 44, borderRadius: '50%', background: '#e11d4815', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
            {candidate.name[0].toUpperCase()}
          </div>
          <div>
            <div className="candidate-name" style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Hello, {candidate.name}</div>
            <div className="candidate-email" style={{ fontSize: 13, color: '#64748b' }}>{candidate.email}</div>
          </div>
          <div className="expires-badge" style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={13} /> Expires in ~{expiresIn}h
          </div>
        </div>

        {/* Assessment details */}
        <div className="details-card" style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 24, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h3 className="details-title" style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Assessment Details</h3>
          <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              ['Total Questions', assessment.totalQuestions],
              ['Time Limit', `${assessment.duration} minutes`],
              ['Sections', assessment.sections?.length],
              ['Backtracking', assessment.allowBacktrack ? 'Allowed' : 'Not allowed'],
            ].map(([label, value]) => (
              <div key={label} className="detail-item" style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 10 }}>
                <div className="detail-label" style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{label}</div>
                <div className="detail-value" style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{value}</div>
              </div>
            ))}
          </div>

          {assessment.sections?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div className="sections-title" style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 10 }}>Sections</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {assessment.sections.map(s => (
                  <div key={s.name} className="section-badge" style={{ padding: '6px 14px', borderRadius: 20, background: '#f1f5f9', fontSize: 13, color: '#334155', fontWeight: 500 }}>
                    {s.name} <span style={{ color: '#94a3b8' }}>({s.questionCount}q)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="instructions-card" style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 24, marginBottom: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h3 className="instructions-title" style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Before You Begin</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              'Your answers are saved automatically — no need to worry about losing progress.',
              'A countdown timer will be visible throughout. The assessment auto-submits when time runs out.',
              'If you refresh the page, your session will be recovered from where you left off.',
              'Ensure you have a stable internet connection before starting.',
              'Read each question carefully before selecting your answer.',
            ].map((text, i) => (
              <div key={i} className="instruction-item" style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <CheckCircle size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
                <span className="instruction-text" style={{ fontSize: 14, color: '#475569', lineHeight: 1.5 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={starting}
          className="start-button"
          style={{
            width: '100%', padding: '15px', borderRadius: 12,
            background: starting ? '#94a3b8' : '#e11d48', color: '#fff',
            border: 'none', fontWeight: 700, fontSize: 16, cursor: starting ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: '0 4px 14px rgba(225,29,72,0.35)', transition: 'all 0.2s',
          }}
        >
          {starting ? 'Starting...' : <><span>Start Assessment</span><ArrowRight size={20} /></>}
        </button>
        <p className="start-note" style={{ textAlign: 'center', fontSize: 13, color: '#94a3b8', marginTop: 14 }}>
          Once started, the timer cannot be paused.
        </p>
      </div>
    </div>
  );
}
