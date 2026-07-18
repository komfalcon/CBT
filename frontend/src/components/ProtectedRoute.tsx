import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem('accessToken');
  if (!token || token.trim() === '') {
    return <Navigate to="/auth?mode=login" replace />;
  }
  return <>{children}</>;
}
