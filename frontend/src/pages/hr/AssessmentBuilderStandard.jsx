import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import {
  ArrowLeft, List, Search, CheckCircle, Clock,
  ChevronRight, ClipboardList, Settings, Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageShell from '../../components/layout/PageShell';

// ── Step definitions ──────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Configure',        icon: Settings },
  { id: 2, label: 'Select Questions', icon: List },
  { id: 3, label: 'Review & Publish', icon: Eye },
];

export default function AssessmentBuilderStandard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Data
  const [roles, setRoles]       = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selected, setSelected]   = useState([]);
  const [qFilters, setQFilters]   = useState({ category: '', difficulty: '', type: '', search: '' });
  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState(false);

  const [form, setForm] = useState({
    roleId: '',
    title: '',
    description: '',
    duration: 60,
    passThreshold: 60,
    allowBacktrack: true,
    randomizeOptions: true,
  });

  useEffect(() => {
    api.get('/roles?active=true').then(r => setRoles(r.data));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(qFilters).forEach(([k, v]) => { if (v) params.set(k, v); });
    params.set('limit', '200');
    setLoading(true);
    api.get('/questions?' + params).then(r => setQuestions(r.data.questions)).finally(() => setLoading(false));
  }, [qFilters]);

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handlePublish = async () => {
    setSaving(true);
    try {
      const selectedQs = questions.filter(q => selected.includes(q._id));
      const sectionMap = {};
      selectedQs.forEach(q => {
        if (!sectionMap[q.category]) sectionMap[q.category] = [];
        sectionMap[q.category].push(q);
      });
      const sections = Object.entries(sectionMap).map(([cat, qs]) => ({
        name: cat.charAt(0).toUpperCase() + cat.slice(1),
        category: cat,
        questionCount: qs.length,
        difficulty: 'mixed',
        weight: 25,
      }));

      await api.post('/assessments', {
        ...form,
        totalQuestions: selected.length,
        sections,
        randomizeQuestions: false,
        mode: 'standard',
        selectedQuestions: selected,
      });
      toast.success('Assessment created!');
      navigate('/hr/assessments/create');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create assessment');
    } finally {
      setSaving(false);
    }
  };

  const selectedQs   = questions.filter(q => selected.includes(q._id));
  const catCounts    = {};
  selectedQs.forEach(q => { catCounts[q.category] = (catCounts[q.category] || 0) + 1; });
  const totalPoints  = selectedQs.reduce((s, q) => s + (q.points || 1), 0);

  const canGoStep2 = form.roleId && form.title.trim();
  const canGoStep3 = selected.length > 0;

  return (
    <PageShell scrollable>
      <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto', boxSizing: 'border-box' }}>


        {/* ── Page title ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <List size={22} color="#16a34a" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>Standard Mode Assessment</h1>
            <p style={{ color: '#64748b', fontSize: 13, marginTop: 3 }}>Pre-select questions from the question bank</p>
          </div>
        </div>

        {/* ── Step indicator ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32 }}>
          {STEPS.map((s, i) => {
            const done    = step > s.id;
            const active  = step === s.id;
            const Icon    = s.icon;
            return (
              <React.Fragment key={s.id}>
                <div
                  onClick={() => {
                    if (done) setStep(s.id);
                    if (s.id === 2 && canGoStep2) setStep(2);
                    if (s.id === 3 && canGoStep2 && canGoStep3) setStep(3);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 18px',
                    borderRadius: 10,
                    background: active ? '#f0fdf4' : done ? '#f8fafc' : 'transparent',
                    border: active ? '1.5px solid #86efac' : done ? '1.5px solid #e2e8f0' : '1.5px solid transparent',
                    cursor: (done || (s.id === 2 && canGoStep2) || (s.id === 3 && canGoStep2 && canGoStep3)) ? 'pointer' : 'default',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: active ? '#16a34a' : done ? '#dcfce7' : '#f1f5f9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {done
                      ? <CheckCircle size={14} color="#16a34a" />
                      : <Icon size={13} color={active ? '#fff' : '#94a3b8'} />
                    }
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: active ? '#15803d' : '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Step {s.id}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? '#0f172a' : done ? '#475569' : '#94a3b8' }}>
                      {s.label}
                    </div>
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: 1.5, background: done ? '#86efac' : '#e2e8f0', margin: '0 4px' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            STEP 1 — Configure
        ══════════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div style={{ maxWidth: 640 }}>
            <Card style={{ padding: 28 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Assessment Details</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Role *</label>
                  <select
                    value={form.roleId}
                    onChange={e => setForm(p => ({ ...p, roleId: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="">Select role...</option>
                    {roles.map(r => <option key={r._id} value={r._id}>{r.title} — {r.department}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Assessment Title *</label>
                  <input
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Software Engineer Assessment"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    rows={3}
                    placeholder="Optional description for this assessment..."
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Duration (minutes)</label>
                    <input
                      type="number" min="5"
                      value={form.duration}
                      onChange={e => setForm(p => ({ ...p, duration: parseInt(e.target.value) || 60 }))}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Pass Threshold (%)</label>
                    <input
                      type="number" min="1" max="100"
                      value={form.passThreshold}
                      onChange={e => setForm(p => ({ ...p, passThreshold: parseInt(e.target.value) || 60 }))}
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    ['allowBacktrack', 'Allow candidates to go back to previous questions'],
                    ['randomizeOptions', 'Shuffle answer options for each candidate'],
                  ].map(([key, label]) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#334155', fontWeight: 500 }}>
                      <input
                        type="checkbox"
                        checked={form[key]}
                        onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))}
                        style={{ width: 16, height: 16, accentColor: '#16a34a' }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </Card>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <Button
                onClick={() => setStep(2)}
                disabled={!canGoStep2}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                Continue to Select Questions <ChevronRight size={15} />
              </Button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STEP 2 — Select Questions
        ══════════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div>
            {/* Filters */}
            <Card style={{ marginBottom: 16, padding: '14px 16px' }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                  <input
                    value={qFilters.search}
                    onChange={e => setQFilters(p => ({ ...p, search: e.target.value }))}
                    placeholder="Search questions..."
                    style={{ ...inputStyle, paddingLeft: 32 }}
                  />
                </div>
                {[
                  ['category', 'Category', ['', 'aptitude', 'technical', 'reasoning', 'communication']],
                  ['difficulty', 'Difficulty', ['', 'easy', 'medium', 'hard']],
                  ['type', 'Type', ['', 'mcq_single', 'mcq_multi', 'true_false', 'short_answer', 'scenario', 'logic', 'coding']],
                ].map(([key, label, opts]) => (
                  <select
                    key={key}
                    value={qFilters[key]}
                    onChange={e => setQFilters(p => ({ ...p, [key]: e.target.value }))}
                    style={{ ...inputStyle, width: 'auto' }}
                  >
                    <option value="">{label}: All</option>
                    {opts.filter(Boolean).map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
                  </select>
                ))}
              </div>
            </Card>

            {/* Question list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading questions...</div>
              ) : questions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>No questions found</div>
              ) : questions.map(q => {
                const isSelected = selected.includes(q._id);
                return (
                  <div
                    key={q._id}
                    onClick={() => toggleSelect(q._id)}
                    style={{
                      padding: '14px 18px',
                      borderRadius: 12,
                      border: '2px solid ' + (isSelected ? '#16a34a' : '#e2e8f0'),
                      background: isSelected ? '#f0fdf4' : '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 14,
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = '#cbd5e1'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = '#e2e8f0'; }}
                  >
                    {/* Checkbox */}
                    <div style={{
                      width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 2,
                      border: '2px solid ' + (isSelected ? '#16a34a' : '#cbd5e1'),
                      background: isSelected ? '#16a34a' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}>
                      {isSelected && (
                        <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                          <path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 7, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Badge label={q.category} variant="info" />
                        <Badge label={q.difficulty} variant={q.difficulty === 'easy' ? 'success' : q.difficulty === 'medium' ? 'warning' : 'danger'} />
                        <Badge label={q.type.replace(/_/g, ' ')} variant="default" />
                        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{q.points || 1} pt</span>
                      </div>
                      <p style={{ fontSize: 14, color: '#0f172a', lineHeight: 1.6, margin: 0 }}>{q.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sticky footer */}
            <div style={{
              position: 'sticky', bottom: 0,
              background: '#fff',
              borderTop: '1.5px solid #e2e8f0',
              padding: '14px 0',
              marginTop: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  background: selected.length > 0 ? '#f0fdf4' : '#f8fafc',
                  border: '1.5px solid ' + (selected.length > 0 ? '#86efac' : '#e2e8f0'),
                  borderRadius: 10,
                  padding: '8px 16px',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <CheckCircle size={15} color={selected.length > 0 ? '#16a34a' : '#94a3b8'} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: selected.length > 0 ? '#15803d' : '#94a3b8' }}>
                    {selected.length} question{selected.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
                {selected.length > 0 && (
                  <button
                    onClick={() => setSelected([])}
                    style={{ fontSize: 12, color: '#e11d48', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Button variant="ghost" onClick={() => setStep(1)}>
                  <ArrowLeft size={14} /> Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!canGoStep3}
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  Continue to Review <ChevronRight size={15} />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STEP 3 — Review & Publish
        ══════════════════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div style={{ maxWidth: 760 }}>
            <Card style={{ padding: 28, marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Assessment Summary</h2>

              {/* Config summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                {[
                  ['Role', roles.find(r => r._id === form.roleId)?.title || '—'],
                  ['Duration', form.duration + ' min'],
                  ['Pass Threshold', form.passThreshold + '%'],
                  ['Questions', selected.length],
                ].map(([label, value]) => (
                  <div key={label} style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Title & description */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{form.title}</div>
                {form.description && <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>{form.description}</p>}
              </div>

              {/* Category breakdown */}
              {Object.keys(catCounts).length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 10 }}>Question Breakdown</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {Object.entries(catCounts).map(([cat, count]) => (
                      <div key={cat} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 600, color: '#1d4ed8' }}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}: {count}q
                      </div>
                    ))}
                    <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 600, color: '#15803d' }}>
                      Total: {totalPoints} pts
                    </div>
                  </div>
                </div>
              )}

              {/* Settings */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, background: form.allowBacktrack ? '#f0fdf4' : '#fef2f2', color: form.allowBacktrack ? '#15803d' : '#e11d48', fontWeight: 600 }}>
                  {form.allowBacktrack ? '✓' : '✗'} Backtracking
                </span>
                <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, background: form.randomizeOptions ? '#f0fdf4' : '#fef2f2', color: form.randomizeOptions ? '#15803d' : '#e11d48', fontWeight: 600 }}>
                  {form.randomizeOptions ? '✓' : '✗'} Shuffle Options
                </span>
                <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, background: '#f8fafc', color: '#64748b', fontWeight: 600 }}>
                  Fixed Question Order
                </span>
              </div>
            </Card>

            {/* Selected questions preview */}
            <Card style={{ padding: 24, marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>
                Selected Questions ({selected.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
                {selectedQs.map((q, i) => (
                  <div key={q._id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', minWidth: 20, marginTop: 2 }}>{i + 1}.</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 5, marginBottom: 5, flexWrap: 'wrap' }}>
                        <Badge label={q.category} variant="info" />
                        <Badge label={q.difficulty} variant={q.difficulty === 'easy' ? 'success' : q.difficulty === 'medium' ? 'warning' : 'danger'} />
                      </div>
                      <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.5, margin: 0 }}>{q.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setStep(2)}>
                <ArrowLeft size={14} /> Back to Questions
              </Button>
              <Button
                onClick={handlePublish}
                loading={saving}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <ClipboardList size={15} />
                {saving ? 'Creating...' : 'Publish Assessment'}
              </Button>
            </div>
          </div>
        )}

      </div>
    </PageShell>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const labelStyle = {
  display: 'block', fontSize: 13, fontWeight: 600,
  color: '#334155', marginBottom: 6,
};

const inputStyle = {
  width: '100%', padding: '9px 12px',
  borderRadius: 8, border: '1px solid #e2e8f0',
  fontSize: 13, outline: 'none', background: '#fff',
  boxSizing: 'border-box',
};
