import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileUp, Upload, CheckCircle, AlertCircle,
  ChevronRight, Loader2, Trash2, Edit3, X, Check,
  FileText, Tag, BarChart2, Type, List,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABELS = {
  mcq_single: 'MCQ (Single)',
  mcq_multi: 'MCQ (Multi)',
  true_false: 'True / False',
  short_answer: 'Descriptive',
};

const DIFFICULTY_COLORS = {
  easy: { bg: '#dcfce7', color: '#15803d' },
  medium: { bg: '#fef9c3', color: '#a16207' },
  hard: { bg: '#fee2e2', color: '#b91c1c' },
};

const CAT_COLORS = {
  technical: { bg: '#dbeafe', color: '#1d4ed8' },
  aptitude: { bg: '#fae8ff', color: '#7e22ce' },
  reasoning: { bg: '#ffedd5', color: '#c2410c' },
  communication: { bg: '#dcfce7', color: '#15803d' },
};

function Badge({ label, bg, color }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, letterSpacing: '0.4px',
      background: bg, color, padding: '2px 9px', borderRadius: 20,
      textTransform: 'capitalize', whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

// ─── Step indicators ──────────────────────────────────────────────────────────

function Steps({ current }) {
  const steps = ['Upload File', 'Review Questions', 'Assessment Details'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 36 }}>
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={s}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: done ? '#16a34a' : active ? '#9333ea' : '#e2e8f0',
                color: done || active ? '#fff' : '#94a3b8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, flexShrink: 0,
                transition: 'all 0.2s',
              }}>
                {done ? <Check size={14} /> : i + 1}
              </div>
              <span style={{
                fontSize: 13, fontWeight: active ? 700 : 500,
                color: active ? '#9333ea' : done ? '#16a34a' : '#94a3b8',
              }}>{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 2, margin: '0 12px',
                background: done ? '#16a34a' : '#e2e8f0',
                transition: 'background 0.3s',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Question Card ────────────────────────────────────────────────────────────

function QuestionCard({ q, index, onRemove, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(q.text);

  function save() {
    onEdit(index, { ...q, text });
    setEditing(false);
  }

  const diff = DIFFICULTY_COLORS[q.difficulty] || DIFFICULTY_COLORS.easy;
  const cat = CAT_COLORS[q.category] || { bg: '#f1f5f9', color: '#64748b' };

  return (
    <div style={{
      background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14,
      padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Number */}
        <div style={{
          width: 28, height: 28, borderRadius: 8, background: '#f8fafc',
          border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 12, fontWeight: 700,
          color: '#64748b', flexShrink: 0,
        }}>
          {index + 1}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Badges row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            <Badge label={TYPE_LABELS[q.type] || q.type} bg="#f1f5f9" color="#475569" />
            <Badge label={q.category} bg={cat.bg} color={cat.color} />
            <Badge label={q.difficulty} bg={diff.bg} color={diff.color} />
            <Badge label={`${q.points} pt${q.points !== 1 ? 's' : ''}`} bg="#f0fdf4" color="#15803d" />
          </div>

          {/* Question text */}
          {editing ? (
            <div>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={3}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: 8,
                  border: '1.5px solid #9333ea', fontSize: 13.5, color: '#0f172a',
                  resize: 'vertical', outline: 'none', fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <button onClick={save} style={{
                  padding: '5px 14px', borderRadius: 7, border: 'none',
                  background: '#9333ea', color: '#fff', fontSize: 12,
                  fontWeight: 600, cursor: 'pointer',
                }}>Save</button>
                <button onClick={() => { setText(q.text); setEditing(false); }} style={{
                  padding: '5px 14px', borderRadius: 7, border: '1.5px solid #e2e8f0',
                  background: '#fff', color: '#64748b', fontSize: 12,
                  fontWeight: 600, cursor: 'pointer',
                }}>Cancel</button>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 13.5, color: '#0f172a', lineHeight: 1.65, margin: 0 }}>
              {q.text}
            </p>
          )}

          {/* Options */}
          {q.options && q.options.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {q.options.map(opt => (
                <div key={opt.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '5px 10px', borderRadius: 7,
                  background: q.correctAnswer === opt.id ? '#f0fdf4' : '#f8fafc',
                  border: `1px solid ${q.correctAnswer === opt.id ? '#86efac' : '#e2e8f0'}`,
                }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: '#94a3b8',
                    textTransform: 'uppercase', minWidth: 14,
                  }}>{opt.id})</span>
                  <span style={{ fontSize: 13, color: '#334155' }}>{opt.text}</span>
                  {q.correctAnswer === opt.id && (
                    <CheckCircle size={13} color="#16a34a" style={{ marginLeft: 'auto', flexShrink: 0 }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => setEditing(e => !e)}
            title="Edit question"
            style={{
              width: 30, height: 30, borderRadius: 8, border: '1.5px solid #e2e8f0',
              background: '#fff', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Edit3 size={13} color="#64748b" />
          </button>
          <button
            onClick={() => onRemove(index)}
            title="Remove question"
            style={{
              width: 30, height: 30, borderRadius: 8, border: '1.5px solid #fee2e2',
              background: '#fff', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Trash2 size={13} color="#e11d48" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AssessmentBuilderPDF() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Step: 0 = upload, 1 = review, 2 = details
  const [step, setStep] = useState(0);

  // Upload state
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState(null);

  // Review state
  const [questions, setQuestions] = useState([]);
  const [summary, setSummary] = useState(null);

  // Details state
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({ title: '', roleId: '', duration: 60, passThreshold: 60 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/roles?active=true').then(r => setRoles(r.data)).catch(() => {});
  }, []);

  // ── File handling ──

  function handleFile(file) {
    if (!file) return;
    const allowed = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) {
      toast.error('Only PDF and Word documents are supported');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10 MB');
      return;
    }
    setSelectedFile(file);
    setParseError(null);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }

  async function handleParse() {
    if (!selectedFile) return;
    setParsing(true);
    setParseError(null);
    try {
      const fd = new FormData();
      fd.append('file', selectedFile);
      const res = await api.post('/assessment-import/parse', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setQuestions(res.data.questions);
      setSummary(res.data.summary);
      // Pre-fill title from filename
      const baseName = selectedFile.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      setForm(f => ({ ...f, title: baseName }));
      setStep(1);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to parse file';
      setParseError(msg);
    } finally {
      setParsing(false);
    }
  }

  function removeQuestion(idx) {
    setQuestions(qs => qs.filter((_, i) => i !== idx));
  }

  function editQuestion(idx, updated) {
    setQuestions(qs => qs.map((q, i) => i === idx ? updated : q));
  }

  async function handleCreate() {
    if (!form.title.trim()) { toast.error('Assessment title is required'); return; }
    if (!form.roleId) { toast.error('Please select a role'); return; }
    if (questions.length === 0) { toast.error('No questions to save'); return; }

    setSaving(true);
    try {
      const res = await api.post('/assessment-import/create', {
        ...form,
        questions,
      });
      toast.success(`Assessment created with ${res.data.questionsCreated} questions`);
      navigate(`/hr/assessments/${res.data.assessment._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create assessment');
    } finally {
      setSaving(false);
    }
  }

  // ── Render ──

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>

        {/* Back */}
        <button
          onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/hr/assessments/create')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            color: '#64748b', background: 'none', border: 'none',
            cursor: 'pointer', fontSize: 14, marginBottom: 32, padding: '6px 0',
          }}
        >
          <ArrowLeft size={16} />
          {step > 0 ? 'Back' : 'Back to Create Assessment'}
        </button>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg,#fdf4ff,#fae8ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FileUp size={22} color="#9333ea" />
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Import from PDF
              </h1>
              <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
                Upload a document and auto-generate assessment questions
              </p>
            </div>
          </div>
        </div>

        <Steps current={step} />

        {/* ── Step 0: Upload ── */}
        {step === 0 && (
          <div>
            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !selectedFile && fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? '#9333ea' : selectedFile ? '#16a34a' : '#cbd5e1'}`,
                borderRadius: 20, padding: '52px 32px', textAlign: 'center',
                background: dragOver ? '#fdf4ff' : selectedFile ? '#f0fdf4' : '#fff',
                cursor: selectedFile ? 'default' : 'pointer',
                transition: 'all 0.2s',
                marginBottom: 20,
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                style={{ display: 'none' }}
                onChange={e => handleFile(e.target.files[0])}
              />

              {selectedFile ? (
                <div>
                  <CheckCircle size={44} color="#16a34a" style={{ margin: '0 auto 14px' }} />
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
                    {selectedFile.name}
                  </p>
                  <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedFile(null); }}
                    style={{
                      padding: '6px 16px', borderRadius: 8, border: '1.5px solid #e2e8f0',
                      background: '#fff', color: '#64748b', fontSize: 13,
                      fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    <X size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <Upload size={44} color="#cbd5e1" style={{ margin: '0 auto 14px' }} />
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
                    Drop your file here, or click to browse
                  </p>
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
                    Supports PDF and Word documents up to 10 MB
                  </p>
                </div>
              )}
            </div>

            {/* Error */}
            {parseError && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                background: '#fff1f2', border: '1.5px solid #fecdd3',
                borderRadius: 12, padding: '14px 16px', marginBottom: 20,
              }}>
                <AlertCircle size={18} color="#e11d48" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 13.5, color: '#be123c', margin: 0 }}>{parseError}</p>
              </div>
            )}

            {/* Parse button */}
            <button
              onClick={handleParse}
              disabled={!selectedFile || parsing}
              style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                background: selectedFile && !parsing ? '#9333ea' : '#e2e8f0',
                color: selectedFile && !parsing ? '#fff' : '#94a3b8',
                fontSize: 15, fontWeight: 700, cursor: selectedFile && !parsing ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s',
              }}
            >
              {parsing ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
                  Extracting questions…
                </>
              ) : (
                <>
                  <FileText size={18} />
                  Extract Questions
                </>
              )}
            </button>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* ── Step 1: Review ── */}
        {step === 1 && (
          <div>
            {/* Summary bar */}
            {summary && (
              <div style={{
                background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14,
                padding: '16px 20px', marginBottom: 24,
                display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <List size={16} color="#9333ea" />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                    {questions.length} questions extracted
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {Object.entries(summary.byType || {}).map(([t, n]) => (
                    <Badge key={t} label={`${TYPE_LABELS[t] || t}: ${n}`} bg="#f1f5f9" color="#475569" />
                  ))}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {Object.entries(summary.byDifficulty || {}).map(([d, n]) => {
                    const c = DIFFICULTY_COLORS[d] || { bg: '#f1f5f9', color: '#64748b' };
                    return <Badge key={d} label={`${d}: ${n}`} bg={c.bg} color={c.color} />;
                  })}
                </div>
              </div>
            )}

            {questions.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '48px 0',
                background: '#fff', borderRadius: 16, border: '1.5px dashed #e2e8f0',
                marginBottom: 24,
              }}>
                <AlertCircle size={36} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
                <p style={{ color: '#94a3b8', fontSize: 14 }}>All questions removed</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {questions.map((q, i) => (
                  <QuestionCard
                    key={i}
                    q={q}
                    index={i}
                    onRemove={removeQuestion}
                    onEdit={editQuestion}
                  />
                ))}
              </div>
            )}

            <button
              onClick={() => setStep(2)}
              disabled={questions.length === 0}
              style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                background: questions.length > 0 ? '#9333ea' : '#e2e8f0',
                color: questions.length > 0 ? '#fff' : '#94a3b8',
                fontSize: 15, fontWeight: 700,
                cursor: questions.length > 0 ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              Continue to Assessment Details <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* ── Step 2: Details ── */}
        {step === 2 && (
          <div>
            <div style={{
              background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16,
              padding: '28px 28px', marginBottom: 24,
            }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>
                Assessment Details
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Title */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                    Assessment Title *
                  </label>
                  <input
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Frontend Developer Assessment"
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 9,
                      border: '1.5px solid #e2e8f0', fontSize: 14, color: '#0f172a',
                      outline: 'none', boxSizing: 'border-box',
                    }}
                    onFocus={e => e.target.style.borderColor = '#9333ea'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>

                {/* Role */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                    Role *
                  </label>
                  <select
                    value={form.roleId}
                    onChange={e => setForm(f => ({ ...f, roleId: e.target.value }))}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 9,
                      border: '1.5px solid #e2e8f0', fontSize: 14, color: form.roleId ? '#0f172a' : '#94a3b8',
                      outline: 'none', background: '#fff', boxSizing: 'border-box',
                    }}
                    onFocus={e => e.target.style.borderColor = '#9333ea'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  >
                    <option value="">Select a role…</option>
                    {roles.map(r => (
                      <option key={r._id} value={r._id}>{r.title}{r.department ? ` — ${r.department}` : ''}</option>
                    ))}
                  </select>
                </div>

                {/* Duration + Pass threshold */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                      Duration (minutes)
                    </label>
                    <input
                      type="number" min={5} max={300}
                      value={form.duration}
                      onChange={e => setForm(f => ({ ...f, duration: parseInt(e.target.value) || 60 }))}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 9,
                        border: '1.5px solid #e2e8f0', fontSize: 14, color: '#0f172a',
                        outline: 'none', boxSizing: 'border-box',
                      }}
                      onFocus={e => e.target.style.borderColor = '#9333ea'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                      Pass Threshold (%)
                    </label>
                    <input
                      type="number" min={0} max={100}
                      value={form.passThreshold}
                      onChange={e => setForm(f => ({ ...f, passThreshold: parseInt(e.target.value) || 60 }))}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 9,
                        border: '1.5px solid #e2e8f0', fontSize: 14, color: '#0f172a',
                        outline: 'none', boxSizing: 'border-box',
                      }}
                      onFocus={e => e.target.style.borderColor = '#9333ea'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div style={{
              background: '#fdf4ff', border: '1.5px solid #e9d5ff', borderRadius: 12,
              padding: '14px 18px', marginBottom: 24,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <CheckCircle size={18} color="#9333ea" />
              <span style={{ fontSize: 13.5, color: '#6b21a8', fontWeight: 500 }}>
                {questions.length} questions will be saved and linked to this assessment
              </span>
            </div>

            <button
              onClick={handleCreate}
              disabled={saving}
              style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                background: saving ? '#e2e8f0' : '#9333ea',
                color: saving ? '#94a3b8' : '#fff',
                fontSize: 15, fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {saving ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
                  Creating Assessment…
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Create Assessment
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
