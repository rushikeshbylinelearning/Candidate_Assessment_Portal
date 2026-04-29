# Bugfix Requirements Document

## Introduction

The Candidate Detail page (`CandidateDetail.jsx`) and its child components (`RoleMatchCard.jsx`, `StructuredResume.jsx`) display hardcoded placeholder data instead of real data fetched from the database. This affects five distinct areas: strengths/weaknesses, role match analysis, assessment score cards, the resume loading state, and the resume download button. A sixth bug causes the left panel layout to scroll incorrectly. Together these bugs mean HR users see fake numbers and dummy text regardless of which candidate they view, making the page unreliable for evaluation decisions.

---

## Bug Analysis

### Current Behavior (Defect)

**Bug 1 — Hardcoded strengths and weaknesses**

1.1 WHEN any candidate detail page is opened THEN the system displays hardcoded strengths ('Strong problem-solving skills', 'Excellent communication', 'Quick learner') regardless of which candidate is viewed

1.2 WHEN any candidate detail page is opened THEN the system displays hardcoded weaknesses ('Limited system design experience', 'Needs improvement in testing') regardless of which candidate is viewed

1.3 WHEN a user adds or removes a strength or weakness THEN the system does not persist the change to the database, so the modification is lost on page reload

1.4 WHEN a candidate has no interview notes THEN the system still shows the hardcoded default strengths and weaknesses instead of an empty state

**Bug 2 — Hardcoded dummy data in RoleMatchCard**

2.1 WHEN `matchData` is null (no resume uploaded or resume not yet parsed) THEN the system renders the Role Match Analysis card with a fake 78% match percentage

2.2 WHEN `matchData` is null THEN the system displays hardcoded missing skills (['JavaScript', 'React', 'Node', 'MongoDB']) as if they were real gaps for the candidate

2.3 WHEN `matchData` is present but `matchedSkills`, `missingSkills`, or `partialMatch` arrays are empty THEN the system falls back to fake counts (12 matched, 4 missing, 3 partial) instead of showing real zeros

**Bug 3 — Score cards show fake defaults instead of real scores or nothing**

3.1 WHEN a candidate has not taken any assessment (score is null) THEN the system renders four score cards with `aptitude: 100` as a fake default, misleading HR users into thinking the candidate scored 100 on aptitude

3.2 WHEN a candidate has not taken any assessment THEN the system renders score cards for technical, reasoning, and communication with value 0, implying the candidate took the test and scored zero rather than indicating no test was taken

**Bug 4 — StructuredResume shows spinner forever when no resume exists**

4.1 WHEN a candidate has no resume (`candidate.resumeUrl` is null) THEN the system renders a loading spinner inside the left panel that never resolves, because the component cannot distinguish between "loading" and "no resume"

**Bug 5 — Resume download button is non-functional**

5.1 WHEN a user clicks the Download Resume button THEN the system does nothing — no file is opened or downloaded

5.2 WHEN a candidate has no resume (`candidate.resumeUrl` is null) THEN the system renders the Download Resume button in an enabled, clickable state with no indication that no resume is available

**Bug 6 — Left panel scrolls with page instead of being truly fixed**

6.1 WHEN the resume content in the left panel is taller than the viewport THEN the system clips the overflow content because the resume section does not scroll independently within the panel

6.2 WHEN the user scrolls the resume content in the left panel THEN the candidate header card scrolls out of view instead of remaining fixed at the top of the panel

---

### Expected Behavior (Correct)

**Bug 1 — Strengths and weaknesses from real data**

2.1 WHEN a candidate detail page is opened THEN the system SHALL initialize strengths and weaknesses as empty arrays and populate them by aggregating all `strengths` and `weaknesses` fields from the candidate's interview notes (logs), deduplicating with `Set`

2.2 WHEN a candidate has no interview notes and no resume data THEN the system SHALL display an empty state message ("No strengths recorded yet" / "No weaknesses recorded yet") instead of the add-input boxes or hardcoded values

2.3 WHEN a user adds a strength or weakness THEN the system SHALL persist the addition to the backend so it survives a page reload

**Bug 2 — RoleMatchCard shows real data or empty state**

2.4 WHEN `matchData` is null or undefined THEN the system SHALL render a minimal empty state card with the message "No resume uploaded yet. Upload a resume to see role match analysis." and SHALL NOT display any percentage, skill counts, or skill names

2.5 WHEN `matchData` is present but `matchedSkills`, `missingSkills`, or `partialMatch` arrays are empty THEN the system SHALL display real zeros for those counts

2.6 WHEN `matchData` is present but `matchPercentage` is absent THEN the system SHALL default to 0%, NOT 78%

**Bug 3 — Score cards show real scores or a no-assessment state**

3.1 WHEN a candidate has not taken any assessment (score is null or `score.sectionScores` is absent) THEN the system SHALL render a single placeholder card with the message "No assessment taken yet. Scores will appear here once the candidate completes their assessment." and SHALL NOT render any numeric score cards

3.2 WHEN a candidate has taken an assessment THEN the system SHALL display `score.sectionScores` exactly as returned by the API with no overrides or defaults

**Bug 4 — StructuredResume distinguishes loading from no-resume**

4.1 WHEN `candidate.resumeUrl` is null and `resumeData` is null THEN the system SHALL render a "No resume uploaded" empty state (with FileText icon and explanatory text) instead of a loading spinner

4.2 WHEN `candidate.resumeUrl` is not null and `resumeData` is null (still loading) THEN the system SHALL render the loading spinner as before

4.3 WHEN `candidate.resumeUrl` is null THEN the system SHALL NOT make an API call to `/resume/:id`

**Bug 5 — Resume download button is functional**

5.1 WHEN a candidate has a resume and the user clicks Download Resume THEN the system SHALL open the resume file URL in a new browser tab

5.2 WHEN `candidate.resumeUrl` is a relative path THEN the system SHALL prepend the API base URL (`VITE_API_URL` or `http://localhost:5000`) before opening

5.3 WHEN a candidate has no resume THEN the system SHALL render the button as disabled with the label "No Resume" and reduced opacity

**Bug 6 — Left panel layout is truly fixed**

6.1 WHEN the resume content in the left panel is taller than the available panel height THEN the system SHALL allow the resume content area to scroll independently within the panel without affecting the candidate header card or the right panel

6.2 WHEN the user scrolls the resume content THEN the system SHALL keep the candidate header card fixed at the top of the left panel at all times

6.3 WHEN the user scrolls the resume content THEN the system SHALL keep the resume nav tabs sticky at the top of the scrollable resume area

6.4 WHEN the user scrolls the right panel THEN the system SHALL scroll the right panel independently of the left panel

---

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a candidate has a resume and it is still being fetched from the API THEN the system SHALL CONTINUE TO show the loading spinner inside the left panel

3.2 WHEN a candidate's resume has `parsingStatus === 'processing'` THEN the system SHALL CONTINUE TO show the "Processing Resume..." state in StructuredResume

3.3 WHEN a candidate's resume has `parsingStatus === 'failed'` THEN the system SHALL CONTINUE TO show the parse-failed error state with the retry option in StructuredResume

3.4 WHEN a candidate has taken an assessment and `score.sectionScores` is present THEN the system SHALL CONTINUE TO render the four score cards (aptitude, technical, reasoning, communication) with their real values

3.5 WHEN `matchData` is present with real skill arrays THEN the system SHALL CONTINUE TO render the full Role Match Analysis card with the circular progress indicator, matched/missing/partial counts, and missing skill tags

3.6 WHEN the user adds an interview note via the drawer THEN the system SHALL CONTINUE TO save the note and refresh the logs list, which in turn updates the aggregated strengths and weaknesses display

3.7 WHEN the viewport is narrower than 900px THEN the system SHALL CONTINUE TO apply the responsive stacked layout (left panel above right panel, both scrolling normally)

3.8 WHEN a candidate has a `resumeUrl` and the user clicks "View Original" THEN the system SHALL CONTINUE TO toggle the original resume view as before
