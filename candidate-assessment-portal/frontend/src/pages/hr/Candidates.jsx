import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { 
  Search, Plus, Send, ChevronRight, Copy, Check, Clock, ExternalLink, X, Users, 
  ClipboardList, Upload, FileText, Download, AlertCircle, CheckCircle, Loader,
  Trash2, Eye, UserPlus, UsersIcon, Edit2
} from 'lucide-react';
import toast from 'react-hot-toast';
import '../../styles/Candidates.css';

// ── Invite Link Modal ────────────────────────────────────────────────────────
function InviteModal({ data, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(data.assessmentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const expiresAt = new Date(data.expiresAt);
  const daysLeft = Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="fixed inset-0 bg-black/50 modal-backdrop flex items-center justify-center z-50 p-6 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-7 pb-6 relative">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X size={16} />
          </button>
          <div className="w-11 h-11 rounded-xl bg-primary-600 flex items-center justify-center mb-3.5">
            <Send size={20} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Assessment Assigned!</h2>
          <p className="text-sm text-slate-400">Share this link with the candidate to begin their assessment.</p>
        </div>
        <div className="p-7">
          <div className="flex items-center gap-2 px-3.5 py-2.5 bg-amber-50 rounded-lg border border-amber-200 mb-5">
            <Clock size={15} className="text-amber-600 flex-shrink-0" />
            <span className="text-sm text-amber-900 font-medium">
              Link expires in <strong>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong> · {expiresAt.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <div className="mb-5">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Assessment Link
            </label>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              <div className="flex-1 px-3.5 py-3 bg-slate-50 text-sm text-slate-700 font-mono overflow-hidden text-ellipsis whitespace-nowrap">
                {data.assessmentLink}
              </div>
              <button 
                onClick={handleCopy} 
                className={`px-4 py-3 text-white border-none cursor-pointer flex items-center gap-1.5 text-sm font-semibold flex-shrink-0 transition-colors ${
                  copied ? 'bg-green-600' : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button 
              onClick={handleCopy} 
              className={`flex-1 py-3 px-4 rounded-lg text-white border-none font-bold text-sm cursor-pointer flex items-center justify-center gap-2 transition-all ${
                copied ? 'bg-green-600' : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Link</>}
            </button>
            <a 
              href={data.assessmentLink} 
              target="_blank" 
              rel="noreferrer" 
              className="flex-1 py-3 px-4 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-sm cursor-pointer flex items-center justify-center gap-2 no-underline hover:bg-slate-200 transition-colors"
            >
              <ExternalLink size={16} /> Preview
            </a>
          </div>
          <p className="text-center text-xs text-slate-400 mt-4">
            This link is single-use and tied to this candidate only.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Assign Assessment Modal ──────────────────────────────────────────────────
function AssignModal({ candidate, onClose, onAssigned }) {
  const [allAssessments, setAllAssessments] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    api.get('/assessments?active=true')
      .then(r => {
        setAllAssessments(r.data);
        if (r.data.length > 0) setSelected(r.data[0]._id);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = allAssessments.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.roleId?.title?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAssign = async () => {
    if (!selected) return toast.error('Please select an assessment');
    setAssigning(true);
    try {
      const { data } = await api.post(`/candidates/${candidate._id}/invite`, { assessmentId: selected });
      onAssigned(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign assessment');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content assign-modal" onClick={(e) => e.stopPropagation()}>
        <div className="assign-modal-header">
          <div className="assign-header-content">
            <div className="assign-icon">
              <ClipboardList size={20} />
            </div>
            <div>
              <h2>Assign Assessment</h2>
              <p>To: <strong>{candidate.name}</strong> · {candidate.appliedRole?.title || 'No role'}</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={16} />
          </button>
        </div>

        <div className="assign-search">
          <Search size={15} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search assessments by title or role..."
          />
        </div>

        <div className="assign-list">
          {loading ? (
            <div className="assign-loading">Loading assessments...</div>
          ) : filtered.length === 0 ? (
            <div className="assign-empty">
              {search ? 'No assessments match your search' : 'No active assessments found'}
            </div>
          ) : (
            filtered.map(a => {
              const isSelected = selected === a._id;
              const isRoleMatch = a.roleId?._id === candidate.appliedRole?._id;
              return (
                <label key={a._id} className={`assign-item ${isSelected ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="assign-assessment"
                    value={a._id}
                    checked={isSelected}
                    onChange={() => setSelected(a._id)}
                  />
                  <div className="assign-item-content">
                    <div className="assign-item-header">
                      <span className="assign-item-title">{a.title}</span>
                      {isRoleMatch && <span className="role-match-badge">Role match</span>}
                    </div>
                    <div className="assign-item-meta">
                      <span>{a.roleId?.title || 'No role'}</span>
                      <span>·</span>
                      <span>{a.totalQuestions} questions</span>
                      <span>·</span>
                      <span>{a.duration} min</span>
                      <span>·</span>
                      <span>Pass: {a.passThreshold}%</span>
                    </div>
                  </div>
                </label>
              );
            })
          )}
        </div>

        <div className="assign-footer">
          <button onClick={handleAssign} disabled={assigning || !selected} className="btn-primary">
            <Send size={15} /> {assigning ? 'Assigning...' : 'Assign & Generate Link'}
          </button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Add Candidate Modal (with Resume Upload) ────────────────────────────────
function AddCandidateModal({ roles, onClose, onSuccess }) {
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    appliedRole: '', 
    experienceLevel: 'mid' 
  });
  const [resume, setResume] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
        toast.error('Only PDF and Word documents are allowed');
        return;
      }
      setResume(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => formData.append(key, form[key]));
      if (resume) formData.append('resume', resume);

      await api.post('/candidates', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Candidate added successfully');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add candidate');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content add-candidate-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon">
              <UserPlus size={20} />
            </div>
            <h2>Add New Candidate</h2>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-candidate-form">
          <div className="form-grid">
            <div className="form-field">
              <label>Full Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="John Doe"
              />
            </div>

            <div className="form-field">
              <label>Email *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="john@example.com"
              />
            </div>

            <div className="form-field">
              <label>Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="form-field">
              <label>Applied Role *</label>
              <select
                required
                value={form.appliedRole}
                onChange={e => setForm(p => ({ ...p, appliedRole: e.target.value }))}
              >
                <option value="">Select role...</option>
                {roles.map(r => (
                  <option key={r._id} value={r._id}>{r.title} — {r.department}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Experience Level *</label>
              <select
                value={form.experienceLevel}
                onChange={e => setForm(p => ({ ...p, experienceLevel: e.target.value }))}
              >
                {['intern', 'junior', 'mid', 'senior', 'lead'].map(l => (
                  <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Resume Upload */}
          <div className="resume-upload-section">
            <label>Resume (Optional)</label>
            <div 
              className={`resume-dropzone ${resume ? 'has-file' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              {resume ? (
                <div className="resume-file-info">
                  <FileText size={24} />
                  <div className="resume-file-details">
                    <span className="resume-file-name">{resume.name}</span>
                    <span className="resume-file-size">
                      {(resume.size / 1024).toFixed(2)} KB
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setResume(null);
                    }}
                    className="resume-remove-btn"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <div className="resume-dropzone-content">
                  <Upload size={32} />
                  <p className="resume-dropzone-title">Click to upload resume</p>
                  <p className="resume-dropzone-subtitle">PDF, DOC, DOCX (Max 5MB)</p>
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={uploading} className="btn-primary">
              {uploading ? (
                <><Loader size={16} className="spinner" /> Uploading...</>
              ) : (
                <><Plus size={16} /> Add Candidate</>
              )}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Candidate Modal ─────────────────────────────────────────────────────
function EditCandidateModal({ candidate, roles, onClose, onSuccess }) {
  const [form, setForm] = useState({ 
    name: candidate.name || '', 
    email: candidate.email || '', 
    phone: candidate.phone || '', 
    appliedRole: candidate.appliedRole?._id || '', 
    experienceLevel: candidate.experienceLevel || 'mid' 
  });
  const [resume, setResume] = useState(null);
  const [updating, setUpdating] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
        toast.error('Only PDF and Word documents are allowed');
        return;
      }
      setResume(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => formData.append(key, form[key]));
      if (resume) formData.append('resume', resume);

      await api.put(`/candidates/${candidate._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Candidate updated successfully');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update candidate');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content add-candidate-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon">
              <Edit2 size={20} />
            </div>
            <h2>Edit Candidate</h2>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-candidate-form">
          <div className="form-grid">
            <div className="form-field">
              <label>Full Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="John Doe"
              />
            </div>

            <div className="form-field">
              <label>Email *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="john@example.com"
              />
            </div>

            <div className="form-field">
              <label>Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="form-field">
              <label>Applied Role *</label>
              <select
                required
                value={form.appliedRole}
                onChange={e => setForm(p => ({ ...p, appliedRole: e.target.value }))}
              >
                <option value="">Select role...</option>
                {roles.map(r => (
                  <option key={r._id} value={r._id}>{r.title} — {r.department}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Experience Level *</label>
              <select
                value={form.experienceLevel}
                onChange={e => setForm(p => ({ ...p, experienceLevel: e.target.value }))}
              >
                {['intern', 'junior', 'mid', 'senior', 'lead'].map(l => (
                  <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Resume Upload */}
          <div className="resume-upload-section">
            <label>Resume {candidate.resumeUrl && '(Upload new to replace)'}</label>
            {candidate.resumeUrl && !resume && (
              <div className="current-resume-info">
                <FileText size={16} />
                <span>Current resume available</span>
                <a href={candidate.resumeUrl} target="_blank" rel="noreferrer" className="view-resume-link">
                  View
                </a>
              </div>
            )}
            <div 
              className={`resume-dropzone ${resume ? 'has-file' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              {resume ? (
                <div className="resume-file-info">
                  <FileText size={24} />
                  <div className="resume-file-details">
                    <span className="resume-file-name">{resume.name}</span>
                    <span className="resume-file-size">
                      {(resume.size / 1024).toFixed(2)} KB
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setResume(null);
                    }}
                    className="resume-remove-btn"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <div className="resume-dropzone-content">
                  <Upload size={32} />
                  <p className="resume-dropzone-title">Click to upload new resume</p>
                  <p className="resume-dropzone-subtitle">PDF, DOC, DOCX (Max 5MB)</p>
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={updating} className="btn-primary">
              {updating ? (
                <><Loader size={16} className="spinner" /> Updating...</>
              ) : (
                <><Edit2 size={16} /> Update Candidate</>
              )}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirmation Modal ────────────────────────────────────────────────
function DeleteConfirmModal({ candidate, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/candidates/${candidate._id}`);
      toast.success('Candidate deleted successfully');
      onConfirm();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete candidate');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header delete-header">
          <div className="modal-header-content">
            <div className="modal-icon delete-icon">
              <Trash2 size={20} />
            </div>
            <h2>Delete Candidate</h2>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={16} />
          </button>
        </div>

        <div className="delete-modal-body">
          <p>Are you sure you want to delete <strong>{candidate.name}</strong>?</p>
          <p className="delete-warning">This action cannot be undone. All associated data including assessment results and notes will be permanently deleted.</p>
        </div>

        <div className="form-actions">
          <button 
            onClick={handleDelete} 
            disabled={deleting} 
            className="btn-danger"
          >
            {deleting ? (
              <><Loader size={16} className="spinner" /> Deleting...</>
            ) : (
              <><Trash2 size={16} /> Delete Candidate</>
            )}
          </button>
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Bulk Upload Modal ────────────────────────────────────────────────────────
function BulkUploadModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error('Only CSV files are allowed');
        return;
      }
      setFile(selectedFile);
      setResults(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post('/candidates/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setResults(data);
      toast.success(`Successfully imported ${data.success} candidates`);
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = 'name,email,phone,appliedRole,experienceLevel\nJohn Doe,john@example.com,+1234567890,Software Engineer,mid\nJane Smith,jane@example.com,+0987654321,Product Manager,senior';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'candidates_template.csv';
    a.click();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content bulk-upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon bulk-icon">
              <UsersIcon size={20} />
            </div>
            <h2>Bulk Upload Candidates</h2>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={16} />
          </button>
        </div>

        <div className="bulk-upload-body">
          {!results ? (
            <>
              <div className="bulk-upload-instructions">
                <h3>How to upload:</h3>
                <ol>
                  <li>Download the CSV template</li>
                  <li>Fill in candidate information</li>
                  <li>Upload the completed CSV file</li>
                </ol>
              </div>

              <button onClick={downloadTemplate} className="download-template-btn">
                <Download size={16} />
                Download CSV Template
              </button>

              <div 
                className={`bulk-dropzone ${file ? 'has-file' : ''}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {file ? (
                  <div className="bulk-file-info">
                    <FileText size={32} />
                    <div className="bulk-file-details">
                      <span className="bulk-file-name">{file.name}</span>
                      <span className="bulk-file-size">
                        {(file.size / 1024).toFixed(2)} KB
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="bulk-remove-btn"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="bulk-dropzone-content">
                    <Upload size={40} />
                    <p className="bulk-dropzone-title">Click to upload CSV file</p>
                    <p className="bulk-dropzone-subtitle">or drag and drop</p>
                  </div>
                )}
              </div>

              <div className="bulk-actions">
                <button 
                  onClick={handleUpload} 
                  disabled={!file || uploading} 
                  className="btn-primary"
                >
                  {uploading ? (
                    <><Loader size={16} className="spinner" /> Uploading...</>
                  ) : (
                    <><Upload size={16} /> Upload Candidates</>
                  )}
                </button>
                <button onClick={onClose} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div className="bulk-results">
              <div className="bulk-results-summary">
                <div className="bulk-result-card success">
                  <CheckCircle size={24} />
                  <div>
                    <span className="bulk-result-number">{results.success}</span>
                    <span className="bulk-result-label">Successful</span>
                  </div>
                </div>
                <div className="bulk-result-card error">
                  <AlertCircle size={24} />
                  <div>
                    <span className="bulk-result-number">{results.failed}</span>
                    <span className="bulk-result-label">Failed</span>
                  </div>
                </div>
              </div>

              {results.errors && results.errors.length > 0 && (
                <div className="bulk-errors">
                  <h4>Errors:</h4>
                  <ul>
                    {results.errors.map((err, idx) => (
                      <li key={idx}>
                        <AlertCircle size={14} />
                        <span>Row {err.row}: {err.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button onClick={onClose} className="btn-primary">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ role: '', status: '' });
  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [inviteData, setInviteData] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);
  const navigate = useNavigate();

  const fetchCandidates = async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filters.role) params.set('role', filters.role);
    if (filters.status) params.set('status', filters.status);
    const { data } = await api.get(`/candidates?${params}`);
    setCandidates(data.candidates);
  };

  useEffect(() => {
    Promise.all([fetchCandidates(), api.get('/roles?active=true')])
      .then(([, r]) => setRoles(r.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchCandidates(); }, [search, filters]);

  const handleAssigned = (data) => {
    setAssignTarget(null);
    setInviteData(data);
    fetchCandidates();
  };

  const canAssign = (status) => ['pending', 'expired'].includes(status);

  return (
    <div className="candidates-page">
      {/* Squircle Header */}
      <div className="squircle-header">
        <div className="squircle-header-icon">
          <Users size={20} />
        </div>
        <div className="squircle-header-content">
          <h1>Candidates</h1>
          <p>Manage and review applicants</p>
        </div>
        <div className="squircle-header-actions">
          <Button variant="outline" onClick={() => setShowBulk(true)}>
            <UsersIcon size={16} /> Bulk Upload
          </Button>
          <Button onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Add Candidate
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="filters-card">
        <div className="filters-container">
          <div className="search-box">
            <Search size={16} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
            />
          </div>
          <select
            value={filters.role}
            onChange={e => setFilters(p => ({ ...p, role: e.target.value }))}
            className="filter-select"
          >
            <option value="">All Roles</option>
            {roles.map(r => <option key={r._id} value={r._id}>{r.title}</option>)}
          </select>
          <select
            value={filters.status}
            onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}
            className="filter-select"
          >
            <option value="">All Status</option>
            {['pending', 'invited', 'in_progress', 'completed', 'expired'].map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card className="table-card">
        {loading ? (
          <div className="table-loading">
            <Loader size={32} className="spinner" />
            <p>Loading candidates...</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="table-empty">
            <Users size={48} />
            <h3>No candidates found</h3>
            <p>Add candidates individually or use bulk upload</p>
            <div className="empty-actions">
              <Button onClick={() => setShowAdd(true)}>
                <Plus size={16} /> Add Candidate
              </Button>
              <Button variant="outline" onClick={() => setShowBulk(true)}>
                <UsersIcon size={16} /> Bulk Upload
              </Button>
            </div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="candidates-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Role</th>
                  <th>Access Code</th>
                  <th>Experience</th>
                  <th>Assessment</th>
                  <th>Score</th>
                  <th>Decision</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => (
                  <tr key={c._id} onClick={() => navigate(`/hr/candidates/${c._id}`)}>
                    <td>
                      <div className="candidate-cell">
                        <div className="candidate-avatar">
                          {c.name[0].toUpperCase()}
                        </div>
                        <div className="candidate-info">
                          <div className="candidate-name">{c.name}</div>
                          <div className="candidate-email">{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="role-cell">{c.appliedRole?.title || '—'}</td>
                    <td>
                      {c.accessCode ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ 
                            fontFamily: 'monospace', 
                            fontSize: 14, 
                            fontWeight: 700,
                            color: '#e11d48',
                            letterSpacing: '0.1em'
                          }}>
                            {c.accessCode}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(c.accessCode);
                              toast.success('Access code copied!');
                            }}
                            style={{
                              padding: '4px 8px',
                              background: '#f1f5f9',
                              border: '1px solid #e2e8f0',
                              borderRadius: 4,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 11,
                              fontWeight: 600,
                              color: '#64748b'
                            }}
                            title="Copy access code"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      ) : '—'}
                    </td>
                    <td><Badge label={c.experienceLevel} variant="default" /></td>
                    <td><Badge status={c.assessmentStatus} /></td>
                    <td className={`score-cell ${c.overallScore >= 70 ? 'high' : c.overallScore >= 50 ? 'medium' : 'low'}`}>
                      {c.overallScore != null ? `${c.overallScore}%` : '—'}
                    </td>
                    <td>{c.finalDecision ? <Badge status={c.finalDecision} /> : '—'}</td>
                    <td>
                      <div className="action-buttons">
                        {canAssign(c.assessmentStatus) && (
                          <button
                            onClick={e => { e.stopPropagation(); setAssignTarget(c); }}
                            className="action-btn assign-btn"
                            title="Assign Assessment"
                          >
                            <ClipboardList size={14} /> Assign
                          </button>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); navigate(`/hr/candidates/${c._id}`); }}
                          className="action-btn view-btn"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setEditTarget(c); }}
                          className="action-btn edit-btn"
                          title="Edit Candidate"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setDeleteTarget(c); }}
                          className="action-btn delete-btn"
                          title="Delete Candidate"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modals */}
      {showAdd && (
        <AddCandidateModal
          roles={roles}
          onClose={() => setShowAdd(false)}
          onSuccess={fetchCandidates}
        />
      )}

      {editTarget && (
        <EditCandidateModal
          candidate={editTarget}
          roles={roles}
          onClose={() => setEditTarget(null)}
          onSuccess={fetchCandidates}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          candidate={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={fetchCandidates}
        />
      )}

      {showBulk && (
        <BulkUploadModal
          onClose={() => setShowBulk(false)}
          onSuccess={fetchCandidates}
        />
      )}

      {assignTarget && (
        <AssignModal
          candidate={assignTarget}
          onClose={() => setAssignTarget(null)}
          onAssigned={handleAssigned}
        />
      )}

      {inviteData && <InviteModal data={inviteData} onClose={() => setInviteData(null)} />}
    </div>
  );
}
