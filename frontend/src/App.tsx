import React, { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import OneSignal from 'react-onesignal';
import { DesktopOnlyBarrier } from './components/DesktopOnlyBarrier';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { Sabilytics } from './components/Sabilytics';
import UnderMaintenance from './pages/UnderMaintenance';
import AuthPage from './features/auth/AuthPage';
import RegisterPage from './pages/RegisterPage';
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
import SyllabusTrackerPage from './pages/SyllabusTrackerPage';
import CandidateProfilePage from './pages/CandidateProfilePage';
import FalkeAiStudioPage from './pages/FalkeAiStudioPage';
import PracticeBySubjectPage from './pages/PracticeBySubjectPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

const AdminLayout = React.lazy(() => import('./components/AdminLayout'));
const AdminOverview = React.lazy(() => import('./pages/admin/AdminOverview'));
const AdminCandidates = React.lazy(() => import('./pages/admin/AdminCandidates'));
const AdminKeys = React.lazy(() => import('./pages/admin/AdminKeys'));
const AdminBilling = React.lazy(() => import('./pages/admin/AdminBilling'));
const SecureAccess = React.lazy(() => import('./pages/admin/SecureAccess'));

const routeMetadata: Record<string, { title: string; description: string }> = {
  '/': { title: 'Falke AI CBT Exam Arena — JAMB UTME Practice', description: 'Realistic JAMB UTME mocks, focused drills, explanations, and progress insights.' },
  '/arena': { title: 'Exam Arena — Falke AI CBT Exam Arena', description: 'Prepare with focused practice sessions and realistic exam simulations.' },
  '/register': { title: 'Register — Falke AI CBT Exam Arena', description: 'Create your candidate profile for JAMB UTME practice.' },
  '/auth': { title: 'Sign in — Falke AI CBT Exam Arena', description: 'Sign in or create your Falke AI CBT Exam Arena candidate profile.' },
  '/help': { title: 'Help Center — Falke AI CBT Exam Arena', description: 'Find answers and support for your Falke AI CBT Exam Arena account and exams.' },
  '/contact': { title: 'Contact — Falke AI CBT Exam Arena', description: 'Contact the Falke AI CBT Exam Arena support team.' },
  '/privacy': { title: 'Privacy Policy — Falke AI CBT Exam Arena', description: 'Read how Falke AI CBT Exam Arena handles personal data and privacy.' },
  '/terms': { title: 'Terms of Service — Falke AI CBT Exam Arena', description: 'Review the terms, subscriptions, refunds, and acceptable use rules.' },
};

function RouteMetadata() {
  const { pathname } = useLocation();
  useEffect(() => {
    const metadata = routeMetadata[pathname] || { title: 'Falke AI CBT Exam Arena', description: 'JAMB UTME preparation and exam practice from Falke AI CBT Exam Arena.' };
    document.title = metadata.title;
    const setMeta = (selector: string, attribute: string, value: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) { element = document.createElement('meta'); document.head.appendChild(element); }
      element.setAttribute(attribute, value);
    };
    setMeta('meta[name="description"]', 'content', metadata.description);
    setMeta('meta[property="og:title"]', 'content', metadata.title);
    setMeta('meta[property="og:description"]', 'content', metadata.description);
    
    // SEO-01: Set route-specific metadata and social preview images
    const currentUrl = `https://cbt.aurikrex.com${pathname}`;
    const defaultImage = 'https://cbt.aurikrex.com/pwa-512x512.png';
    setMeta('meta[property="og:url"]', 'content', currentUrl);
    setMeta('meta[property="og:image"]', 'content', defaultImage);
    setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');
    setMeta('meta[name="twitter:image"]', 'content', defaultImage);
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = `${window.location.origin}${pathname}`;
  }, [pathname]);
  return null;
}

function App() {
  const location = useLocation();
  const [isMaintenance, setIsMaintenance] = useState<boolean>(false);

  const checkMaintenance = useCallback(async () => {
    try {
      const apiBase = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, '');
      const res = await fetch(`${apiBase}/system/maintenance-status`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const active = Boolean(data.isMaintenance);
        setIsMaintenance(active);
        return active;
      }
    } catch {
      // Non-blocking on network failure
    }
    return false;
  }, []);

  useEffect(() => {
    checkMaintenance();
    const interval = setInterval(checkMaintenance, 15000);
    return () => clearInterval(interval);
  }, [checkMaintenance]);

  const oneSignalInitRef = useRef(false);
  useEffect(() => {
    if (oneSignalInitRef.current) return;
    oneSignalInitRef.current = true;
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return;
    }
    OneSignal.init({
      appId: import.meta.env.VITE_ONESIGNAL_APP_ID || 'b7622f37-8ca3-4304-922c-69438cc14d67',
      allowLocalhostAsSecureOrigin: true,
    }).catch((err) => {
      console.warn('OneSignal initialization skipped or failed:', err);
    });
  }, []);

  const userRole = typeof window !== 'undefined' ? localStorage.getItem('user_role') : null;
  const isStaff = userRole === 'admin' || userRole === 'super_admin';
  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/sys/auth-checkpoint');

  if (isMaintenance && !isAdminRoute && !isStaff) {
    return (
      <div className="min-h-screen bg-[#0a1020] text-slate-100 flex flex-col">
        <DesktopOnlyBarrier />
        <RouteMetadata />
        <UnderMaintenance onCheckStatus={checkMaintenance} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary selection:bg-primary selection:text-white flex flex-col">
      <DesktopOnlyBarrier />
      <RouteMetadata />
      <Sabilytics />
      <PwaInstallPrompt />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/arena" element={<LandingPage />} />
          <Route path="/register" element={<RegisterPage defaultTab="register" />} />
          <Route path="/verify-email" element={<RegisterPage defaultTab="register" />} />
          <Route path="/auth" element={<RegisterPage defaultTab="sign-in" />} />
          <Route path="/login" element={<RegisterPage defaultTab="sign-in" />} />
          <Route path="/dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
          <Route path="/exam-hub" element={<ProtectedRoute><ExamHub /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
          <Route path="/study" element={<ProtectedRoute><SyllabusTrackerPage /></ProtectedRoute>} />
          <Route path="/syllabus" element={<ProtectedRoute><SyllabusTrackerPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><CandidateProfilePage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><CandidateProfilePage /></ProtectedRoute>} />
          <Route path="/falke-ai" element={<ProtectedRoute><FalkeAiStudioPage /></ProtectedRoute>} />
          <Route path="/falke" element={<ProtectedRoute><FalkeAiStudioPage /></ProtectedRoute>} />
          <Route path="/mock-setup" element={<ProtectedRoute><MockSetupPage /></ProtectedRoute>} />
          <Route path="/practice" element={<ProtectedRoute><PracticeBySubjectPage /></ProtectedRoute>} />
          <Route path="/questions" element={<AdminRoute><QuestionBankPage /></AdminRoute>} />
          <Route path="/exam/:sessionId" element={<ProtectedRoute><ExamConsole /></ProtectedRoute>} />
          <Route path="/results/:resultId" element={<ProtectedRoute><ResultReview /></ProtectedRoute>} />
          <Route
            path="/admin/*"
            element={
              <Suspense
                fallback={
                  <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-bg-primary text-text-primary font-sans">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                    <p className="text-sm font-medium text-text-secondary">Loading Control Center...</p>
                  </div>
                }
              >
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
