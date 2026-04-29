# Implementation Plan: Unified Sequential Candidate Flow

## Overview

This implementation plan converts the unified-candidate-flow design into discrete coding tasks. The pipeline module introduces a 5-step sequential evaluation flow controlled by a WorkflowEngine service. Each step stores data in its own collection, and a master PipelineRecord tracks progress. The implementation follows this order: backend data models → services → API routes → frontend candidate flow → frontend HR journey → integration and testing.

## Tasks

- [ ] 1. Set up pipeline module structure and data models
  - [ ] 1.1 Create pipeline module directory structure
    - Create `candidate-assessment-portal/backend/src/modules/pipeline/` directory
    - Create subdirectory `candidate-assessment-portal/backend/src/modules/pipeline/stepData/`
    - _Requirements: 1.1, 6.1-6.6_

  - [ ] 1.2 Implement PipelineRecord model
    - Create `candidate-assessment-portal/backend/src/modules/pipeline/pipeline.model.js`
    - Define `stepStatusSchema` with status enum, timestamps, dataRef, score fields
    - Define `pipelineRecordSchema` with candidateId, roleId, tokenId, stepConfigSnapshot, currentStep, completedSteps, stepStatus map, status, aggregateScore, totalTimeSpentSecs
    - Add compound unique index on `(candidateId, roleId)`
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ] 1.3 Implement StepConfiguration model
    - Create `candidate-assessment-portal/backend/src/modules/pipeline/stepConfig.model.js`
    - Define `stepConfigEntrySchema` with stepType, order, required, skip, scoringWeight, timeLimitMins
    - Define `stepConfigurationSchema` with roleId (unique), steps array, createdBy
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 1.4 Implement EvaluationFormData model
    - Create `candidate-assessment-portal/backend/src/modules/pipeline/stepData/evaluationForm.model.js`
    - Define schema with base fields (candidateId, pipelineId, stepType, status, startedAt, submittedAt, timeSpentSecs)
    - Add step-specific fields: yearsExperience, currentTitle, noticePeriodDays, salaryExpectation, availableFrom, linkedinUrl, portfolioUrl, answers array
    - _Requirements: 6.1_

  - [x] 1.5 Implement LanguageAssessmentData model
    - Create `candidate-assessment-portal/backend/src/modules/pipeline/stepData/languageAssessment.model.js`
    - Define schema with base fields plus language, writtenScore, spokenScore, grammarScore, overallBand, responses array
    - _Requirements: 6.2_

  - [x] 1.6 Implement RoleAssessmentData model
    - Create `candidate-assessment-portal/backend/src/modules/pipeline/stepData/roleAssessment.model.js`
    - Define schema with base fields plus assessmentId ref, responses array ref, sectionScores object, autoScore, completionRate
    - _Requirements: 6.3_

  - [x] 1.7 Implement InterviewInteractionData model
    - Create `candidate-assessment-portal/backend/src/modules/pipeline/stepData/interviewInteraction.model.js`
    - Define schema with base fields plus interviewerId ref, scheduledAt, conductedAt, durationMins, questions array, overallInterviewScore, interviewerNotes
    - _Requirements: 6.4_

  - [x] 1.8 Implement PostInterviewFeedbackData model
    - Create `candidate-assessment-portal/backend/src/modules/pipeline/stepData/postInterviewFeedback.model.js`
    - Define schema with base fields plus submittedBy ref, recommendation enum, strengths array, concerns array, finalNotes, hrScore
    - _Requirements: 6.5_

  - [ ]* 1.9 Write property test for Pipeline Record Creation Invariants
    - **Property 1: Pipeline Record Creation Invariants**
    - **Validates: Requirements 1.1, 1.2, 1.3**
    - Use fast-check to generate candidateId, roleId, stepConfig
    - Assert pipeline contains candidateId reference, snapshotted config, current_step set to first step, empty completed_steps, all steps initialized to NOT_STARTED
    - Run 100 iterations

  - [ ]* 1.10 Write property test for Pipeline Record Idempotency
    - **Property 2: Pipeline Record Idempotency**
    - **Validates: Requirements 1.4**
    - Use fast-check to generate candidateId, roleId
    - Call creation function multiple times, assert same PipelineRecord returned and count remains 1
    - Run 100 iterations

- [ ] 2. Extend Token model and implement pipeline token middleware
  - [ ] 2.1 Extend Token model with pipelineId field
    - Open `candidate-assessment-portal/backend/src/modules/token/token.model.js`
    - Add `pipelineId` field as optional ObjectId ref to PipelineRecord
    - Make `assessmentId` field optional (required: false)
    - _Requirements: 2.1_

  - [ ] 2.2 Create pipeline token authentication middleware
    - Create `candidate-assessment-portal/backend/src/middleware/pipelineAuth.js`
    - Implement `validatePipelineToken` middleware that reads `x-pipeline-token` header
    - Validate token exists, not expired, not consumed (useCount < maxUses)
    - Attach resolved PipelineRecord to `req.pipeline`
    - Return 401 with TOKEN_INVALID error code if validation fails
    - _Requirements: 2.1, 2.2_

  - [ ]* 2.3 Write property test for Token Authentication and Session Initialization
    - **Property 3: Token Authentication and Session Initialization**
    - **Validates: Requirements 2.1, 2.4**
    - Use fast-check to generate valid, unexpired, unconsumed tokens
    - Assert authentication returns correct PipelineRecord and appends session_started event to candidate timeline
    - Run 100 iterations

  - [ ]* 2.4 Write property test for Invalid Token Rejection
    - **Property 4: Invalid Token Rejection**
    - **Validates: Requirements 2.2**
    - Use fast-check to generate expired, consumed, or max-uses-exceeded tokens
    - Assert authentication rejects session with descriptive error
    - Run 100 iterations

- [ ] 3. Implement WorkflowEngine service
  - [ ] 3.1 Create WorkflowEngine service with step advancement logic
    - Create `candidate-assessment-portal/backend/src/modules/pipeline/workflowEngine.service.js`
    - Implement `advanceStep(pipeline, submittedStepType, submittedData)` function
    - Validate submittedData against required fields for step type
    - Persist data to correct Step_Data_Store with status COMPLETED
    - Update pipeline.stepStatus, add to completedSteps, compute nextStep
    - Implement auto-skip loop for optional skippable steps
    - Set pipeline status to FINISHED when no more steps
    - Update Candidate.assessmentStatus to 'completed' on finish
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 3.2 Implement time limit enforcement in WorkflowEngine
    - Add `checkTimeLimit(pipeline, stepType)` function
    - Calculate elapsed time from stepStatus[stepType].startedAt
    - Auto-submit step with partial data if elapsed >= timeLimitMins
    - Return remainingTime calculation for resume sessions
    - _Requirements: 5.5, 7.4_

  - [ ] 3.3 Implement HR override logic in WorkflowEngine
    - Add `hrOverride(pipeline, targetStep, hrUserId, reason)` function
    - Validate reason is non-empty and non-whitespace
    - Update currentStep to targetStep
    - Reset target step status to NOT_STARTED if previously COMPLETED
    - Append hr_override event to Candidate.timeline with userId, previousStep, newStep, reason
    - Return 422 with REASON_REQUIRED error code if reason empty
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ] 3.4 Implement partial data save logic in WorkflowEngine
    - Add `savePartialData(pipeline, stepType, partialData)` function
    - Persist partial data to Step_Data_Store with status IN_PROGRESS
    - Keep pipeline.stepStatus[stepType].status as IN_PROGRESS
    - Update timeSpentSecs field
    - _Requirements: 7.1_

  - [ ] 3.5 Implement session resume logic in WorkflowEngine
    - Add `resumeSession(pipeline)` function
    - Return currentStep, partial data from Step_Data_Store, remaining time
    - Pre-populate step form data for frontend
    - _Requirements: 7.2, 7.4_

  - [ ]* 3.6 Write property test for Step Submission Validation
    - **Property 8: Step Submission Validation**
    - **Validates: Requirements 4.1, 4.2**
    - Use fast-check to generate step submissions with missing required fields
    - Assert WorkflowEngine rejects submission, returns validation error with missing fields list, does not mark COMPLETED or advance
    - Run 100 iterations

  - [ ]* 3.7 Write property test for Step Completion and Advancement
    - **Property 9: Step Completion and Advancement**
    - **Validates: Requirements 4.3**
    - Use fast-check to generate valid step submissions at non-final steps
    - Assert WorkflowEngine updates completed_steps, sets step_status to COMPLETED, advances current_step
    - Run 100 iterations

  - [ ]* 3.8 Write property test for Auto-Skip Logic
    - **Property 10: Auto-Skip Logic**
    - **Validates: Requirements 4.4**
    - Use fast-check to generate pipelines with skip:true + required:false steps
    - Assert WorkflowEngine sets step_status to SKIPPED and advances without candidate interaction
    - Run 100 iterations

  - [ ]* 3.9 Write property test for Pipeline Completion
    - **Property 11: Pipeline Completion**
    - **Validates: Requirements 4.5**
    - Use fast-check to generate pipelines where all steps are COMPLETED or SKIPPED
    - Assert WorkflowEngine sets status to FINISHED, sets Candidate.assessmentStatus to 'completed', triggers aggregate score computation
    - Run 100 iterations

  - [ ]* 3.10 Write property test for Time Limit Enforcement
    - **Property 14: Time Limit Enforcement**
    - **Validates: Requirements 5.5**
    - Use fast-check to generate steps with timeLimitMins and elapsed time >= limit
    - Assert WorkflowEngine auto-submits step with partial data and advances pipeline
    - Run 100 iterations

  - [ ]* 3.11 Write property test for Partial Data Persistence
    - **Property 16: Partial Data Persistence**
    - **Validates: Requirements 7.1**
    - Use fast-check to generate partial step submissions
    - Assert WorkflowEngine persists data with status IN_PROGRESS and retains step_status as IN_PROGRESS
    - Run 100 iterations

  - [ ]* 3.12 Write property test for Session Resume Round-Trip
    - **Property 17: Session Resume Round-Trip**
    - **Validates: Requirements 7.2**
    - Use fast-check to generate pipelines with partial data saved
    - Assert candidate re-authentication restores current_step and pre-populates form with partial data
    - Run 100 iterations

  - [ ]* 3.13 Write property test for Remaining Time Calculation
    - **Property 18: Remaining Time Calculation**
    - **Validates: Requirements 7.4**
    - Use fast-check to generate steps with timeLimitMins T and elapsed E where E < T
    - Assert WorkflowEngine returns remainingTime = T - E on resume
    - Run 100 iterations

  - [ ]* 3.14 Write property test for HR Override State Update
    - **Property 21: HR Override State Update**
    - **Validates: Requirements 9.1, 9.2**
    - Use fast-check to generate valid override requests with non-empty reason
    - Assert WorkflowEngine updates current_step and appends hr_override event to candidate timeline
    - Run 100 iterations

  - [ ]* 3.15 Write property test for HR Override Reason Validation
    - **Property 22: HR Override Reason Validation**
    - **Validates: Requirements 9.3**
    - Use fast-check to generate override requests with empty or whitespace-only reason
    - Assert WorkflowEngine rejects request with validation error
    - Run 100 iterations

  - [ ]* 3.16 Write property test for HR Override Step Reset
    - **Property 23: HR Override Step Reset**
    - **Validates: Requirements 9.4**
    - Use fast-check to generate override requests targeting COMPLETED steps
    - Assert WorkflowEngine resets step_status to NOT_STARTED, sets completedAt to null, removes from completed_steps
    - Run 100 iterations

- [ ] 4. Implement ScoringService
  - [x] 4.1 Create ScoringService with weighted aggregate computation
    - Create `candidate-assessment-portal/backend/src/modules/pipeline/scoring.service.js`
    - Implement `computeAggregateScore(pipeline)` function
    - Calculate weighted score: sum(stepScore_i × weight_i) / 100
    - Implement weight redistribution for SKIPPED steps (proportional reallocation)
    - Update both PipelineRecord.aggregateScore and Candidate.overallScore
    - _Requirements: 10.1, 10.2_

  - [x] 4.2 Implement score recomputation on update
    - Add `recomputeScore(pipeline)` function triggered when any stepStatus[type].score changes
    - Recalculate aggregate using new step score values
    - Update PipelineRecord.aggregateScore and Candidate.overallScore atomically
    - _Requirements: 10.3_

  - [ ]* 4.3 Write property test for Step Configuration Weight Validation
    - **Property 12: Step Configuration Weight Validation**
    - **Validates: Requirements 5.2, 5.3**
    - Use fast-check to generate step configuration arrays with various weight sums
    - Assert validation passes if and only if sum equals 100
    - Run 100 iterations

  - [ ]* 4.4 Write property test for Weighted Aggregate Score Computation
    - **Property 24: Weighted Aggregate Score Computation**
    - **Validates: Requirements 10.1, 10.2**
    - Use fast-check to generate step scores and weights summing to 100
    - Assert aggregate score equals sum(score_i × weight_i) / 100 and both PipelineRecord.aggregateScore and Candidate.overallScore are updated
    - Run 100 iterations

  - [ ]* 4.5 Write property test for Score Recomputation on Update
    - **Property 25: Score Recomputation on Update**
    - **Validates: Requirements 10.3**
    - Use fast-check to generate pipelines with existing aggregate scores
    - Update a stepStatus[type].score, assert WorkflowEngine recomputes aggregate and updates both records
    - Run 100 iterations

- [ ] 5. Checkpoint - Ensure all backend service tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement Pipeline API controller and routes
  - [x] 6.1 Create PipelineController with candidate-facing endpoints
    - Create `candidate-assessment-portal/backend/src/modules/pipeline/pipeline.controller.js`
    - Implement `POST /session` handler: validate token, return PipelineRecord + current step data
    - Implement `PATCH /:pipelineId/step/save` handler: auto-save partial step data
    - Implement `POST /:pipelineId/step/submit` handler: submit current step, advance pipeline
    - Implement `POST /:pipelineId/resume` handler: re-enter session, return current step + partial data
    - Use pipelineAuth middleware for all candidate endpoints
    - _Requirements: 2.1, 3.4, 4.1, 4.3, 7.1, 7.2_

  - [x] 6.2 Add HR-facing endpoints to PipelineController
    - Implement `POST /invite` handler: create PipelineRecord + Token for candidate
    - Implement `GET /:pipelineId` handler: get full PipelineRecord with step statuses
    - Implement `GET /candidate/:candidateId` handler: get all pipeline records for candidate
    - Implement `POST /:pipelineId/override` handler: HR override current_step
    - Implement `GET /:pipelineId/step/:stepType/data` handler: retrieve step data from Step_Data_Store
    - Implement `GET /analytics` handler: completion rates, avg scores, avg time per role
    - Use protect + authorize('admin','hr') middleware for all HR endpoints
    - _Requirements: 8.1, 8.2, 8.3, 9.1, 10.5_

  - [x] 6.3 Add step configuration endpoints to PipelineController
    - Implement `POST /config` handler: create StepConfiguration for role
    - Implement `PUT /config/:roleId` handler: update StepConfiguration for role
    - Implement `GET /config/:roleId` handler: get StepConfiguration for role
    - Validate weight sum equals 100 on create/update
    - Use protect + authorize('admin') middleware
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 6.4 Add RMS integration endpoint to PipelineController
    - Implement `POST /rms/session` handler: RMS-initiated session
    - Validate x-rms-api-key header
    - Locate or create PipelineRecord, return current step
    - _Requirements: 2.3_

  - [x] 6.5 Create pipeline routes file
    - Create `candidate-assessment-portal/backend/src/modules/pipeline/pipeline.routes.js`
    - Define all 14 routes with correct HTTP methods and paths
    - Apply appropriate middleware (pipelineAuth, protect, authorize) to each route
    - Export router

  - [x] 6.6 Register pipeline routes in server.js
    - Open `candidate-assessment-portal/backend/server.js`
    - Import pipelineRoutes from `./src/modules/pipeline/pipeline.routes`
    - Add `app.use('/api/pipeline', pipelineRoutes);` after existing route registrations
    - _Requirements: All API requirements_

  - [ ]* 6.7 Write property test for Step Configuration Snapshot Immutability
    - **Property 13: Step Configuration Snapshot Immutability**
    - **Validates: Requirements 5.4**
    - Use fast-check to generate PipelineRecords created from Role StepConfiguration
    - Modify Role's StepConfiguration, assert PipelineRecord's snapshot unchanged
    - Run 100 iterations

  - [ ]* 6.8 Write property test for Step Data Routing
    - **Property 15: Step Data Routing**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**
    - Use fast-check to generate step submissions of each type
    - Assert WorkflowEngine persists to correct Step_Data_Store collection with correct candidateId, pipelineId, and updates stepStatus[X].dataRef
    - Run 100 iterations

- [ ] 7. Implement frontend candidate flow components
  - [x] 7.1 Create StepIndicator component
    - Create `candidate-assessment-portal/frontend/src/components/pipeline/StepIndicator.jsx`
    - Accept currentStepIndex and totalSteps as props
    - Display "Step K of N" format
    - _Requirements: 3.2_

  - [x] 7.2 Create ProgressBar component
    - Create `candidate-assessment-portal/frontend/src/components/pipeline/ProgressBar.jsx`
    - Accept completedSteps and totalSteps as props
    - Calculate and display completion percentage bar
    - _Requirements: 3.3_

  - [x] 7.3 Create SaveResumeControl component
    - Create `candidate-assessment-portal/frontend/src/components/pipeline/SaveResumeControl.jsx`
    - Implement "Save & Resume Later" button
    - Implement auto-save logic (every 30 seconds)
    - Call PATCH /api/pipeline/:pipelineId/step/save endpoint
    - Display non-blocking warning on save failure with 10-second retry
    - _Requirements: 3.4, 7.1, 7.3_

  - [x] 7.4 Create EvaluationFormStep component
    - Create `candidate-assessment-portal/frontend/src/components/pipeline/steps/EvaluationFormStep.jsx`
    - Build form with fields: yearsExperience, currentTitle, noticePeriodDays, salaryExpectation, availableFrom, linkedinUrl, portfolioUrl, custom answers
    - Integrate with SaveResumeControl for auto-save
    - Submit to POST /api/pipeline/:pipelineId/step/submit with stepType EVALUATION_FORM
    - _Requirements: 6.1_

  - [x] 7.5 Create LanguageAssessmentStep component
    - Create `candidate-assessment-portal/frontend/src/components/pipeline/steps/LanguageAssessmentStep.jsx`
    - Build form with fields: language, responses array (prompt + response)
    - Integrate with SaveResumeControl
    - Submit to POST /api/pipeline/:pipelineId/step/submit with stepType LANGUAGE_ASSESSMENT
    - _Requirements: 6.2_

  - [x] 7.6 Create RoleAssessmentStep component
    - Create `candidate-assessment-portal/frontend/src/components/pipeline/steps/RoleAssessmentStep.jsx`
    - Reuse existing AssessmentRunner component for quiz flow
    - Link responses to RoleAssessmentData
    - Submit to POST /api/pipeline/:pipelineId/step/submit with stepType ROLE_BASED_ASSESSMENT
    - _Requirements: 6.3_

  - [x] 7.7 Create InterviewInteractionStep component
    - Create `candidate-assessment-portal/frontend/src/components/pipeline/steps/InterviewInteractionStep.jsx`
    - Build form for interviewer to enter: scheduledAt, conductedAt, durationMins, questions array, overallInterviewScore, interviewerNotes
    - Integrate with SaveResumeControl
    - Submit to POST /api/pipeline/:pipelineId/step/submit with stepType INTERVIEW_INTERACTION
    - _Requirements: 6.4_

  - [x] 7.8 Create PostInterviewFeedbackStep component
    - Create `candidate-assessment-portal/frontend/src/components/pipeline/steps/PostInterviewFeedbackStep.jsx`
    - Build form with fields: recommendation enum, strengths array, concerns array, finalNotes, hrScore
    - Integrate with SaveResumeControl
    - Submit to POST /api/pipeline/:pipelineId/step/submit with stepType POST_INTERVIEW_FEEDBACK
    - _Requirements: 6.5_

  - [x] 7.9 Create StepRenderer component
    - Create `candidate-assessment-portal/frontend/src/components/pipeline/StepRenderer.jsx`
    - Accept currentStep prop (step type enum)
    - Switch on step type and render corresponding step component
    - Pass pipelineId, partialData, remainingTime props to step components
    - _Requirements: 3.1_

  - [x] 7.10 Create CandidateFlowPage
    - Create `candidate-assessment-portal/frontend/src/pages/candidate/CandidateFlowPage.jsx`
    - Call POST /api/pipeline/session on mount with x-pipeline-token header
    - Render StepIndicator, ProgressBar, StepRenderer components
    - Handle session resume: call POST /api/pipeline/:pipelineId/resume
    - Display time limit countdown if step has timeLimitMins
    - _Requirements: 2.1, 3.1, 3.2, 3.3, 7.2_

  - [ ]* 7.11 Write property test for Step Renderer Mapping
    - **Property 5: Step Renderer Mapping**
    - **Validates: Requirements 3.1**
    - Use fast-check to generate all step type enum values
    - Assert StepRenderer returns correct corresponding step component for each type
    - Run 100 iterations

  - [ ]* 7.12 Write property test for Step Indicator Display
    - **Property 6: Step Indicator Display**
    - **Validates: Requirements 3.2**
    - Use fast-check to generate N total steps and current position K
    - Assert step indicator displays "Step K of N"
    - Run 100 iterations

  - [ ]* 7.13 Write property test for Progress Bar Computation
    - **Property 7: Progress Bar Computation**
    - **Validates: Requirements 3.3**
    - Use fast-check to generate step_status maps
    - Assert progress bar value equals count(COMPLETED) / total_steps
    - Run 100 iterations

- [ ] 8. Checkpoint - Ensure candidate flow renders correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement frontend HR journey components
  - [x] 9.1 Create StepStatusOverview component
    - Create `candidate-assessment-portal/frontend/src/components/pipeline/hr/StepStatusOverview.jsx`
    - Display table of all steps with status, startedAt, completedAt timestamps
    - Accept pipelineRecord prop
    - _Requirements: 8.1_

  - [x] 9.2 Create OverrideControls component
    - Create `candidate-assessment-portal/frontend/src/components/pipeline/hr/OverrideControls.jsx`
    - Build form with target step dropdown and reason text field
    - Call POST /api/pipeline/:pipelineId/override endpoint
    - Validate reason is non-empty before submission
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 9.3 Create AggregateSummary component
    - Create `candidate-assessment-portal/frontend/src/components/pipeline/hr/AggregateSummary.jsx`
    - Display completion percentage, total time spent, weighted aggregate score
    - Accept pipelineRecord prop
    - _Requirements: 8.3, 10.1, 10.2_

  - [x] 9.4 Create StepDataViewer component
    - Create `candidate-assessment-portal/frontend/src/components/pipeline/hr/StepDataViewer.jsx`
    - Accept stepType and pipelineId props
    - Call GET /api/pipeline/:pipelineId/step/:stepType/data endpoint
    - Display raw step data in formatted view
    - _Requirements: 8.2_

  - [x] 9.5 Create CandidateJourneyPage
    - Create `candidate-assessment-portal/frontend/src/pages/hr/CandidateJourneyPage.jsx`
    - Call GET /api/pipeline/:pipelineId on mount
    - Render StepStatusOverview, OverrideControls, AggregateSummary, StepDataViewer components
    - Allow HR user to select any step to view its data
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 9.1_

  - [ ]* 9.6 Write property test for HR Journey View Rendering
    - **Property 19: HR Journey View Rendering**
    - **Validates: Requirements 8.1**
    - Use fast-check to generate PipelineRecords
    - Assert HR journey view displays all configured steps with correct step_status, startedAt, completedAt
    - Run 100 iterations

  - [ ]* 9.7 Write property test for Aggregate Summary Computation
    - **Property 20: Aggregate Summary Computation**
    - **Validates: Requirements 8.3**
    - Use fast-check to generate PipelineRecords
    - Assert aggregate summary computes completionPercentage, totalTimeSpent, weightedScore correctly (with weight redistribution for skipped steps)
    - Run 100 iterations

- [ ] 10. Add new routes to App.jsx
  - [x] 10.1 Register CandidateFlowPage route
    - Open `candidate-assessment-portal/frontend/src/App.jsx`
    - Import CandidateFlowPage
    - Add route: `<Route path="/pipeline/:token" element={<CandidateFlowPage />} />`
    - _Requirements: 2.1, 3.1_

  - [x] 10.2 Register CandidateJourneyPage route
    - Import CandidateJourneyPage
    - Add route under HR layout: `<Route path="pipeline/:pipelineId" element={<CandidateJourneyPage />} />`
    - _Requirements: 8.1_

- [ ] 11. Integration and end-to-end validation
  - [ ] 11.1 Test full candidate pipeline flow
    - Create test script that simulates: token entry → session start → 5 step submissions → pipeline FINISHED
    - Verify PipelineRecord status, Candidate.assessmentStatus, aggregateScore computed
    - _Requirements: All candidate-facing requirements_

  - [ ] 11.2 Test HR override flow
    - Create test script that simulates: HR override to different step → step reset → candidate resumes
    - Verify hr_override event in candidate timeline, step status reset
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ] 11.3 Test RMS integration endpoint
    - Create mock RMS request to POST /api/pipeline/rms/session
    - Verify PipelineRecord located or created, current step returned
    - _Requirements: 2.3_

  - [ ] 11.4 Test analytics endpoint
    - Seed database with multiple PipelineRecords across different roles
    - Call GET /api/pipeline/analytics
    - Verify completion rates, avg scores, avg time per role computed correctly
    - _Requirements: 10.5_

- [ ] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based test sub-tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties using fast-check with 100 iterations
- Unit tests validate specific examples and edge cases
- The design uses JavaScript (Node.js + React), so all code examples should use JavaScript/JSX syntax
- All 25 correctness properties from the design document are mapped to property test sub-tasks
