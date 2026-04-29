import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Plus, Briefcase, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import '../../styles/Roles.css';

const defaultForm = { title: '', department: '', experienceLevel: 'mid', scoringWeights: { aptitude: 20, technical: 50, reasoning: 20, communication: 10 } };

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);

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
      setShowForm(false); setEditing(null); setForm(defaultForm);
      fetchRoles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const openEdit = (role) => {
    setForm({ title: role.title, department: role.department, experienceLevel: role.experienceLevel, scoringWeights: role.scoringWeights });
    setEditing(role._id); setShowForm(true);
  };

  return (
    <div>
      {/* Squircle Header */}
      <div className="squircle-header">
        <div className="squircle-header-icon">
          <Briefcase size={20} />
        </div>
        <div className="squircle-header-content">
          <h1>Roles</h1>
          <p>Open positions and job descriptions</p>
        </div>
        <div className="squircle-header-actions">
          <Button onClick={() => { setForm(defaultForm); setEditing(null); setShowForm(true); }}>
            <Plus size={16} /> New Role
          </Button>
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
              </div>
              <div>
                <div className="scoring-section-title">Scoring Weights</div>
                <div className="scoring-weights">
                  {Object.entries(role.scoringWeights).map(([k, v]) => (
                    <div key={k} className="scoring-weight-item">
                      <div className="scoring-weight-header">
                        <span className="scoring-weight-label">{k}</span>
                        <span className="scoring-weight-value">{v}%</span>
                      </div>
                      <div className="scoring-weight-bar">
                        <div className="scoring-weight-bar-fill" style={{ width: `${v}%` }} />
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
          <div className="role-modal-content">
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
              <div className="role-form-actions">
                <Button type="submit" style={{ flex: 1 }}>{editing ? 'Update Role' : 'Create Role'}</Button>
                <Button variant="ghost" onClick={() => setShowForm(false)} style={{ flex: 1 }}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
