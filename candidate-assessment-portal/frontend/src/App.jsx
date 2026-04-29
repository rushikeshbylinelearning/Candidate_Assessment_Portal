import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import HRLayout from './components/layout/HRLayout';
import Login from './pages/hr/Login';
import Dashboard from './pages/hr/Dashboard';
import Candidates from './pages/hr/Candidates';
import CandidateDetail from './pages/hr/CandidateDetail';
import AssessmentReview from './pages/hr/AssessmentReview';
import Roles from './pages/hr/Roles';
import Questions from './pages/hr/Questions';
import CreateAssessment from './pages/hr/CreateAssessment';
import AssessmentBuilderStandard from './pages/hr/AssessmentBuilderStandard';
import AssessmentBuilderAdaptive from './pages/hr/AssessmentBuilderAdaptive';
import AssessmentBuilderPDF from './pages/hr/AssessmentBuilderPDF';
import AssessmentDetail from './pages/hr/AssessmentDetail';
import Analytics from './pages/hr/Analytics';
import Notes from './pages/hr/Notes';
import AccessPage from './pages/candidate/AccessPage';
import StartPage from './pages/candidate/StartPage';
import AssessmentRunner from './pages/candidate/AssessmentRunner';
import CompletionPage from './pages/candidate/CompletionPage';
import CandidateFlowPage from './pages/candidate/CandidateFlowPage';
import CandidateJourneyPage from './pages/hr/CandidateJourneyPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* HR Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/hr" element={<HRLayout />}>
            <Route index element={<Navigate to="/hr/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="candidates" element={<Candidates />} />
            <Route path="candidates/:id" element={<CandidateDetail />} />
            <Route path="candidates/:id/assessment-review" element={<AssessmentReview />} />
            <Route path="roles" element={<Roles />} />
            <Route path="questions" element={<Questions />} />
            <Route path="assessments/create" element={<CreateAssessment />} />
            <Route path="assessments/create/standard" element={<AssessmentBuilderStandard />} />
            <Route path="assessments/create/adaptive" element={<AssessmentBuilderAdaptive />} />
            <Route path="assessments/create/pdf" element={<AssessmentBuilderPDF />} />
            <Route path="assessments/:id" element={<AssessmentDetail />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="notes" element={<Notes />} />
            <Route path="pipeline/:pipelineId" element={<CandidateJourneyPage />} />
          </Route>

          {/* Candidate Assessment Routes (Public) */}
          <Route path="/" element={<AccessPage />} />
          <Route path="/assessment/:token" element={<StartPage />} />
          <Route path="/assessment/:token/run" element={<AssessmentRunner />} />
          <Route path="/assessment/:token/complete" element={<CompletionPage />} />
          <Route path="/pipeline/:token" element={<CandidateFlowPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        duration: 3000,
        style: { background: '#0f172a', color: '#fff', borderRadius: 10, padding: '12px 16px', fontSize: 14 },
        success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
        error: { iconTheme: { primary: '#e11d48', secondary: '#fff' } },
      }} />
    </AuthProvider>
  );
}
