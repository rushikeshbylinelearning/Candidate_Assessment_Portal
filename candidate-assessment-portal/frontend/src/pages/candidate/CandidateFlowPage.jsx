import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import StepRenderer from '../../components/pipeline/StepRenderer';

const STEP_META = {
  EVALUATION_FORM:       { label: 'Evaluation Form',       icon: '📋' },
  LANGUAGE_ASSESSMENT:   { label: 'Language Assessment',   icon: '🌐' },
  ROLE_BASED_ASSESSMENT: { label: 'Role Assessment',       icon: '💼' },
  INTERVIEW_INTERACTION: { label: 'Interview Interaction', icon: '🎤' },
  POST_INTERVIEW_FEEDBACK: { label: 'Post-Interview Feedback', icon: '📝' },
};

export default function CandidateFlowPage() {
  const { token } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(null);

  const initSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      localStorage.setItem('pipeline_token', token);
      const headers = { 'x-pipeline-token': token };
      const { data } = await axios.post('/api/pipeline/session', {}, { headers });
      const pipeline = data.pipeline || data;

      if (pipeline._id && pipeline.currentStep && pipeline.stepStatus?.[pipeline.currentStep] === 'IN_PROGRESS') {
        const resumeRes = await axios.post(`/api/pipeline/${pipeline._id}/resume`, {}, { headers });
        setSession(resumeRes.data.pipeline || resumeRes.data);
      } else {
        setSession(pipeline);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired token.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { if (token) initSession(); }, [token, initSession]);

  useEffect(() => {
    if (!session?.remainingTime) { setCountdown(null); return; }
    let seconds = session.remainingTime * 60;
    setCountdown(seconds);
    const interval = setInterval(() => {
      seconds -= 1;
      setCountdown(seconds);
      if (seconds <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [session?.remainingTime, session?.currentStep]);

  const handleStepComplete = useCallback(async () => { await initSession(); }, [initSession]);

  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.spinner} />
        <p style={{ color: '#64748b', marginTop: 16 }}>Loading your assessment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.center}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2 style={{ color: '#0f172a', marginBottom: 8 }}>Access Denied</h2>
        <p style={{ color: '#64748b' }}>{error}</p>
      </div>
    );
  }

  // Build ordered steps list from stepConfigSnapshot or stepStatus keys
  const stepConfig = session?.stepConfigSnapshot || [];
  const orderedSteps = stepConfig.length > 0
    ? stepConfig.map(s => s.stepType)
    : Object.keys(session?.stepStatus || {});

  const stepStatus = session?.stepStatus || {};
  const currentStep = session?.currentStep;

  const completedCount = orderedSteps.filter(
    s => stepStatus[s]?.status === 'COMPLETED' || stepStatus[s]?.status === 'SKIPPED'
  ).length;
  const totalSteps = orderedSteps.length;
  const progressPct = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  return (
    <div style={styles.page}>
      {/* ── TOP HEADER BAR ── */}
      <div style={styles.topBar}>
        <div style={styles.topBarInner}>
          <div style={styles.topBarLogo}>
            <div style={styles.logoIcon}>H</div>
            <span style={styles.logoText}>HireOS Assessment</span>
          </div>
          <div style={styles.topBarRight}>
            {countdown !== null && (
              <div style={styles.timer}>
                ⏱ {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
              </div>
            )}
            <div style={styles.progressPill}>
              {completedCount}/{totalSteps} Steps
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div style={styles.topProgressBar}>
          <div style={{ ...styles.topProgressFill, width: `${progressPct}%` }} />
        </div>
      </div>

      {/* ── BODY: SIDEBAR + CONTENT ── */}
      <div style={styles.body}>

        {/* ── LEFT SIDEBAR ── */}
        <aside style={styles.sidebar}>
          <p style={styles.sidebarTitle}>YOUR PROGRESS</p>
          <div style={styles.stepList}>
            {orderedSteps.map((stepType, idx) => {
              const meta = STEP_META[stepType] || { label: stepType, icon: '📄' };
              const status = stepStatus[stepType]?.status || 'NOT_STARTED';
              const isCurrent = stepType === currentStep;
              const isDone = status === 'COMPLETED' || status === 'SKIPPED';
              const isLast = idx === orderedSteps.length - 1;

              return (
                <div key={stepType} style={styles.stepRow}>
                  {/* Icon + connector column */}
                  <div style={styles.stepIconCol}>
                    <div style={{
                      ...styles.stepCircle,
                      background: isDone ? '#10b981' : isCurrent ? '#e11d48' : '#e2e8f0',
                      color: isDone || isCurrent ? '#fff' : '#94a3b8',
                      boxShadow: isCurrent ? '0 0 0 4px rgba(225,29,72,0.15)' : 'none',
                    }}>
                      {isDone ? '✓' : meta.icon}
                    </div>
                    {/* Trailing connector line */}
                    {!isLast && (
                      <div style={{
                        ...styles.connector,
                        background: isDone ? '#10b981' : '#e2e8f0',
                      }} />
                    )}
                  </div>

                  {/* Label column */}
                  <div style={styles.stepLabelCol}>
                    <span style={{
                      ...styles.stepLabel,
                      color: isCurrent ? '#0f172a' : isDone ? '#10b981' : '#94a3b8',
                      fontWeight: isCurrent ? 700 : isDone ? 600 : 400,
                    }}>
                      {meta.label}
                    </span>
                    <span style={{
                      ...styles.stepStatus,
                      color: isDone ? '#10b981' : isCurrent ? '#e11d48' : '#cbd5e1',
                    }}>
                      {isDone ? 'Completed' : isCurrent ? 'In Progress' : 'Pending'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── RIGHT CONTENT ── */}
        <main style={styles.content}>
          <StepRenderer
            currentStep={currentStep}
            pipelineId={session?._id}
            partialData={session?.partialData}
            remainingTime={session?.remainingTime}
            onStepComplete={handleStepComplete}
          />
        </main>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f1f5f9',
    display: 'flex',
    flexDirection: 'column',
  },

  /* Top bar */
  topBar: {
    background: '#fff',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  topBarInner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '14px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: '#e11d48',
    color: '#fff',
    fontWeight: 800,
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontWeight: 700,
    fontSize: 16,
    color: '#0f172a',
  },
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  timer: {
    fontSize: 13,
    fontWeight: 700,
    color: '#e11d48',
    background: '#fff1f2',
    padding: '5px 12px',
    borderRadius: 20,
    border: '1px solid #fecdd3',
  },
  progressPill: {
    fontSize: 13,
    fontWeight: 600,
    color: '#475569',
    background: '#f1f5f9',
    padding: '5px 12px',
    borderRadius: 20,
    border: '1px solid #e2e8f0',
  },
  topProgressBar: {
    height: 3,
    background: '#f1f5f9',
    overflow: 'hidden',
  },
  topProgressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #e11d48, #f43f5e)',
    transition: 'width 0.4s ease',
  },

  /* Body */
  body: {
    flex: 1,
    maxWidth: 1200,
    width: '100%',
    margin: '0 auto',
    padding: '32px 24px',
    display: 'flex',
    gap: 28,
    alignItems: 'flex-start',
  },

  /* Sidebar */
  sidebar: {
    width: 260,
    flexShrink: 0,
    background: '#fff',
    borderRadius: 16,
    padding: '24px 20px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    border: '1px solid #e2e8f0',
    position: 'sticky',
    top: 80,
  },
  sidebarTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: '#94a3b8',
    letterSpacing: '0.08em',
    marginBottom: 20,
    margin: '0 0 20px 0',
  },
  stepList: {
    display: 'flex',
    flexDirection: 'column',
  },
  stepRow: {
    display: 'flex',
    gap: 14,
    alignItems: 'flex-start',
  },
  stepIconCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flexShrink: 0,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 15,
    fontWeight: 700,
    transition: 'all 0.2s',
    flexShrink: 0,
  },
  connector: {
    width: 2,
    height: 36,
    borderRadius: 2,
    transition: 'background 0.3s',
  },
  stepLabelCol: {
    paddingTop: 6,
    paddingBottom: 36,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  stepLabel: {
    fontSize: 13,
    lineHeight: 1.3,
    transition: 'color 0.2s',
  },
  stepStatus: {
    fontSize: 11,
    fontWeight: 500,
    transition: 'color 0.2s',
  },

  /* Main content */
  content: {
    flex: 1,
    minWidth: 0,
    background: '#fff',
    borderRadius: 16,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    border: '1px solid #e2e8f0',
    padding: 36,
  },

  /* Utility */
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    textAlign: 'center',
    background: '#f1f5f9',
  },
  spinner: {
    width: 40,
    height: 40,
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #e11d48',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};
