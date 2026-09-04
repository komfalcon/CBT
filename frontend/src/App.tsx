import React, { Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import AuthPage from './features/auth/AuthPage';
import QuestionBankPage from './features/questions/QuestionBankPage';
import ExamArenaLanding from './pages/ExamArenaLanding';
import LandingPage from './pages/LandingPage';
import StudentDashboard from './pages/StudentDashboard';
import MockSetupPage from './pages/MockSetupPage';
import ExamConsole from './features/exam/ExamConsole';
import ResultReview from './features/results/ResultReview';
import HelpCenter from './pages/HelpCenter';
import ContactUs from './pages/ContactUs';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import ExamHub from './pages/ExamHub';
import Leaderboard from './pages/Leaderboard';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

const AdminLayout = React.lazy(() => import('./components/AdminLayout'));
const AdminOverview = React.lazy(() => import('./pages/admin/AdminOverview'));
const AdminCandidates = React.lazy(() => import('./pages/admin/AdminCandidates'));
const AdminKeys = React.lazy(() => import('./pages/admin/AdminKeys'));
const AdminBilling = React.lazy(() => import('./pages/admin/AdminBilling'));
const SecureAccess = React.lazy(() => import('./pages/admin/SecureAccess'));

const routeMetadata: Record<string, { title: string; description: string }> = {
  '/': { title: 'Aurikrex Exam Arena — JAMB UTME Practice', description: 'Realistic JAMB UTME mocks, focused drills, explanations, and progress insights.' },
  '/arena': { title: 'Exam Arena — Aurikrex Exam Arena', description: 'Prepare with focused practice sessions and realistic exam simulations.' },
  '/auth': { title: 'Sign in — Aurikrex Exam Arena', description: 'Sign in or create your Aurikrex Exam Arena candidate profile.' },
  '/help': { title: 'Help Center — Aurikrex Exam Arena', description: 'Find answers and support for your Aurikrex Exam Arena account and exams.' },
  '/contact': { title: 'Contact — Aurikrex Exam Arena', description: 'Contact the Aurikrex Exam Arena support team.' },
  '/privacy': { title: 'Privacy Policy — Aurikrex Exam Arena', description: 'Read how Aurikrex Exam Arena handles personal data and privacy.' },
  '/terms': { title: 'Terms of Service — Aurikrex Exam Arena', description: 'Review the terms, subscriptions, refunds, and acceptable use rules.' },
};

function RouteMetadata() {
  const { pathname } = useLocation();
  useEffect(() => {
    const metadata = routeMetadata[pathname] || { title: 'Aurikrex Exam Arena', description: 'JAMB UTME preparation and exam practice from Aurikrex Exam Arena.' };
    document.title = metadata.title;
    const setMeta = (selector: string, attribute: string, value: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) { element = document.createElement('meta'); document.head.appendChild(element); }
      element.setAttribute(attribute, value);
    };
    setMeta('meta[name="description"]', 'content', metadata.description);
    setMeta('meta[property="og:title"]', 'content', metadata.title);
    setMeta('meta[property="og:description"]', 'content', metadata.description);
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = `${window.location.origin}${pathname}`;
  }, [pathname]);
  return null;
}

function App() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary selection:bg-primary selection:text-white flex flex-col">
      <RouteMetadata />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/arena" element={<ExamArenaLanding />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
          <Route path="/exam-hub" element={<ProtectedRoute><ExamHub /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<Leaderboard />} />
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
