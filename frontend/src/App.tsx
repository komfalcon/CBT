import React, { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AuthPage from './features/auth/AuthPage';
import QuestionBankPage from './features/questions/QuestionBankPage';
import LandingPage from './pages/LandingPage';
import StudentDashboard from './pages/StudentDashboard';
import MockSetupPage from './pages/MockSetupPage';
import ExamConsole from './features/exam/ExamConsole';
import ResultReview from './features/results/ResultReview';
import HelpCenter from './pages/HelpCenter';
import ContactUs from './pages/ContactUs';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

const AdminLayout = React.lazy(() => import('./components/AdminLayout'));
const AdminOverview = React.lazy(() => import('./pages/admin/AdminOverview'));
const AdminCandidates = React.lazy(() => import('./pages/admin/AdminCandidates'));
const AdminKeys = React.lazy(() => import('./pages/admin/AdminKeys'));
const AdminBilling = React.lazy(() => import('./pages/admin/AdminBilling'));
const SecureAccess = React.lazy(() => import('./pages/admin/SecureAccess'));

function App() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary selection:bg-primary selection:text-white flex flex-col">
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
          <Route path="/mock-setup" element={<ProtectedRoute><MockSetupPage /></ProtectedRoute>} />
          <Route path="/questions" element={<ProtectedRoute><QuestionBankPage /></ProtectedRoute>} />
          <Route path="/exam/:sessionId" element={<ProtectedRoute><ExamConsole /></ProtectedRoute>} />
          <Route path="/results/:resultId" element={<ProtectedRoute><ResultReview /></ProtectedRoute>} />
          <Route
            path="/admin/*"
            element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0b0f19] text-slate-400">Loading Control Center...</div>}>
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              </Suspense>
            }
          >
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<AdminOverview />} />
            <Route path="candidates" element={<AdminCandidates />} />
            <Route path="keys" element={<AdminKeys />} />
            <Route path="billing" element={<AdminBilling />} />
            <Route path="questions" element={<QuestionBankPage />} />
          </Route>
          <Route 
            path="/sys/auth-checkpoint" 
            element={
              <Suspense fallback={<div className="min-h-screen bg-bg-primary" />}>
                <SecureAccess />
              </Suspense>
            } 
          />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
