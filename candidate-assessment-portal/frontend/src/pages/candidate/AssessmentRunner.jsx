import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Clock, ChevronLeft, ChevronRight, Send, AlertTriangle, CheckCircle2, Circle } from 'lucide-react';

// ── Timer hook ──────────────────────────────────────────────────────────────
function useTimer(durationMinutes, onExpire) {
  const [secondsLeft, setSecondsLeft] = useState(null);
  const intervalRef = useRef(null);

  const start = useCallback((remaining) => {
    setSecondsLeft(remaining);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [onExpire]);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const fmt = (s) => {
    if (s === null) return '--:--';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return { secondsLeft, start, fmt };
}

// ── Question renderer ────────────────────────────────────────────────────────
function QuestionCard({ question, answer, onChange }) {
  const { type, text, options } = question;

  const optStyle = (id, selected) => ({
    display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
    borderRadius: 10, border: `2px solid ${selected ? '#e11d48' : '#e2e8f0'}`,
    background: selected ? '#fff1f2' : '#fff', cursor: 'pointer',
    transition: 'all 0.15s', marginBottom: 10,
  });

  if (type === 'mcq_single' || type === 'true_false') {
    return (
      <div>
        {options.map(opt => {
          const selected = answer === opt.id;
          return (
            <div key={opt.id} style={optStyle(opt.id, selected)} onClick={() => onChange(opt.id)}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', border: `2px solid ${selected ? '#e11d48' : '#cbd5e1'}`,
                background: selected ? '#e11d48' : 'transparent', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {selected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
              </div>
              <span style={{ fontSize: 15, color: '#334155', fontWeight: selected ? 600 : 400 }}>{opt.text}</span>
            </div>
          );
        })}
      </div>
    );
  }

  if (type === 'mcq_multi') {
    const selected = Array.isArray(answer) ? answer : [];
    const toggle = (id) => {
      const next = selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id];
      onChange(next);
    };
    return (
      <div>
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>Select all that apply</p>
        {options.map(opt => {
          const isSelected = selected.includes(opt.id);
          return (
            <div key={opt.id} style={optStyle(opt.id, isSelected)} onClick={() => toggle(opt.id)}>
              <div style={{
                width: 20, height: 20, borderRadius: 5, border: `2px solid ${isSelected ? '#e11d48' : '#cbd5e1'}`,
                background: isSelected ? '#e11d48' : 'transparent', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isSelected && <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>✓</span>}
              </div>
              <span style={{ fontSize: 15, color: '#334155', fontWeight: isSelected ? 600 : 400 }}>{opt.text}</span>
            </div>
          );
        })}
      </div>
    );
  }

  if (type === 'short_answer' || type === 'scenario' || type === 'logic' || type === 'coding') {
    const placeholder = type === 'coding'
      ? '// Write your code here...'
      : type === 'scenario'
      ? 'Describe your approach to this scenario...'
      : 'Write your answer here...';
    return (
      <textarea
        value={answer || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={type === 'coding' ? 10 : 6}
        style={{
          width: '100%', padding: '14px 16px', borderRadius: 10,
          border: '2px solid #e2e8f0', fontSize: type === 'coding' ? 13 : 15,
          fontFamily: type === 'coding' ? 'monospace' : 'inherit',
          outline: 'none', resize: 'vertical', color: '#334155',
          lineHeight: 1.6, boxSizing: 'border-box',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => e.target.style.borderColor = '#e11d48'}
        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
      />
    );
  }

  return <p style={{ color: '#94a3b8' }}>Unsupported question type: {type}</p>;
}

// ── Main component ───────────────────────────────────────────────────────────
export default function AssessmentRunner() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState({});        // { questionId: answer }
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const questionStartRef = useRef(Date.now());
  const saveQueueRef = useRef({});
  const saveTimerRef = useRef(null);

  // Tab-switch detection
  const tabSwitchCount = useRef(0);
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        tabSwitchCount.current += 1;
        if (tabSwitchCount.current <= 3) {
          toast('Please stay on this tab during the assessment', { icon: '⚠️', duration: 4000 });
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Auto-submit on timer expire
  const handleExpire = useCallback(() => {
    toast('Time is up! Submitting your assessment...', { icon: '⏰', duration: 3000 });
    setTimeout(() => doSubmit(true), 2000);
  }, []);

  const { secondsLeft, start, fmt } = useTimer(0, handleExpire);

  // Load session
  useEffect(() => {
    axios.get(`/api/tokens/session/${token}`)
      .then(r => {
        const data = r.data;
        setSession(data);

        // Restore existing answers
        const restored = {};
        (data.existingResponses || []).forEach(resp => {
          restored[resp.questionId] = resp.answer;
        });
        setAnswers(restored);

        // Calculate remaining time
        const elapsed = data.existingResponses?.length > 0
          ? (data.existingResponses.reduce((sum, r) => sum + (r.timeSpent || 0), 0))
          : 0;
        const totalSecs = data.assessment.duration * 60;
        const remaining = Math.max(totalSecs - elapsed, 30);
        start(remaining);
      })
      .catch(err => {
        const msg = err.response?.data?.message || 'Failed to load assessment';
        if (err.response?.status === 409) {
          navigate(`/assessment/${token}/complete`);
        } else {
          setError(msg);
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  // Flush save queue
  const flushSave = useCallback(async (qId, ans) => {
    if (!session) return;
    const timeSpent = Math.floor((Date.now() - questionStartRef.current) / 1000);
    setSaving(true);
    try {
      await axios.post('/api/tokens/answer', {
        tokenValue: token,
        questionId: qId,
        answer: ans,
        timeSpent,
      });
    } catch {
      // silent — will retry on next change
    } finally {
      setSaving(false);
    }
  }, [token, session]);

  // Debounced save
  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    clearTimeout(saveTimerRef.current);
    saveQueueRef.current[questionId] = value;
    saveTimerRef.current = setTimeout(() => {
      flushSave(questionId, value);
    }, 800);
  };

  const goTo = (index) => {
    if (!session) return;
    const q = session.questions[current];
    if (q && answers[q._id] !== undefined) {
      flushSave(q._id, answers[q._id]);
    }
    questionStartRef.current = Date.now();
    setCurrent(index);
  };

  const doSubmit = async (forced = false) => {
    setSubmitting(true);
    // Flush any pending saves first
    const pending = Object.entries(saveQueueRef.current);
    for (const [qId, ans] of pending) {
      await flushSave(qId, ans).catch(() => {});
    }
    try {
      await axios.post('/api/tokens/submit', { tokenValue: token });
      navigate(`/assessment/${token}/complete`);
    } catch (err) {
      if (err.response?.status === 409) {
        navigate(`/assessment/${token}/complete`);
      } else {
        toast.error('Submission failed. Please try again.');
        setSubmitting(false);
        setShowConfirm(false);
      }
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#64748b' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#e11d48', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        Restoring your session...
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <AlertTriangle size={48} color="#e11d48" style={{ margin: '0 auto 16px', display: 'block' }} />
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Session Error</h2>
        <p style={{ color: '#64748b' }}>{error}</p>
      </div>
    </div>
  );

  const questions = session.questions;
  const q = questions[current];
  const totalQ = questions.length;
  const answered = Object.keys(answers).filter(id => {
    const a = answers[id];
    return a !== null && a !== undefined && a !== '' && !(Array.isArray(a) && a.length === 0);
  }).length;
  const progress = Math.round((answered / totalQ) * 100);
  const isAnswered = (id) => {
    const a = answers[id];
    return a !== null && a !== undefined && a !== '' && !(Array.isArray(a) && a.length === 0);
  };

  const timerColor = secondsLeft !== null && secondsLeft < 300 ? '#e11d48' : secondsLeft < 600 ? '#d97706' : '#16a34a';

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } } 
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @media (max-width: 768px) {
          .assessment-topbar { padding: 0 12px !important; height: auto !important; min-height: 60px; flex-wrap: wrap; gap: 8px; }
          .assessment-title { font-size: 13px !important; }
          .assessment-subtitle { font-size: 11px !important; }
          .assessment-stats { gap: 8px !important; }
          .timer-badge { padding: 4px 10px !important; }
          .timer-text { font-size: 13px !important; }
          .answered-count { font-size: 12px !important; }
          .saving-indicator { display: none !important; }
          .assessment-container { flex-direction: column !important; padding: 12px !important; gap: 16px !important; }
          .question-card { padding: 20px !important; border-radius: 12px !important; }
          .question-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          .question-badges { gap: 6px !important; }
          .answered-badge { margin-top: 8px; }
          .answered-text { display: none; }
          .question-nav { flex-direction: column-reverse !important; }
          .nav-btn { width: 100% !important; justify-content: center !important; padding: 12px 20px !important; }
          .nav-text { display: inline; }
          .question-sidebar { width: 100% !important; order: -1; }
          .question-panel { width: 100% !important; }
        }
      `}</style>

      {/* Top bar */}
      <div className="assessment-topbar" style={{
        background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 24px',
        height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div>
          <div className="assessment-title" style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{session.assessment.title}</div>
          <div className="assessment-subtitle" style={{ fontSize: 12, color: '#94a3b8' }}>{session.role?.title}</div>
        </div>

        <div className="assessment-stats" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {saving && (
            <span className="saving-indicator" style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#94a3b8', animation: 'pulse 1s infinite' }} />
              Saving...
            </span>
          )}
          <div className="timer-badge" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: `${timerColor}15`, border: `1px solid ${timerColor}30` }}>
            <Clock size={14} color={timerColor} />
            <span className="timer-text" style={{ fontSize: 15, fontWeight: 700, color: timerColor, fontVariantNumeric: 'tabular-nums' }}>{fmt(secondsLeft)}</span>
          </div>
          <div className="answered-count" style={{ fontSize: 13, color: '#64748b' }}>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>{answered}</span>/{totalQ} answered
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: '#f1f5f9' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: '#e11d48', transition: 'width 0.4s' }} />
      </div>

      <div className="assessment-container" style={{ flex: 1, display: 'flex', maxWidth: 1100, margin: '0 auto', width: '100%', padding: '24px 16px', gap: 24, alignItems: 'flex-start' }}>

        {/* Question panel */}
        <div className="question-panel" style={{ flex: 1, minWidth: 0 }}>
          <div className="question-card" style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            {/* Question header */}
            <div className="question-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div className="question-badges" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>Question {current + 1} of {totalQ}</span>
                <span style={{ padding: '2px 10px', borderRadius: 20, background: '#f1f5f9', fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'capitalize' }}>
                  {q.category}
                </span>
                <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
                  background: q.difficulty === 'hard' ? '#fef2f2' : q.difficulty === 'medium' ? '#fffbeb' : '#f0fdf4',
                  color: q.difficulty === 'hard' ? '#e11d48' : q.difficulty === 'medium' ? '#d97706' : '#16a34a',
                }}>
                  {q.difficulty}
                </span>
                <span style={{ padding: '2px 10px', borderRadius: 20, background: '#eff6ff', fontSize: 12, fontWeight: 600, color: '#2563eb' }}>
                  {q.points} pt{q.points !== 1 ? 's' : ''}
                </span>
              </div>
              {isAnswered(q._id) && (
                <div className="answered-badge" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#16a34a', fontSize: 13, fontWeight: 600 }}>
                  <CheckCircle2 size={16} /> <span className="answered-text">Answered</span>
                </div>
              )}
            </div>

            {/* Question text */}
            <p style={{ fontSize: 17, color: '#0f172a', lineHeight: 1.7, marginBottom: 28, fontWeight: 500 }}>{q.text}</p>

            {/* Answer input */}
            <QuestionCard
              question={q}
              answer={answers[q._id]}
              onChange={(val) => handleAnswer(q._id, val)}
            />

            {/* Navigation */}
            <div className="question-nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, paddingTop: 24, borderTop: '1px solid #f1f5f9', gap: 12 }}>
              <button
                onClick={() => goTo(current - 1)}
                disabled={current === 0 || (!session.assessment.allowBacktrack && current > 0)}
                className="nav-btn"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px',
                  borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff',
                  color: '#475569', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                  opacity: (current === 0 || (!session.assessment.allowBacktrack && current > 0)) ? 0.4 : 1,
                }}
              >
                <ChevronLeft size={16} /> <span className="nav-text">Previous</span>
              </button>

              {current < totalQ - 1 ? (
                <button
                  onClick={() => goTo(current + 1)}
                  className="nav-btn"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px',
                    borderRadius: 8, background: '#e11d48', color: '#fff',
                    border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                  }}
                >
                  <span className="nav-text">Next</span> <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  onClick={() => setShowConfirm(true)}
                  className="nav-btn submit-btn"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px',
                    borderRadius: 8, background: '#16a34a', color: '#fff',
                    border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                  }}
                >
                  <Send size={15} /> <span className="nav-text">Submit Assessment</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Question navigator sidebar */}
        <div className="question-sidebar" style={{ width: 220, flexShrink: 0 }}>
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Questions
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {questions.map((qs, i) => {
                const done = isAnswered(qs._id);
                const isCurrent = i === current;
                return (
                  <button
                    key={qs._id}
                    onClick={() => goTo(i)}
                    title={`Q${i + 1} — ${qs.category}`}
                    style={{
                      width: '100%', aspectRatio: '1', borderRadius: 6, border: 'none',
                      background: isCurrent ? '#e11d48' : done ? '#dcfce7' : '#f1f5f9',
                      color: isCurrent ? '#fff' : done ? '#16a34a' : '#64748b',
                      fontWeight: 700, fontSize: 12, cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                ['#e11d48', '#fff', 'Current'],
                ['#dcfce7', '#16a34a', 'Answered'],
                ['#f1f5f9', '#64748b', 'Unanswered'],
              ].map(([bg, color, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, background: bg, border: `1px solid ${color}30` }} />
                  <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Progress</div>
              <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3 }}>
                <div style={{ height: '100%', width: `${progress}%`, background: '#e11d48', borderRadius: 3, transition: 'width 0.4s' }} />
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>{answered}/{totalQ} answered</div>
            </div>

            {answered === totalQ && (
              <button
                onClick={() => setShowConfirm(true)}
                style={{
                  width: '100%', marginTop: 16, padding: '10px', borderRadius: 8,
                  background: '#16a34a', color: '#fff', border: 'none',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <Send size={14} /> Submit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirm submit modal */}
      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 36, maxWidth: 440, width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.2)' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Send size={24} color="#16a34a" />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Submit Assessment?</h2>
              <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>
                You've answered <strong>{answered}</strong> of <strong>{totalQ}</strong> questions.
                {answered < totalQ && <span style={{ color: '#d97706' }}> {totalQ - answered} question{totalQ - answered > 1 ? 's' : ''} unanswered.</span>}
              </p>
              <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 8 }}>This action cannot be undone.</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
                style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
              >
                Review Answers
              </button>
              <button
                onClick={() => doSubmit(false)}
                disabled={submitting}
                style={{ flex: 1, padding: '12px', borderRadius: 10, background: '#16a34a', color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? 'Submitting...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
