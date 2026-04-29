import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { ArrowLeft, List, Search, Plus, X, CheckCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AssessmentBuilderStandard() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selected, setSelected] = useState([]); // array of question _ids
  const [qFilters, setQFilters] = useState({ category: '', difficulty: '', type: '', search: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showBank, setShowBank] = useState(true);

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
    api.get(`/questions?${params}`).then(r => setQuestions(r.data.questions)).finally(() => setLoading(false));
  }, [qFilters]);

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.roleId) return toast.error('Please select a role');
    if (selected.length === 0) return toast.error('Select at least one question');
    setSaving(true);
    try {
      // Build sections from selected questions
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
        randomizeQuestions: false, // standard = fixed order
        mode: 'standard',
        selectedQuestions: selected,
      });
      toast.success('Assessment created!');
      navigate('/hr/questions');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create assessment');
    } finally {
      setSaving(false);
    }
  };

  const selectedQs = questions.filter(q => selected.includes(q._id));
  const catCounts = {};
  selectedQs.forEach(q => { catCounts[q.category] = (catCounts[q.category] || 0) + 1; });

  return (
    <div>
      <button
        onClick={() => navigate('/hr/assessments/create')}
        style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, marginBottom: 24 }}
      >
        <ArrowLeft size={16} /> Back to Mode Selection
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <List size={22} color="#16a34a" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Standard Mode Assessment</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 2 }}>Pre-select questions from the bank</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'flex-start' }}>

          {/* Left — Question Bank */}
          <div>
            {/* Bank filters */}
            <Card style={{ marginBottom: 16, padding: 16 }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    value={qFilters.search}
                    onChange={e => setQFilters(p => ({ ...p, search: e.target.value }))}
                    placeholder="Search questions..."
                    style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none' }}
                  />
                </div>
                {[
                  ['category', ['', 'aptitude', 'technical', 'reasoning', 'communication']],
                  ['difficulty', ['', 'easy', 'medium', 'hard']],
                ].map(([key, opts]) => (
                  <select
                    key={key}
                    value={qFilters[key]}
                    onChange={e => setQFilters(p => ({ ...p, [key]: e.target.value }))}
                    style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', background: '#fff' }}
                  >
                    <option value="">{key.charAt(0).toUpperCase() + key.slice(1)}: All</option>
                    {opts.filter(Boolean).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ))}
              </div>
            </Card>

            {/* Question list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 520, overflowY: 'auto', paddingRight: 4 }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>Loading...</div>
              ) : questions.map(q => {
                const isSelected = selected.includes(q._id);
                return (
                  <div
                    key={q._id}
                    onClick={() => toggleSelect(q._id)}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 12,
                      border: `2px solid ${isSelected ? '#16a34a' : '#e2e8f0'}`,
                      background: isSelected ? '#f0fdf4' : '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                          <Badge label={q.category} variant="info" />
                          <Badge label={q.difficulty} variant={q.difficulty === 'easy' ? 'success' : q.difficulty === 'medium' ? 'warning' : 'danger'} />
                          <Badge label={q.type.replace(/_/g, ' ')} variant="default" />
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>{q.points}pt</span>
                        </div>
                        <p style={{ fontSize: 14, color: '#0f172a', lineHeight: 1.5 }}>{q.text}</p>
                      </div>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${isSelected ? '#16a34a' : '#cbd5e1'}`, background: isSelected ? '#16a34a' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {isSelected && <CheckCircle size={14} color="#fff" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right — Config panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Selected summary */}
            <Card style={{ padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                Selected Questions
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>{selected.length}</div>
              {Object.entries(catCounts).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {Object.entries(catCounts).map(([cat, count]) => (
                    <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: '#64748b', textTransform: 'capitalize' }}>{cat}</span>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{count}q</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: '#94a3b8' }}>Click questions to add them</p>
              )}
              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelected([])}
                  style={{ marginTop: 12, fontSize: 12, color: '#e11d48', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Clear all
                </button>
              )}
            </Card>

            {/* Assessment config */}
            <Card style={{ padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
                Assessment Config
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Role *</label>
                  <select
                    required
                    value={form.roleId}
                    onChange={e => setForm(p => ({ ...p, roleId: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', background: '#fff' }}
                  >
                    <option value="">Select role...</option>
                    {roles.map(r => <option key={r._id} value={r._id}>{r.title} — {r.department}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Title *</label>
                  <input
                    required
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Software Engineer Assessment"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    rows={2}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', resize: 'vertical' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />Duration (min)
                    </label>
                    <input
                      type="number"
                      min="5"
                      value={form.duration}
                      onChange={e => setForm(p => ({ ...p, duration: parseInt(e.target.value) || 60 }))}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Pass Threshold %</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={form.passThreshold}
                      onChange={e => setForm(p => ({ ...p, passThreshold: parseInt(e.target.value) || 60 }))}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    ['allowBacktrack', 'Allow backtracking'],
                    ['randomizeOptions', 'Shuffle answer options'],
                  ].map(([key, label]) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#334155', fontWeight: 500 }}>
                      <input
                        type="checkbox"
                        checked={form[key]}
                        onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))}
                        style={{ width: 16, height: 16, accentColor: '#e11d48' }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </Card>

            <Button type="submit" disabled={saving || selected.length === 0} style={{ width: '100%', justifyContent: 'center' }}>
              {saving ? 'Creating...' : `Create Assessment (${selected.length} questions)`}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
