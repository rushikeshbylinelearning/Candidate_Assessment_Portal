# Requirements Document

## Introduction

The Unified Sequential Candidate Flow (Phase 17) replaces the existing fragmented candidate forms and assessments with a single, structured, step-by-step evaluation pipeline. Candidates progress through up to five ordered steps — Evaluation Form, Language Assessment, Role-Based Assessment, Interview Interaction, and Post-Interview Feedback — controlled by a central Workflow Engine. Each step stores data independently in its own collection while a master candidate record links all steps together. HR users retain full visibility and override capability throughout the pipeline.

## Glossary

- **Workflow_Engine**: The backend service responsible for tracking, validating, and advancing a candidate's position within the pipeline.
- **Pipeline**: The ordered sequence of evaluation steps assigned to a candidate for a given role.
- **Step**: A discrete evaluation unit within the pipeline. One of: `EVALUATION_FORM`, `LANGUAGE_ASSESSMENT`, `ROLE_BASED_ASSESSMENT`, `INTERVIEW_INTERACTION`, `POST_INTERVIEW_FEEDBACK`.
- **Step_Status**: The state of a single step for a candidate. One of: `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `SKIPPED`.
- **Pipeline_Record**: The master document that links a candidate to their pipeline instance, tracking current step, completed steps, and per-step status.
- **Step_Configuration**: A role-scoped definition of step order, required/optional flags, scoring weights, and time limits.
- **Candidate_Interface**: The React frontend view presented to a candidate during their pipeline session.
- **HR_Interface**: The React frontend view used by HR users to monitor and manage candidate pipelines.
- **Token**: A time-limited, single-use (or limited-use) credential that grants a candidate access to their pipeline session.
- **HR_Override**: An action performed by an authorized HR user to forcibly advance, revert, or skip a candidate's current step.
- **Step_Data_Store**: The dedicated MongoDB collection that persists the submission data for a specific step type.
- **RMS**: Recruitment Management System — an external system that may initiate candidate pipeline sessions via API integration.

---

## Requirements

### Requirement 1: Pipeline Record Initialization

**User Story:** As an HR user, I want a pipeline record to be created for each candidate when they are invited, so that the system has a single source of truth for tracking their progress through all evaluation steps.

#### Acceptance Criteria

1. WHEN a candidate is invited to a pipeline, THE Workflow_Engine SHALL create a Pipeline_Record containing the candidate's ID, the assigned role's Step_Configuration, `current_step`, `completed_steps`, and a `step_status` map initialized to `NOT_STARTED` for each configured step.
2. THE Pipeline_Record SHALL store a reference to the candidate's existing `Candidate` master record without duplicating candidate profile data.
3. WHEN a Pipeline_Record is created, THE Workflow_Engine SHALL set `current_step` to the first step defined in the role's Step_Configuration.
4. IF a Pipeline_Record already exists for a candidate and role combination, THEN THE Workflow_Engine SHALL return the existing Pipeline_Record without creating a duplicate.

---

### Requirement 2: Candidate Entry via Token or RMS Integration

**User Story:** As a candidate, I want to enter my evaluation pipeline using a secure token or via RMS integration, so that I can access my assigned steps without requiring a separate account login.

#### Acceptance Criteria

1. WHEN a candidate presents a valid, unexpired Token, THE Workflow_Engine SHALL authenticate the session and return the candidate's current Pipeline_Record.
2. WHEN a candidate presents an expired or already-consumed Token, THE Workflow_Engine SHALL reject the session and return a descriptive error message.
3. WHEN an RMS system initiates a candidate session via the integration API, THE Workflow_Engine SHALL validate the RMS request, locate or create the Pipeline_Record, and return the candidate's current step.
4. THE Workflow_Engine SHALL record a `session_started` event in the candidate's timeline upon each successful entry.

---

### Requirement 3: Dynamic Step Rendering

**User Story:** As a candidate, I want the system to automatically display the correct evaluation step for my current position in the pipeline, so that I never have to navigate manually between forms.

#### Acceptance Criteria

1. WHEN a candidate's session is active, THE Candidate_Interface SHALL render the UI component corresponding to the candidate's `current_step` as defined in their Pipeline_Record.
2. THE Candidate_Interface SHALL display a step indicator showing the candidate's current step number and total step count (e.g., "Step 2 of 5").
3. THE Candidate_Interface SHALL display a progress bar reflecting the ratio of `COMPLETED` steps to total configured steps.
4. WHILE a step is `IN_PROGRESS`, THE Candidate_Interface SHALL continuously save partial responses to the corresponding Step_Data_Store at intervals no greater than 30 seconds.
5. IF a save operation fails, THEN THE Candidate_Interface SHALL notify the candidate with a non-blocking warning and retry the save within 10 seconds.

---

### Requirement 4: Step Completion and Automatic Advancement

**User Story:** As a candidate, I want the system to automatically move me to the next step when I complete the current one, so that the experience feels seamless and I do not need to manage navigation.

#### Acceptance Criteria

1. WHEN a candidate submits a step, THE Workflow_Engine SHALL validate that all required fields for that step are present before marking the step as `COMPLETED`.
2. IF required fields are missing upon submission, THEN THE Workflow_Engine SHALL return a validation error listing the missing fields without advancing the pipeline.
3. WHEN a step is marked `COMPLETED`, THE Workflow_Engine SHALL update `completed_steps`, set the step's `step_status` to `COMPLETED`, and advance `current_step` to the next configured step.
4. WHEN `current_step` advances to a step configured as optional and the Step_Configuration specifies `skip: true` for that step, THE Workflow_Engine SHALL set that step's `step_status` to `SKIPPED` and advance to the following step automatically.
5. WHEN all steps in the pipeline are either `COMPLETED` or `SKIPPED`, THE Workflow_Engine SHALL mark the Pipeline_Record as `FINISHED` and update the candidate's `assessmentStatus` to `completed` in the master `Candidate` record.

---

### Requirement 5: Step Configuration per Role

**User Story:** As an HR administrator, I want to configure the evaluation steps for each role independently, so that different roles can have tailored pipelines with appropriate steps, weights, and time limits.

#### Acceptance Criteria

1. THE HR_Interface SHALL allow an authorized user to define a Step_Configuration for a role specifying: step order, required or optional flag per step, scoring weight per step, and time limit per step in minutes.
2. WHEN a Step_Configuration is saved, THE Workflow_Engine SHALL validate that the sum of scoring weights across all non-skipped steps equals 100.
3. IF the scoring weights do not sum to 100, THEN THE Workflow_Engine SHALL return a validation error and reject the Step_Configuration.
4. WHEN a Pipeline_Record is created, THE Workflow_Engine SHALL snapshot the role's current Step_Configuration into the Pipeline_Record so that subsequent changes to the role's configuration do not alter in-progress pipelines.
5. WHERE a step has a configured time limit, THE Workflow_Engine SHALL record the step's `started_at` timestamp and enforce the time limit by automatically submitting the step when the limit is reached.

---

### Requirement 6: Modular Step Data Storage

**User Story:** As a system architect, I want each evaluation step to store its data in a dedicated collection, so that step data is independently queryable, scalable, and does not pollute a single monolithic document.

#### Acceptance Criteria

1. THE Workflow_Engine SHALL persist `EVALUATION_FORM` submissions to a dedicated `EvaluationFormData` collection referencing the candidate ID and Pipeline_Record ID.
2. THE Workflow_Engine SHALL persist `LANGUAGE_ASSESSMENT` submissions to a dedicated `LanguageAssessmentData` collection referencing the candidate ID and Pipeline_Record ID.
3. THE Workflow_Engine SHALL persist `ROLE_BASED_ASSESSMENT` submissions to a dedicated `RoleAssessmentData` collection referencing the candidate ID and Pipeline_Record ID.
4. THE Workflow_Engine SHALL persist `INTERVIEW_INTERACTION` submissions to a dedicated `InterviewInteractionData` collection referencing the candidate ID and Pipeline_Record ID.
5. THE Workflow_Engine SHALL persist `POST_INTERVIEW_FEEDBACK` submissions to a dedicated `PostInterviewFeedbackData` collection referencing the candidate ID and Pipeline_Record ID.
6. THE Pipeline_Record SHALL store references (document IDs) to each step's Step_Data_Store document, enabling aggregation without embedding raw step data.

---

### Requirement 7: Save and Resume

**User Story:** As a candidate, I want to save my progress and resume from where I left off if I am interrupted, so that I do not lose work due to connectivity issues or session timeouts.

#### Acceptance Criteria

1. WHEN a candidate's session ends without step completion, THE Workflow_Engine SHALL retain the partial step data in the Step_Data_Store with `step_status` set to `IN_PROGRESS`.
2. WHEN a candidate re-enters the pipeline with a valid Token, THE Candidate_Interface SHALL restore the candidate to their `current_step` and pre-populate any previously saved partial responses.
3. WHILE a step is `IN_PROGRESS`, THE Candidate_Interface SHALL display a "Save & Resume Later" control that triggers an immediate save and ends the session gracefully.
4. IF a step has a configured time limit and the candidate resumes, THEN THE Workflow_Engine SHALL calculate remaining time as `time_limit - elapsed_time` and enforce the reduced limit.

---

### Requirement 8: HR Candidate Journey View

**User Story:** As an HR user, I want to view the full evaluation journey of any candidate, so that I can monitor their progress, review step outcomes, and make informed decisions.

#### Acceptance Criteria

1. THE HR_Interface SHALL display a candidate's Pipeline_Record showing all configured steps, each step's `step_status`, and timestamps for step start and completion.
2. WHEN an HR user selects a completed step, THE HR_Interface SHALL retrieve and display the step's data from the corresponding Step_Data_Store.
3. THE HR_Interface SHALL display an aggregate summary including overall completion percentage, total time spent, and weighted score where scoring has been applied.
4. THE HR_Interface SHALL allow an HR user to navigate directly to any step in a candidate's pipeline regardless of the step's current status.

---

### Requirement 9: HR Override

**User Story:** As an HR user, I want to override a candidate's current pipeline stage, so that I can correct errors, accommodate special circumstances, or manually advance a candidate.

#### Acceptance Criteria

1. WHEN an authorized HR user submits an override request specifying a target step, THE Workflow_Engine SHALL update the Pipeline_Record's `current_step` to the specified step.
2. THE Workflow_Engine SHALL record an `hr_override` event in the candidate's timeline including the HR user's ID, the previous step, the new step, and a mandatory reason string.
3. IF the override reason string is empty, THEN THE Workflow_Engine SHALL reject the override request and return a validation error.
4. WHEN an HR override sets `current_step` to a step with `step_status` of `COMPLETED`, THE Workflow_Engine SHALL reset that step's `step_status` to `NOT_STARTED` and remove its reference from `completed_steps`.

---

### Requirement 10: Aggregate Scoring and Analytics

**User Story:** As an HR administrator, I want the system to compute an aggregate score across all completed steps using configured weights, so that I can compare candidates objectively.

#### Acceptance Criteria

1. WHEN all scorable steps in a pipeline are `COMPLETED`, THE Workflow_Engine SHALL compute a weighted aggregate score using the scoring weights defined in the Pipeline_Record's snapshotted Step_Configuration.
2. THE Workflow_Engine SHALL store the aggregate score in the Pipeline_Record and update the `overallScore` field in the master `Candidate` record.
3. WHEN a step score is updated after initial computation, THE Workflow_Engine SHALL recompute and update the aggregate score in the Pipeline_Record.
4. THE HR_Interface SHALL display per-step scores alongside the aggregate score for each candidate.
5. THE Workflow_Engine SHALL expose an analytics endpoint that returns pipeline completion rates, average scores per step, and average total time per role.
