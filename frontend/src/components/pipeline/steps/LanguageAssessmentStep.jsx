import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import SaveResumeControl from '../SaveResumeControl';

/**
 * LanguageAssessmentStep - Language proficiency assessment form
 * Validates: Requirements 6.2
 */
export default function LanguageAssessmentStep({ pipelineId, partialData, onStepComplete }) {
  const [formData, setFormData] = useState({
    language: partialData?.language || '',
    responses: partialData?.responses || [{ prompt: '', response: '' }],
  });

  const [submitting, setSubmitting] = useState(false);

  const handleLanguageChange = (value) => {
    setFormData(prev => ({ ...prev, language: value }));
  };

  const handleResponseChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.responses];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, responses: updated };
    });
  };

  const addResponse = () => {
    setFormData(prev => ({
      ...prev,
      responses: [...prev.responses, { prompt: '', response: '' }],
    }));
  };

  const removeResponse = (index) => {
    setFormData(prev => ({
      ...prev,
      responses: prev.responses.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.language.trim()) {
      toast.error('Please specify a language');
      return;
    }

    // Filter out incomplete response entries before submitting
    const filledResponses = formData.responses.filter(
      r => r.prompt.trim() !== '' && r.response.trim() !== ''
    );

    if (filledResponses.length === 0) {
      toast.error('Please fill in at least one prompt and response');
      return;
    }

    setSubmitting(true);
    try {
      const pipelineToken = localStorage.getItem('pipeline_token');
      const response = await axios.post(
        `/api/pipeline/${pipelineId}/step/submit`,
        { stepType: 'LANGUAGE_ASSESSMENT', data: { ...formData, responses: filledResponses } },
        { headers: { 'x-pipeline-token': pipelineToken } }
      );

      toast.success('Language assessment submitted successfully!');
      if (onStepComplete) {
        onStepComplete(response.data);
      }
    } catch (error) {
      console.error('Submit failed:', error);
      toast.error(error.response?.data?.message || 'Failed to submit assessment');
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

  const LANGUAGES = [
    'English', 'Spanish', 'French', 'German', 'Mandarin',
    'Arabic', 'Portuguese', 'Japanese', 'Korean', 'Italian', 'Other',
  ];

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#0ea5e915', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 24 }}>
            🌐
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Language Assessment</h2>
          <p style={{ color: '#64748b', fontSize: 15 }}>Provide your language proficiency details and responses to the prompts below.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Language */}
            <div>
              <label style={labelStyle}>
                Language <span style={{ color: '#e11d48' }}>*</span>
              </label>
              <select
                value={formData.language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                style={{ ...inputStyle, background: '#fff' }}
                required
              >
                <option value="">Select a language...</option>
                {LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
              {formData.language === 'Other' && (
                <input
                  type="text"
                  placeholder="Please specify language"
                  style={{ ...inputStyle, marginTop: 8 }}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                />
              )}
            </div>

            {/* Responses */}
            <div>
              <label style={labelStyle}>Responses</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {formData.responses.map((item, index) => (
                  <div
                    key={index}
                    style={{ padding: 16, borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', position: 'relative' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Response {index + 1}</span>
                      {formData.responses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeResponse(index)}
                          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px' }}
                          title="Remove"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <input
                        type="text"
                        placeholder="Prompt / Question"
                        value={item.prompt}
                        onChange={(e) => handleResponseChange(index, 'prompt', e.target.value)}
                        style={{ ...inputStyle, background: '#fff' }}
                      />
                      <textarea
                        placeholder="Your response"
                        value={item.response}
                        onChange={(e) => handleResponseChange(index, 'response', e.target.value)}
                        rows={3}
                        style={{ ...inputStyle, background: '#fff', resize: 'vertical' }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addResponse}
                style={{
                  marginTop: 12,
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px dashed #cbd5e1',
                  background: '#f8fafc',
                  color: '#475569',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                + Add Response
              </button>
            </div>
          </div>

          {/* Save & Resume Control */}
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #f1f5f9' }}>
            <SaveResumeControl
              pipelineId={pipelineId}
              stepType="LANGUAGE_ASSESSMENT"
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
              background: submitting ? '#94a3b8' : '#0ea5e9',
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
