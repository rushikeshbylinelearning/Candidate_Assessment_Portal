import React, { useEffect, useState, useRef } from 'react';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Plus, Briefcase, Edit2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import '../../styles/Roles.css';
import PageShell from '../../components/layout/PageShell';

const defaultForm = {
  title: '',
  department: '',
  experienceLevel: 'mid',
  scoringWeights: { aptitude: 20, technical: 50, reasoning: 20, communication: 10 },
  requiredSkills: [],
};

const WEIGHT_COLORS = {
  aptitude: '#E5383B',
  technical: '#3B82F6',
  reasoning: '#10B981',
  communication: '#F59E0B'
};

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);

  // Skill input state
  const [skillInput, setSkillInput] = useState('');
  const skillInputRef = useRef(null);

  const fetchRoles = () => api.get('/roles').then(r => setRoles(r.data)).finally(() => setLoading(false));
  useEffect(() => { fetchRoles(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const total = Object.values(form.scoringWeights).reduce((a, b) => a + Number(b), 0);
    if (total !== 100) return toast.error('Scoring weights must sum to 100');
    try {
      if (editing) {
        await api.put(`/roles/${editing}`, form);
        toast.success('Role updated');
      } else {
        await api.post('/roles', form);
        toast.success('Role created');
      }
      setShowForm(false); setEditing(null); setForm(defaultForm); setSkillInput('');
      fetchRoles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const openEdit = (role) => {
    setForm({
      title: role.title,
      department: role.department,
      experienceLevel: role.experienceLevel,
      scoringWeights: role.scoringWeights,
      requiredSkills: role.requiredSkills || [],
    });
    setEditing(role._id);
    setShowForm(true);
    setSkillInput('');
  };

  // Add a skill tag from the input
  const addSkill = (raw) => {
    const name = raw.trim().replace(/,+$/, '').trim();
    if (!name) return;
    // Avoid duplicates (case-insensitive)
    const exists = form.requiredSkills.some(s => s.name.toLowerCase() === name.toLowerCase());
    if (exists) { setSkillInput(''); return; }
    setForm(p => ({ ...p, requiredSkills: [...p.requiredSkills, { name, level: 'required' }] }));
    setSkillInput('');
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(skillInput);
    }
  };

  const handleSkillBlur = () => {
    if (skillInput.trim()) addSkill(skillInput);
  };

  const removeSkill = (idx) => {
    setForm(p => ({ ...p, requiredSkills: p.requiredSkills.filter((_, i) => i !== idx) }));
  };

  const toggleSkillLevel = (idx) => {
    setForm(p => ({
      ...p,
      requiredSkills: p.requiredSkills.map((s, i) =>
        i === idx ? { ...s, level: s.level === 'required' ? 'nice-to-have' : 'required' } : s
      ),
    }));
  };

  return (
    <PageShell>
      {/* ── Dark header card — matches Candidates page style ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0C1220 0%, #1E2A45 60%, #162035 100%)',
        borderRadius: 12,
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        boxShadow: '0 4px 16px rgba(12,18,32,0.18), 0 1px 4px rgba(12,18,32,0.12)',
        border: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
        marginBottom: 10,
      }}>
        {/* Icon */}
        <div style={{
          width: 42, height: 42, borderRadius: 10,
          background: 'rgba(244,63,94,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, color: '#F43F5E',
        }}>
          <Briefcase size={20} />
        </div>
        {/* Title + subtitle */}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.2 }}>
            Roles
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0, fontWeight: 400 }}>
            Open positions and job descriptions
          </p>
        </div>
        {/* New Role button */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <button
            onClick={() => { setForm(defaultForm); setEditing(null); setShowForm(true); setSkillInput(''); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '7px 16px', borderRadius: 9,
              border: 'none', background: '#F43F5E',
              color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(244,63,94,0.35)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#E11D48'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F43F5E'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <Plus size={14} /> New Role
          </button>
        </div>
      </div>

      {loading ? <div className="roles-loading">Loading...</div> : (
        <div className="roles-grid">
          {roles.map(role => (
            <Card key={role._id}>
              <div className="role-card-header">
                <div className="role-card-info">
                  <div className="role-icon">
                    <Briefcase size={18} color="#e11d48" />
                  </div>
                  <div>
                    <div className="role-title">{role.title}</div>
                    <div className="role-department">{role.department}</div>
                  </div>
                </div>
                <button onClick={() => openEdit(role)} className="role-edit-btn">
                  <Edit2 size={15} />
                </button>
              </div>
              <div className="role-badges">
                <Badge label={role.experienceLevel} variant="default" />
                <Badge label={role.active ? 'Active' : 'Inactive'} variant={role.active ? 'success' : 'danger'} />
                {role.assessmentTemplate && <Badge label="Has Template" variant="info" />}
                {role.requiredSkills && role.requiredSkills.length > 0 && (
                  <span className="role-skills-badge">
                    {role.requiredSkills.length} Skill{role.requiredSkills.length !== 1 ? 's' : ''} Required
                  </span>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="scoring-section-title">Scoring Weights</div>
                <div className="scoring-weights">
                  {Object.entries(role.scoringWeights).map(([k, v]) => (
                    <div key={k} className="scoring-weight-item">
                      <div className="scoring-weight-header">
                        <span className="scoring-weight-label">{k}</span>
                        <span className="scoring-weight-value">{v}%</span>
                      </div>
                      <div className="scoring-weight-bar">
                        <div 
                          className="scoring-weight-bar-fill" 
                          style={{ 
                            width: `${v}%`, 
                            backgroundColor: WEIGHT_COLORS[k] || '#e11d48'
                          }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <div className="role-modal-overlay">
          <div className="role-modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 className="role-modal-title">{editing ? 'Edit Role' : 'Create New Role'}</h2>
            <form onSubmit={handleSubmit} className="role-form">
              <div className="role-form-field">
                <label className="role-form-label">Role Title</label>
                <input
                  required
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="role-form-input"
                />
              </div>
              <div className="role-form-grid">
                <div className="role-form-field">
                  <label className="role-form-label">Department</label>
                  <input
                    required
                    value={form.department}
                    onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                    className="role-form-input"
                  />
                </div>
                <div className="role-form-field">
                  <label className="role-form-label">Experience Level</label>
                  <select
                    value={form.experienceLevel}
                    onChange={e => setForm(p => ({ ...p, experienceLevel: e.target.value }))}
                    className="role-form-select"
                  >
                    {['intern', 'junior', 'mid', 'senior', 'lead'].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="role-form-field">
                <label className="role-form-label">Scoring Weights (must sum to 100)</label>
                <div className="scoring-weights-form">
                  {Object.entries(form.scoringWeights).map(([k, v]) => (
                    <div key={k}>
                      <label className="scoring-weight-input-label">{k} %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={v}
                        onChange={e => setForm(p => ({ ...p, scoringWeights: { ...p.scoringWeights, [k]: parseInt(e.target.value) || 0 } }))}
                        className="scoring-weight-input"
                      />
                    </div>
                  ))}
                </div>
                <div className="scoring-total">
                  Total: <strong className={`scoring-total-value ${Object.values(form.scoringWeights).reduce((a, b) => a + Number(b), 0) === 100 ? 'valid' : 'invalid'}`}>
                    {Object.values(form.scoringWeights).reduce((a, b) => a + Number(b), 0)}%
                  </strong>
                </div>
              </div>

              {/* ── Required Skills Section ── */}
              <div className="role-form-field">
                <label className="role-form-label">Required Skills</label>
                <p className="role-skills-hint">Type a skill and press Enter or comma to add. Click a tag to toggle Required / Nice-to-have.</p>

                {/* Skill tags */}
                <div className="role-skills-tags-wrap">
                  {form.requiredSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className={`role-skill-tag ${skill.level === 'required' ? 'skill-required' : 'skill-nice'}`}
                      title={`Click to toggle: currently "${skill.level}"`}
                    >
                      <span className="skill-tag-name" onClick={() => toggleSkillLevel(idx)}>
                        {skill.name}
                      </span>
                      <span className="skill-tag-level" onClick={() => toggleSkillLevel(idx)}>
                        {skill.level === 'required' ? 'R' : 'N'}
                      </span>
                      <button
                        type="button"
                        className="skill-tag-remove"
                        onClick={() => removeSkill(idx)}
                        aria-label={`Remove ${skill.name}`}
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                  <input
                    ref={skillInputRef}
                    type="text"
                    className="role-skill-input"
                    placeholder={form.requiredSkills.length === 0 ? 'Type a skill and press Enter or comma' : 'Add another skill...'}
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                    onBlur={handleSkillBlur}
                  />
                </div>
                {form.requiredSkills.length > 0 && (
                  <p className="role-skills-legend">
                    <span className="legend-dot legend-required" /> Required &nbsp;
                    <span className="legend-dot legend-nice" /> Nice-to-have &nbsp;· Click tag to toggle
                  </p>
                )}
              </div>

              <div className="role-form-actions">
                <Button type="submit" style={{ flex: 1 }}>{editing ? 'Update Role' : 'Create Role'}</Button>
                <Button variant="ghost" onClick={() => { setShowForm(false); setSkillInput(''); }} style={{ flex: 1 }}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}
