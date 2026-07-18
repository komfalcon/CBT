import { Navigate, Route, Routes } from 'react-router-dom';
import AuthPage from './features/auth/AuthPage';
import QuestionBankPage from './features/questions/QuestionBankPage';
import LandingPage from './pages/LandingPage';
import StudentDashboard from './pages/StudentDashboard';
import ExamConsole from './features/exam/ExamConsole';
import ResultReview from './features/results/ResultReview';
import HelpCenter from './pages/HelpCenter';
import ContactUs from './pages/ContactUs';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
      <Route path="/questions" element={<ProtectedRoute><QuestionBankPage /></ProtectedRoute>} />
      <Route path="/exam/:sessionId" element={<ProtectedRoute><ExamConsole /></ProtectedRoute>} />
      <Route path="/results/:resultId" element={<ProtectedRoute><ResultReview /></ProtectedRoute>} />
      <Route path="/help" element={<HelpCenter />} />
      <Route path="/contact" element={<ContactUs />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
