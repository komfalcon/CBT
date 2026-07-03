import { Navigate, Route, Routes } from 'react-router-dom';
import AuthPage from './features/auth/AuthPage';
import QuestionBankPage from './features/questions/QuestionBankPage';
import LandingPage from './pages/LandingPage';
import StudentDashboard from './pages/StudentDashboard';
import ExamConsole from './features/exam/ExamConsole';
import ResultReview from './features/results/ResultReview';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/dashboard" element={<StudentDashboard />} />
      <Route path="/questions" element={<QuestionBankPage />} />
      <Route path="/exam/:sessionId" element={<ExamConsole />} />
      <Route path="/results/:resultId" element={<ResultReview />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
