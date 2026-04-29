import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Button from '../../components/ui/Button';
import StructuredResume from '../../components/resume/StructuredResume';
import RoleMatchCard from '../../components/resume/RoleMatchCard';
import {
  Mail, Phone, ChevronRight, Calendar, CheckCircle2, XCircle,
  Edit2, Plus, X, Save, Trash2, MessageSquare, TrendingUp, TrendingDown,
  Download, FileText, Brain, Zap, Lightbulb, BarChart2
} from 'lucide-react';
import toast from 'react-hot-toast';
import '../../styles/CandidateDetail.css';

export default function CandidateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [responses, setResponses] = useState([]);
  const [score, setScore] = useState(null);
  const [logs, setLogs] = useState([]);
  const [resumeData, setResumeData] = useState(null);
  const [roleMatch, setRoleMatch] = useState(null);
  const [showOriginalResume, setShowOriginalResume] = useState(false);
  const [logForm, setLogForm] = useState({
    round: '', stage: 'technical', notes: '', rating: 7,
    strengths: '', weaknesses: '', recommendation: 'proceed', nextAction: ''
  });
  const [showDrawer, setShowDrawer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');

  // Strength & Weakness Management
  const [strengths, setStrengths] = useState([]);
  const [weaknesses, setWeaknesses] = useState([]);
  const [newStrength, setNewStrength] = useState('');
  const [newWeakness, setNewWeakness] = useState('');

  const fetchAll = async () => {
    const [c, r, s, l] = await Promise.all([
      api.get(`/candidates/${id}`),
      api.get(`/responses?candidateId=${id}`).catch(() => ({ data: [] })),
      api.get(`/responses/score/${id}`).catch(() => ({ data: null })),
      api.get(`/notes?candidateId=${id}`),
    ]);
    setCandidate(c.data);
    setResponses(r.data);
    setScore(s.data);
    setLogs(l.data);

    // Aggregate strengths and weaknesses from interview logs
    const allStrengths = l.data.flatMap(log => log.strengths || []);
    setStrengths([...new Set(allStrengths)]);
    const allWeaknesses = l.data.flatMap(log => log.weaknesses || []);
    setWeaknesses([...new Set(allWeaknesses)]);

    if (c.data.resumeUrl) {
      try {
        const resumeRes = await api.get(`/resume/${id}`);
        setResumeData(resumeRes.data);
        if (c.data.appliedRole?._id) {
          const matchRes = await api.get(`/resume/${id}/match/${c.data.appliedRole._id}`);
          setRoleMatch(matchRes.data);
        }
      } catch (err) {
        console.log('Resume data not available yet');
      }
    }
  };

  useEffect(() => {
    fetchAll().finally(() => setLoading(false));
  }, [id]);

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/notes', {
        ...logForm,
        candidateId: id,
        strengths: logForm.strengths.split(',').map(s => s.trim()).filter(Boolean),
        weaknesses: logForm.weaknesses.split(',').map(s => s.trim()).filter(Boolean),
        rating: parseInt(logForm.rating),
      });
      toast.success('Interview log saved');
      setShowDrawer(false);
      setLogForm({ round: '', stage: 'technical', notes: '', rating: 7, strengths: '', weaknesses: '', recommendation: 'proceed', nextAction: '' });
      fetchAll();
    } catch {
      toast.error('Failed to save log');
    }
  };

  const addStrength = async () => {
    if (newStrength.trim()) {
      const updated = [...strengths, newStrength.trim()];
      setStrengths(updated);
      setNewStrength('');
      try {
        await api.patch(`/candidates/${id}`, { strengths: updated });
      } catch {
        toast.error('Failed to save strength');
      }
    }
  };
  const addWeakness = async () => {
    if (newWeakness.trim()) {
      const updated = [...weaknesses, newWeakness.trim()];
      setWeaknesses(updated);
      setNewWeakness('');
      try {
        await api.patch(`/candidates/${id}`, { weaknesses: updated });
      } catch {
        toast.error('Failed to save weakness');
      }
    }
  };
  const removeStrength = (i) => setStrengths(strengths.filter((_, idx) => idx !== i));
  const removeWeakness = (i) => setWeaknesses(weaknesses.filter((_, idx) => idx !== i));

  if (loading) {
    return (
      <div className="candidate-detail-loading">
        <div className="shimmer-container">
          <div className="shimmer shimmer-hero"></div>
          <div className="shimmer-columns">
            <div className="shimmer shimmer-panel"></div>
            <div className="shimmer shimmer-panel"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="candidate-detail-error">
        <div className="error-content">
          <XCircle size={48} />
          <h2>Candidate not found</h2>
          <Button onClick={() => navigate('/hr/candidates')}>Back to Candidates</Button>
        </div>
      </div>
    );
  }

  const skillColors = {
    aptitude: { border: '#E11D48', bg: '#FFF1F2', icon: '#E11D48' },
    technical: { border: '#3B82F6', bg: '#EFF6FF', icon: '#3B82F6' },
    reasoning: { border: '#22C55E', bg: '#F0FDF4', icon: '#22C55E' },
    communication: { border: '#F59E0B', bg: '#FFFBEB', icon: '#F59E0B' },
  };

  const skillIcons = {
    aptitude: <Brain size={16} />,
    technical: <Zap size={16} />,
    reasoning: <Lightbulb size={16} />,
    communication: <BarChart2 size={16} />,
  };

  return (
    <div className="candidate-detail-page">
      <div className="candidate-columns">
        {/* ===================== LEFT PANEL (FIXED) ===================== */}
        <div className="column-left">
          {/* Candidate Header */}
          <div className="candidate-header-card" style={{ flexShrink: 0 }}>
            <div className="candidate-header-top">
              <div className="candidate-avatar-info">
                <div className="candidate-avatar">
                  {(candidate.name || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="candidate-name">{candidate.name}</h2>
                  <div className="candidate-contact">
                    <span className="candidate-contact-item">
                      <Mail size={12} />
                      {candidate.email}
                    </span>
                    {candidate.phone && (
                      <>
                        <span className="contact-sep">|</span>
                        <span className="candidate-contact-item">
                          <Phone size={12} />
                          {candidate.phone}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {candidate.resumeUrl && (
                <button
                  className="view-original-btn"
                  onClick={() => setShowOriginalResume(!showOriginalResume)}
                >
                  <FileText size={12} />
                  View Original
                </button>
              )}
            </div>
            <div className="candidate-tags">
              {candidate.appliedRole?.title && (
                <span className="candidate-tag">{candidate.appliedRole.title}</span>
              )}
              {candidate.appliedRole?.department && (
                <span className="candidate-tag">{candidate.appliedRole.department}</span>
              )}
              {candidate.experienceLevel && (
                <span className="candidate-tag">{candidate.experienceLevel}</span>
              )}
            </div>
            

          </div>

          {/* Resume Section Label */}
          <div className="resume-section-label">
            <span>Resume</span>
          </div>

          {/* Scrollable resume area: StructuredResume + Download button */}
          <div className="resume-panel-scroll">
            {/* Structured Resume with vertical nav tabs */}
            <StructuredResume
              resumeData={resumeData}
              candidate={candidate}
              onViewOriginal={() => setShowOriginalResume(true)}
              showOriginal={showOriginalResume}
              onHideOriginal={() => setShowOriginalResume(false)}
              hasResume={!!candidate.resumeUrl}
            />

            {/* Download Resume */}
            <div className="resume-download-row">
              <button
                className="download-resume-btn"
                onClick={() => {
                  if (candidate.resumeUrl) {
                    const url = candidate.resumeUrl.startsWith('http')
                      ? candidate.resumeUrl
                      : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${candidate.resumeUrl}`;
                    window.open(url, '_blank');
                  }
                }}
                disabled={!candidate.resumeUrl}
                style={{ opacity: candidate.resumeUrl ? 1 : 0.5, cursor: candidate.resumeUrl ? 'pointer' : 'not-allowed' }}
              >
                <Download size={14} />
                {candidate.resumeUrl ? 'Download Resume' : 'No Resume'}
              </button>
            </div>
          </div>
        </div>

        {/* ===================== RIGHT PANEL (SCROLLABLE) ===================== */}
        <div className="column-right">
          <div className="evaluation-panel">
            {/* Role Match Card */}
            <RoleMatchCard matchData={roleMatch} />

            {/* Score Cards Row */}
            <div className="score-cards-row">
              {(score === null || !score?.sectionScores) ? (
                <div className="score-card-placeholder">
                  No assessment taken yet. Scores will appear here once the candidate completes their assessment.
                </div>
              ) : (
                Object.entries(score.sectionScores).map(([category, value]) => {
                  const colors = skillColors[category] || { border: '#E5E7EB', bg: '#F9FAFB', icon: '#6B7280' };
                  return (
                    <div
                      key={category}
                      className="score-card"
                      style={{ borderTopColor: colors.border }}
                    >
                      <div
                        className="score-card-icon"
                        style={{ background: colors.bg, color: colors.icon }}
                      >
                        {skillIcons[category] || <BarChart2 size={16} />}
                      </div>
                      <div className="score-card-value">{value}</div>
                      <div className="score-card-label">
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Strengths & Weaknesses */}
            <div className="sw-section">
              <h3 className="sw-section-title">Strengths &amp; Weaknesses</h3>

              {/* Strengths */}
              <div className="sw-group">
                <div className="sw-group-header">
                  <TrendingUp size={14} color="#22C55E" />
                  <span>Strengths</span>
                </div>
                <div className="sw-items-grid">
                  {strengths.length === 0 && (
                    <div className="sw-empty-state">No strengths recorded yet</div>
                  )}
                  {strengths.map((s, i) => (
                    <div key={i} className="sw-tag strength">
                      <span>{s}</span>
                      <button className="sw-tag-remove" onClick={() => removeStrength(i)}>
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                  <div className="sw-add-input-wrap">
                    <input
                      type="text"
                      className="sw-add-input"
                      placeholder="+ Add strength"
                      value={newStrength}
                      onChange={e => setNewStrength(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addStrength()}
                    />
                    <button className="sw-add-btn" onClick={addStrength}>
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Weaknesses */}
              <div className="sw-group">
                <div className="sw-group-header">
                  <TrendingDown size={14} color="#E11D48" />
                  <span>Weaknesses</span>
                </div>
                <div className="sw-items-grid">
                  {weaknesses.length === 0 && (
                    <div className="sw-empty-state">No weaknesses recorded yet</div>
                  )}
                  {weaknesses.map((w, i) => (
                    <div key={i} className="sw-tag weakness">
                      <span>{w}</span>
                      <button className="sw-tag-remove" onClick={() => removeWeakness(i)}>
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                  <div className="sw-add-input-wrap">
                    <input
                      type="text"
                      className="sw-add-input"
                      placeholder="+ Add weakness"
                      value={newWeakness}
                      onChange={e => setNewWeakness(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addWeakness()}
                    />
                    <button className="sw-add-btn" onClick={addWeakness}>
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="notes-section-card">
              <div className="notes-section-header">
                <div className="notes-title-row">
                  <FileText size={16} color="#6B7280" />
                  <h3 className="notes-title">Notes</h3>
                </div>
                <button className="add-note-btn" onClick={() => setShowDrawer(true)}>
                  + Add Note
                </button>
              </div>

              <textarea
                className="notes-textarea"
                placeholder="Write your note here..."
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
              />

              {logs.length > 0 && (
                <div className="notes-timeline">
                  {logs.map((log) => (
                    <div key={log._id} className="note-item">
                      <div className="note-marker" />
                      <div className="note-content">
                        <div className="note-header">
                          <div className="note-title">
                            <span className="note-round">{log.round}</span>
                            <span
                              className="note-stage"
                              style={{
                                background: log.stage === 'technical' ? '#EFF6FF' : log.stage === 'hr' ? '#F0FDF4' : '#FEF3C7',
                                color: log.stage === 'technical' ? '#2563EB' : log.stage === 'hr' ? '#16A34A' : '#D97706'
                              }}
                            >{log.stage}</span>
                          </div>
                          <div className="note-meta">
                            <span className="note-rating">
                              <span className="rating-dot" />
                              {log.rating}/10
                            </span>
                            <span
                              className="note-recommendation"
                              style={{
                                background: log.recommendation === 'proceed' ? '#D1FAE5' : log.recommendation === 'reject' ? '#FEE2E2' : '#FEF3C7',
                                color: log.recommendation === 'proceed' ? '#065F46' : log.recommendation === 'reject' ? '#991B1B' : '#92400E'
                              }}
                            >{log.recommendation}</span>
                          </div>
                        </div>
                        {log.notes && <p className="note-text">{log.notes}</p>}
                        <div className="note-footer">
                          <span className="note-author">By {log.interviewerId?.name || 'Unknown'}</span>
                          <span>{new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {logs.length === 0 && !noteText && (
                <div className="notes-empty">
                  <Calendar size={28} color="#D1D5DB" />
                  <div className="empty-text">No notes yet</div>
                  <p className="empty-subtext">Add interview feedback and evaluation notes</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Note Drawer */}
      {showDrawer && (
        <>
          <div className="drawer-overlay" onClick={() => setShowDrawer(false)} />
          <div className="drawer-panel">
            <div className="drawer-header">
              <h2 className="drawer-title">Add Interview Note</h2>
              <button className="drawer-close" onClick={() => setShowDrawer(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleLogSubmit} className="drawer-form">
              <div className="form-field">
                <label className="form-label">Round Name</label>
                <input required value={logForm.round} onChange={e => setLogForm(p => ({ ...p, round: e.target.value }))} placeholder="e.g. Round 1 - Technical" className="form-input" />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Stage</label>
                  <select value={logForm.stage} onChange={e => setLogForm(p => ({ ...p, stage: e.target.value }))} className="form-select">
                    {['screening', 'technical', 'hr', 'final', 'offer'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Rating (1-10)</label>
                  <input type="number" min="1" max="10" value={logForm.rating} onChange={e => setLogForm(p => ({ ...p, rating: e.target.value }))} className="form-input" />
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Notes</label>
                <textarea value={logForm.notes} onChange={e => setLogForm(p => ({ ...p, notes: e.target.value }))} rows={4} placeholder="Add detailed feedback..." className="form-textarea" />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Strengths (comma-separated)</label>
                  <input value={logForm.strengths} onChange={e => setLogForm(p => ({ ...p, strengths: e.target.value }))} placeholder="Problem solving, Communication" className="form-input" />
                </div>
                <div className="form-field">
                  <label className="form-label">Weaknesses</label>
                  <input value={logForm.weaknesses} onChange={e => setLogForm(p => ({ ...p, weaknesses: e.target.value }))} placeholder="System design" className="form-input" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Recommendation</label>
                  <select value={logForm.recommendation} onChange={e => setLogForm(p => ({ ...p, recommendation: e.target.value }))} className="form-select">
                    {['proceed', 'hold', 'reject', 'hire'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Next Action</label>
                  <input value={logForm.nextAction} onChange={e => setLogForm(p => ({ ...p, nextAction: e.target.value }))} placeholder="Schedule final round" className="form-input" />
                </div>
              </div>
              <div className="drawer-actions">
                <Button type="submit">Save Note</Button>
                <Button variant="ghost" onClick={() => setShowDrawer(false)} type="button">Cancel</Button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Floating Action Button */}
      <button className="fab-button" onClick={() => setShowDrawer(true)} title="Add Interview Note">
        <Edit2 size={18} />
      </button>
    </div>
  );
}