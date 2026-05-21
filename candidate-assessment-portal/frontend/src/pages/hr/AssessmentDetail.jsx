import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Clock, Users, CheckCircle, XCircle, Trash2,
  Edit2, Save, X, Send, ChevronRight, ToggleLeft, ToggleRight,
  ChevronDown, ChevronUp, AlertCircle,
} from 'lucide-react';
import PageShell from '../../components/layout/PageShell';

const TYPE_LABELS = {
  mcq_single: 'MCQ',
  mcq_multi: 'MCQ (Multi)',
  true_false: 'True / False',
  short_answer: 'Descriptive',
  scenario: 'Scenario',
  logic: 'Logic',
  coding: 'Coding',
};

const DIFFICULTY_STYLES = {
  easy:   { background: '#dcfce7', color: '#15803d' },
  medium: { background: '#fef9c3', color: '#a16207' },
  hard:   { background: '#fee2e2', color: '#b91c1c' },
};

const CAT_STYLES = {
  technical:     { background: '#dbeafe', color: '#1d4ed8' },
  aptitude:      { background: '#fae8ff', color: '#7e22ce' },
  reasoning:     { background: '#ffedd5', color: '#c2410c' },
  communication: { background: '#dcfce7', color: '#15803d' },
};

function InlineBadge({ label, style }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, letterSpacing: '0.4px',
      padding: '2px 9px', borderRadius: 20, textTransform: 'capitalize',
      whiteSpace: 'nowrap', ...style,
    }}>
      {label}
    </span>
  );
}

function QuestionRow({ q, index, onUpdate, isAssigned }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ type: q.type, text: q.text });
  const [saving, setSaving] = useState(false);
  
  const diffStyle = DIFFICULTY_STYLES[q.difficulty] || { background: '#f1f5f9', color: '#64748b' };
  const catStyle  = CAT_STYLES[q.category]  || { background: '#f1f5f9', color: '#64748b' };
  const hasOptions = q.options && q.options.length > 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/questions/${q._id}`, {
        type: editForm.type,
        text: editForm.text,
      });
      toast.success('Question updated');
      setEditing(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update question');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm({ type: q.type, text: q.text });
    setEditing(false);
  };

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: '12px 16px', background: '#fff',
        }}
      >
        {/* Number */}
        <div style={{
          width: 26, height: 26, borderRadius: 7, background: '#f8fafc',
          border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 11, fontWeight: 700,
          color: '#64748b', flexShrink: 0, marginTop: 1,
        }}>
          {index + 1}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Type selector */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Question Type
                </label>
                <select
                  value={editForm.type}
                  onChange={e => setEditForm(p => ({ ...p, type: e.target.value }))}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 8,
                    border: '1px solid #e2e8f0', fontSize: 13, outline: 'none',
                    background: '#fff', cursor: 'pointer',
                  }}
                >
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Question text */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Question Text
                </label>
                <textarea
                  value={editForm.text}
                  onChange={e => setEditForm(p => ({ ...p, text: e.target.value }))}
                  rows={3}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 8,
                    border: '1px solid #e2e8f0', fontSize: 13, outline: 'none',
                    resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6,
                  }}
                />
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  style={{
                    padding: '6px 14px', borderRadius: 7, border: '1px solid #e2e8f0',
                    background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  <X size={14} /> Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !editForm.text.trim()}
                  style={{
                    padding: '6px 14px', borderRadius: 7, border: 'none',
                    background: saving || !editForm.text.trim() ? '#94a3b8' : '#e11d48',
                    color: '#fff', fontSize: 13, fontWeight: 600,
                    cursor: saving || !editForm.text.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
                <InlineBadge label={TYPE_LABELS[q.type] || q.type} style={{ background: '#f1f5f9', color: '#475569' }} />
                <InlineBadge label={q.category} style={catStyle} />
                <InlineBadge label={q.difficulty} style={diffStyle} />
                <InlineBadge label={`${q.points ?? 1} pt`} style={{ background: '#f0fdf4', color: '#15803d' }} />
              </div>
              <p style={{ fontSize: 13.5, color: '#0f172a', lineHeight: 1.6, margin: 0 }}>{q.text}</p>
            </>
          )}
        </div>

        {!editing && (
          <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginTop: 2 }}>
            {!isAssigned && (
              <button
                onClick={() => setEditing(true)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#64748b', padding: 4, display: 'flex', alignItems: 'center',
                }}
                title="Edit question"
              >
                <Edit2 size={15} />
              </button>
            )}
            {hasOptions && (
              <button
                onClick={() => setExpanded(e => !e)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#94a3b8', padding: 4, display: 'flex', alignItems: 'center',
                }}
                title={expanded ? 'Collapse options' : 'Expand options'}
              >
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            )}
          </div>
        )}
      </div>

      {expanded && hasOptions && !editing && (
        <div style={{ padding: '0 16px 12px 54px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {q.options.map(opt => (
            <div key={opt.id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 10px', borderRadius: 7,
              background: q.correctAnswer === opt.id ? '#f0fdf4' : '#fff',
              border: `1px solid ${q.correctAnswer === opt.id ? '#86efac' : '#e2e8f0'}`,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', minWidth: 14 }}>
                {opt.id})
              </span>
              <span style={{ fontSize: 13, color: '#334155' }}>{opt.text}</span>
              {q.correctAnswer === opt.id && (
                <CheckCircle size={13} color="#16a34a" style={{ marginLeft: 'auto', flexShrink: 0 }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AssessmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [showAssign, setShowAssign] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [assigning, setAssigning] = useState(null);

  const fetchAssessment = () =>
    api.get(`/assessments/${id}`)
      .then(r => { setAssessment(r.data); setForm(r.data); })
      .finally(() => setLoading(false));

  useEffect(() => { fetchAssessment(); }, [id]);

  const fetchCandidates = async () => {
    const params = new URLSearchParams({ status: 'pending', limit: 50 });
    if (candidateSearch) params.set('search', candidateSearch);
    const { data } = await api.get(`/candidates?${params}`);
    setCandidates(data.candidates);
  };

  useEffect(() => { if (showAssign) fetchCandidates(); }, [showAssign, candidateSearch]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put(`/assessments/${id}`, {
        title: form.title,
        description: form.description,
        duration: form.duration,
        passThreshold: form.passThreshold,
        allowBacktrack: form.allowBacktrack,
        randomizeQuestions: form.randomizeQuestions,
        randomizeOptions: form.randomizeOptions,
      });
      setAssessment(data);
      setEditing(false);
      toast.success('Assessment updated');
    } catch {
      toast.error('Failed to update assessment');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    try {
      const { data } = await api.patch(`/assessments/${id}/toggle`);
      setAssessment(data);
      toast.success(`Assessment ${data.active ? 'activated' : 'deactivated'}`);
    } catch {
      toast.error('Failed to toggle status');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this assessment? This cannot be undone.')) return;
    try {
      await api.delete(`/assessments/${id}`);
      toast.success('Assessment deleted');
      navigate('/hr/assessments/create');
    } catch {
      toast.error('Failed to delete assessment');
    }
  };

  const handleAssign = async (candidateId) => {
    setAssigning(candidateId);
    try {
      const { data } = await api.post(`/candidates/${candidateId}/invite`, { assessmentIds: { ROLE_BASED_ASSESSMENT: id } });
      toast.success(data.message || 'Assessment assigned successfully');
      setShowAssign(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign assessment');
    } finally {
      setAssigning(null);
    }
  };

  if (loading) return <PageShell><div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading...</div></PageShell>;
  if (!assessment) return <PageShell><div style={{ padding: 40, textAlign: 'center', color: '#e11d48' }}>Assessment not found</div></PageShell>;

  return (
    <PageShell scrollable>
    <div>
      <button
        onClick={() => navigate('/hr/assessments/create')}
        style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, marginBottom: 20 }}
      >
        <ArrowLeft size={16} /> Back to Assessments
      </button>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          {editing ? (
            <input
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: 8, padding: '4px 10px', outline: 'none', width: 400 }}
            />
          ) : (
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>{assessment.title}</h1>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, color: '#64748b' }}>{assessment.roleId?.title} · {assessment.roleId?.department}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: assessment.active ? '#16a34a' : '#94a3b8' }}>
              {assessment.active ? <CheckCircle size={14} /> : <XCircle size={14} />}
              {assessment.active ? 'Active' : 'Inactive'}
            </div>
            {assessment.isAssigned && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: '#f59e0b', background: '#fef3c7', padding: '4px 10px', borderRadius: 6 }}>
                <Users size={14} />
                Assigned to Candidates
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {editing ? (
            <>
              <Button size="sm" onClick={handleSave} loading={saving}><Save size={14} /> Save</Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setForm(assessment); }}><X size={14} /> Cancel</Button>
            </>
          ) : (
            <>
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={() => setEditing(true)}
                disabled={assessment.isAssigned}
                title={assessment.isAssigned ? 'Cannot edit assessment that has been assigned to candidates' : 'Edit assessment'}
              >
                <Edit2 size={14} /> Edit
              </Button>
              <Button size="sm" variant="secondary" onClick={handleToggle}>
                {assessment.active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                {assessment.active ? 'Deactivate' : 'Activate'}
              </Button>
              <Button size="sm" onClick={() => setShowAssign(true)}><Send size={14} /> Assign to Candidate</Button>
              <Button 
                size="sm" 
                variant="danger" 
                onClick={handleDelete}
                disabled={assessment.isAssigned}
                title={assessment.isAssigned ? 'Cannot delete assessment that has been assigned to candidates' : 'Delete assessment'}
              >
                <Trash2 size={14} /> Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          ['Duration', `${assessment.duration} min`, Clock],
          ['Questions', assessment.totalQuestions, Users],
          ['Pass Threshold', `${assessment.passThreshold}%`, CheckCircle],
          ['Sections', assessment.sections?.length || 0, null],
        ].map(([label, value, Icon]) => (
          <Card key={label} style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{value}</div>
          </Card>
        ))}
      </div>

      {/* Warning message when assigned */}
      {assessment.isAssigned && (
        <div style={{ 
          background: '#fef3c7', 
          border: '1.5px solid #fbbf24', 
          borderRadius: 12, 
          padding: '14px 18px', 
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <AlertCircle size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#92400e', marginBottom: 2 }}>
              Assessment is Assigned
            </div>
            <div style={{ fontSize: 13, color: '#78350f' }}>
              This assessment has been assigned to candidates and cannot be edited or deleted. To make changes, create a new version of this assessment.
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Config */}
        <Card style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Configuration</h3>
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Description</label>
                <textarea
                  value={form.description || ''}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Duration (min)</label>
                  <input type="number" min="5" value={form.duration}
                    onChange={e => setForm(p => ({ ...p, duration: parseInt(e.target.value) || 60 }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Pass Threshold %</label>
                  <input type="number" min="1" max="100" value={form.passThreshold}
                    onChange={e => setForm(p => ({ ...p, passThreshold: parseInt(e.target.value) || 60 }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['allowBacktrack', 'Allow backtracking'],
                  ['randomizeQuestions', 'Randomize question order'],
                  ['randomizeOptions', 'Shuffle answer options'],
                ].map(([key, label]) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#334155', fontWeight: 500 }}>
                    <input type="checkbox" checked={!!form[key]}
                      onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))}
                      style={{ width: 16, height: 16, accentColor: '#e11d48' }} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {assessment.description && (
                <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>{assessment.description}</p>
              )}
              {[
                ['Backtracking', assessment.allowBacktrack ? 'Allowed' : 'Not allowed'],
                ['Randomize Questions', assessment.randomizeQuestions ? 'Yes' : 'No'],
                ['Randomize Options', assessment.randomizeOptions ? 'Yes' : 'No'],
                ['Created', new Date(assessment.createdAt).toLocaleDateString()],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: '#64748b' }}>{label}</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Sections */}
        <Card style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Sections</h3>
          {assessment.sections?.length === 0 ? (
            <p style={{ fontSize: 14, color: '#94a3b8' }}>No sections defined</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {assessment.sections?.map((s, i) => (
                <div key={i} style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{s.category} · {s.difficulty}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{s.questionCount}q</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Questions List */}
      {assessment.selectedQuestions && assessment.selectedQuestions.length > 0 && (
        <Card style={{ padding: 24, marginTop: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
            Questions ({assessment.selectedQuestions.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {assessment.selectedQuestions.map((q, i) => (
              <QuestionRow key={q._id} q={q} index={i} onUpdate={fetchAssessment} isAssigned={assessment.isAssigned} />
            ))}
          </div>
        </Card>
      )}

      {/* Assign Modal */}
      {showAssign && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 520, boxShadow: '0 25px 50px rgba(0,0,0,0.2)', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Assign to Candidate</h2>
              <button onClick={() => setShowAssign(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
              Assigning: <strong style={{ color: '#0f172a' }}>{assessment.title}</strong>
            </p>
            <input
              value={candidateSearch}
              onChange={e => setCandidateSearch(e.target.value)}
              placeholder="Search candidates by name or email..."
              style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', marginBottom: 16 }}
            />
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {candidates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: 14 }}>
                  No pending candidates found
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {candidates.map(c => (
                    <div key={c._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e11d4815', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                          {c.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{c.name}</div>
                          <div style={{ fontSize: 12, color: '#94a3b8' }}>{c.email} · {c.appliedRole?.title || 'No role'}</div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        loading={assigning === c._id}
                        onClick={() => handleAssign(c._id)}
                      >
                        <Send size={12} /> Assign
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </PageShell>
  );
}
