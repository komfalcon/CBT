import { Navigate, Route, Routes } from 'react-router-dom';
import AuthPage from './features/auth/AuthPage';
import QuestionBankPage from './features/questions/QuestionBankPage';

function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/questions" element={<QuestionBankPage />} />
      <Route path="*" element={<Navigate to="/questions" replace />} />
    </Routes>
  );
}

export default App;
