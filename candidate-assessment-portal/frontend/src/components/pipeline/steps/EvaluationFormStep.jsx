import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { User, Briefcase, Calendar, DollarSign, Link as LinkIcon, FileText } from 'lucide-react';
import SaveResumeControl from '../SaveResumeControl';

/**
 * EvaluationFormStep - Structured candidate profile / screening form
 * Validates: Requirements 6.1
 */
export default function EvaluationFormStep({ pipelineId, partialData, onStepComplete }) {
  const [formData, setFormData] = useState({
    yearsExperience: partialData?.yearsExperience || '',
    currentTitle: partialData?.currentTitle || '',
    noticePeriodDays: partialData?.noticePeriodDays || '',
    salaryExpectation: partialData?.salaryExpectation || '',
    availableFrom: partialData?.availableFrom || '',
    linkedinUrl: partialData?.linkedinUrl || '',
    portfolioUrl: partialData?.portfolioUrl || '',
    answers: partialData?.answers || [],
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.yearsExperience || !formData.currentTitle) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const pipelineToken = localStorage.getItem('pipeline_token');
      const response = await axios.post(
        `/api/pipeline/${pipelineId}/step/submit`,
        {
          stepType: 'EVALUATION_FORM',
          data: formData,
        },
        {
          headers: {
            'x-pipeline-token': pipelineToken,
          },
        }
      );

      toast.success('Evaluation form submitted successfully!');
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
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#e11d4815', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <User size={24} color="#e11d48" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Evaluation Form</h2>
          <p style={{ color: '#64748b', fontSize: 15 }}>Please provide your professional details and background information.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Years of Experience */}
            <div>
              <label style={labelStyle}>
                Years of Experience <span style={{ color: '#e11d48' }}>*</span>
              </label>
              <input
                type="number"
                min="0"
                value={formData.yearsExperience}
                onChange={(e) => handleChange('yearsExperience', e.target.value)}
                style={inputStyle}
                placeholder="e.g., 5"
                required
              />
            </div>

            {/* Current Title */}
            <div>
              <label style={labelStyle}>
                Current Job Title <span style={{ color: '#e11d48' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.currentTitle}
                onChange={(e) => handleChange('currentTitle', e.target.value)}
                style={inputStyle}
                placeholder="e.g., Senior Software Engineer"
                required
              />
            </div>

            {/* Notice Period */}
            <div>
              <label style={labelStyle}>Notice Period (Days)</label>
              <input
                type="number"
                min="0"
                value={formData.noticePeriodDays}
                onChange={(e) => handleChange('noticePeriodDays', e.target.value)}
                style={inputStyle}
                placeholder="e.g., 30"
              />
            </div>

            {/* Salary Expectation */}
            <div>
              <label style={labelStyle}>Salary Expectation (Annual)</label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={18} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="number"
                  min="0"
                  value={formData.salaryExpectation}
                  onChange={(e) => handleChange('salaryExpectation', e.target.value)}
                  style={{ ...inputStyle, paddingLeft: 40 }}
                  placeholder="e.g., 80000"
                />
              </div>
            </div>

            {/* Available From */}
            <div>
              <label style={labelStyle}>Available From</label>
              <input
                type="date"
                value={formData.availableFrom}
                onChange={(e) => handleChange('availableFrom', e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* LinkedIn URL */}
            <div>
              <label style={labelStyle}>LinkedIn Profile</label>
              <div style={{ position: 'relative' }}>
                <LinkIcon size={18} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={(e) => handleChange('linkedinUrl', e.target.value)}
                  style={{ ...inputStyle, paddingLeft: 40 }}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>
            </div>

            {/* Portfolio URL */}
            <div>
              <label style={labelStyle}>Portfolio / Website</label>
              <div style={{ position: 'relative' }}>
                <LinkIcon size={18} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="url"
                  value={formData.portfolioUrl}
                  onChange={(e) => handleChange('portfolioUrl', e.target.value)}
                  style={{ ...inputStyle, paddingLeft: 40 }}
                  placeholder="https://yourportfolio.com"
                />
              </div>
            </div>
          </div>

          {/* Save & Resume Control */}
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #f1f5f9' }}>
            <SaveResumeControl
              pipelineId={pipelineId}
              stepType="EVALUATION_FORM"
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
