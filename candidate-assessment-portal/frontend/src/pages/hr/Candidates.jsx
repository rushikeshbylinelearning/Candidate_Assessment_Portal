import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { 
  Search, Plus, Send, X, Users, 
  ClipboardList, Upload, FileText, Download, AlertCircle, CheckCircle, Loader,
  Trash2, Eye, UserPlus, UsersIcon, Edit2, Copy, Award, Clock, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import '../../styles/Candidates.css';
import SummaryStrip from '../../components/candidates/SummaryStrip';
import FilterBar from '../../components/candidates/FilterBar';
import CandidateRow from '../../components/candidates/CandidateRow';
import SkeletonRow, { SkeletonStyle } from '../../components/candidates/SkeletonRow';
import PageShell from '../../components/layout/PageShell';

// ?? Prevent background scroll while any modal is open ???????????????????????
function useBodyScrollLock() {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);
}

// ?? Invite Link Modal ????????????????????????????????????????????????????????
// Removed: token/link generation is no longer part of the assign flow

// ?? Assign Assessment Modal ??????????????????????????????????????????????????
function AssignModal({ candidate, onClose, onAssigned }) {
  useBodyScrollLock();
  const [allAssessments, setAllAssessments] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [previouslyAssigned, setPreviouslyAssigned] = useState(new Set());
  const [assignmentDetails, setAssignmentDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/assessments?active=true'),
      api.get(`/candidates/${candidate._id}/assigned-assessments`)
    ])
      .then(([assessmentsRes, assignedRes]) => {
        setAllAssessments(assessmentsRes.data);
        const assignments = assignedRes.data.assignments || [];
        setAssignmentDetails(assignments);
        const assignedIds = new Set(assignments.map(a => a.assessmentId));
        setPreviouslyAssigned(assignedIds);
        setSelected(new Set(assignedIds));
      })
      .catch(err => {
        toast.error('Failed to load assessments');
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [candidate._id]);

  const filtered = allAssessments.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.roleId?.title?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id) => {
    // Check if this assessment is completed or in progress
    const assignment = assignmentDetails.find(a => a.assessmentId === id);
    
    if (assignment?.isCompleted) {
      toast.error('Cannot remove completed assessment');
      return;
    }
    
    if (assignment?.isInProgress && selected.has(id)) {
      // Show confirmation dialog for in-progress assessments
      setConfirmRemove(id);
      return;
    }
    
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirmRemove = () => {
    if (confirmRemove) {
      setSelected(prev => {
        const next = new Set(prev);
        next.delete(confirmRemove);
        return next;
      });
      setConfirmRemove(null);
    }
  };

  const handleAssign = async () => {
    if (selected.size === 0) return toast.error('Please select at least one assessment');
    
    // Calculate diff
    const toAdd = Array.from(selected).filter(id => !previouslyAssigned.has(id));
    const toRemove = Array.from(previouslyAssigned).filter(id => !selected.has(id));
    
    if (toAdd.length === 0 && toRemove.length === 0) {
      toast.info('No changes to save');
      return;
    }
    
    setAssigning(true);
    try {
      const operations = [];
      
      // Remove assessments first
      for (const assessmentId of toRemove) {
        operations.push(
          api.post(`/candidates/${candidate._id}/remove-assessment`, { assessmentId })
            .catch(err => {
              // If it's a confirmation required error, we already handled it in toggleSelect
              if (!err.response?.data?.requiresConfirmation) {
                throw err;
              }
            })
        );
      }
      
      // Add new assessments
      if (toAdd.length > 0) {
        const STEP_TYPES = ['ROLE_BASED_ASSESSMENT', 'LANGUAGE_ASSESSMENT', 'EVALUATION_FORM', 'INTERVIEW_INTERACTION', 'POST_INTERVIEW_FEEDBACK'];
        
        // Find available step types (not already assigned)
        const usedStepTypes = new Set(assignmentDetails.map(a => a.stepType));
        const availableStepTypes = STEP_TYPES.filter(st => !usedStepTypes.has(st));
        
        const assessmentIds = {};
        toAdd.forEach((id, i) => {
          if (i < availableStepTypes.length) {
            assessmentIds[availableStepTypes[i]] = id;
          }
        });
        
        operations.push(
          api.post(`/candidates/${candidate._id}/invite`, { assessmentIds })
        );
      }
      
      await Promise.all(operations);
      
      const changeMsg = [];
      if (toAdd.length > 0) changeMsg.push(`${toAdd.length} added`);
      if (toRemove.length > 0) changeMsg.push(`${toRemove.length} removed`);
      
      toast.success(`Assessments updated: ${changeMsg.join(', ')}`);
      onAssigned();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update assessments');
    } finally {
      setAssigning(false);
    }
  };
  
  const hasChanges = () => {
    if (selected.size !== previouslyAssigned.size) return true;
    for (const id of selected) {
      if (!previouslyAssigned.has(id)) return true;
    }
    return false;
  };
  
  const isEditing = previouslyAssigned.size > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content assign-modal" onClick={(e) => e.stopPropagation()}>
        <div className="assign-modal-header">
          <div className="assign-header-content">
            <div className="assign-icon">
              <ClipboardList size={20} />
            </div>
            <div>
              <h2>{isEditing ? 'Update Assessments' : 'Assign Assessments'}</h2>
              <p>To: <strong>{candidate.name}</strong> ∑ {candidate.appliedRole?.title || 'No role'}</p>
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

        <div className="assign-count-bar">
          <span>
            <strong>{selected.size}</strong> assessment{selected.size !== 1 ? 's' : ''} selected
          </span>
          {previouslyAssigned.size > 0 && (
            <span>
              {previouslyAssigned.size} currently assigned
            </span>
          )}
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
              const isSelected = selected.has(a._id);
              const isAssigned = previouslyAssigned.has(a._id);
              const isRoleMatch = a.roleId?._id === candidate.appliedRole?._id;
              const assignment = assignmentDetails.find(ad => ad.assessmentId === a._id);
              const isCompleted = assignment?.isCompleted;
              const isInProgress = assignment?.isInProgress;
              
              return (
                <label 
                  key={a._id} 
                  className={`assign-item ${isSelected ? 'selected' : ''} ${isCompleted ? 'locked' : ''} ${isAssigned && !isCompleted ? 'assigned' : ''}`}
                  title={isCompleted ? 'Completed ó cannot remove' : ''}
                >
                  <input
                    type="checkbox"
                    value={a._id}
                    checked={isSelected}
                    onChange={() => toggleSelect(a._id)}
                    disabled={isCompleted}
                  />
                  <div className="assign-item-content">
                    <div className="assign-item-header">
                      <span className="assign-item-title">{a.title}</span>
                      {isAssigned && (
                        <span className="status-badge assigned-badge">? Assigned</span>
                      )}
                      {isRoleMatch && <span className="role-match-badge">Role match</span>}
                      {isCompleted && <span className="status-badge completed">Completed</span>}
                      {isInProgress && !isCompleted && <span className="status-badge in-progress">In Progress</span>}
                    </div>
                    <div className="assign-item-meta">
                      <span>{a.roleId?.title || 'No role'}</span>
                      <span>∑</span>
                      <span>{a.totalQuestions} questions</span>
                      <span>∑</span>
                      <span>{a.duration} min</span>
                      <span>∑</span>
                      <span>Pass: {a.passThreshold}%</span>
                    </div>
                  </div>
                </label>
              );
            })
          )}
        </div>

        <div className="assign-footer">
          <button 
            onClick={handleAssign} 
            disabled={assigning || selected.size === 0 || !hasChanges()} 
            className="btn-primary"
          >
            <Send size={15} /> 
            {assigning 
              ? (isEditing ? 'Updating...' : 'Assigning...') 
              : (isEditing ? 'Update Assignments' : `Assign${selected.size > 0 ? ` (${selected.size})` : ''}`)}
          </button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
      
      {/* Confirmation Dialog for In-Progress Assessment Removal */}
      {confirmRemove && (
        <div className="modal-overlay" style={{ zIndex: 10001 }}>
          <div className="modal-content" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-content">
                <div className="modal-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
                  <AlertCircle size={20} />
                </div>
                <h2>Remove In-Progress Assessment?</h2>
              </div>
            </div>
            <div style={{ padding: '16px 24px' }}>
              <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
                This assessment is currently in progress. Removing it will discard the candidate's progress. Are you sure?
              </p>
            </div>
            <div className="form-actions">
              <button onClick={handleConfirmRemove} className="btn-danger">
                Remove Anyway
              </button>
              <button onClick={() => setConfirmRemove(null)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ?? Add Candidate Modal (with Resume Upload) ????????????????????????????????
function AddCandidateModal({ roles, onClose, onSuccess }) {
  useBodyScrollLock();
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
            <div>
              <h2>Add New Candidate</h2>
              <p className="modal-subtitle">Fill in the details to add a candidate to the pipeline</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-candidate-form">
          <div className="form-grid">
            <div className="form-field">
              <label>Full Name <span className="required-star">*</span></label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. John Doe"
              />
            </div>

            <div className="form-field">
              <label>Email <span className="required-star">*</span></label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="e.g. john@company.com"
              />
            </div>

            <div className="form-field">
              <label>Phone <span className="optional-label">(optional)</span></label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="e.g. +1 555 000 0000"
              />
            </div>

            <div className="form-field">
              <label>Applied Role <span className="required-star">*</span></label>
              <select
                required
                value={form.appliedRole}
                onChange={e => setForm(p => ({ ...p, appliedRole: e.target.value }))}
              >
                <option value="">Select a roleÖ</option>
                {roles.map(r => (
                  <option key={r._id} value={r._id}>{r.title} ó {r.department}</option>
                ))}
              </select>
            </div>

            <div className="form-field form-field-full">
              <label>Experience Level <span className="required-star">*</span></label>
              <div className="experience-options">
                {['intern', 'junior', 'mid', 'senior', 'lead'].map(l => (
                  <label key={l} className={`experience-option ${form.experienceLevel === l ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="experienceLevel"
                      value={l}
                      checked={form.experienceLevel === l}
                      onChange={e => setForm(p => ({ ...p, experienceLevel: e.target.value }))}
                    />
                    {l.charAt(0).toUpperCase() + l.slice(1)}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Resume Upload */}
          <div className="resume-upload-section">
            <label>Resume <span className="optional-label">(optional)</span></label>
            <div 
              className={`resume-dropzone ${resume ? 'has-file' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              {resume ? (
                <div className="resume-file-info">
                  <FileText size={20} />
                  <div className="resume-file-details">
                    <span className="resume-file-name">{resume.name}</span>
                    <span className="resume-file-size">
                      {(resume.size / 1024).toFixed(1)} KB
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
                    <Trash2 size={14} />
                  </button>
                </div>
              ) : (
                <div className="resume-dropzone-content">
                  <Upload size={22} />
                  <p className="resume-dropzone-title">Click to upload resume</p>
                  <p className="resume-dropzone-subtitle">PDF, DOC or DOCX ∑ Max 5 MB</p>
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={uploading} className="btn-primary btn-submit">
              {uploading ? (
                <><Loader size={15} className="spinner" /> UploadingÖ</>
              ) : (
                <><Plus size={15} /> Add Candidate</>
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

// ?? Edit Candidate Modal ?????????????????????????????????????????????????????
function EditCandidateModal({ candidate, roles, onClose, onSuccess }) {
  useBodyScrollLock();
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
            <div>
              <h2>Edit Candidate</h2>
              <p className="modal-subtitle">Update the candidate's information below</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-candidate-form">
          <div className="form-grid">
            <div className="form-field">
              <label>Full Name <span className="required-star">*</span></label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. John Doe"
              />
            </div>

            <div className="form-field">
              <label>Email <span className="required-star">*</span></label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="e.g. john@company.com"
              />
            </div>

            <div className="form-field">
              <label>Phone <span className="optional-label">(optional)</span></label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="e.g. +1 555 000 0000"
              />
            </div>

            <div className="form-field">
              <label>Applied Role <span className="required-star">*</span></label>
              <select
                required
                value={form.appliedRole}
                onChange={e => setForm(p => ({ ...p, appliedRole: e.target.value }))}
              >
                <option value="">Select a roleÖ</option>
                {roles.map(r => (
                  <option key={r._id} value={r._id}>{r.title} ó {r.department}</option>
                ))}
              </select>
            </div>

            <div className="form-field form-field-full">
              <label>Experience Level <span className="required-star">*</span></label>
              <div className="experience-options">
                {['intern', 'junior', 'mid', 'senior', 'lead'].map(l => (
                  <label key={l} className={`experience-option ${form.experienceLevel === l ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="experienceLevel"
                      value={l}
                      checked={form.experienceLevel === l}
                      onChange={e => setForm(p => ({ ...p, experienceLevel: e.target.value }))}
                    />
                    {l.charAt(0).toUpperCase() + l.slice(1)}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Resume Upload */}
          <div className="resume-upload-section">
            <label>Resume {candidate.resumeUrl ? <span className="optional-label">(upload new to replace)</span> : <span className="optional-label">(optional)</span>}</label>
            {candidate.resumeUrl && !resume && (
              <div className="current-resume-info">
                <FileText size={14} />
                <span>Current resume on file</span>
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
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              {resume ? (
                <div className="resume-file-info">
                  <FileText size={20} />
                  <div className="resume-file-details">
                    <span className="resume-file-name">{resume.name}</span>
                    <span className="resume-file-size">
                      {(resume.size / 1024).toFixed(1)} KB
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
                    <Trash2 size={14} />
                  </button>
                </div>
              ) : (
                <div className="resume-dropzone-content">
                  <Upload size={22} />
                  <p className="resume-dropzone-title">Click to upload resume</p>
                  <p className="resume-dropzone-subtitle">PDF, DOC or DOCX ∑ Max 5 MB</p>
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={updating} className="btn-primary btn-submit">
              {updating ? (
                <><Loader size={15} className="spinner" /> SavingÖ</>
              ) : (
                <><Edit2 size={15} /> Save Changes</>
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

// ?? Delete Confirmation Modal ????????????????????????????????????????????????
function DeleteConfirmModal({ candidate, onClose, onConfirm }) {
  useBodyScrollLock();
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

// ?? Bulk Upload Modal ????????????????????????????????????????????????????????
function BulkUploadModal({ onClose, onSuccess }) {
  useBodyScrollLock();
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

// ?? View Completed Assessments Modal ?????????????????????????????????????????
function ViewAssessmentsModal({ candidate, onClose }) {
  useBodyScrollLock();
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [assessmentData, setAssessmentData] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [questions, setQuestions] = useState({});

  useEffect(() => {
    const fetchPipelines = async () => {
      try {
        const { data } = await api.get(`/pipeline/candidate/${candidate._id}`);
        setPipelines(data.pipelines || []);
      } catch (err) {
        toast.error('Failed to load assessment data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPipelines();
  }, [candidate._id]);

  const fetchAssessmentData = async (pipelineId, stepType) => {
    setLoadingData(true);
    setAssessmentData(null);
    try {
      const { data } = await api.get(`/pipeline/${pipelineId}/step/${stepType}/data`);
      setAssessmentData(data);
      setSelectedPipeline({ pipelineId, stepType });

      // Fetch questions for the responses
      if (data.data?.responses && data.data.responses.length > 0) {
        const questionIds = [...new Set(data.data.responses.map(r => r.questionId).filter(Boolean))];
        const questionPromises = questionIds.map(id => 
          api.get(`/questions/${id}`).catch(() => null)
        );
        const questionResults = await Promise.all(questionPromises);
        const questionsMap = {};
        questionResults.forEach((result, idx) => {
          if (result?.data) {
            questionsMap[questionIds[idx]] = result.data;
          }
        });
        setQuestions(questionsMap);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load assessment details';
      toast.error(msg);
      console.error('[fetchAssessmentData] error:', err.response?.data || err);
    } finally {
      setLoadingData(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'ó';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (start, end) => {
    if (!start || !end) return 'ó';
    const diff = new Date(end) - new Date(start);
    const minutes = Math.floor(diff / 60000);
    return `${minutes} min`;
  };

  const getAnswerDisplay = (response, question) => {
    if (!question) {
      return typeof response.answer === 'object' 
        ? JSON.stringify(response.answer) 
        : response.answer || '(No answer provided)';
    }

    // For MCQ questions, show the selected option text
    if (question.type === 'mcq' && question.options) {
      const selectedOption = question.options.find(opt => opt.id === response.answer);
      return selectedOption ? selectedOption.text : response.answer;
    }

    // For multi-select, show all selected options
    if (question.type === 'mcq_multi' && Array.isArray(response.answer) && question.options) {
      const selectedOptions = question.options.filter(opt => response.answer.includes(opt.id));
      return selectedOptions.length > 0 
        ? selectedOptions.map(opt => opt.text).join(', ')
        : '(No answer provided)';
    }

    // For other types, show the answer as-is
    return typeof response.answer === 'object' 
      ? JSON.stringify(response.answer) 
      : response.answer || '(No answer provided)';
  };

  const isCorrectAnswer = (response, question) => {
    if (!question || !question.correctAnswer) return null;
    
    if (question.type === 'mcq_multi' && Array.isArray(response.answer)) {
      const correctSet = new Set(question.correctAnswer);
      const answerSet = new Set(response.answer);
      return correctSet.size === answerSet.size && 
             [...correctSet].every(item => answerSet.has(item));
    }
    
    return response.answer === question.correctAnswer;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content view-assessments-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon">
              <Award size={18} />
            </div>
            <div>
              <h2>Assessment Results</h2>
              <p className="modal-subtitle">{candidate.name} ∑ {candidate.appliedRole?.title || 'No role'}</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="va-body">
          {loading ? (
            <div className="va-empty-state">
              <Loader size={28} className="spinner" style={{ color: '#94a3b8' }} />
              <p>Loading assessmentsÖ</p>
            </div>
          ) : pipelines.length === 0 ? (
            <div className="va-empty-state">
              <ClipboardList size={40} strokeWidth={1.5} style={{ color: '#cbd5e1' }} />
              <p style={{ fontWeight: 600, color: '#475569', marginBottom: 4 }}>No assessments yet</p>
              <p style={{ fontSize: 13 }}>This candidate hasn't completed any assessments.</p>
            </div>
          ) : (
            <div className="va-layout">
              {/* Left ó pipeline list */}
              <div className="va-sidebar">
                <div className="va-section-label">Pipelines</div>
                {pipelines.map((pipeline) => (
                  <div key={pipeline.pipelineId} className="va-pipeline-card">
                    <div className="va-pipeline-header">
                      <span className="va-pipeline-title">
                        {pipeline.role?.title || 'Assessment'}
                      </span>
                      <span className={`va-status-badge va-status-${pipeline.status === 'FINISHED' ? 'completed' : 'active'}`}>
                        {pipeline.status === 'FINISHED' ? 'Completed' : pipeline.status}
                      </span>
                    </div>

                    <div className="va-pipeline-meta">
                      <Calendar size={11} />
                      {formatDate(pipeline.createdAt)}
                      {pipeline.aggregateScore != null && (
                        <span className={`va-score ${pipeline.aggregateScore >= 70 ? 'good' : pipeline.aggregateScore >= 50 ? 'mid' : 'low'}`}>
                          ∑ {Math.round(pipeline.aggregateScore)}%
                        </span>
                      )}
                    </div>

                    {pipeline.completedSteps?.length > 0 && (
                      <div className="va-steps">
                        {pipeline.completedSteps.map((stepType) => {
                          const isActive = selectedPipeline?.pipelineId === pipeline.pipelineId && selectedPipeline?.stepType === stepType;
                          return (
                            <button
                              key={stepType}
                              onClick={() => fetchAssessmentData(pipeline.pipelineId, stepType)}
                              className={`va-step-btn ${isActive ? 'active' : ''}`}
                            >
                              <Eye size={11} />
                              {stepType.replace(/_/g, ' ')}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Right ó detail panel */}
              <div className="va-detail">
                {loadingData ? (
                  <div className="va-empty-state">
                    <Loader size={22} className="spinner" style={{ color: '#94a3b8' }} />
                    <p>Loading detailsÖ</p>
                  </div>
                ) : assessmentData ? (
                  <div className="va-detail-content">
                    {/* Step header */}
                    <div className="va-detail-header">
                      <div className="va-detail-title">
                        {assessmentData.stepType.replace(/_/g, ' ')}
                      </div>
                      <div className="va-detail-meta">
                        <span><Clock size={11} /> {formatDate(assessmentData.startedAt)}</span>
                        <span><CheckCircle size={11} /> {formatDuration(assessmentData.startedAt, assessmentData.completedAt)}</span>
                        {assessmentData.score != null && (
                          <span className={`va-score ${assessmentData.score >= 70 ? 'good' : assessmentData.score >= 50 ? 'mid' : 'low'}`}>
                            Score: {Math.round(assessmentData.score)}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Section scores */}
                    {assessmentData.data?.sectionScores && Object.keys(assessmentData.data.sectionScores).length > 0 && (
                      <div className="va-section-scores">
                        {Object.entries(assessmentData.data.sectionScores).map(([section, score]) =>
                          score != null && (
                            <div key={section} className="va-section-score-card">
                              <div className="va-section-score-label">{section}</div>
                              <div className={`va-section-score-value ${score >= 70 ? 'good' : score >= 50 ? 'mid' : 'low'}`}>
                                {Math.round(score)}%
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {/* Responses */}
                    {assessmentData.data?.responses?.length > 0 && (
                      <div className="va-responses">
                        <div className="va-section-label">
                          Responses ∑ {assessmentData.data.responses.length} questions
                        </div>
                        {assessmentData.data.responses.map((response, idx) => {
                          const question = questions[response.questionId];
                          const isCorrect = isCorrectAnswer(response, question);
                          return (
                            <div key={idx} className={`va-response-card ${isCorrect === true ? 'correct' : isCorrect === false ? 'incorrect' : ''}`}>
                              <div className="va-response-top">
                                <span className="va-q-num">Q{idx + 1}</span>
                                {question?.category && (
                                  <span className="va-tag blue">{question.category}</span>
                                )}
                                {question?.difficulty && (
                                  <span className={`va-tag ${question.difficulty === 'hard' ? 'red' : question.difficulty === 'medium' ? 'amber' : 'green'}`}>
                                    {question.difficulty}
                                  </span>
                                )}
                                {isCorrect !== null && (
                                  <span className={`va-verdict ${isCorrect ? 'correct' : 'incorrect'}`}>
                                    {isCorrect ? '? Correct' : '? Incorrect'}
                                  </span>
                                )}
                              </div>

                              {question ? (
                                <>
                                  <div className="va-question-text">{question.text}</div>
                                  <div className="va-answer-row">
                                    <span className="va-answer-label">Answer</span>
                                    <span className="va-answer-value">{getAnswerDisplay(response, question)}</span>
                                  </div>
                                  {isCorrect === false && question.correctAnswer && (
                                    <div className="va-answer-row correct-answer">
                                      <span className="va-answer-label">Correct</span>
                                      <span className="va-answer-value">
                                        {question.type === 'mcq'
                                          ? question.options?.find(opt => opt.id === question.correctAnswer)?.text || question.correctAnswer
                                          : Array.isArray(question.correctAnswer)
                                            ? question.options?.filter(opt => question.correctAnswer.includes(opt.id)).map(opt => opt.text).join(', ')
                                            : question.correctAnswer}
                                      </span>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="va-answer-row">
                                  <span className="va-answer-label">Answer</span>
                                  <span className="va-answer-value">{getAnswerDisplay(response, null)}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="va-empty-state">
                    <Eye size={36} strokeWidth={1.5} style={{ color: '#cbd5e1' }} />
                    <p>Select a step to view details</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="va-footer">
          <button onClick={onClose} className="btn-secondary va-close-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ?? Main Component ???????????????????????????????????????????????????????????
export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [allCandidates, setAllCandidates] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ role: '', status: '', experience: '' });
  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);
  const [viewAssessmentsTarget, setViewAssessmentsTarget] = useState(null);
  const navigate = useNavigate();

  const fetchCandidates = async (applyFilters = true) => {
    const params = new URLSearchParams({ limit: '500' });
    if (applyFilters) {
      if (search) params.set('search', search);
      if (filters.role) params.set('role', filters.role);
      if (filters.status) params.set('status', filters.status);
      if (filters.experience) params.set('experienceLevel', filters.experience);
    }
    const { data } = await api.get(`/candidates?${params}`);
    return data.candidates;
  };

  const loadAll = async () => {
    try {
      const [filtered, all] = await Promise.all([
        fetchCandidates(true),
        fetchCandidates(false),
      ]);
      setCandidates(filtered);
      setAllCandidates(all);
    } catch (err) {
      toast.error('Failed to load candidates');
    }
  };

  const skipFilterEffectRef = useRef(true);

  useEffect(() => {
    Promise.all([loadAll(), api.get('/roles?active=true')])
      .then(([, r]) => setRoles(r.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (skipFilterEffectRef.current) {
      skipFilterEffectRef.current = false;
      return;
    }
    if (!loading) loadAll();
  }, [search, filters]);

  const handleAssigned = () => {
    setAssignTarget(null);
    loadAll();
  };

  const handleClearFilters = () => {
    setSearch('');
    setFilters({ role: '', status: '', experience: '' });
  };

  const hasFilters = search || filters.role || filters.status || filters.experience;

  // ?? CTA buttons (passed to PageShell header) ??????????????????????????????
  const headerActions = (
    <>
      <button
        onClick={() => setShowBulk(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '7px 15px', borderRadius: 9,
          border: '1px solid #E2E8F0', background: '#fff',
          color: '#475569', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', transition: 'all 0.2s',
          boxShadow: '0 1px 2px rgba(16,24,40,0.05)',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
        onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
      >
        <UsersIcon size={14} /> Bulk Upload
      </button>
      <button
        onClick={() => setShowAdd(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '7px 16px', borderRadius: 9,
          border: 'none', background: '#F43F5E',
          color: '#fff', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', transition: 'all 0.2s',
          boxShadow: '0 2px 8px rgba(244,63,94,0.28)',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#E11D48'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = '#F43F5E'; e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        <Plus size={14} /> Add Candidate
      </button>
    </>
  );

  return (
    <PageShell>
      <SkeletonStyle />

      {/* -- Dark header card ù matches Dashboard style -- */}
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
          <UsersIcon size={20} />
        </div>
        {/* Title + subtitle */}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.2 }}>
            Candidates
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0, fontWeight: 400 }}>
            Manage and review your applicant pipeline
          </p>
        </div>
        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <button
            onClick={() => setShowBulk(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '7px 15px', borderRadius: 9,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
          >
            <UsersIcon size={14} /> Bulk Upload
          </button>
          <button
            onClick={() => setShowAdd(true)}
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
            <Plus size={14} /> Add Candidate
          </button>
        </div>
      </div>

      {/* ?? Summary strip (static) ?? */}
      <SummaryStrip candidates={allCandidates} />

      {/* ?? Filter bar (static) ?? */}
      <FilterBar
        search={search}
        onSearch={setSearch}
        filters={filters}
        onFilter={setFilters}
        roles={roles}
        onClear={handleClearFilters}
      />

      {/* ?? Table card ó this is the ONLY scrollable section ?? */}
      <div style={{
        flex: 1,           // takes all remaining vertical space
        minHeight: 0,      // ? CRITICAL: allows flex child to shrink below content size
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        border: '1px solid #E4E7EC',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(16,24,40,0.06)',
      }}>
        {/* Table toolbar ó always visible */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid #F1F5F9',
          flexShrink: 0,
          background: '#fff',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
            {loading ? 'LoadingÖ' : `${candidates.length} candidate${candidates.length !== 1 ? 's' : ''}`}
            {hasFilters && !loading && (
              <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 400, marginLeft: 6 }}>
                (filtered)
              </span>
            )}
          </span>
        </div>

        {loading ? (
          /* ?? Skeleton state ?? */
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                  {['Candidate', 'Role', 'Experience', 'Access Code', 'Assessment', 'Score', 'Decision', 'Actions'].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px', textAlign: 'left',
                      fontSize: 11, fontWeight: 700, color: '#64748B',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      whiteSpace: 'nowrap', position: 'sticky', top: 0,
                      background: '#F8FAFC', zIndex: 1,
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(6)].map((_, i) => <SkeletonRow key={i} />)}
              </tbody>
            </table>
          </div>
        ) : candidates.length === 0 ? (
          /* ?? Empty state ?? */
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '48px 24px', gap: 12,
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: 16,
              background: '#FFF1F2', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Users size={26} style={{ color: '#F43F5E' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 5px' }}>
                {hasFilters ? 'No candidates match your filters' : 'No candidates yet'}
              </h3>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                {hasFilters
                  ? "Try adjusting your search or filters."
                  : 'Add your first candidate to get started.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              {hasFilters ? (
                <button
                  onClick={handleClearFilters}
                  style={{
                    padding: '7px 16px', borderRadius: 9,
                    border: '1px solid #E2E8F0', background: '#fff',
                    color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Clear Filters
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setShowAdd(true)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '7px 16px', borderRadius: 9,
                      border: 'none', background: '#F43F5E',
                      color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    <Plus size={13} /> Add Candidate
                  </button>
                  <button
                    onClick={() => setShowBulk(true)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '7px 16px', borderRadius: 9,
                      border: '1px solid #E2E8F0', background: '#fff',
                      color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    <UsersIcon size={13} /> Bulk Upload
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          /* ?? Scrollable table ?? */
          <div style={{
            flex: 1,
            overflowY: 'auto',   // ? ONLY this div scrolls
            minHeight: 0,        // ? CRITICAL
            overflowX: 'auto',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                  {['Candidate', 'Role', 'Experience', 'Access Code', 'Assessment', 'Score', 'Decision', 'Actions'].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px', textAlign: 'left',
                      fontSize: 11, fontWeight: 700, color: '#64748B',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      whiteSpace: 'nowrap',
                      // Sticky thead so column labels stay visible while scrolling
                      position: 'sticky', top: 0,
                      background: '#F8FAFC', zIndex: 1,
                      boxShadow: '0 1px 0 #F1F5F9',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {candidates.map(c => (
                  <CandidateRow
                    key={c._id}
                    candidate={c}
                    onEdit={setEditTarget}
                    onDelete={setDeleteTarget}
                    onAssign={setAssignTarget}
                    onResults={setViewAssessmentsTarget}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ?? Modals ?? */}
      {showAdd && (
        <AddCandidateModal roles={roles} onClose={() => setShowAdd(false)} onSuccess={loadAll} />
      )}
      {editTarget && (
        <EditCandidateModal candidate={editTarget} roles={roles} onClose={() => setEditTarget(null)} onSuccess={loadAll} />
      )}
      {deleteTarget && (
        <DeleteConfirmModal candidate={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={loadAll} />
      )}
      {showBulk && (
        <BulkUploadModal onClose={() => setShowBulk(false)} onSuccess={loadAll} />
      )}
      {assignTarget && (
        <AssignModal candidate={assignTarget} onClose={() => setAssignTarget(null)} onAssigned={handleAssigned} />
      )}
      {viewAssessmentsTarget && (
        <ViewAssessmentsModal candidate={viewAssessmentsTarget} onClose={() => setViewAssessmentsTarget(null)} />
      )}
    </PageShell>
  );
}

