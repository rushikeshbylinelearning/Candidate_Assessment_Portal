import React from 'react';
import { render, screen } from '@testing-library/react';
import StepIndicator from './StepIndicator';

describe('StepIndicator', () => {
  test('should display "Step K of N" format correctly', () => {
    render(<StepIndicator currentStepIndex={2} totalSteps={5} />);
    expect(screen.getByText('Step 2 of 5')).toBeInTheDocument();
  });

  test('should display first step correctly', () => {
    render(<StepIndicator currentStepIndex={1} totalSteps={5} />);
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
  });

  test('should display last step correctly', () => {
    render(<StepIndicator currentStepIndex={5} totalSteps={5} />);
    expect(screen.getByText('Step 5 of 5')).toBeInTheDocument();
  });

  test('should handle single step pipeline', () => {
    render(<StepIndicator currentStepIndex={1} totalSteps={1} />);
    expect(screen.getByText('Step 1 of 1')).toBeInTheDocument();
  });

  test('should render with correct styling', () => {
    const { container } = render(<StepIndicator currentStepIndex={3} totalSteps={5} />);
    const element = container.firstChild;
    
    expect(element).toHaveStyle({
      display: 'inline-flex',
      alignItems: 'center',
      padding: '8px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      background: '#f1f5f9',
      color: '#475569',
    });
  });
});
