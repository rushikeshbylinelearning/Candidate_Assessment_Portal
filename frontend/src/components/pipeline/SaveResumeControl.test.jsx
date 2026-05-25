import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import axios from 'axios';
import SaveResumeControl from './SaveResumeControl';

// Mock axios
vi.mock('axios');

describe('SaveResumeControl', () => {
  const mockPipelineId = 'pipeline123';
  const mockStepData = { field1: 'value1', field2: 'value2' };
  const mockOnSaveSuccess = vi.fn();
  const mockOnResumeClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    localStorage.setItem('pipeline_token', 'test-token');
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    localStorage.clear();
  });

  test('should render Save & Resume Later button', () => {
    render(
      <SaveResumeControl
        pipelineId={mockPipelineId}
        stepData={mockStepData}
        onResumeClick={mockOnResumeClick}
      />
    );
    
    expect(screen.getByText('Save & Resume Later')).toBeInTheDocument();
  });

  test('should call save endpoint when button is clicked', async () => {
    axios.patch.mockResolvedValueOnce({ data: { success: true } });

    render(
      <SaveResumeControl
        pipelineId={mockPipelineId}
        stepData={mockStepData}
        onResumeClick={mockOnResumeClick}
      />
    );

    const button = screen.getByText('Save & Resume Later');
    fireEvent.click(button);

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith(
        `/api/pipeline/${mockPipelineId}/step/save`,
        { data: mockStepData },
        {
          headers: {
            'x-pipeline-token': 'test-token'
          }
        }
      );
    });
  });

  test('should trigger onResumeClick callback after successful save', async () => {
    axios.patch.mockResolvedValueOnce({ data: { success: true } });

    render(
      <SaveResumeControl
        pipelineId={mockPipelineId}
        stepData={mockStepData}
        onResumeClick={mockOnResumeClick}
      />
    );

    const button = screen.getByText('Save & Resume Later');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockOnResumeClick).toHaveBeenCalled();
    });
  });

  test('should call onSaveSuccess callback when provided', async () => {
    axios.patch.mockResolvedValueOnce({ data: { success: true } });

    render(
      <SaveResumeControl
        pipelineId={mockPipelineId}
        stepData={mockStepData}
        onSaveSuccess={mockOnSaveSuccess}
        onResumeClick={mockOnResumeClick}
      />
    );

    const button = screen.getByText('Save & Resume Later');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockOnSaveSuccess).toHaveBeenCalled();
    });
  });

  test('should display success message after successful save', async () => {
    axios.patch.mockResolvedValueOnce({ data: { success: true } });

    render(
      <SaveResumeControl
        pipelineId={mockPipelineId}
        stepData={mockStepData}
        onResumeClick={mockOnResumeClick}
      />
    );

    const button = screen.getByText('Save & Resume Later');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('✓ Progress saved')).toBeInTheDocument();
    });
  });

  test('should display error message on save failure', async () => {
    axios.patch.mockRejectedValueOnce({
      response: { data: { message: 'Network error' } }
    });

    render(
      <SaveResumeControl
        pipelineId={mockPipelineId}
        stepData={mockStepData}
        onResumeClick={mockOnResumeClick}
      />
    );

    const button = screen.getByText('Save & Resume Later');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });

  test('should retry save after 10 seconds on failure', async () => {
    axios.patch
      .mockRejectedValueOnce({ response: { data: { message: 'Error' } } })
      .mockResolvedValueOnce({ data: { success: true } });

    render(
      <SaveResumeControl
        pipelineId={mockPipelineId}
        stepData={mockStepData}
        onResumeClick={mockOnResumeClick}
      />
    );

    const button = screen.getByText('Save & Resume Later');
    fireEvent.click(button);

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledTimes(1);
    });

    // Fast-forward 10 seconds
    vi.advanceTimersByTime(10000);

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledTimes(2);
    });
  });

  test('should auto-save every 30 seconds', async () => {
    axios.patch.mockResolvedValue({ data: { success: true } });

    render(
      <SaveResumeControl
        pipelineId={mockPipelineId}
        stepData={mockStepData}
        onResumeClick={mockOnResumeClick}
      />
    );

    // Initially no calls
    expect(axios.patch).not.toHaveBeenCalled();

    // Fast-forward 30 seconds
    vi.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledTimes(1);
    });

    // Fast-forward another 30 seconds
    vi.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledTimes(2);
    });
  });

  test('should disable button while saving', async () => {
    axios.patch.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve({ data: { success: true } }), 1000);
    }));

    render(
      <SaveResumeControl
        pipelineId={mockPipelineId}
        stepData={mockStepData}
        onResumeClick={mockOnResumeClick}
      />
    );

    const button = screen.getByText('Save & Resume Later');
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toBeDisabled();
    });
  });

  test('should not save if pipelineId is missing', async () => {
    render(
      <SaveResumeControl
        pipelineId={null}
        stepData={mockStepData}
        onResumeClick={mockOnResumeClick}
      />
    );

    const button = screen.getByText('Save & Resume Later');
    fireEvent.click(button);

    await waitFor(() => {
      expect(axios.patch).not.toHaveBeenCalled();
    });
  });

  test('should not save if stepData is missing', async () => {
    render(
      <SaveResumeControl
        pipelineId={mockPipelineId}
        stepData={null}
        onResumeClick={mockOnResumeClick}
      />
    );

    const button = screen.getByText('Save & Resume Later');
    fireEvent.click(button);

    await waitFor(() => {
      expect(axios.patch).not.toHaveBeenCalled();
    });
  });

  test('should clean up timers on unmount', () => {
    const { unmount } = render(
      <SaveResumeControl
        pipelineId={mockPipelineId}
        stepData={mockStepData}
        onResumeClick={mockOnResumeClick}
      />
    );

    unmount();

    // Advance timers after unmount
    vi.advanceTimersByTime(30000);

    // Should not trigger any saves
    expect(axios.patch).not.toHaveBeenCalled();
  });

  test('should display default error message when no message in response', async () => {
    axios.patch.mockRejectedValueOnce({ response: {} });

    render(
      <SaveResumeControl
        pipelineId={mockPipelineId}
        stepData={mockStepData}
        onResumeClick={mockOnResumeClick}
      />
    );

    const button = screen.getByText('Save & Resume Later');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Failed to save progress. Retrying in 10 seconds.../)).toBeInTheDocument();
    });
  });
});
