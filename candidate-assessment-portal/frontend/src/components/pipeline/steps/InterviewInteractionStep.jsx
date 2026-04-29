import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import SaveResumeControl from '../SaveResumeControl';

/**
 * InterviewInteractionStep - Interviewer records interview details and Q&A
 * Validates: Requirements 6.4
 */
export default function InterviewInteractionStep({ pipelineId, partialData, onStepComplete }) {
  const [formData, setFormData] = useState({
    scheduledAt: partialData?.scheduledAt || '',
    conductedAt: partialData?.conductedAt || '',
    durationMins: partialData?.durationMins || '',
    questions: partialData?.questions || [],
    overallInterviewScore: partialData?.overallInterviewScore || '',
    interviewerNotes: partialData?.interviewerNotes || '',
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, { question: '', response: '', score: '', notes: '' }],
    }));
  };

  const removeQuestion = (index) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const updateQuestion = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.questions];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, questions: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.scheduledAt || !formData.conductedAt) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const pipelineToken = localStorage.getItem('pipeline_token');
      const response = await axios.post(
        `/api/pipeline/${pipelineId}/step/submit`,
        { stepType: 'INTERVIEW_INTERACTION', data: formData },
        { headers: { 'x-pipeline-token': pipelineToken } }
      );

      toast.success('Interview interaction submitted successfully!');
      if (onStepComplete) {
        onStepComplete(response.data);
      }
    } catch (error) {
      console.error('Submit failed:', error);
      toast.error(error.response?.data?.message || 'Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    fontSize: 15,
    color: '#334155',
    outline: 'none',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 14,
    fontWeight: 600,
    color: '#475569',
    marginBottom: 8,
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#7c3aed15', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <MessageSquare size={24} color="#7c3aed" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Interview Interaction</h2>
          <p style={{ color: '#64748b', fontSize: 15 }}>Record interview details, questions, and candidate responses.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Scheduled At */}
            <div>
              <label style={labelStyle}>
                Scheduled At <span style={{ color: '#e11d48' }}>*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => handleChange('scheduledAt', e.target.value)}
                style={inputStyle}
                required
              />
            </div>

            {/* Conducted At */}
            <div>
              <label style={labelStyle}>
                Conducted At <span style={{ color: '#e11d48' }}>*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.conductedAt}
                onChange={(e) => handleChange('conductedAt', e.target.value)}
                style={inputStyle}
                required
              />
            </div>

            {/* Duration */}
            <div>
              <label style={labelStyle}>Duration (minutes)</label>
              <input
                type="number"
                min="0"
                value={formData.durationMins}
                onChange={(e) => handleChange('durationMins', e.target.value)}
                style={inputStyle}
                placeholder="e.g., 45"
              />
            </div>

            {/* Questions */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Interview Questions</label>
                <button
                  type="button"
                  onClick={addQuestion}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: '1px solid #7c3aed',
                    background: '#7c3aed10',
                    color: '#7c3aed',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={14} /> Add Question
                </button>
              </div>

              {formData.questions.length === 0 && (
                <p style={{ color: '#94a3b8', fontSize: 14, fontStyle: 'italic' }}>No questions added yet. Click "Add Question" to begin.</p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {formData.questions.map((q, index) => (
                  <div key={index} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 20, background: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <span style={{ fontWeight: 600, color: '#475569', fontSize: 14 }}>Question {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <label style={{ ...labelStyle, fontSize: 13 }}>Question</label>
                        <input
                          type="text"
                          value={q.question}
                          onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                          style={{ ...inputStyle, fontSize: 14 }}
                          placeholder="Enter interview question"
                        />
                      </div>
                      <div>
                        <label style={{ ...labelStyle, fontSize: 13 }}>Candidate Response</label>
                        <textarea
                          value={q.response}
                          onChange={(e) => updateQuestion(index, 'response', e.target.value)}
                          style={{ ...inputStyle, minHeight: 80, resize: 'vertical', fontSize: 14 }}
                          placeholder="Summarize candidate's response"
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ ...labelStyle, fontSize: 13 }}>Score (0–10)</label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={q.score}
                            onChange={(e) => updateQuestion(index, 'score', e.target.value)}
                            style={{ ...inputStyle, fontSize: 14 }}
                            placeholder="0–10"
                          />
                        </div>
                        <div style={{ flex: 2 }}>
                          <label style={{ ...labelStyle, fontSize: 13 }}>Notes</label>
                          <input
                            type="text"
                            value={q.notes}
                            onChange={(e) => updateQuestion(index, 'notes', e.target.value)}
                            style={{ ...inputStyle, fontSize: 14 }}
                            placeholder="Additional notes"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Overall Interview Score */}
            <div>
              <label style={labelStyle}>Overall Interview Score (0–100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.overallInterviewScore}
                onChange={(e) => handleChange('overallInterviewScore', e.target.value)}
                style={inputStyle}
                placeholder="e.g., 75"
              />
            </div>

            {/* Interviewer Notes */}
            <div>
              <label style={labelStyle}>Interviewer Notes</label>
              <textarea
                value={formData.interviewerNotes}
                onChange={(e) => handleChange('interviewerNotes', e.target.value)}
                style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
                placeholder="General observations, impressions, and recommendations..."
              />
            </div>
          </div>

          {/* Save & Resume Control */}
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #f1f5f9' }}>
            <SaveResumeControl
              pipelineId={pipelineId}
              stepType="INTERVIEW_INTERACTION"
              stepData={formData}
              onSaveSuccess={() => {}}
              onResumeClick={() => {
                toast.success('Progress saved. You can resume later.');
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              marginTop: 16,
              padding: '14px',
              borderRadius: 10,
              background: submitting ? '#94a3b8' : '#7c3aed',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: 16,
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {submitting ? 'Submitting...' : 'Submit & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
