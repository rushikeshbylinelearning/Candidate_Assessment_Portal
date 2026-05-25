import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Clock, CheckCircle2, PlayCircle, AlertCircle, LogOut,
  BookOpen, ChevronRight, ClipboardList, ChevronLeft,
} from 'lucide-react';

/* ─── Design tokens ─────────────────────────────────────────────────────── */
const T = {
  red:       '#E11D48',
  redHov:    '#BE123C',
  redSoft:   'rgba(225,29,72,0.08)',
  redBorder: 'rgba(225,29,72,0.2)',
  white:     '#FFFFFF',
  bg:        '#F8FAFC',
  border:    '#E5E7EB',
  text1:     '#111827',
  text2:     '#6B7280',
  text3:     '#9CA3AF',
  green:     '#16A34A',
  greenBg:   '#F0FDF4',
  greenBdr:  '#BBF7D0',
  yellow:    '#D97706',
  yellowBg:  '#FFFBEB',
  yellowBdr: '#FDE68A',
  blue:      '#2563EB',
  blueBg:    '#EFF6FF',
  blueBdr:   '#BFDBFE',
};

/* ─── Status badge config ───────────────────────────────────────────────── */
const STATUS_CONFIG = {
  pending:     { label: 'Pending',     bg: T.yellowBg, color: T.yellow, border: T.yellowBdr, icon: Clock },
  'in-progress': { label: 'In Progress', bg: T.blueBg,   color: T.blue,   border: T.blueBdr,   icon: PlayCircle },
  completed:   { label: 'Completed',   bg: T.greenBg,  color: T.green,  border: T.greenBdr,  icon: CheckCircle2 },
};

/* ─── Skeleton card ─────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{
      background: T.white, borderRadius: 12, border: `1px solid ${T.border}`,
      padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .sk { background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
              background-size: 800px 100%; animation: shimmer 1.4s infinite; border-radius: 6px; }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div className="sk" style={{ height: 20, width: '55%' }} />
        <div className="sk" style={{ height: 22, width: 80, borderRadius: 20 }} />
      </div>
      <div className="sk" style={{ height: 14, width: '35%', marginBottom: 16 }} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[60, 80, 70].map((w, i) => (
          <div key={i} className="sk" style={{ height: 24, width: w, borderRadius: 20 }} />
        ))}
      </div>
      <div className="sk" style={{ height: 38, width: '100%', borderRadius: 8 }} />
    </div>
  );
}

/* ─── Assessment card ───────────────────────────────────────────────────── */
function AssessmentCard({ assessment, onStart, isActive }) {
  const [hovered, setHovered] = useState(false);
  const cfg = STATUS_CONFIG[assessment.status] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;

  const isCompleted  = assessment.status === 'completed';
  const isInProgress = assessment.status === 'in-progress';
  const isPending    = assessment.status === 'pending';

  const btnLabel = isCompleted ? 'Completed' : isInProgress ? 'Continue' : 'Start Test';
  const btnDisabled = isCompleted;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: T.white,
        borderRadius: 12,
        border: `1px solid ${isActive && !isCompleted ? T.redBorder : T.border}`,
        padding: '20px',
        boxShadow: hovered
          ? '0 8px 24px rgba(0,0,0,0.10)'
          : '0 1px 3px rgba(0,0,0,0.06)',
        transform: hovered && !isCompleted ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        opacity: isCompleted ? 0.85 : 1,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Red top accent for active/in-progress */}
      {isActive && !isCompleted && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, ${T.redHov}, ${T.red})`,
        }} />
      )}

      {/* Top row: title + badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <h3 style={{
          fontSize: 15, fontWeight: 600, color: T.text1,
          margin: 0, lineHeight: 1.4, flex: 1, paddingRight: 12,
        }}>
          {assessment.title}
        </h3>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 10px', borderRadius: 20, flexShrink: 0,
          fontSize: 11, fontWeight: 600,
          background: cfg.bg, color: cfg.color,
          border: `1px solid ${cfg.border}`,
        }}>
          <StatusIcon size={11} />
          {cfg.label}
        </span>
      </div>

      {/* Duration */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        fontSize: 13, color: T.text2, marginBottom: 14,
      }}>
        <Clock size={13} color={T.text3} />
        <span>{assessment.duration}</span>
        {assessment.score !== null && assessment.score !== undefined && (
          <>
            <span style={{ color: T.border }}>·</span>
            <span style={{ color: T.green, fontWeight: 600 }}>Score: {Math.round(assessment.score)}%</span>
          </>
        )}
      </div>

      {/* Skills */}
      {assessment.skills && assessment.skills.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
          {assessment.skills.map((skill, i) => (
            <span key={i} style={{
              padding: '3px 10px', borderRadius: 20,
              background: T.bg, border: `1px solid ${T.border}`,
              fontSize: 12, color: T.text2, fontWeight: 500,
            }}>
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Spacer to push button to bottom */}
      <div style={{ flex: 1 }} />

      {/* CTA button */}
      <button
        onClick={() => !btnDisabled && onStart(assessment)}
        disabled={btnDisabled}
        style={{
          width: '100%', padding: '10px 16px',
          borderRadius: 8, border: 'none',
          background: btnDisabled
            ? T.greenBg
            : hovered ? T.redHov : T.red,
          color: btnDisabled ? T.green : T.white,
          fontWeight: 600, fontSize: 14,
          cursor: btnDisabled ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          transition: 'background 0.2s',
          marginTop: assessment.skills?.length > 0 ? 0 : 4,
        }}
      >
        {isCompleted ? (
          <><CheckCircle2 size={15} /> {btnLabel}</>
        ) : isInProgress ? (
          <><PlayCircle size={15} /> {btnLabel} <ChevronRight size={14} /></>
        ) : (
          <><BookOpen size={15} /> {btnLabel} <ChevronRight size={14} /></>
        )}
      </button>

      {/* Tooltip for duration */}
      {assessment.timeLimitMins && !isCompleted && (
        <p style={{ fontSize: 11, color: T.text3, textAlign: 'center', margin: '8px 0 0', lineHeight: 1.4 }}>
          ⏱ {assessment.timeLimitMins} minute time limit — cannot be paused once started
        </p>
      )}
    </div>
  );
}

/* ─── Empty state ───────────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div style={{
      textAlign: 'center', padding: '64px 24px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: T.bg, border: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 4,
      }}>
        <ClipboardList size={32} color={T.text3} />
      </div>
      <h3 style={{ fontSize: 17, fontWeight: 600, color: T.text1, margin: 0 }}>
        No assessments assigned yet
      </h3>
      <p style={{ fontSize: 14, color: T.text2, margin: 0, maxWidth: 320, lineHeight: 1.6 }}>
        Please wait for your recruiter to assign tests. You'll see them here once they're ready.
      </p>
    </div>
  );
}

/* ─── Assessment Quiz Runner ─────────────────────────────────────────────── */
function AssessmentQuizRunner({ token, assessment, pipelineId, assessments, onComplete, onBack }) {
  const [questions, setQuestions]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [answers, setAnswers]       = useState({});   // { questionId: selectedOptionId }
  const [current, setCurrent]       = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft]     = useState(null); // seconds
  const timerRef                    = useRef(null);

  // Fetch questions on mount
  useEffect(() => {
    const load = async () => {
      try {
        const headers = { 'x-pipeline-token': token };
        const { data } = await axios.get(
          `/api/pipeline/assessment/${assessment.id}/questions`,
          { headers }
        );
        setQuestions(data.questions || []);
        // Start countdown if duration is set
        if (data.assessment?.duration) {
          setTimeLeft(data.assessment.duration * 60);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load questions.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, assessment.id]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) { handleSubmit(true); return; }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleAnswer = (questionId, optionId) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit) {
      const unanswered = questions.filter(q => {
        const ans = answers[q._id];
        if (ans === undefined || ans === null) return true;
        if (typeof ans === 'string') return ans.trim() === '';
        if (Array.isArray(ans)) return ans.length === 0;
        return !ans;
      });
      if (unanswered.length > 0) {
        const proceed = window.confirm(
          `You have ${unanswered.length} unanswered question(s). Submit anyway?`
        );
        if (!proceed) return;
      }
    }
    clearTimeout(timerRef.current);
    setSubmitting(true);
    try {
      const headers = { 'x-pipeline-token': token };
      const responses = questions.map(q => ({
        questionId: q._id,
        answer: answers[q._id] || '',
      }));
      await axios.post(
        `/api/pipeline/${pipelineId}/step/submit`,
        {
          stepType: assessment.stepType,
          data: {
            assessmentId: assessment.id,
            responses,
          },
        },
        { headers }
      );
      onComplete();
    } catch (err) {
      setSubmitting(false);
      alert(err.response?.data?.message || 'Failed to submit. Please try again.');
    }
  };

  const progress = getProgress(assessments);
  const answered = Object.keys(answers).length;
  const total    = questions.length;

  // ── Loading ──
  if (loading) return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column' }}>
      <QuizTopBar title={assessment.title} timeLeft={timeLeft} onBack={onBack} progress={progress} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 36, height: 36, border: '3px solid #e5e7eb', borderTopColor: T.red, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: T.text2, fontSize: 14 }}>Loading questions…</p>
      </div>
    </div>
  );

  // ── Error ──
  if (error) return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column' }}>
      <QuizTopBar title={assessment.title} timeLeft={null} onBack={onBack} progress={progress} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <AlertCircle size={40} color={T.red} />
        <p style={{ color: T.text1, fontWeight: 600 }}>{error}</p>
        <button onClick={onBack} style={{ padding: '10px 24px', borderRadius: 8, background: T.red, color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );

  // ── No questions ──
  if (questions.length === 0) return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column' }}>
      <QuizTopBar title={assessment.title} timeLeft={null} onBack={onBack} progress={progress} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <ClipboardList size={40} color={T.text3} />
        <p style={{ color: T.text2, fontSize: 15 }}>No questions found for this assessment.</p>
        <button onClick={onBack} style={{ padding: '10px 24px', borderRadius: 8, background: T.red, color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );

  const q = questions[current];
  const qId = q._id;
  const selectedOption = answers[qId];

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column' }}>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>

      <QuizTopBar title={assessment.title} timeLeft={timeLeft} onBack={onBack} progress={progress} />

      <main style={{ flex: 1, maxWidth: 780, width: '100%', margin: '0 auto', padding: '28px 16px' }}>

        {/* Progress strip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 13, color: T.text2, fontWeight: 500 }}>
            Question {current + 1} of {total}
          </span>
          <span style={{ fontSize: 13, color: T.text2, fontWeight: 500 }}>
            {answered} answered
          </span>
        </div>

        {/* Question dots */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              style={{
                width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 700,
                background: i === current ? T.red : answers[questions[i]._id] ? T.green : '#E5E7EB',
                color: (i === current || answers[questions[i]._id]) ? '#fff' : T.text2,
                transition: 'all 0.15s',
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Question card */}
        <div key={qId} style={{
          background: T.white, borderRadius: 14, border: `1px solid ${T.border}`,
          padding: '28px 28px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          animation: 'fadeIn 0.2s ease-out',
        }}>
          {/* Category + difficulty badges */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {q.category && (
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: T.blueBg, color: T.blue, textTransform: 'capitalize' }}>
                {q.category}
              </span>
            )}
            {q.difficulty && (
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                background: q.difficulty === 'hard' ? '#FFF1F2' : q.difficulty === 'medium' ? T.yellowBg : T.greenBg,
                color: q.difficulty === 'hard' ? T.red : q.difficulty === 'medium' ? T.yellow : T.green,
                textTransform: 'capitalize',
              }}>
                {q.difficulty}
              </span>
            )}
          </div>

          {/* Question text */}
          <p style={{ fontSize: 16, fontWeight: 600, color: T.text1, lineHeight: 1.6, marginBottom: 22 }}>
            <span style={{ color: T.red, marginRight: 8, fontWeight: 700 }}>Q{current + 1}.</span>
            {q.text}
          </p>

          {/* Answer input — type-aware rendering */}
          {(() => {
            const isDescriptive = q.type === 'short_answer' || q.type === 'scenario' ||
              q.type === 'logic' || q.type === 'coding' || q.type === 'descriptive' ||
              q.type === 'text' || q.type === 'essay' || !q.type ||
              (!q.options || q.options.length === 0);

            if (isDescriptive) {
              // Descriptive / open-ended — render a textarea
              return (
                <textarea
                  value={answers[qId] || ''}
                  onChange={e => handleAnswer(qId, e.target.value)}
                  placeholder="Type your answer here..."
                  rows={q.type === 'coding' ? 10 : 5}
                  style={{
                    width: '100%', padding: '14px 16px', borderRadius: 10,
                    border: `2px solid ${answers[qId] ? T.red : T.border}`,
                    fontSize: 14, color: T.text1, lineHeight: 1.6,
                    fontFamily: q.type === 'coding' ? 'monospace' : 'inherit',
                    background: T.white, resize: 'vertical', outline: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => { e.target.style.borderColor = T.red; }}
                  onBlur={e => { e.target.style.borderColor = answers[qId] ? T.red : T.border; }}
                />
              );
            }

            if (q.type === 'mcq_multi') {
              // Multi-select checkboxes
              const selectedArr = Array.isArray(answers[qId]) ? answers[qId] : [];
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(q.options || []).map((opt) => {
                    const isSelected = selectedArr.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          const next = isSelected
                            ? selectedArr.filter(id => id !== opt.id)
                            : [...selectedArr, opt.id];
                          handleAnswer(qId, next);
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                          border: `2px solid ${isSelected ? T.red : T.border}`,
                          background: isSelected ? 'rgba(225,29,72,0.05)' : T.white,
                          textAlign: 'left', fontSize: 14, color: T.text1,
                          fontWeight: isSelected ? 600 : 400, transition: 'all 0.15s',
                        }}
                      >
                        <span style={{
                          width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                          border: `2px solid ${isSelected ? T.red : '#D1D5DB'}`,
                          background: isSelected ? T.red : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {isSelected && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
                        </span>
                        {opt.text}
                      </button>
                    );
                  })}
                </div>
              );
            }

            // Default: MCQ single / true_false — radio buttons
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(q.options || []).map((opt) => {
                  const isSelected = selectedOption === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleAnswer(qId, opt.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                        border: `2px solid ${isSelected ? T.red : T.border}`,
                        background: isSelected ? 'rgba(225,29,72,0.05)' : T.white,
                        textAlign: 'left', fontSize: 14, color: T.text1,
                        fontWeight: isSelected ? 600 : 400, transition: 'all 0.15s',
                      }}
                    >
                      <span style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${isSelected ? T.red : '#D1D5DB'}`,
                        background: isSelected ? T.red : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isSelected && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                      </span>
                      {opt.text}
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
          <button
            onClick={() => setCurrent(c => Math.max(0, c - 1))}
            disabled={current === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 20px', borderRadius: 8, border: `1px solid ${T.border}`,
              background: T.white, color: current === 0 ? T.text3 : T.text1,
              fontWeight: 600, fontSize: 14, cursor: current === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            <ChevronLeft size={16} /> Previous
          </button>

          {current < total - 1 ? (
            <button
              onClick={() => setCurrent(c => c + 1)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 20px', borderRadius: 8, border: 'none',
                background: T.red, color: '#fff',
                fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              style={{
                padding: '10px 28px', borderRadius: 8, border: 'none',
                background: submitting ? '#94a3b8' : T.green,
                color: '#fff', fontWeight: 700, fontSize: 14,
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Submitting…' : `Submit Assessment (${answered}/${total} answered)`}
            </button>
          )}
        </div>

        {/* Submit from any question */}
        {current < total - 1 && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              style={{
                padding: '8px 24px', borderRadius: 8, border: `1px solid ${T.green}`,
                background: 'transparent', color: T.green,
                fontWeight: 600, fontSize: 13, cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Submitting…' : `Finish & Submit (${answered}/${total} answered)`}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

/* ─── Quiz top bar ───────────────────────────────────────────────────────── */
function QuizTopBar({ title, timeLeft, onBack, progress }) {
  const urgent = timeLeft !== null && timeLeft < 300; // < 5 min
  return (
    <div style={{ background: T.white, borderBottom: `1px solid ${T.border}`, position: 'sticky', top: 0, zIndex: 10 }}>
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: T.red, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14 }}>H</div>
          <span style={{ fontWeight: 700, fontSize: 15, color: T.text1 }}>{title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {timeLeft !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20,
              background: urgent ? '#FFF1F2' : T.yellowBg,
              border: `1px solid ${urgent ? T.red : T.yellowBdr}`,
              color: urgent ? T.red : T.yellow, fontWeight: 700, fontSize: 13,
            }}>
              <Clock size={13} />
              {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          )}
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.white, color: T.text2, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            <ChevronLeft size={14} /> Dashboard
          </button>
        </div>
      </div>
      <div style={{ height: 3, background: '#F3F4F6' }}>
        <div style={{ height: '100%', background: T.red, width: `${progress}%`, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────────── */
export default function CandidateFlowPage() {
  const { token } = useParams();

  // Session / pipeline state
  const [session, setSession]           = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState(null);

  // Assigned assessments state
  const [assessments, setAssessments]   = useState([]);
  const [assLoading, setAssLoading]     = useState(true);
  const [assError, setAssError]         = useState(null);

  // Active assessment (when candidate clicks Start/Continue)
  const [activeAssessment, setActiveAssessment] = useState(null);
  const [countdown, setCountdown]       = useState(null);

  /* ── Init pipeline session ── */
  const initSession = useCallback(async () => {
    setSessionLoading(true);
    setSessionError(null);
    try {
      localStorage.setItem('pipeline_token', token);
      const headers = { 'x-pipeline-token': token };
      const { data } = await axios.post('/api/pipeline/session', {}, { headers });
      const pipeline = data.pipeline || data;

      if (pipeline._id && pipeline.currentStep && pipeline.stepStatus?.[pipeline.currentStep]?.status === 'IN_PROGRESS') {
        const resumeRes = await axios.post(`/api/pipeline/${pipeline._id}/resume`, {}, { headers });
        setSession(resumeRes.data.pipeline || resumeRes.data);
      } else {
        setSession(pipeline);
      }
    } catch (err) {
      setSessionError(err.response?.data?.message || 'Invalid or expired token.');
    } finally {
      setSessionLoading(false);
    }
  }, [token]);

  /* ── Fetch assigned assessments ── */
  const fetchAssessments = useCallback(async () => {
    setAssLoading(true);
    setAssError(null);
    try {
      const headers = { 'x-pipeline-token': token };
      const { data } = await axios.get('/api/pipeline/assigned-assessments', { headers });
      setAssessments(data.assessments || []);
    } catch (err) {
      setAssError(err.response?.data?.message || 'Failed to load assessments.');
    } finally {
      setAssLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      initSession();
      fetchAssessments();
    }
  }, [token, initSession, fetchAssessments]);

  /* ── Countdown timer for active step ── */
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

  /* ── Step complete callback ── */
  const handleStepComplete = useCallback(async () => {
    setActiveAssessment(null);
    await initSession();
    await fetchAssessments();
  }, [initSession, fetchAssessments]);

  /* ── Handle start/continue ── */
  const handleStart = (assessment) => {
    setActiveAssessment(assessment);
  };

  /* ── Logout ── */
  const handleLogout = () => {
    localStorage.removeItem('pipeline_token');
    window.location.href = '/';
  };

  /* ── Loading / error states ── */
  if (sessionLoading) {
    return (
      <div style={styles.fullCenter}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={styles.spinner} />
        <p style={{ color: T.text2, marginTop: 16, fontSize: 14 }}>Loading your dashboard…</p>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div style={styles.fullCenter}>
        <AlertCircle size={48} color={T.red} style={{ marginBottom: 16 }} />
        <h2 style={{ color: T.text1, marginBottom: 8, fontSize: 20, fontWeight: 700 }}>Access Denied</h2>
        <p style={{ color: T.text2, marginBottom: 24, fontSize: 14 }}>{sessionError}</p>
        <button onClick={() => window.location.href = '/'} style={styles.redBtn}>
          Go Back
        </button>
      </div>
    );
  }

  /* ── Derive candidate name and applied role from session ── */
  const candidateName = session?.candidate?.name || session?.candidateName || 'Candidate';
  const appliedRole   = session?.role?.title || null;

  /* ── If an assessment is active, show the quiz runner ── */
  if (activeAssessment) {
    return (
      <AssessmentQuizRunner
        token={token}
        assessment={activeAssessment}
        pipelineId={session?._id}
        assessments={assessments}
        onComplete={handleStepComplete}
        onBack={() => { setActiveAssessment(null); fetchAssessments(); }}
      />
    );
  }

  /* ── Dashboard view ── */
  const completedCount = assessments.filter(a => a.status === 'completed').length;
  const totalCount     = assessments.length;
  const progressPct    = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { font-family: 'Inter', -apple-system, sans-serif; box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .card-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        @media (max-width: 1023px) { .card-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 639px)  { .card-grid { grid-template-columns: 1fr; } }
        @media (max-width: 639px)  {
          .dashboard-body { padding: 16px !important; }
          .welcome-section { padding: 20px 16px !important; }
          .stats-row { flex-direction: column !important; gap: 10px !important; }
          .stat-card { flex: none !important; width: 100% !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column' }}>

        {/* ── Top bar ── */}
        <header style={styles.topBar}>
          <div style={styles.topBarInner}>
            {/* Logo */}
            <div style={styles.logo}>
              <div style={styles.logoIcon}>H</div>
              <span style={styles.logoText}>HireOS Assessment</span>
            </div>

            {/* Right: name + logout */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13, color: T.text2, fontWeight: 500 }}>
                {candidateName}
              </span>
              <button onClick={handleLogout} style={styles.outlineBtn}>
                <LogOut size={13} />
                Logout
              </button>
            </div>
          </div>
          {/* Progress bar */}
          <div style={styles.progressBarTrack}>
            <div style={{ ...styles.progressBarFill, width: `${progressPct}%` }} />
          </div>
        </header>

        {/* ── Body ── */}
        <main className="dashboard-body" style={{ flex: 1, maxWidth: 1100, width: '100%', margin: '0 auto', padding: '32px 24px' }}>

          {/* Welcome section */}
          <div className="welcome-section" style={{
            padding: '28px 32px', marginBottom: 28,
            background: T.white, borderRadius: 12,
            border: `1px solid ${T.border}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            animation: 'fadeUp 0.3s ease-out',
          }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text1, margin: '0 0 4px' }}>
              Welcome, {candidateName}
            </h1>
            <p style={{ fontSize: 14, color: T.text2, margin: 0 }}>
              {appliedRole ? (
                <>Applying for <strong style={{ color: T.text1 }}>{appliedRole}</strong> · Complete each step to finish your evaluation.</>
              ) : (
                'Here are your assigned assessments. Complete each step to finish your evaluation.'
              )}
            </p>
          </div>

          {/* Stats row */}
          {!assLoading && assessments.length > 0 && (
            <div className="stats-row" style={{
              display: 'flex', gap: 16, marginBottom: 28,
              animation: 'fadeUp 0.35s ease-out',
            }}>
              {[
                { label: 'Total',       value: totalCount,     color: T.text1,  bg: T.white },
                { label: 'Completed',   value: completedCount, color: T.green,  bg: T.greenBg },
                { label: 'Remaining',   value: totalCount - completedCount, color: T.red, bg: '#FFF1F2' },
                { label: 'Progress',    value: `${progressPct}%`, color: T.blue, bg: T.blueBg },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className="stat-card" style={{
                  flex: 1, background: bg, borderRadius: 10,
                  border: `1px solid ${T.border}`, padding: '14px 18px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 12, color: T.text2, marginTop: 4, fontWeight: 500 }}>{label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Section header */}
          {!assLoading && assessments.length > 0 && (
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: T.text1, margin: 0 }}>
                Your Assessments
              </h2>
              <span style={{ fontSize: 13, color: T.text2 }}>
                {completedCount} of {totalCount} completed
              </span>
            </div>
          )}

          {/* Cards grid */}
          {assLoading ? (
            <div className="card-grid" style={{ animation: 'fadeUp 0.3s ease-out' }}>
              {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : assError ? (
            <div style={{
              background: '#FFF1F2', border: `1px solid ${T.redBorder}`,
              borderRadius: 12, padding: '24px', textAlign: 'center',
            }}>
              <AlertCircle size={24} color={T.red} style={{ marginBottom: 8 }} />
              <p style={{ color: T.red, fontSize: 14, margin: 0 }}>{assError}</p>
              <button onClick={fetchAssessments} style={{ ...styles.redBtn, marginTop: 12, padding: '8px 20px', fontSize: 13 }}>
                Retry
              </button>
            </div>
          ) : assessments.length === 0 ? (
            <div style={{
              background: T.white, borderRadius: 12,
              border: `1px solid ${T.border}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              animation: 'fadeUp 0.3s ease-out',
            }}>
              <EmptyState />
            </div>
          ) : (
            <div className="card-grid" style={{ animation: 'fadeUp 0.4s ease-out' }}>
              {assessments.map((assessment) => (
                <AssessmentCard
                  key={assessment.id || assessment.stepType}
                  assessment={assessment}
                  onStart={handleStart}
                  isActive={session?.currentStep === assessment.stepType}
                />
              ))}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer style={{
          borderTop: `1px solid ${T.border}`, background: T.white,
          padding: '14px 24px', textAlign: 'center',
          fontSize: 12, color: T.text3,
        }}>
          Your data is secure and confidential · HireOS Assessment Platform
        </footer>
      </div>
    </>
  );
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function getProgress(assessments) {
  if (!assessments.length) return 0;
  const done = assessments.filter(a => a.status === 'completed').length;
  return Math.round((done / assessments.length) * 100);
}

/* ─── Shared styles ─────────────────────────────────────────────────────── */
const styles = {
  fullCenter: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', background: '#F8FAFC',
    textAlign: 'center', padding: 24,
  },
  spinner: {
    width: 40, height: 40,
    border: '3px solid #E5E7EB',
    borderTopColor: '#E11D48',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  topBar: {
    background: '#FFFFFF',
    borderBottom: '1px solid #E5E7EB',
    position: 'sticky', top: 0, zIndex: 100,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  topBarInner: {
    maxWidth: 1100, margin: '0 auto',
    padding: '0 24px', height: 64,
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 10,
  },
  logoIcon: {
    width: 32, height: 32, borderRadius: 8,
    background: '#E11D48', color: '#fff',
    fontWeight: 800, fontSize: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: {
    fontWeight: 700, fontSize: 15, color: '#111827',
  },
  progressBarTrack: {
    height: 3, background: '#F3F4F6', overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #BE123C, #E11D48)',
    transition: 'width 0.5s ease',
  },
  outlineBtn: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '7px 14px', borderRadius: 8,
    border: '1px solid #E5E7EB', background: '#fff',
    color: '#6B7280', fontSize: 13, fontWeight: 500,
    cursor: 'pointer', transition: 'all 0.15s',
  },
  redBtn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    padding: '10px 24px', borderRadius: 8,
    background: '#E11D48', color: '#fff',
    border: 'none', fontWeight: 600, fontSize: 14,
    cursor: 'pointer',
  },
};