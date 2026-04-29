/**
 * Bug Condition Exploration Tests
 *
 * These tests encode the EXPECTED (fixed) behavior for all six bugs.
 * They are EXPECTED TO FAIL on unfixed code — failure confirms the bugs exist.
 *
 * DO NOT fix the code or the tests when they fail.
 * Document the counterexamples found (what the unfixed code actually renders).
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 3.1, 3.2, 4.1, 5.1, 5.2, 6.1, 6.2
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// ── Mock react-router-dom (CandidateDetail uses useParams / useNavigate) ──────
vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'test-candidate-id' }),
  useNavigate: () => vi.fn(),
}));

// ── Mock react-hot-toast ──────────────────────────────────────────────────────
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

// ── Mock the api module ───────────────────────────────────────────────────────
vi.mock('../utils/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

import api from '../utils/api';
import CandidateDetail from '../pages/hr/CandidateDetail';
import RoleMatchCard from '../components/resume/RoleMatchCard';
import StructuredResume from '../components/resume/StructuredResume';

// ── Shared mock candidate ─────────────────────────────────────────────────────
const baseMockCandidate = {
  _id: 'test-candidate-id',
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '555-1234',
  accessCode: 'ABC123',
  appliedRole: { _id: 'role-1', title: 'Frontend Engineer', department: 'Engineering' },
  experienceLevel: 'Mid',
  resumeUrl: null,
};

// ── Helper: set up api.get mock for CandidateDetail ──────────────────────────
function setupApiMocks({
  candidate = baseMockCandidate,
  score = null,
  logs = [],
  resumeData = null,
} = {}) {
  api.get.mockImplementation((url) => {
    if (url.includes('/candidates/')) return Promise.resolve({ data: candidate });
    if (url.includes('/responses/score/')) return Promise.resolve({ data: score });
    if (url.includes('/responses')) return Promise.resolve({ data: [] });
    if (url.includes('/notes')) return Promise.resolve({ data: logs });
    if (url.includes('/resume/')) return Promise.resolve({ data: resumeData });
    return Promise.resolve({ data: null });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Bug 1 — Hardcoded strengths / weaknesses
// ─────────────────────────────────────────────────────────────────────────────
describe('Bug 1 — Hardcoded strengths/weaknesses', () => {
  beforeEach(() => {
    const logsWithData = [
      {
        _id: 'log-1',
        round: 'Round 1',
        stage: 'technical',
        notes: 'Good session',
        rating: 8,
        recommendation: 'proceed',
        strengths: ['Good communicator'],
        weaknesses: ['Needs testing experience'],
        createdAt: new Date().toISOString(),
      },
      {
        _id: 'log-2',
        round: 'Round 2',
        stage: 'hr',
        notes: 'Culture fit',
        rating: 7,
        recommendation: 'proceed',
        strengths: ['Good communicator'],
        weaknesses: ['Needs testing experience'],
        createdAt: new Date().toISOString(),
      },
    ];
    setupApiMocks({ logs: logsWithData });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should display strengths from interview logs, NOT hardcoded defaults', async () => {
    render(<CandidateDetail />);

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Expected: real strength from logs
    await waitFor(() => {
      expect(screen.getByText('Good communicator')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Must NOT show hardcoded defaults
    expect(screen.queryByText('Strong problem-solving skills')).not.toBeInTheDocument();
    expect(screen.queryByText('Excellent communication')).not.toBeInTheDocument();
    expect(screen.queryByText('Quick learner')).not.toBeInTheDocument();
  });

  it('should display weaknesses from interview logs, NOT hardcoded defaults', async () => {
    render(<CandidateDetail />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Expected: real weakness from logs
    await waitFor(() => {
      expect(screen.getByText('Needs testing experience')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Must NOT show hardcoded defaults
    expect(screen.queryByText('Limited system design experience')).not.toBeInTheDocument();
    expect(screen.queryByText('Needs improvement in testing')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Bug 2 — Hardcoded role match data in RoleMatchCard
// ─────────────────────────────────────────────────────────────────────────────
describe('Bug 2 — Hardcoded role match data', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should NOT render "78%" when matchData is null', () => {
    render(<RoleMatchCard matchData={null} />);

    expect(screen.queryByText(/78%/)).not.toBeInTheDocument();
  });

  it('should NOT render hardcoded missing skills when matchData is null', () => {
    render(<RoleMatchCard matchData={null} />);

    expect(screen.queryByText('JavaScript')).not.toBeInTheDocument();
    expect(screen.queryByText('React')).not.toBeInTheDocument();
    expect(screen.queryByText('Node')).not.toBeInTheDocument();
    expect(screen.queryByText('MongoDB')).not.toBeInTheDocument();
  });

  it('should show an empty state message when matchData is null', () => {
    render(<RoleMatchCard matchData={null} />);

    // The fixed component should show some empty state text
    // (e.g. "No resume uploaded yet" or similar)
    const emptyStateText =
      screen.queryByText(/no resume/i) ||
      screen.queryByText(/upload a resume/i) ||
      screen.queryByText(/no match/i) ||
      screen.queryByText(/no data/i);

    expect(emptyStateText).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Bug 3 — Fake default scores
// ─────────────────────────────────────────────────────────────────────────────
describe('Bug 3 — Fake default scores', () => {
  beforeEach(() => {
    setupApiMocks({ score: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should NOT show a score card with "100" for aptitude when score is null', async () => {
    render(<CandidateDetail />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // The value "100" should not appear as a score card value
    // (it may appear elsewhere, but not as the aptitude score card value)
    const scoreCardValues = document.querySelectorAll('.score-card-value');
    const aptitudeCard = Array.from(scoreCardValues).find(
      (el) => el.textContent === '100'
    );
    expect(aptitudeCard).toBeUndefined();
  });

  it('should show "No assessment taken yet" placeholder when score is null', async () => {
    render(<CandidateDetail />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(screen.getByText(/no assessment taken yet/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Bug 4 — Spinner forever when no resume
// ─────────────────────────────────────────────────────────────────────────────
describe('Bug 4 — Spinner forever when no resume', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should NOT render a loading spinner when resumeData is null and hasResume is false', () => {
    render(
      <StructuredResume
        resumeData={null}
        hasResume={false}
        candidate={baseMockCandidate}
        onViewOriginal={vi.fn()}
        showOriginal={false}
        onHideOriginal={vi.fn()}
      />
    );

    // The spinner has class "sr-spinner" or aria-label, or the loading text
    expect(screen.queryByText(/loading resume/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/please wait/i)).not.toBeInTheDocument();
    // Also check no Loader/spinner element by class
    expect(document.querySelector('.sr-spinner')).toBeNull();
  });

  it('should show "No resume uploaded" text when resumeData is null and hasResume is false', () => {
    render(
      <StructuredResume
        resumeData={null}
        hasResume={false}
        candidate={baseMockCandidate}
        onViewOriginal={vi.fn()}
        showOriginal={false}
        onHideOriginal={vi.fn()}
      />
    );

    expect(screen.getByText(/no resume uploaded/i)).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Bug 5 — Non-functional download button
// ─────────────────────────────────────────────────────────────────────────────
describe('Bug 5 — Non-functional download button', () => {
  const candidateWithResume = {
    ...baseMockCandidate,
    resumeUrl: '/uploads/resumes/test.pdf',
  };

  beforeEach(() => {
    // Mock window.open
    vi.stubGlobal('open', vi.fn());

    setupApiMocks({
      candidate: candidateWithResume,
      resumeData: {
        parsingStatus: 'done',
        basicInfo: { name: 'Jane Doe' },
        summary: 'A great candidate',
        skills: {},
        experience: [],
        education: [],
        projects: [],
        certifications: [],
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('should call window.open with a URL containing the resumeUrl when Download Resume is clicked', async () => {
    render(<CandidateDetail />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    const downloadBtn = await waitFor(
      () => screen.getByRole('button', { name: /download resume/i }),
      { timeout: 3000 }
    );

    fireEvent.click(downloadBtn);

    expect(window.open).toHaveBeenCalledTimes(1);
    const calledUrl = window.open.mock.calls[0][0];
    expect(calledUrl).toContain('/uploads/resumes/test.pdf');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Bug 6 — Layout: resume-panel-scroll wrapper and flex-shrink on header
// ─────────────────────────────────────────────────────────────────────────────
describe('Bug 6 — Left panel layout', () => {
  beforeEach(() => {
    setupApiMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should have a .resume-panel-scroll wrapper around StructuredResume and download button', async () => {
    render(<CandidateDetail />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    const scrollWrapper = document.querySelector('.resume-panel-scroll');
    expect(scrollWrapper).not.toBeNull();

    // The download button should be inside the scroll wrapper
    const downloadBtn = scrollWrapper?.querySelector('.download-resume-btn');
    expect(downloadBtn).not.toBeNull();
  });

  it('should have flex-shrink: 0 applied to .candidate-header-card', async () => {
    render(<CandidateDetail />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    const headerCard = document.querySelector('.candidate-header-card');
    expect(headerCard).not.toBeNull();

    const computedStyle = window.getComputedStyle(headerCard);
    // flex-shrink: 0 is set via CSS class in CandidateDetail.css
    // In jsdom, getComputedStyle may not fully resolve CSS files,
    // so we check the inline style OR the class-based style attribute.
    // The CSS file already sets flex-shrink: 0 on .candidate-header-card,
    // but the bug is that the .resume-panel-scroll wrapper is missing,
    // so the header can scroll out of view. We assert the CSS property is set.
    expect(computedStyle.flexShrink).toBe('0');
  });
});
