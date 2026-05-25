import React from 'react';

export default function StepIndicator({ currentStepIndex, totalSteps }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '8px 16px',
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        background: '#f1f5f9',
        color: '#475569',
      }}
    >
      Step {currentStepIndex} of {totalSteps}
    </div>
  );
}
