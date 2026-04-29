import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Plus, FileQuestion, Edit2, Trash2, Search, Zap, List } from 'lucide-react';
import toast from 'react-hot-toast';
import '../../styles/Questions.css';
import '../../styles/SquircleHeader.css';

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
    <div>
      {/* Squircle Header */}
      <div className="squircle-header">
        <div className="squircle-header-icon">
          <FileQuestion size={20} />
        </div>
        <div className="squircle-header-content">
          <h1>Question Bank</h1>
          <p>Manage assessment questions</p>
        </div>
        <div className="squircle-header-actions">
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

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24, overflowY: 'auto' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 600, boxShadow: '0 25px 50px rgba(0,0,0,0.2)', margin: 'auto' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
              {editingId ? 'Edit Question' : 'Add Question'}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                  ['type', 'Type', ['mcq_single', 'mcq_multi', 'true_false', 'short_answer', 'scenario', 'logic', 'coding']],
                  ['category', 'Category', ['aptitude', 'technical', 'reasoning', 'communication']],
                  ['difficulty', 'Difficulty', ['easy', 'medium', 'hard']],
                ].map(([key, label, opts]) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      {label}
                    </label>
                    <select
                      value={form[key]}
                      onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', background: '#fff' }}
                    >
                      {opts.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Question Text
                </label>
                <textarea
                  required
                  value={form.text}
                  onChange={e => setForm(p => ({ ...p, text: e.target.value }))}
                  rows={3}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', resize: 'vertical' }}
                />
              </div>
              {needsOptions && (
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>
                    Options
                  </label>
                  {form.options.map((opt, i) => (
                    <div key={opt.id} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b', width: 24 }}>
                        {opt.id.toUpperCase()}.
                      </span>
                      <input
                        value={opt.text}
                        onChange={e =>
                          setForm(p => ({
                            ...p,
                            options: p.options.map((o, j) => (j === i ? { ...o, text: e.target.value } : o)),
                          }))
                        }
                        style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }}
                      />
                    </div>
                  ))}
                  <div style={{ marginTop: 10 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      Correct Answer
                    </label>
                    <input
                      value={form.correctAnswer}
                      onChange={e => setForm(p => ({ ...p, correctAnswer: e.target.value }))}
                      placeholder={form.type === 'mcq_multi' ? 'e.g. a,c' : 'e.g. b'}
                      style={{ width: '100%', padding: '9px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }}
                    />
                    <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                      {form.type === 'mcq_multi' ? 'Comma-separated option IDs (e.g. a,c)' : 'Single option ID (e.g. b)'}
                    </p>
                  </div>
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Explanation (optional)
                </label>
                <textarea
                  value={form.explanation}
                  onChange={e => setForm(p => ({ ...p, explanation: e.target.value }))}
                  rows={2}
                  placeholder="Provide guidance for HR when manually scoring..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', resize: 'vertical' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Points
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.points}
                  onChange={e => setForm(p => ({ ...p, points: parseInt(e.target.value) || 1 }))}
                  style={{ width: 100, padding: '9px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <Button type="submit" style={{ flex: 1 }}>
                  {editingId ? 'Update Question' : 'Add Question'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setForm(defaultForm);
                  }}
                  style={{ flex: 1 }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
