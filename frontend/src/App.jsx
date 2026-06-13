import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import HRLayout from './components/layout/HRLayout';

const Login = lazy(() => import('./pages/hr/Login'));
const SsoCallback = lazy(() => import('./pages/hr/SsoCallback'));
const SsoLaunchRedirect = lazy(() => import('./pages/hr/SsoLaunchRedirect'));
const Dashboard = lazy(() => import('./pages/hr/Dashboard'));
const Candidates = lazy(() => import('./pages/hr/Candidates'));
const CandidateDetail = lazy(() => import('./pages/hr/CandidateDetail'));
const AssessmentReview = lazy(() => import('./pages/hr/AssessmentReview'));
const Roles = lazy(() => import('./pages/hr/Roles'));
const CreateAssessment = lazy(() => import('./pages/hr/CreateAssessment'));
const AssessmentBuilderStandard = lazy(() => import('./pages/hr/AssessmentBuilderStandard'));
const AssessmentBuilderAdaptive = lazy(() => import('./pages/hr/AssessmentBuilderAdaptive'));
const AssessmentBuilderPDF = lazy(() => import('./pages/hr/AssessmentBuilderPDF'));
const AssessmentDetail = lazy(() => import('./pages/hr/AssessmentDetail'));
const Analytics = lazy(() => import('./pages/hr/Analytics'));
const Notes = lazy(() => import('./pages/hr/Notes'));
const Questions = lazy(() => import('./pages/hr/Questions'));
const AccessPage = lazy(() => import('./pages/candidate/AccessPage'));
const StartPage = lazy(() => import('./pages/candidate/StartPage'));
const AssessmentRunner = lazy(() => import('./pages/candidate/AssessmentRunner'));
const CompletionPage = lazy(() => import('./pages/candidate/CompletionPage'));
const CandidateFlowPage = lazy(() => import('./pages/candidate/CandidateFlowPage'));
const CandidateJourneyPage = lazy(() => import('./pages/hr/CandidateJourneyPage'));

function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '40vh',
      color: '#64748b',
      fontSize: 14,
    }}
    >
      Loading…
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/auth/sso-callback" element={<SsoCallback />} />
            <Route path="/sso-login" element={<SsoLaunchRedirect />} />
            <Route path="/hr" element={<HRLayout />}>
              <Route index element={<Navigate to="/hr/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="candidates" element={<Candidates />} />
              <Route path="candidates/:id" element={<CandidateDetail />} />
              <Route path="candidates/:id/assessment-review" element={<AssessmentReview />} />
              <Route path="roles" element={<Roles />} />
              <Route path="questions" element={<Questions />} />
              <Route path="assessments" element={<Navigate to="/hr/assessments/create" replace />} />
              <Route path="assessments/create" element={<CreateAssessment />} />
              <Route path="assessments/create/standard" element={<AssessmentBuilderStandard />} />
              <Route path="assessments/create/adaptive" element={<AssessmentBuilderAdaptive />} />
              <Route path="assessments/create/pdf" element={<AssessmentBuilderPDF />} />
              <Route path="assessments/:id" element={<AssessmentDetail />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="notes" element={<Notes />} />
              <Route path="pipeline/:pipelineId" element={<CandidateJourneyPage />} />
            </Route>

            <Route path="/" element={<AccessPage />} />
            <Route path="/assessment/:token" element={<StartPage />} />
            <Route path="/assessment/:token/run" element={<AssessmentRunner />} />
            <Route path="/assessment/:token/complete" element={<CompletionPage />} />
            <Route path="/pipeline/:token" element={<CandidateFlowPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster position="top-center" toastOptions={{
        duration: 3000,
        style: { background: '#0f172a', color: '#fff', borderRadius: 10, padding: '12px 16px', fontSize: 14 },
        success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
        error: { iconTheme: { primary: '#e11d48', secondary: '#fff' } },
      }} />
    </AuthProvider>
  );
}
