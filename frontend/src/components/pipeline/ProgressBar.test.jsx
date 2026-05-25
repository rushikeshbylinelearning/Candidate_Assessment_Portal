import React from 'react';
import { render } from '@testing-library/react';
import ProgressBar from './ProgressBar';

describe('ProgressBar', () => {
  test('should calculate 0% when no steps are completed', () => {
    const { container } = render(<ProgressBar completedSteps={0} totalSteps={5} />);
    const progressFill = container.querySelector('div > div');
    expect(progressFill).toHaveStyle({ width: '0%' });
  });

  test('should calculate 50% when half the steps are completed', () => {
    const { container } = render(<ProgressBar completedSteps={2} totalSteps={4} />);
    const progressFill = container.querySelector('div > div');
    expect(progressFill).toHaveStyle({ width: '50%' });
  });

  test('should calculate 100% when all steps are completed', () => {
    const { container } = render(<ProgressBar completedSteps={5} totalSteps={5} />);
    const progressFill = container.querySelector('div > div');
    expect(progressFill).toHaveStyle({ width: '100%' });
  });

  test('should handle single step pipeline at 0%', () => {
    const { container } = render(<ProgressBar completedSteps={0} totalSteps={1} />);
    const progressFill = container.querySelector('div > div');
    expect(progressFill).toHaveStyle({ width: '0%' });
  });

  test('should handle single step pipeline at 100%', () => {
    const { container } = render(<ProgressBar completedSteps={1} totalSteps={1} />);
    const progressFill = container.querySelector('div > div');
    expect(progressFill).toHaveStyle({ width: '100%' });
  });

  test('should calculate correct percentage for 3 of 5 steps', () => {
    const { container } = render(<ProgressBar completedSteps={3} totalSteps={5} />);
    const progressFill = container.querySelector('div > div');
    expect(progressFill).toHaveStyle({ width: '60%' });
  });

  test('should handle edge case of 0 total steps', () => {
    const { container } = render(<ProgressBar completedSteps={0} totalSteps={0} />);
    const progressFill = container.querySelector('div > div');
    expect(progressFill).toHaveStyle({ width: '0%' });
  });

  test('should render container with correct styling', () => {
    const { container } = render(<ProgressBar completedSteps={2} totalSteps={5} />);
    const progressContainer = container.firstChild;
    
    expect(progressContainer).toHaveStyle({
      width: '100%',
      height: '8px',
      borderRadius: '4px',
      background: '#e2e8f0',
      overflow: 'hidden',
    });
  });

  test('should render fill bar with correct styling', () => {
    const { container } = render(<ProgressBar completedSteps={2} totalSteps={5} />);
    const progressFill = container.querySelector('div > div');
    
    expect(progressFill).toHaveStyle({
      height: '100%',
      background: '#e11d48',
      transition: 'width 0.3s ease',
      borderRadius: '4px',
    });
  });
});
