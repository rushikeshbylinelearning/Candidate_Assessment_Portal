import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ClipboardList } from 'lucide-react';
import SaveResumeControl from '../SaveResumeControl';

/**
 * RoleAssessmentStep - Quiz-style role-based assessment
 * Validates: Requirements 6.3
 */
export default function RoleAssessmentStep({ pipelineId, partialData, onStepComplete }) {
  const questions = partialData?.questions || [];

  const [formData, setFormData] = useState({
    responses: partialData?.responses || questions.map(q => ({ questionId: q._id || q.id, answer: '' })),
  });

  const [submitting, setSubmitting] = useState(false);

  const handleAnswer = (questionId, answer) => {
    setFormData(prev => ({
      responses: prev.responses.map(r =>
        r.questionId === questionId ? { ...r, answer } : r
      ),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const unanswered = formData.responses.filter(r => !r.answer);
    if (questions.length > 0 && unanswered.length > 0) {
      toast.error('Please answer all questions before submitting');
      return;
    }

    setSubmitting(true);
    try {
      const pipelineToken = localStorage.getItem('pipeline_token');
      const response = await axios.post(
        `/api/pipeline/${pipelineId}/step/submit`,
        {
          stepType: 'ROLE_BASED_ASSESSMENT',
          data: {
            assessmentId: partialData?.assessmentId || null,
            responses: formData.responses,
          },
        },
        {
          headers: { 'x-pipeline-token': pipelineToken },
        }
      );

      toast.success('Assessment submitted successfully!');
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
            <ClipboardList size={24} color="#7c3aed" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Role Assessment</h2>
          <p style={{ color: '#64748b', fontSize: 15 }}>Answer each question to the best of your ability.</p>
        </div>

        <form onSubmit={handleSubmit}>
          {questions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: 15 }}>
              No questions available for this assessment.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {questions.map((question, index) => {
                const questionId = question._id || question.id;
                const response = formData.responses.find(r => r.questionId === questionId);
                const selectedAnswer = response?.answer || '';

                return (
                  <div key={questionId} style={{ padding: 20, borderRadius: 10, border: '1px solid #e2e8f0', background: '#fafafa' }}>
                    <label style={{ ...labelStyle, fontSize: 15, color: '#0f172a' }}>
                      <span style={{ color: '#7c3aed', marginRight: 8 }}>Q{index + 1}.</span>
                      {question.questionText}
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                      {(question.options || []).map((option, optIdx) => {
                        const optionValue = typeof option === 'string' ? option : option.value || option.text;
                        const optionLabel = typeof option === 'string' ? option : option.label || option.text || option.value;
                        const isSelected = selectedAnswer === optionValue;

                        return (
                          <label
                            key={optIdx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              padding: '10px 14px',
                              borderRadius: 8,
                              border: `1px solid ${isSelected ? '#7c3aed' : '#e2e8f0'}`,
                              background: isSelected ? '#7c3aed10' : '#fff',
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                              fontSize: 14,
                              color: '#334155',
                            }}
                          >
                            <input
                              type="radio"
                              name={`question-${questionId}`}
                              value={optionValue}
                              checked={isSelected}
                              onChange={() => handleAnswer(questionId, optionValue)}
                              style={{ accentColor: '#7c3aed' }}
                            />
                            {optionLabel}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Save & Resume Control */}
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #f1f5f9' }}>
            <SaveResumeControl
              pipelineId={pipelineId}
              stepType="ROLE_BASED_ASSESSMENT"
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
