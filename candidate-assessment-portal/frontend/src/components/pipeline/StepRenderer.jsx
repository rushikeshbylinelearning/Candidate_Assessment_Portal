import React from 'react';
import EvaluationFormStep from './steps/EvaluationFormStep';
import LanguageAssessmentStep from './steps/LanguageAssessmentStep';
import RoleAssessmentStep from './steps/RoleAssessmentStep';
import InterviewInteractionStep from './steps/InterviewInteractionStep';
import PostInterviewFeedbackStep from './steps/PostInterviewFeedbackStep';

/**
 * StepRenderer - Renders the appropriate step component based on currentStep type.
 * Validates: Requirements 3.1
 *
 * @param {string|null} currentStep - The step type enum value
 * @param {string} pipelineId - The pipeline record ID
 * @param {object} partialData - Previously saved partial data for the current step
 * @param {number} remainingTime - Remaining time in seconds for the current step
 * @param {function} onStepComplete - Callback invoked when a step is submitted successfully
 */
export default function StepRenderer({ currentStep, pipelineId, partialData, remainingTime, onStepComplete }) {
  const stepProps = { pipelineId, partialData, remainingTime, onStepComplete };

  switch (currentStep) {
    case 'EVALUATION_FORM':
      return <EvaluationFormStep {...stepProps} />;
    case 'LANGUAGE_ASSESSMENT':
      return <LanguageAssessmentStep {...stepProps} />;
    case 'ROLE_BASED_ASSESSMENT':
      return <RoleAssessmentStep {...stepProps} />;
    case 'INTERVIEW_INTERACTION':
      return <InterviewInteractionStep {...stepProps} />;
    case 'POST_INTERVIEW_FEEDBACK':
      return <PostInterviewFeedbackStep {...stepProps} />;
    case null:
    case undefined:
      return (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Pipeline Complete</h2>
          <p style={{ fontSize: 15 }}>You have completed all steps in your evaluation pipeline.</p>
        </div>
      );
    default:
      return (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Unknown Step</h2>
          <p style={{ fontSize: 15 }}>The step <code>{currentStep}</code> is not recognized.</p>
        </div>
      );
  }
}
