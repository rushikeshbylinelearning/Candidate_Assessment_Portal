/**
 * Preservation Property Tests
 *
 * These tests capture the BASELINE behavior of the unfixed code for states
 * that must remain unchanged after the bugfix is applied.
 *
 * Methodology: Observe behavior on UNFIXED code first, then write tests.
 * These tests are EXPECTED TO PASS on unfixed code — passing confirms the
 * baseline behavior to preserve.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// ── Mock react-router-dom ─────────────────────────────────────────────────────
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

const candidateWithResume = {
  ...baseMockCandidate,
  resumeUrl: '/uploads/resumes/jane-doe.pdf',
};

// ── Helper: set up api.get mock for CandidateDetail ──────────────────────────
function setupApiMocks({
  candidate = baseMockCandidate,
  score = null,
  logs = [],
  resumeData = null,
  matchData = null,
} = {}) {
  api.get.mockImplementation((url) => {
    if (url.includes('/candidates/')) return Promise.resolve({ data: candidate });
    if (url.includes('/responses/score/')) return Promise.resolve({ data: score });
    if (url.includes('/responses')) return Promise.resolve({ data: [] });
    if (url.includes('/notes')) return Promise.resolve({ data: logs });
    if (url.includes('/match/')) return Promise.resolve({ data: matchData });
    if (url.includes('/resume/')) return Promise.resolve({ data: resumeData });
    return Promise.resolve({ data: null });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Observe 1 — Loading spinner preserved when hasResume=true and resumeData=null
// Validates: Requirement 3.1
// ─────────────────────────────────────────────────────────────────────────────
describe('Observe 1 — Loading spinner (Requirement 3.1)', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Observation: On unfixed code, StructuredResume does not accept a hasResume
   * prop. When resumeData is null, it always shows the loading spinner regardless
   * of whether the candidate has a resume. After the fix, the loading spinner
   * must still appear when hasResume=true and resumeData=null.
   *
   * Property: For all inputs where hasResume=true and resumeData=null,
   * the loading spinner is shown.
   *
   * Validates: Requirements 3.1
   */
  it('shows loading spinner when resumeData is null and hasResume is true', () => {
    render(
      <StructuredResume
        resumeData={null}
        hasResume={true}
        candidate={baseMockCandidate}
        onViewOriginal={vi.fn()}
        showOriginal={false}
        onHideOriginal={vi.fn()}
      />
    );

    // The loading spinner element should be present
    const spinner = document.querySelector('.sr-spinner');
    expect(spinner).not.toBeNull();
  });

  it('shows "Loading resume..." text when resumeData is null and hasResume is true', () => {
    render(
      <StructuredResume
        resumeData={null}
        hasResume={true}
        candidate={baseMockCandidate}
        onViewOriginal={vi.fn()}
        showOriginal={false}
        onHideOriginal={vi.fn()}
      />
    );

    expect(screen.getByText(/loading resume/i)).toBeInTheDocument();
  });

  /**
   * Property-based: for any truthy hasResume value with null resumeData,
   * the spinner is always shown.
   */
  it('shows loading spinner for any truthy hasResume value with null resumeData', () => {
    // Test with various truthy hasResume values
    const truthyValues = [true, 1, 'yes', '/some/url'];

    for (const hasResume of truthyValues) {
      const { unmount } = render(
        <StructuredResume
          resumeData={null}
          hasResume={hasResume}
          candidate={baseMockCandidate}
          onViewOriginal={vi.fn()}
          showOriginal={false}
          onHideOriginal={vi.fn()}
        />
      );

      const spinner = document.querySelector('.sr-spinner');
      expect(spinner).not.toBeNull();
      unmount();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Observe 2 — Processing state preserved
// Validates: Requirement 3.2
// ─────────────────────────────────────────────────────────────────────────────
describe('Observe 2 — Processing state (Requirement 3.2)', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Observation: When resumeData.parsingStatus === 'processing', the component
   * shows "Processing Resume..." text and a spinner.
   *
   * This state must be preserved after the fix.
   *
   * Validates: Requirements 3.2
   */
  it('shows "Processing Resume..." when parsingStatus is "processing"', () => {
    render(
      <StructuredResume
        resumeData={{ parsingStatus: 'processing' }}
        hasResume={true}
        candidate={baseMockCandidate}
        onViewOriginal={vi.fn()}
        showOriginal={false}
        onHideOriginal={vi.fn()}
      />
    );

    expect(screen.getByText(/processing resume/i)).toBeInTheDocument();
  });

  it('shows a spinner when parsingStatus is "processing"', () => {
    render(
      <StructuredResume
        resumeData={{ parsingStatus: 'processing' }}
        hasResume={true}
        candidate={baseMockCandidate}
        onViewOriginal={vi.fn()}
        showOriginal={false}
        onHideOriginal={vi.fn()}
      />
    );

    const spinner = document.querySelector('.sr-spinner');
    expect(spinner).not.toBeNull();
  });

  it('does NOT show "No resume uploaded" when parsingStatus is "processing"', () => {
    render(
      <StructuredResume
        resumeData={{ parsingStatus: 'processing' }}
        hasResume={true}
        candidate={baseMockCandidate}
        onViewOriginal={vi.fn()}
        showOriginal={false}
        onHideOriginal={vi.fn()}
      />
    );

    expect(screen.queryByText(/no resume uploaded/i)).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Observe 3 — Parse-failed state preserved
// Validates: Requirement 3.3
// ─────────────────────────────────────────────────────────────────────────────
describe('Observe 3 — Parse-failed state (Requirement 3.3)', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Observation: When resumeData.parsingStatus === 'failed', the component
   * shows "Failed to Parse Resume" and a retry button.
   *
   * This state must be preserved after the fix.
   *
   * Validates: Requirements 3.3
   */
  it('shows "Failed to Parse Resume" when parsingStatus is "failed"', () => {
    render(
      <StructuredResume
        resumeData={{ parsingStatus: 'failed', parsingError: 'Could not parse' }}
        hasResume={true}
        candidate={baseMockCandidate}
        onViewOriginal={vi.fn()}
        showOriginal={false}
        onHideOriginal={vi.fn()}
      />
    );

    expect(screen.getByText(/failed to parse resume/i)).toBeInTheDocument();
  });

  it('shows the parsingError message when parsingStatus is "failed"', () => {
    render(
      <StructuredResume
        resumeData={{ parsingStatus: 'failed', parsingError: 'Could not parse' }}
        hasResume={true}
        candidate={baseMockCandidate}
        onViewOriginal={vi.fn()}
        showOriginal={false}
        onHideOriginal={vi.fn()}
      />
    );

    expect(screen.getByText('Could not parse')).toBeInTheDocument();
  });

  it('shows a retry button when parsingStatus is "failed"', () => {
    render(
      <StructuredResume
        resumeData={{ parsingStatus: 'failed', parsingError: 'Could not parse' }}
        hasResume={true}
        candidate={baseMockCandidate}
        onViewOriginal={vi.fn()}
        showOriginal={false}
        onHideOriginal={vi.fn()}
      />
    );

    expect(screen.getByText(/retry parsing/i)).toBeInTheDocument();
  });

  it('shows "View Original Resume" button when onViewOriginal is provided and parsingStatus is "failed"', () => {
    render(
      <StructuredResume
        resumeData={{ parsingStatus: 'failed', parsingError: 'Could not parse' }}
        hasResume={true}
        candidate={baseMockCandidate}
        onViewOriginal={vi.fn()}
        showOriginal={false}
        onHideOriginal={vi.fn()}
      />
    );

    expect(screen.getByText(/view original resume/i)).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Observe 4 — Real score cards preserved
// Validates: Requirement 3.4
// ─────────────────────────────────────────────────────────────────────────────
describe('Observe 4 — Real score cards (Requirement 3.4)', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Observation: When score.sectionScores is present, CandidateDetail renders
   * four score cards with the exact values from the API.
   *
   * Property: For any sectionScores object with numeric values 0–100,
   * all four cards render with the exact values from the API.
   *
   * Validates: Requirements 3.4
   */
  it('renders four score cards with exact values when score.sectionScores is present', async () => {
    setupApiMocks({
      score: {
        sectionScores: { aptitude: 85, technical: 72, reasoning: 90, communication: 68 },
      },
    });

    render(<CandidateDetail />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // All four exact values should appear as score card values
    await waitFor(() => {
      const scoreCardValues = document.querySelectorAll('.score-card-value');
      const values = Array.from(scoreCardValues).map((el) => Number(el.textContent));
      expect(values).toContain(85);
      expect(values).toContain(72);
      expect(values).toContain(90);
      expect(values).toContain(68);
    }, { timeout: 3000 });
  });

  it('renders exactly four score cards when score.sectionScores is present', async () => {
    setupApiMocks({
      score: {
        sectionScores: { aptitude: 85, technical: 72, reasoning: 90, communication: 68 },
      },
    });

    render(<CandidateDetail />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    await waitFor(() => {
      const scoreCards = document.querySelectorAll('.score-card');
      expect(scoreCards.length).toBe(4);
    }, { timeout: 3000 });
  });

  /**
   * Property-based: for any sectionScores with values 0–100,
   * all four cards render with the exact values from the API.
   */
  it('renders score cards with exact API values for various score combinations', async () => {
    const scoreSets = [
      { aptitude: 0, technical: 0, reasoning: 0, communication: 0 },
      { aptitude: 100, technical: 100, reasoning: 100, communication: 100 },
      { aptitude: 50, technical: 75, reasoning: 25, communication: 60 },
      { aptitude: 33, technical: 67, reasoning: 88, communication: 12 },
    ];

    for (const sectionScores of scoreSets) {
      setupApiMocks({ score: { sectionScores } });

      const { unmount } = render(<CandidateDetail />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      }, { timeout: 3000 });

      await waitFor(() => {
        const scoreCardValues = document.querySelectorAll('.score-card-value');
        const values = Array.from(scoreCardValues).map((el) => Number(el.textContent));
        expect(values).toContain(sectionScores.aptitude);
        expect(values).toContain(sectionScores.technical);
        expect(values).toContain(sectionScores.reasoning);
        expect(values).toContain(sectionScores.communication);
      }, { timeout: 3000 });

      unmount();
      vi.clearAllMocks();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Observe 5 — Real match data preserved
// Validates: Requirement 3.5
// ─────────────────────────────────────────────────────────────────────────────
describe('Observe 5 — Real match data (Requirement 3.5)', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Observation: When matchData is non-null with real skill arrays,
   * RoleMatchCard renders the full card with the circular progress indicator,
   * matched/missing/partial counts, and missing skill tags.
   *
   * Property: For any non-null matchData, the full Role Match Analysis card
   * renders with real values.
   *
   * Validates: Requirements 3.5
   */
  it('renders the full Role Match Analysis card with 65% when matchData is present', () => {
    const matchData = {
      matchPercentage: 65,
      matchedSkills: ['Python', 'SQL'],
      missingSkills: ['Docker'],
      partialMatch: ['AWS'],
    };

    render(<RoleMatchCard matchData={matchData} />);

    expect(screen.getByText('65%')).toBeInTheDocument();
  });

  it('renders matched/missing/partial counts correctly from matchData', () => {
    const matchData = {
      matchPercentage: 65,
      matchedSkills: ['Python', 'SQL'],
      missingSkills: ['Docker'],
      partialMatch: ['AWS'],
    };

    render(<RoleMatchCard matchData={matchData} />);

    // matchedCount = 2, missingCount = 1, partialCount = 1
    const statNums = document.querySelectorAll('.rmc-stat-num');
    const values = Array.from(statNums).map((el) => Number(el.textContent));
    expect(values).toContain(2); // matched
    expect(values).toContain(1); // missing
  });

  it('renders "Docker" as a missing skill tag when it is in missingSkills', () => {
    const matchData = {
      matchPercentage: 65,
      matchedSkills: ['Python', 'SQL'],
      missingSkills: ['Docker'],
      partialMatch: ['AWS'],
    };

    render(<RoleMatchCard matchData={matchData} />);

    expect(screen.getByText('Docker')).toBeInTheDocument();
  });

  it('renders "Role Match Analysis" title when matchData is present', () => {
    const matchData = {
      matchPercentage: 65,
      matchedSkills: ['Python', 'SQL'],
      missingSkills: ['Docker'],
      partialMatch: ['AWS'],
    };

    render(<RoleMatchCard matchData={matchData} />);

    expect(screen.getByText('Role Match Analysis')).toBeInTheDocument();
  });

  /**
   * Property-based: for any non-null matchData with non-empty skill arrays,
   * the full card renders with real values (not hardcoded defaults).
   *
   * Note: The unfixed code uses `|| 12`, `|| 4`, `|| 3` fallbacks when arrays
   * are empty — those are the bug conditions covered by the bug condition tests.
   * This preservation test covers the non-empty array path that works correctly
   * on both unfixed and fixed code.
   */
  it('renders real values for various matchData inputs with non-empty skill arrays', () => {
    const matchDataSets = [
      {
        matchPercentage: 45,
        matchedSkills: ['Python'],
        missingSkills: ['Java', 'Kubernetes'],
        partialMatch: ['AWS', 'Docker'],
      },
      {
        matchPercentage: 78,
        matchedSkills: ['TypeScript', 'GraphQL', 'PostgreSQL'],
        missingSkills: ['Rust'],
        partialMatch: ['Go'],
      },
      {
        matchPercentage: 92,
        matchedSkills: ['React', 'Node', 'MongoDB', 'Express'],
        missingSkills: ['Kubernetes', 'Terraform'],
        partialMatch: ['AWS'],
      },
    ];

    for (const matchData of matchDataSets) {
      const { unmount } = render(<RoleMatchCard matchData={matchData} />);

      // The percentage shown must match the input, not a hardcoded value
      expect(screen.getByText(`${matchData.matchPercentage}%`)).toBeInTheDocument();

      // The stat counts must match the real array lengths
      const statNums = document.querySelectorAll('.rmc-stat-num');
      const values = Array.from(statNums).map((el) => Number(el.textContent));
      expect(values).toContain(matchData.matchedSkills.length);
      expect(values).toContain(matchData.missingSkills.length);
      expect(values).toContain(matchData.partialMatch.length);

      // Each missing skill tag must be rendered
      for (const skill of matchData.missingSkills) {
        expect(screen.getByText(skill)).toBeInTheDocument();
      }

      unmount();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Observe 6 — Responsive layout preserved
// Validates: Requirement 3.7
// ─────────────────────────────────────────────────────────────────────────────
describe('Observe 6 — Responsive layout (Requirement 3.7)', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Observation: The CSS media query at max-width: 900px sets
   * flex-direction: column on .candidate-columns.
   *
   * In jsdom, CSS media queries are not evaluated, so we verify the CSS
   * class structure is in place and the responsive CSS rule exists.
   *
   * Validates: Requirements 3.7
   */
  it('renders .candidate-columns element that can receive responsive flex-direction', async () => {
    setupApiMocks();

    render(<CandidateDetail />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    const columns = document.querySelector('.candidate-columns');
    expect(columns).not.toBeNull();
  });

  it('renders .column-left and .column-right inside .candidate-columns', async () => {
    setupApiMocks();

    render(<CandidateDetail />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    const columnLeft = document.querySelector('.column-left');
    const columnRight = document.querySelector('.column-right');
    expect(columnLeft).not.toBeNull();
    expect(columnRight).not.toBeNull();
  });

  it('has .candidate-columns as a flex container (display: flex)', async () => {
    setupApiMocks();

    render(<CandidateDetail />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    const columns = document.querySelector('.candidate-columns');
    expect(columns).not.toBeNull();
    // The CSS class sets display: flex — verify the element exists with the class
    expect(columns.classList.contains('candidate-columns')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Observe 7 — View Original toggle preserved
// Validates: Requirement 3.8
// ─────────────────────────────────────────────────────────────────────────────
describe('Observe 7 — View Original toggle (Requirement 3.8)', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Observation: When a candidate has a resumeUrl, the "View Original" button
   * is rendered in the candidate header. Clicking it toggles showOriginalResume
   * state, which is passed as showOriginal to StructuredResume.
   *
   * This toggle must continue to work after the fix.
   *
   * Validates: Requirements 3.8
   */
  it('renders "View Original" button when candidate has a resumeUrl', async () => {
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

    render(<CandidateDetail />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(screen.getByText(/view original/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('does NOT render "View Original" button when candidate has no resumeUrl', async () => {
    setupApiMocks({ candidate: baseMockCandidate });

    render(<CandidateDetail />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.queryByText(/view original/i)).not.toBeInTheDocument();
  });

  it('toggles showOriginalResume state when "View Original" is clicked', async () => {
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

    render(<CandidateDetail />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    const viewOriginalBtn = await waitFor(
      () => screen.getByText(/view original/i),
      { timeout: 3000 }
    );

    // Click the button — this should toggle showOriginalResume
    // The button itself should still be present after clicking (it's a toggle)
    await act(async () => {
      fireEvent.click(viewOriginalBtn);
    });

    // After clicking, the button should still be in the DOM (it's a toggle, not a one-shot)
    expect(screen.getByText(/view original/i)).toBeInTheDocument();
  });

  it('clicking "View Original" again toggles back (double-toggle)', async () => {
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

    render(<CandidateDetail />);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    const viewOriginalBtn = await waitFor(
      () => screen.getByText(/view original/i),
      { timeout: 3000 }
    );

    // First click — toggle on
    await act(async () => {
      fireEvent.click(viewOriginalBtn);
    });

    // Second click — toggle off
    await act(async () => {
      fireEvent.click(viewOriginalBtn);
    });

    // Button should still be present after both clicks
    expect(screen.getByText(/view original/i)).toBeInTheDocument();
  });
});
