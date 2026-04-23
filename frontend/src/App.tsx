import { Navigate, Route, Routes } from 'react-router-dom';
import AuthPage from './features/auth/AuthPage';

function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
}

export default App;
