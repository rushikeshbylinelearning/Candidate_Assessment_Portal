import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { MessageSquare } from 'lucide-react';
import SaveResumeControl from '../SaveResumeControl';

/**
 * PostInterviewFeedbackStep - Post-interview evaluation and recommendation form
 * Validates: Requirements 6.5
 */
export default function PostInterviewFeedbackStep({ pipelineId, partialData, onStepComplete }) {
  const [formData, setFormData] = useState({
    recommendation: partialData?.recommendation || '',
    strengths: partialData?.strengths?.length ? partialData.strengths : [''],
    concerns: partialData?.concerns?.length ? partialData.concerns : [''],
    finalNotes: partialData?.finalNotes || '',
    hrScore: partialData?.hrScore ?? '',
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field, index, value) => {
    setFormData(prev => {
      const updated = [...prev[field]];
      updated[index] = value;
      return { ...prev, [field]: updated };
    });
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => {
      const updated = prev[field].filter((_, i) => i !== index);
      return { ...prev, [field]: updated.length ? updated : [''] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.recommendation) {
      toast.error('Please select a recommendation');
      return;
    }

    const payload = {
      ...formData,
      strengths: formData.strengths.filter(s => s.trim()),
      concerns: formData.concerns.filter(c => c.trim()),
      hrScore: formData.hrScore !== '' ? Number(formData.hrScore) : undefined,
    };

    setSubmitting(true);
    try {
      const pipelineToken = localStorage.getItem('pipeline_token');
      const response = await axios.post(
        `/api/pipeline/${pipelineId}/step/submit`,
        { stepType: 'POST_INTERVIEW_FEEDBACK', data: payload },
        { headers: { 'x-pipeline-token': pipelineToken } }
      );

      toast.success('Feedback submitted successfully!');
      if (onStepComplete) {
        onStepComplete(response.data);
      }
    } catch (error) {
      console.error('Submit failed:', error);
      toast.error(error.response?.data?.message || 'Failed to submit feedback');
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

  const RECOMMENDATIONS = [
    { value: 'excellent', label: 'Excellent' },
    { value: 'strong', label: 'Strong' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'needs_review', label: 'Needs Review' },
    { value: 'reject', label: 'Reject' },
  ];

  const renderDynamicList = (field, placeholder) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {formData[field].map((item, index) => (
        <div key={index} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            value={item}
            onChange={(e) => handleArrayChange(field, index, e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
            placeholder={placeholder}
          />
          <button
            type="button"
            onClick={() => removeArrayItem(field, index)}
            disabled={formData[field].length === 1 && !item}
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: '#fff',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: 18,
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => addArrayItem(field)}
        style={{
          alignSelf: 'flex-start',
          padding: '8px 14px',
          borderRadius: 8,
          border: '1px dashed #cbd5e1',
          background: '#f8fafc',
          color: '#64748b',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        + Add item
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#e11d4815', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <MessageSquare size={24} color="#e11d48" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Post-Interview Feedback</h2>
          <p style={{ color: '#64748b', fontSize: 15 }}>Provide your evaluation and recommendation for this candidate.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Recommendation */}
            <div>
              <label style={labelStyle}>
                Recommendation <span style={{ color: '#e11d48' }}>*</span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {RECOMMENDATIONS.map(({ value, label }) => (
                  <label
                    key={value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 16px',
                      borderRadius: 8,
                      border: `1px solid ${formData.recommendation === value ? '#e11d48' : '#e2e8f0'}`,
                      background: formData.recommendation === value ? '#e11d4810' : '#fff',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 500,
                      color: formData.recommendation === value ? '#e11d48' : '#475569',
                      transition: 'all 0.15s',
                    }}
                  >
                    <input
                      type="radio"
                      name="recommendation"
                      value={value}
                      checked={formData.recommendation === value}
                      onChange={() => handleChange('recommendation', value)}
                      style={{ display: 'none' }}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {/* Strengths */}
            <div>
              <label style={labelStyle}>Strengths</label>
              {renderDynamicList('strengths', 'e.g., Strong communication skills')}
            </div>

            {/* Concerns */}
            <div>
              <label style={labelStyle}>Concerns</label>
              {renderDynamicList('concerns', 'e.g., Limited experience with X')}
            </div>

            {/* Final Notes */}
            <div>
              <label style={labelStyle}>Final Notes</label>
              <textarea
                value={formData.finalNotes}
                onChange={(e) => handleChange('finalNotes', e.target.value)}
                style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
                placeholder="Any additional observations or context..."
              />
            </div>

            {/* HR Score */}
            <div>
              <label style={labelStyle}>HR Score (0–100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.hrScore}
                onChange={(e) => handleChange('hrScore', e.target.value)}
                style={{ ...inputStyle, maxWidth: 160 }}
                placeholder="e.g., 85"
              />
            </div>
          </div>

          {/* Save & Resume Control */}
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #f1f5f9' }}>
            <SaveResumeControl
              pipelineId={pipelineId}
              stepType="POST_INTERVIEW_FEEDBACK"
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
              background: submitting ? '#94a3b8' : '#e11d48',
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
