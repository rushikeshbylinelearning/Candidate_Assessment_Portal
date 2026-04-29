# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Hardcoded Data Display Bugs
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bugs exist
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate all six bugs exist
  - **Scoped PBT Approach**: Scope the property to the concrete failing cases for each bug to ensure reproducibility
  - Test 1 (Bug 1 — Hardcoded strengths/weaknesses): Render `CandidateDetail` with a mocked candidate that has 2 interview logs containing `strengths: ["Good communicator"]` and `weaknesses: ["Needs testing experience"]`. Assert that the displayed strengths equal `["Good communicator"]` and weaknesses equal `["Needs testing experience"]`, NOT the hardcoded defaults `['Strong problem-solving skills', 'Excellent communication', 'Quick learner']` / `['Limited system design experience', 'Needs improvement in testing']`
  - Test 2 (Bug 2 — Hardcoded role match): Render `RoleMatchCard` with `matchData={null}`. Assert that the rendered output does NOT contain "78%" and does NOT contain "JavaScript", "React", "Node", or "MongoDB". Assert it shows an empty state message instead
  - Test 3 (Bug 3 — Fake default scores): Render `CandidateDetail` with `score=null`. Assert that no score card shows "100" for aptitude. Assert a single placeholder card is shown with "No assessment taken yet" text
  - Test 4 (Bug 4 — Spinner forever): Render `StructuredResume` with `resumeData={null}` and `hasResume={false}`. Assert that no loading spinner is rendered. Assert "No resume uploaded" text is present
  - Test 5 (Bug 5 — Non-functional download): Render `CandidateDetail` with a candidate having `resumeUrl="/uploads/resumes/test.pdf"`. Mock `window.open`. Click the Download Resume button. Assert `window.open` was called with a URL containing `/uploads/resumes/test.pdf`
  - Test 6 (Bug 6 — Layout): Render `CandidateDetail` and assert `.resume-panel-scroll` wrapper exists around the `StructuredResume` component and download button. Assert `.candidate-header-card` has `flex-shrink: 0` applied
  - Run all tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests FAIL (this is correct — it proves the bugs exist)
  - Document counterexamples found (e.g., "strengths shows 'Strong problem-solving skills' instead of 'Good communicator'", "RoleMatchCard renders 78% when matchData is null")
  - Mark task complete when tests are written, run, and failures are documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 3.1, 3.2, 4.1, 5.1, 5.2, 6.1, 6.2_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing Loading, Error, and Interaction States
  - **IMPORTANT**: Follow observation-first methodology — observe behavior on UNFIXED code first, then write tests
  - Observe 1 (Loading spinner): Render `StructuredResume` with `resumeData={null}` and `hasResume={true}` (candidate has a resumeUrl). Confirm the loading spinner IS rendered on unfixed code. Write property-based test: for all inputs where `hasResume=true` and `resumeData=null`, the loading spinner is shown
  - Observe 2 (Processing state): Render `StructuredResume` with `resumeData={{ parsingStatus: 'processing' }}`. Confirm "Processing Resume..." text is shown. Write test asserting this state is preserved
  - Observe 3 (Parse-failed state): Render `StructuredResume` with `resumeData={{ parsingStatus: 'failed', parsingError: 'Could not parse' }}`. Confirm the error state with retry button is shown. Write test asserting this state is preserved
  - Observe 4 (Real score cards): Render `CandidateDetail` with `score={{ sectionScores: { aptitude: 85, technical: 72, reasoning: 90, communication: 68 } }}`. Confirm four score cards with those exact values are shown. Write property-based test: for any `sectionScores` object with numeric values 0–100, all four cards render with the exact values from the API
  - Observe 5 (Real match data): Render `RoleMatchCard` with `matchData={{ matchPercentage: 65, matchedSkills: ['Python', 'SQL'], missingSkills: ['Docker'], partialMatch: ['AWS'] }}`. Confirm the full card renders with 65%, counts 2/1/1, and "Docker" tag. Write property-based test: for any non-null `matchData`, the full Role Match Analysis card renders with real values
  - Observe 6 (Responsive layout): Render `CandidateDetail` at viewport width < 900px. Confirm stacked layout is applied (`.candidate-columns` has `flex-direction: column`). Write test asserting this continues after fix
  - Observe 7 (View Original toggle): Render `CandidateDetail` with a candidate having `resumeUrl` set. Confirm clicking "View Original" toggles `showOriginalResume` state. Write test asserting this toggle continues to work
  - Run all preservation tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 3. Fix all six hardcoded-data bugs

  - [x] 3.1 Bug 1 — Initialize strengths/weaknesses from interview logs (CandidateDetail.jsx)
    - Change `useState(['Strong problem-solving skills', ...])` to `useState([])`
    - Change `useState(['Limited system design experience', ...])` to `useState([])`
    - After `fetchAll` resolves and `l.data` (logs) is available, aggregate: `const allStrengths = l.data.flatMap(log => log.strengths || []); setStrengths([...new Set(allStrengths)]);`
    - Do the same for weaknesses: `const allWeaknesses = l.data.flatMap(log => log.weaknesses || []); setWeaknesses([...new Set(allWeaknesses)]);`
    - Wire `addStrength` to persist via `PATCH /api/candidates/:id` (or notes endpoint) so additions survive page reload
    - Wire `addWeakness` similarly
    - When `strengths` array is empty, render "No strengths recorded yet" empty state instead of the add-input box alone
    - When `weaknesses` array is empty, render "No weaknesses recorded yet" empty state
    - _Bug_Condition: `isBugCondition(input)` where `input.pageState.strengths === HARDCODED_STRENGTHS_ARRAY`_
    - _Expected_Behavior: `strengths` and `weaknesses` populated from `logs.flatMap(log => log.strengths || [])` deduplicated with `Set`; empty state shown when no logs_
    - _Preservation: Interview note drawer continues to save notes and refresh logs list, which in turn updates aggregated strengths/weaknesses_
    - _Requirements: 2.1, 2.2, 2.3, 3.6_

  - [x] 3.2 Bug 2 — Remove hardcoded fallbacks from RoleMatchCard (RoleMatchCard.jsx)
    - Add early return at top of component: `if (!matchData) { return <div className="rmc-card rmc-empty">...</div>; }` with FileText icon and message "No resume uploaded yet. Upload a resume to see role match analysis."
    - Change `matchData?.matchPercentage ?? 78` to `matchData?.matchPercentage ?? 0`
    - Change `matchData?.missingSkills ?? ['JavaScript', 'React', 'Node', 'MongoDB']` to `matchData?.missingSkills || []`
    - Change `matchedSkills.length || 12` to `matchedSkills.length`
    - Change `missingSkills.length || 4` to `missingSkills.length`
    - Change `partialMatch.length || 3` to `partialMatch.length`
    - _Bug_Condition: `isBugCondition(input)` where `input.pageState.matchData === null AND input.pageState.displayedMatchPercentage === 78`_
    - _Expected_Behavior: empty state card rendered when `matchData` is null; real zeros shown when arrays are empty_
    - _Preservation: Full Role Match Analysis card with circular progress, skill counts, and missing skill tags continues to render when `matchData` is present with real skill arrays_
    - _Requirements: 2.4, 2.5, 2.6, 3.5_

  - [x] 3.3 Bug 3 — Remove fake default scores (CandidateDetail.jsx)
    - Delete `const defaultScores = { aptitude: 100, technical: 0, reasoning: 0, communication: 0 };`
    - Delete `const displayScores = score?.sectionScores || defaultScores;`
    - Replace the score cards `Object.entries(displayScores).map(...)` block with a conditional:
      - If `score === null || !score?.sectionScores`: render a single `<div className="score-card-placeholder">` with message "No assessment taken yet. Scores will appear here once the candidate completes their assessment."
      - If `score?.sectionScores` is present: render `Object.entries(score.sectionScores).map(...)` with real values
    - _Bug_Condition: `isBugCondition(input)` where `input.pageState.score === null AND input.pageState.displayedScores === { aptitude: 100, ... }`_
    - _Expected_Behavior: single placeholder card shown when `score` is null; four real score cards shown when `score.sectionScores` is present_
    - _Preservation: Four score cards with real values continue to render when `score.sectionScores` is present_
    - _Requirements: 3.1, 3.2, 3.4_

  - [x] 3.4 Bug 4 — Add hasResume prop to distinguish loading vs no-resume (StructuredResume.jsx + CandidateDetail.jsx)
    - In `StructuredResume.jsx`: add `hasResume` to function parameters: `export default function StructuredResume({ resumeData, candidate, onViewOriginal, showOriginal, onHideOriginal, hasResume })`
    - Replace the first `if (!resumeData)` block with two separate checks:
      - `if (!resumeData && !hasResume)`: render empty state with FileText icon, title "No resume uploaded", sub "Upload a resume to see structured data."
      - `if (!resumeData && hasResume)`: render the existing loading spinner JSX (unchanged)
    - In `CandidateDetail.jsx`: pass `hasResume={!!candidate.resumeUrl}` prop to `<StructuredResume />`
    - In `CandidateDetail.jsx` `fetchAll`: the resume API call is already gated on `if (c.data.resumeUrl)` — confirm this gate is in place and not removed
    - _Bug_Condition: `isBugCondition(input)` where `input.pageState.candidate.resumeUrl === null AND input.pageState.resumeComponentState === 'loading'`_
    - _Expected_Behavior: "No resume uploaded" empty state shown when `!resumeData && !hasResume`; loading spinner shown when `!resumeData && hasResume`_
    - _Preservation: Loading spinner continues when `resumeUrl` is not null and `resumeData` is null; "Processing Resume..." and parse-failed states unchanged_
    - _Requirements: 4.1, 4.2, 4.3, 3.1, 3.2, 3.3_

  - [x] 3.5 Bug 5 — Wire download button onClick (CandidateDetail.jsx)
    - Add `onClick` handler to `.download-resume-btn`:
      ```javascript
      onClick={() => {
        if (candidate.resumeUrl) {
          const url = candidate.resumeUrl.startsWith('http')
            ? candidate.resumeUrl
            : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${candidate.resumeUrl}`;
          window.open(url, '_blank');
        }
      }}
      ```
    - Add `disabled={!candidate.resumeUrl}` attribute to the button
    - Change button label to `{candidate.resumeUrl ? 'Download Resume' : 'No Resume'}` conditionally
    - Add `style={{ opacity: candidate.resumeUrl ? 1 : 0.5, cursor: candidate.resumeUrl ? 'pointer' : 'not-allowed' }}` when no resume
    - _Bug_Condition: `isBugCondition(input)` where `input.pageState.downloadButtonClicked === true AND input.pageState.downloadAction === 'none'`_
    - _Expected_Behavior: `window.open` called with full URL (prepend `VITE_API_URL` if relative) when `resumeUrl` is present; button disabled with "No Resume" label when `resumeUrl` is null_
    - _Preservation: "View Original" toggle continues to work when candidate has a `resumeUrl`_
    - _Requirements: 5.1, 5.2, 5.3, 3.8_

  - [x] 3.6 Bug 6 — Fix left panel layout for independent scrolling (CandidateDetail.css + CandidateDetail.jsx)
    - In `CandidateDetail.css`, update `.candidate-detail-page`: ensure `height: 100vh; overflow: hidden; display: flex; flex-direction: column`
    - Update `.candidate-columns`: ensure `display: flex; flex: 1; overflow: hidden; min-height: 0`
    - Update `.column-left`: ensure `display: flex; flex-direction: column; overflow: hidden; height: 100%`
    - Update `.candidate-header-card`: add `flex-shrink: 0`
    - Add new class `.resume-panel-scroll`: `flex: 1; overflow-y: auto; overflow-x: hidden; min-height: 0`
    - Update `.column-right`: ensure `flex: 1; height: 100%; overflow-y: auto; overflow-x: hidden; min-height: 0`
    - Update `.sr-nav` in `StructuredResume.css` (or via CandidateDetail.css override): add `position: sticky; top: 0; z-index: 10; background: var(--card)`
    - In `CandidateDetail.jsx`: wrap `<StructuredResume />` and the `<div className="resume-download-row">` in `<div className="resume-panel-scroll">` inside the left panel
    - Remove the intermediate `<div className="resume-panel">` wrapper if it conflicts, or ensure it passes flex layout through correctly
    - _Bug_Condition: `isBugCondition(input)` where `input.pageState.resumeContentHeight > input.pageState.panelHeight AND input.pageState.candidateHeaderScrolledOutOfView === true`_
    - _Expected_Behavior: `.resume-panel-scroll` scrolls independently; `.candidate-header-card` stays fixed; `.sr-nav` stays sticky; right panel scrolls independently_
    - _Preservation: Responsive stacked layout (< 900px) continues to apply; both panels scroll normally in stacked mode_
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 3.7_

  - [x] 3.7 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Hardcoded Data Display Bugs
    - **IMPORTANT**: Re-run the SAME tests from task 1 — do NOT write new tests
    - The tests from task 1 encode the expected behavior for all six bugs
    - When these tests pass, it confirms the expected behavior is satisfied
    - Run all six bug condition tests from step 1
    - **EXPECTED OUTCOME**: All six tests PASS (confirms all bugs are fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4_

  - [x] 3.8 Verify preservation tests still pass
    - **Property 2: Preservation** - Existing Loading, Error, and Interaction States
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run all preservation property tests from step 2
    - **EXPECTED OUTCOME**: All preservation tests PASS (confirms no regressions)
    - Confirm loading spinner, processing state, parse-failed state, real score cards, real match data, responsive layout, and View Original toggle all behave identically to pre-fix observations

- [x] 4. Checkpoint — Ensure all tests pass
  - Run the full test suite for the frontend
  - Confirm all six bug condition tests pass (task 3.7)
  - Confirm all preservation tests pass (task 3.8)
  - Manually verify pass criteria in the browser:
    - Candidate with no resume: left panel shows "No resume uploaded", RoleMatchCard shows empty state, download button disabled with "No Resume" label
    - Candidate with no assessment: score section shows "No assessment taken yet" placeholder
    - Candidate with no notes: strengths/weaknesses shows empty state messages
    - Candidate with resume + assessment + notes: all real data displayed correctly
    - Left panel: header fixed, resume scrolls independently, right panel scrolls independently
  - Confirm no hardcoded values remain: no `?? 78`, no `|| 12`, no `|| 4`, no `|| 3`, no `?? ['JavaScript', 'React', 'Node', 'MongoDB']`, no `aptitude: 100`, no `'Strong problem-solving skills'`, no `'Limited system design experience'`
  - Ask the user if any questions arise
