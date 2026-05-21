import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Plus, FileQuestion, Edit2, Trash2, Search, Zap, List, X, BookOpen, Tag, BarChart2, AlignLeft, Lightbulb, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import '../../styles/Questions.css';
import '../../styles/Dashboard.css';
import PageShell from '../../components/layout/PageShell';

const defaultForm = {
  type: 'mcq_single',
  category: 'technical',
  difficulty: 'medium',
  text: '',
  options: [{ id: 'a', text: '' }, { id: 'b', text: '' }, { id: 'c', text: '' }, { id: 'd', text: '' }],
  correctAnswer: 'a',
  explanation: '',
  points: 1,
};

export default function Questions() {
  const [questions, setQuestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ category: '', difficulty: '', type: '', search: '' });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const navigate = useNavigate();

  const fetchQuestions = async () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const { data } = await api.get(`/questions?${params}&limit=100`);
    setQuestions(data.questions);
    setTotal(data.total);
  };

  useEffect(() => { fetchQuestions().finally(() => setLoading(false)); }, [filters]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (!['mcq_single', 'mcq_multi', 'true_false'].includes(form.type)) {
        delete payload.options;
        delete payload.correctAnswer;
      }
      if (editingId) {
        await api.put(`/questions/${editingId}`, payload);
        toast.success('Question updated');
      } else {
        await api.post('/questions', payload);
        toast.success('Question created');
      }
      setShowForm(false);
      setForm(defaultForm);
      setEditingId(null);
      fetchQuestions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleEdit = (q) => {
    setForm({
      type: q.type,
      category: q.category,
      difficulty: q.difficulty,
      text: q.text,
      options: q.options || [{ id: 'a', text: '' }, { id: 'b', text: '' }],
      correctAnswer: q.correctAnswer || '',
      explanation: q.explanation || '',
      points: q.points || 1,
    });
    setEditingId(q._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this question?')) return;
    try {
      await api.delete(`/questions/${id}`);
      toast.success('Question deactivated');
      fetchQuestions();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const needsOptions = ['mcq_single', 'mcq_multi', 'true_false'].includes(form.type);

  return (
    <PageShell scrollable>
      {/* ── Header card — matches Dashboard style ── */}
      <div className="dashboard-header-card" style={{ marginBottom: 16 }}>
        <div className="dashboard-header-icon" style={{ background: 'rgba(37,99,235,0.2)', color: '#3B82F6' }}>
          <FileQuestion size={22} />
        </div>
        <div className="dashboard-header-content" style={{ flex: 1 }}>
          <h1>Question Bank</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
            Manage assessment questions
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Button variant="secondary" onClick={() => navigate('/hr/assessments/create')}>
            <Zap size={16} /> Create Assessment
          </Button>
          <Button onClick={() => { setEditingId(null); setForm(defaultForm); setShowForm(true); }}>
            <Plus size={16} /> Add Question
          </Button>
        </div>
      </div>
      {/* Filters */}
      <Card className="questions-filters">
        <div className="questions-filters-container">
          <div className="questions-search-wrapper">
            <Search size={16} className="questions-search-icon" />
            <input
              value={filters.search}
              onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
              placeholder="Search questions..."
              className="questions-search-input"
            />
          </div>
          {[
            ['category', 'Category', ['', 'aptitude', 'technical', 'reasoning', 'communication']],
            ['difficulty', 'Difficulty', ['', 'easy', 'medium', 'hard']],
            ['type', 'Type', ['', 'mcq_single', 'mcq_multi', 'true_false', 'short_answer', 'scenario', 'logic', 'coding']],
          ].map(([key, label, opts]) => (
            <select
              key={key}
              value={filters[key]}
              onChange={e => setFilters(p => ({ ...p, [key]: e.target.value }))}
              className="questions-filter-select"
            >
              <option value="">{label}: All</option>
              {opts.filter(Boolean).map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
            </select>
          ))}
        </div>
      </Card>

      {/* Questions List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading...</div>
      ) : questions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
          <FileQuestion size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
          No questions found
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {questions.map(q => (
            <Card key={q._id} style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Badge label={q.category} variant="info" />
                    <Badge
                      label={q.difficulty}
                      variant={q.difficulty === 'easy' ? 'success' : q.difficulty === 'medium' ? 'warning' : 'danger'}
                    />
                    <Badge label={q.type.replace(/_/g, ' ')} variant="default" />
                    <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                      {q.points} pt{q.points !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p style={{ fontSize: 15, color: '#0f172a', fontWeight: 500, lineHeight: 1.6, marginBottom: 10 }}>
                    {q.text}
                  </p>
                  {q.options?.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                      {q.options.map(opt => {
                        const isCorrect = Array.isArray(q.correctAnswer)
                          ? q.correctAnswer.includes(opt.id)
                          : q.correctAnswer === opt.id;
                        return (
                          <span
                            key={opt.id}
                            style={{
                              fontSize: 13,
                              padding: '5px 12px',
                              borderRadius: 8,
                              background: isCorrect ? '#f0fdf4' : '#f8fafc',
                              color: isCorrect ? '#16a34a' : '#475569',
                              border: `1px solid ${isCorrect ? '#86efac' : '#e2e8f0'}`,
                              fontWeight: isCorrect ? 600 : 400,
                            }}
                          >
                            {opt.id.toUpperCase()}. {opt.text}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {q.explanation && (
                    <p style={{ fontSize: 13, color: '#64748b', fontStyle: 'italic', marginTop: 8 }}>
                      💡 {q.explanation}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => handleEdit(q)}
                    style={{
                      padding: '7px 12px',
                      borderRadius: 8,
                      background: '#eff6ff',
                      color: '#2563eb',
                      border: '1px solid #bfdbfe',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(q._id)}
                    style={{
                      padding: '7px 12px',
                      borderRadius: 8,
                      background: '#fef2f2',
                      color: '#e11d48',
                      border: '1px solid #fecdd3',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Add / Edit Modal ─────────────────────────────────────────── */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(10,15,28,0.72)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 24, overflowY: 'auto',
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 20,
            width: '100%', maxWidth: 620,
            boxShadow: '0 32px 80px rgba(0,0,0,0.28), 0 0 0 1px rgba(0,0,0,0.06)',
            margin: 'auto',
            overflow: 'hidden',
          }}>

            {/* Modal header */}
            <div style={{
              background: 'linear-gradient(135deg, #0C1220 0%, #1E2A45 60%, #162035 100%)',
              padding: '22px 28px',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'rgba(37,99,235,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <BookOpen size={18} color="#60A5FA" />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.2px' }}>
                  {editingId ? 'Edit Question' : 'New Question'}
                </h2>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: '2px 0 0' }}>
                  {editingId ? 'Update the question details below' : 'Fill in the details to add a question to the bank'}
                </p>
              </div>
              <button
                onClick={() => { setShowForm(false); setEditingId(null); setForm(defaultForm); }}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'rgba(255,255,255,0.6)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSubmit} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Row 1 — Type / Category / Difficulty */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                {[
                  { key: 'type',       label: 'Type',       icon: Tag,       opts: ['mcq_single','mcq_multi','true_false','short_answer','scenario','logic','coding'] },
                  { key: 'category',   label: 'Category',   icon: BookOpen,  opts: ['aptitude','technical','reasoning','communication'] },
                  { key: 'difficulty', label: 'Difficulty', icon: BarChart2, opts: ['easy','medium','hard'] },
                ].map(({ key, label, icon: Icon, opts }) => (
                  <div key={key}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 7 }}>
                      <Icon size={11} /> {label}
                    </label>
                    <select
                      value={form[key]}
                      onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: 10,
                        border: '1.5px solid #E2E8F0', fontSize: 13, outline: 'none',
                        background: '#F8FAFC', color: '#0F172A', cursor: 'pointer',
                        fontWeight: 500, appearance: 'auto',
                      }}
                      onFocus={e => e.target.style.borderColor = '#3B82F6'}
                      onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                    >
                      {opts.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: '#F1F5F9', margin: '0 -28px', width: 'calc(100% + 56px)' }} />

              {/* Question Text */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 7 }}>
                  <AlignLeft size={11} /> Question Text
                </label>
                <textarea
                  required
                  value={form.text}
                  onChange={e => setForm(p => ({ ...p, text: e.target.value }))}
                  rows={4}
                  placeholder="Enter the question here…"
                  style={{
                    width: '100%', padding: '11px 14px', borderRadius: 10,
                    border: '1.5px solid #E2E8F0', fontSize: 14, outline: 'none',
                    resize: 'vertical', background: '#F8FAFC', color: '#0F172A',
                    lineHeight: 1.6, boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = '#3B82F6'}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>

              {/* Options (MCQ / True-False) */}
              {needsOptions && (
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>
                    <Tag size={11} /> Answer Options
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {form.options.map((opt, i) => (
                      <div key={opt.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span style={{
                          width: 28, height: 28, borderRadius: 7,
                          background: '#EFF6FF', color: '#2563EB',
                          fontSize: 12, fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {opt.id.toUpperCase()}
                        </span>
                        <input
                          value={opt.text}
                          onChange={e => setForm(p => ({
                            ...p,
                            options: p.options.map((o, j) => j === i ? { ...o, text: e.target.value } : o),
                          }))}
                          placeholder={`Option ${opt.id.toUpperCase()}`}
                          style={{
                            flex: 1, padding: '9px 13px', borderRadius: 10,
                            border: '1.5px solid #E2E8F0', fontSize: 13, outline: 'none',
                            background: '#F8FAFC', color: '#0F172A',
                          }}
                          onFocus={e => e.target.style.borderColor = '#3B82F6'}
                          onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Correct Answer */}
                  <div style={{ marginTop: 14, padding: '14px 16px', background: '#F0FDF4', borderRadius: 10, border: '1.5px solid #BBF7D0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#15803D', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>
                      <Star size={11} /> Correct Answer
                    </label>
                    <input
                      value={form.correctAnswer}
                      onChange={e => setForm(p => ({ ...p, correctAnswer: e.target.value }))}
                      placeholder={form.type === 'mcq_multi' ? 'e.g. a,c' : 'e.g. b'}
                      style={{
                        width: '100%', padding: '9px 13px', borderRadius: 8,
                        border: '1.5px solid #86EFAC', fontSize: 13, outline: 'none',
                        background: '#fff', color: '#15803D', fontWeight: 600,
                        boxSizing: 'border-box',
                      }}
                      onFocus={e => e.target.style.borderColor = '#16A34A'}
                      onBlur={e => e.target.style.borderColor = '#86EFAC'}
                    />
                    <p style={{ fontSize: 11, color: '#4ADE80', marginTop: 5, fontWeight: 500 }}>
                      {form.type === 'mcq_multi' ? 'Comma-separated IDs — e.g. a,c' : 'Single option ID — e.g. b'}
                    </p>
                  </div>
                </div>
              )}

              {/* Explanation + Points row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 14, alignItems: 'start' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 7 }}>
                    <Lightbulb size={11} /> Explanation <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#94A3B8' }}>(optional)</span>
                  </label>
                  <textarea
                    value={form.explanation}
                    onChange={e => setForm(p => ({ ...p, explanation: e.target.value }))}
                    rows={2}
                    placeholder="Guidance for HR when manually scoring…"
                    style={{
                      width: '100%', padding: '10px 13px', borderRadius: 10,
                      border: '1.5px solid #E2E8F0', fontSize: 13, outline: 'none',
                      resize: 'vertical', background: '#F8FAFC', color: '#0F172A',
                      lineHeight: 1.5, boxSizing: 'border-box',
                    }}
                    onFocus={e => e.target.style.borderColor = '#3B82F6'}
                    onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                  />
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 7 }}>
                    <Star size={11} /> Points
                  </label>
                  <input
                    type="number" min="1"
                    value={form.points}
                    onChange={e => setForm(p => ({ ...p, points: parseInt(e.target.value) || 1 }))}
                    style={{
                      width: '100%', padding: '9px 13px', borderRadius: 10,
                      border: '1.5px solid #E2E8F0', fontSize: 14, outline: 'none',
                      background: '#F8FAFC', color: '#0F172A', fontWeight: 600,
                      textAlign: 'center', boxSizing: 'border-box',
                    }}
                    onFocus={e => e.target.style.borderColor = '#3B82F6'}
                    onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                  />
                </div>
              </div>

              {/* Footer actions */}
              <div style={{
                display: 'flex', gap: 10, paddingTop: 4,
                borderTop: '1px solid #F1F5F9', marginTop: 4,
              }}>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); setForm(defaultForm); }}
                  style={{
                    flex: 1, padding: '11px 0', borderRadius: 10,
                    border: '1.5px solid #E2E8F0', background: '#fff',
                    fontSize: 14, fontWeight: 600, color: '#64748B', cursor: 'pointer',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 2, padding: '11px 0', borderRadius: 10,
                    border: 'none',
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)'}
                >
                  {editingId ? <><Edit2 size={14} /> Update Question</> : <><Plus size={14} /> Add Question</>}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}
