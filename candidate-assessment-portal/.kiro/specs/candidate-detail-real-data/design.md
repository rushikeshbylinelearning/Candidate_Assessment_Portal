# Candidate Detail Real Data Bugfix Design

## Overview

The Candidate Detail page displays hardcoded placeholder data across six distinct areas: strengths/weaknesses, role match analysis, assessment score cards, resume loading state, resume download button, and left panel layout. This design document formalizes the bug conditions for each area and outlines the fix implementation strategy. The approach is to replace all hardcoded defaults with real data from the database, render appropriate empty states when data is absent, and fix the layout to enable independent scrolling in the left panel.

## Glossary

- **Bug_Condition (C)**: The condition that triggers each bug - when hardcoded data is displayed instead of real data, or when UI behavior does not match the design specification
- **Property (P)**: The desired behavior - display real data from the database, show empty states when data is absent, enable functional interactions
- **Preservation**: Existing loading states, error states, and responsive behavior that must remain unchanged by the fix
- **CandidateDetail.jsx**: The main page component in `frontend/src/pages/hr/CandidateDetail.jsx` that orchestrates data fetching and rendering
- **RoleMatchCard.jsx**: The component in `frontend/src/components/resume/RoleMatchCard.jsx` that displays role match analysis
- **StructuredResume.jsx**: The component in `frontend/src/components/resume/StructuredResume.jsx` that displays parsed resume data
- **InterviewLog**: The MongoDB model in `backend/src/modules/notes/interviewLog.model.js` that stores interview notes with strengths and weaknesses arrays
- **ResumeData**: The MongoDB model in `backend/src/modules/resume/resume.model.js` that stores parsed resume data
- **matchData**: The object returned by `GET /api/resume/:candidateId/match/:roleId` containing `matchPercentage`, `matchedSkills`, `missingSkills`, and `partialMatch`
- **score**: The object returned by `GET /api/responses/score/:candidateId` containing `sectionScores` with aptitude, technical, reasoning, and communication values

## Bug Details

### Bug Condition

The bugs manifest when the Candidate Detail page is rendered with any candidate. The page displays hardcoded data in six distinct areas regardless of the actual candidate's data state.

**Formal Specification:**

```
FUNCTION isBugCondition(input)
  INPUT: input of type { candidateId: string, pageState: object }
  OUTPUT: boolean
  
  RETURN (
    // Bug 1: Hardcoded strengths/weaknesses
    (input.pageState.strengths === HARDCODED_STRENGTHS_ARRAY
     AND input.pageState.weaknesses === HARDCODED_WEAKNESSES_ARRAY)
    
    OR
    
    // Bug 2: Hardcoded role match data
    (input.pageState.matchData === null
     AND input.pageState.displayedMatchPercentage === 78
     AND input.pageState.displayedMissingSkills === ['JavaScript', 'React', 'Node', 'MongoDB'])
    
    OR
    
    // Bug 3: Fake default scores
    (input.pageState.score === null
     AND input.pageState.displayedScores === { aptitude: 100, technical: 0, reasoning: 0, communication: 0 })
    
    OR
    
    // Bug 4: Spinner forever when no resume
    (input.pageState.candidate.resumeUrl === null
     AND input.pageState.resumeData === null
     AND input.pageState.resumeComponentState === 'loading')
    
    OR
    
    // Bug 5: Non-functional download button
    (input.pageState.downloadButtonClicked === true
     AND input.pageState.downloadAction === 'none')
    
    OR
    
    // Bug 6: Left panel scrolls with page
    (input.pageState.resumeContentHeight > input.pageState.panelHeight
     AND input.pageState.candidateHeaderScrolledOutOfView === true)
  )
END FUNCTION
```

### Examples

**Bug 1 — Hardcoded strengths and weaknesses:**
- **Input:** Open candidate detail page for candidate with ID "abc123" who has 2 interview logs with strengths ["Good communicator", "Fast learner"] and weaknesses ["Needs more testing experience"]
- **Expected:** Display aggregated strengths and weaknesses from the 2 interview logs
- **Actual:** Display hardcoded strengths ['Strong problem-solving skills', 'Excellent communication', 'Quick learner'] and weaknesses ['Limited system design experience', 'Needs improvement in testing']

**Bug 2 — Hardcoded role match data:**
- **Input:** Open candidate detail page for candidate with no resume uploaded (resumeUrl is null)
- **Expected:** Display empty state card with message "No resume uploaded yet. Upload a resume to see role match analysis."
- **Actual:** Display Role Match Analysis card with 78% match percentage and missing skills ['JavaScript', 'React', 'Node', 'MongoDB']

**Bug 3 — Fake default scores:**
- **Input:** Open candidate detail page for candidate who has not taken any assessment (score is null)
- **Expected:** Display single placeholder card with message "No assessment taken yet. Scores will appear here once the candidate completes their assessment."
- **Actual:** Display four score cards with aptitude: 100, technical: 0, reasoning: 0, communication: 0

**Bug 4 — Spinner forever when no resume:**
- **Input:** Open candidate detail page for candidate with no resume (resumeUrl is null)
- **Expected:** Display "No resume uploaded" empty state with FileText icon
- **Actual:** Display loading spinner that never resolves

**Bug 5 — Non-functional download button:**
- **Input:** Click "Download Resume" button for candidate with resumeUrl = "/uploads/resumes/john-doe-resume.pdf"
- **Expected:** Open resume file in new browser tab at "http://localhost:5000/uploads/resumes/john-doe-resume.pdf"
- **Actual:** Nothing happens (no action)

**Bug 6 — Left panel layout:**
- **Input:** Open candidate detail page with resume content taller than viewport, scroll down in left panel
- **Expected:** Resume content scrolls independently, candidate header card stays fixed at top of left panel
- **Actual:** Candidate header card scrolls out of view with the resume content

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Loading spinner must continue to display when `resumeData` is null and `candidate.resumeUrl` is not null (resume is being fetched)
- "Processing Resume..." state must continue to display when `resumeData.parsingStatus === 'processing'`
- Parse-failed error state with retry option must continue to display when `resumeData.parsingStatus === 'failed'`
- Four score cards with real values must continue to render when `score.sectionScores` is present
- Full Role Match Analysis card with circular progress, skill counts, and missing skill tags must continue to render when `matchData` is present with real skill arrays
- Interview note drawer must continue to save notes and refresh the logs list
- Responsive stacked layout (left panel above right panel) must continue to apply when viewport is narrower than 900px
- "View Original" toggle must continue to work when candidate has a `resumeUrl`

**Scope:**
All inputs that do NOT involve the six bug conditions should be completely unaffected by this fix. This includes:
- Existing loading states for resume data
- Existing error states for resume parsing
- Existing interview note creation and display
- Existing responsive layout behavior
- Existing "View Original" resume toggle

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

1. **Hardcoded State Initialization**: The `CandidateDetail.jsx` component initializes `strengths` and `weaknesses` state with hardcoded arrays instead of empty arrays, and does not aggregate data from interview logs

2. **Fallback Defaults in RoleMatchCard**: The `RoleMatchCard.jsx` component uses nullish coalescing (`??`) and logical OR (`||`) operators to provide fake fallback values (78%, ['JavaScript', 'React', 'Node', 'MongoDB'], 12, 4, 3) when `matchData` is null or properties are missing

3. **Fake Default Scores Object**: The `CandidateDetail.jsx` component creates a `defaultScores` object with `{ aptitude: 100, technical: 0, reasoning: 0, communication: 0 }` and uses it when `score` is null, rendering misleading score cards

4. **Missing hasResume Prop**: The `StructuredResume.jsx` component does not receive a `hasResume` boolean prop to distinguish between "loading" (resume exists but not yet fetched) and "no resume" (resume does not exist) states

5. **No onClick Handler**: The download button in `CandidateDetail.jsx` has no `onClick` handler wired to open the resume URL

6. **Missing CSS Layout Rules**: The `CandidateDetail.css` file does not have the necessary flexbox and overflow rules to enable independent scrolling in the left panel with a fixed header

## Correctness Properties

Property 1: Bug Condition - Real Data Display

_For any_ candidate detail page load where the candidate has interview logs, resume data, or assessment scores, the fixed page SHALL display the real data from the database instead of hardcoded placeholder values, and SHALL display appropriate empty states when data is absent.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4**

Property 2: Preservation - Existing States and Behaviors

_For any_ candidate detail page load where the candidate has a resume being fetched, a resume being parsed, or a resume parse failure, the fixed page SHALL produce exactly the same loading, processing, and error states as the original code, preserving all existing functionality for these scenarios.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `frontend/src/pages/hr/CandidateDetail.jsx`

**Function**: `CandidateDetail` component

**Specific Changes**:

1. **Initialize strengths/weaknesses as empty arrays**:
   - Change `const [strengths, setStrengths] = useState([...])` to `const [strengths, setStrengths] = useState([])`
   - Change `const [weaknesses, setWeaknesses] = useState([...])` to `const [weaknesses, setWeaknesses] = useState([])`

2. **Aggregate strengths/weaknesses from logs**:
   - In `fetchAll` or `useEffect`, after fetching logs, aggregate:
     ```javascript
     const allStrengths = logs.flatMap(log => log.strengths || []);
     const allWeaknesses = logs.flatMap(log => log.weaknesses || []);
     setStrengths([...new Set(allStrengths)]);
     setWeaknesses([...new Set(allWeaknesses)]);
     ```

3. **Add persistence for strengths/weaknesses**:
   - Wire `addStrength` and `addWeakness` to call `PATCH /api/candidates/:id` or a notes endpoint to persist additions

4. **Remove defaultScores object**:
   - Delete the line `const defaultScores = { aptitude: 100, technical: 0, reasoning: 0, communication: 0 };`
   - Change `const displayScores = score?.sectionScores || defaultScores;` to conditional rendering

5. **Conditionally render score cards or empty state**:
   - If `score === null`, render a single placeholder card with message "No assessment taken yet..."
   - If `score !== null`, render the four score cards with `score.sectionScores`

6. **Pass hasResume prop to StructuredResume**:
   - Add `hasResume={!!candidate.resumeUrl}` prop when rendering `<StructuredResume />`

7. **Gate resume API fetch**:
   - In `fetchAll`, only call `api.get(\`/resume/${id}\`)` if `c.data.resumeUrl` is not null

8. **Wire download button onClick**:
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

9. **Disable download button when no resume**:
   - Add `disabled={!candidate.resumeUrl}` attribute
   - Change button text to "No Resume" when `!candidate.resumeUrl`

10. **Wrap StructuredResume in scrollable container**:
    - Wrap `<StructuredResume />` and download button in a `<div className="resume-panel-scroll">` div

**File**: `frontend/src/components/resume/RoleMatchCard.jsx`

**Function**: `RoleMatchCard` component

**Specific Changes**:

1. **Remove all fallback defaults**:
   - Change `const percentage = matchData?.matchPercentage ?? 78;` to `const percentage = matchData?.matchPercentage ?? 0;`
   - Change `const matchedSkills = matchData?.matchedSkills ?? [];` to `const matchedSkills = matchData?.matchedSkills || [];`
   - Change `const missingSkills = matchData?.missingSkills ?? ['JavaScript', 'React', 'Node', 'MongoDB'];` to `const missingSkills = matchData?.missingSkills || [];`
   - Change `const matchedCount = matchedSkills.length || 12;` to `const matchedCount = matchedSkills.length;`
   - Change `const missingCount = missingSkills.length || 4;` to `const missingCount = missingSkills.length;`
   - Change `const partialCount = partialMatch.length || 3;` to `const partialCount = partialMatch.length;`

2. **Render empty state when matchData is null**:
   - Add conditional at top of component:
     ```javascript
     if (!matchData) {
       return (
         <div className="rmc-card rmc-empty">
           <FileText size={36} color="#D1D5DB" />
           <p className="rmc-empty-title">No resume uploaded yet</p>
           <p className="rmc-empty-sub">Upload a resume to see role match analysis.</p>
         </div>
       );
     }
     ```

**File**: `frontend/src/components/resume/StructuredResume.jsx`

**Function**: `StructuredResume` component

**Specific Changes**:

1. **Add hasResume prop**:
   - Add `hasResume` to function parameters: `export default function StructuredResume({ resumeData, candidate, onViewOriginal, showOriginal, onHideOriginal, hasResume })`

2. **Distinguish loading from no-resume**:
   - Change the first `if (!resumeData)` block to:
     ```javascript
     if (!resumeData && !hasResume) {
       return (
         <div className="sr-layout">
           <nav className="sr-nav">...</nav>
           <div className="sr-content-area">
             <div className="sr-empty">
               <FileText size={36} color="#D1D5DB" />
               <p className="sr-empty-title">No resume uploaded</p>
               <p className="sr-empty-sub">Upload a resume to see structured data.</p>
             </div>
           </div>
         </div>
       );
     }
     
     if (!resumeData && hasResume) {
       return (
         // existing loading spinner JSX
       );
     }
     ```

**File**: `frontend/src/styles/CandidateDetail.css`

**Specific Changes**:

1. **Add height and overflow rules to page wrapper**:
   - Ensure `.candidate-detail-page` has `height: 100vh; overflow: hidden;`

2. **Add flex and overflow rules to columns container**:
   - Ensure `.candidate-columns` has `display: flex; overflow: hidden; min-height: 0;`

3. **Add flex-direction and overflow to left column**:
   - Ensure `.column-left` has `display: flex; flex-direction: column; overflow: hidden;`

4. **Make candidate header fixed**:
   - Ensure `.candidate-header-card` has `flex-shrink: 0;`

5. **Create scrollable resume panel**:
   - Add new class:
     ```css
     .resume-panel-scroll {
       flex: 1;
       overflow-y: auto;
       overflow-x: hidden;
     }
     ```

6. **Make resume nav sticky**:
   - Add to `.sr-nav`:
     ```css
     position: sticky;
     top: 0;
     background: white;
     z-index: 10;
     ```

7. **Ensure right column scrolls independently**:
   - Ensure `.column-right` has `overflow-y: auto;`

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bugs on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bugs BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that load the Candidate Detail page with various candidate data states and assert that the correct data is displayed. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:

1. **Hardcoded Strengths/Weaknesses Test**: Load candidate detail page for a candidate with 2 interview logs containing strengths ["Good communicator"] and weaknesses ["Needs testing experience"]. Assert that the displayed strengths and weaknesses match the logs, not the hardcoded defaults. (will fail on unfixed code)

2. **Null MatchData Test**: Load candidate detail page for a candidate with no resume (resumeUrl is null). Assert that the Role Match Analysis card displays an empty state message, not 78% and fake skill names. (will fail on unfixed code)

3. **Null Score Test**: Load candidate detail page for a candidate who has not taken an assessment (score is null). Assert that a single placeholder card is displayed, not four score cards with fake values. (will fail on unfixed code)

4. **No Resume Spinner Test**: Load candidate detail page for a candidate with no resume (resumeUrl is null). Assert that the StructuredResume component displays "No resume uploaded" empty state, not a loading spinner. (will fail on unfixed code)

5. **Download Button Click Test**: Simulate clicking the download button for a candidate with resumeUrl = "/uploads/resumes/test.pdf". Assert that `window.open` is called with the correct URL. (will fail on unfixed code)

6. **Left Panel Scroll Test**: Render candidate detail page with tall resume content. Simulate scrolling in the left panel. Assert that the candidate header card remains visible at the top. (will fail on unfixed code)

**Expected Counterexamples**:
- Hardcoded strengths and weaknesses are displayed instead of real data from logs
- 78% match percentage and fake skill names are displayed when matchData is null
- Four score cards with fake values are displayed when score is null
- Loading spinner is displayed forever when resumeUrl is null
- Download button does nothing when clicked
- Candidate header card scrolls out of view when resume content is scrolled

Possible causes: hardcoded state initialization, fallback defaults in components, missing props, missing event handlers, missing CSS layout rules

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := renderCandidateDetailPage_fixed(input)
  ASSERT expectedBehavior(result)
END FOR
```

**Expected Behavior:**
- Real strengths and weaknesses from logs are displayed
- Empty state is displayed when matchData is null
- Empty state is displayed when score is null
- "No resume uploaded" empty state is displayed when resumeUrl is null
- Download button opens resume URL in new tab when clicked
- Candidate header card remains fixed when resume content is scrolled

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT renderCandidateDetailPage_original(input) = renderCandidateDetailPage_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for loading states, error states, and existing interactions, then write property-based tests capturing that behavior.

**Test Cases**:

1. **Loading State Preservation**: Observe that when resumeUrl is not null and resumeData is null, the loading spinner is displayed. Write test to verify this continues after fix.

2. **Processing State Preservation**: Observe that when parsingStatus is 'processing', the "Processing Resume..." state is displayed. Write test to verify this continues after fix.

3. **Parse Failed State Preservation**: Observe that when parsingStatus is 'failed', the parse-failed error state with retry option is displayed. Write test to verify this continues after fix.

4. **Real Score Cards Preservation**: Observe that when score.sectionScores is present, four score cards with real values are displayed. Write test to verify this continues after fix.

5. **Real Match Data Preservation**: Observe that when matchData is present with real skill arrays, the full Role Match Analysis card is displayed. Write test to verify this continues after fix.

6. **Interview Note Creation Preservation**: Observe that when a user adds an interview note via the drawer, the note is saved and the logs list is refreshed. Write test to verify this continues after fix.

7. **Responsive Layout Preservation**: Observe that when viewport is narrower than 900px, the stacked layout is applied. Write test to verify this continues after fix.

8. **View Original Toggle Preservation**: Observe that when a candidate has a resumeUrl and the user clicks "View Original", the original resume view is toggled. Write test to verify this continues after fix.

### Unit Tests

- Test strengths/weaknesses aggregation from interview logs with various log counts (0, 1, 2, 5)
- Test strengths/weaknesses deduplication when multiple logs contain the same strength or weakness
- Test RoleMatchCard empty state rendering when matchData is null
- Test RoleMatchCard real data rendering when matchData is present with empty arrays
- Test score cards empty state rendering when score is null
- Test score cards real data rendering when score.sectionScores is present
- Test StructuredResume empty state rendering when hasResume is false and resumeData is null
- Test StructuredResume loading state rendering when hasResume is true and resumeData is null
- Test download button onClick handler with relative and absolute URLs
- Test download button disabled state when resumeUrl is null

### Property-Based Tests

- Generate random candidate data with varying numbers of interview logs (0-10) and verify strengths/weaknesses are correctly aggregated
- Generate random matchData objects with varying skill array lengths (0-20) and verify RoleMatchCard displays correct counts
- Generate random score objects with varying sectionScores values (0-100) and verify score cards display correct values
- Generate random candidate objects with varying resumeUrl states (null, relative path, absolute URL) and verify download button behavior
- Generate random resume content heights and verify left panel scrolling behavior

### Integration Tests

- Test full candidate detail page load with a candidate who has interview logs, resume, and assessment scores
- Test full candidate detail page load with a candidate who has no interview logs, no resume, and no assessment scores
- Test adding a strength or weakness and verifying it persists after page reload
- Test clicking download button and verifying resume opens in new tab
- Test scrolling left panel and verifying candidate header remains fixed
- Test scrolling right panel and verifying left panel is unaffected
- Test responsive layout by resizing viewport below 900px and verifying stacked layout
