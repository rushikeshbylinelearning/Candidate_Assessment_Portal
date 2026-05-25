import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

/**
 * SaveResumeControl component provides auto-save functionality and
 * a manual "Save & Resume Later" button for pipeline steps.
 * 
 * Features:
 * - Auto-saves step data every 30 seconds
 * - Manual save button that ends the session gracefully
 * - Non-blocking warning on save failure with 10-second retry
 * 
 * @param {string} pipelineId - The ID of the current pipeline
 * @param {string} stepType - The step type identifier (e.g. 'LANGUAGE_ASSESSMENT')
 * @param {object} stepData - The current step data to save
 * @param {function} onSaveSuccess - Optional callback on successful save
 * @param {function} onResumeClick - Callback when "Save & Resume Later" is clicked
 * 
 * Validates: Requirements 3.4, 7.1, 7.3
 */
export default function SaveResumeControl({ 
  pipelineId,
  stepType,
  stepData, 
  onSaveSuccess,
  onResumeClick 
}) {
  const [saveStatus, setSaveStatus] = useState(null); // 'saving', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const autoSaveTimerRef = useRef(null);
  const retryTimerRef = useRef(null);

  // Auto-save function
  const saveStepData = async (isManual = false) => {
    if (!pipelineId || !stepType || !stepData) return;

    try {
      setSaveStatus('saving');
      
      const pipelineToken = localStorage.getItem('pipeline_token');
      await axios.patch(
        `/api/pipeline/${pipelineId}/step/save`,
        { stepType, data: stepData },
        {
          headers: {
            'x-pipeline-token': pipelineToken
          }
        }
      );

      setSaveStatus('success');
      setErrorMessage('');
      
      if (onSaveSuccess) {
        onSaveSuccess();
      }

      // Clear success message after 2 seconds
      setTimeout(() => {
        if (!isManual) setSaveStatus(null);
      }, 2000);

    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('error');
      setErrorMessage(
        error.response?.data?.message || 
        'Failed to save progress. Retrying in 10 seconds...'
      );

      // Retry after 10 seconds on failure
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
      retryTimerRef.current = setTimeout(() => {
        saveStepData(isManual);
      }, 10000);
    }
  };

  // Set up auto-save every 30 seconds
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setInterval(() => {
      saveStepData(false);
    }, 30000); // 30 seconds

    // Cleanup on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, [pipelineId, stepData]);

  // Handle manual save and resume later
  const handleSaveAndResume = async () => {
    await saveStepData(true);
    if (onResumeClick) {
      onResumeClick();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Save status indicator */}
      {saveStatus && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            background: 
              saveStatus === 'saving' ? '#f1f5f9' :
              saveStatus === 'success' ? '#dcfce7' :
              '#fee2e2',
            color:
              saveStatus === 'saving' ? '#64748b' :
              saveStatus === 'success' ? '#166534' :
              '#991b1b',
            border: `1px solid ${
              saveStatus === 'saving' ? '#cbd5e1' :
              saveStatus === 'success' ? '#86efac' :
              '#fca5a5'
            }`,
          }}
        >
          {saveStatus === 'saving' && '💾 Saving...'}
          {saveStatus === 'success' && '✓ Progress saved'}
          {saveStatus === 'error' && `⚠️ ${errorMessage}`}
        </div>
      )}

      {/* Save & Resume Later button */}
      <button
        onClick={handleSaveAndResume}
        disabled={saveStatus === 'saving'}
        style={{
          padding: '10px 20px',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          border: '1px solid #cbd5e1',
          background: '#ffffff',
          color: '#475569',
          cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
          opacity: saveStatus === 'saving' ? 0.6 : 1,
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (saveStatus !== 'saving') {
            e.target.style.background = '#f8fafc';
            e.target.style.borderColor = '#94a3b8';
          }
        }}
        onMouseLeave={(e) => {
          e.target.style.background = '#ffffff';
          e.target.style.borderColor = '#cbd5e1';
        }}
      >
        Save & Resume Later
      </button>
    </div>
  );
}
