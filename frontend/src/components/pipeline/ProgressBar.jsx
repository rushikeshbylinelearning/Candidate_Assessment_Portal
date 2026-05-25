import React from 'react';

/**
 * ProgressBar component displays a visual progress indicator
 * showing the ratio of completed steps to total steps.
 * 
 * @param {number} completedSteps - Number of completed steps
 * @param {number} totalSteps - Total number of steps in the pipeline
 * 
 * Validates: Requirements 3.3
 */
export default function ProgressBar({ completedSteps, totalSteps }) {
  const percentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <div
      style={{
        width: '100%',
        height: 8,
        borderRadius: 4,
        background: '#e2e8f0',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${percentage}%`,
          height: '100%',
          background: '#e11d48',
          transition: 'width 0.3s ease',
          borderRadius: 4,
        }}
      />
    </div>
  );
}
