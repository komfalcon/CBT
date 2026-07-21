import { Navigate } from 'react-router-dom';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  exp: number;
}

function parseJwt(token: string): JwtPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('accessToken');
  if (!token || token.trim() === '') {
    return <Navigate to="/auth?mode=login" replace />;
  }

  const payload = parseJwt(token);
  if (!payload || (payload.role !== 'admin' && payload.role !== 'super_admin')) {
    return <Navigate to="/dashboard" replace />;
  }

  if (payload.exp * 1000 < Date.now()) {
    localStorage.removeItem('accessToken');
    return <Navigate to="/auth?mode=login" replace />;
  }

  return <>{children}</>;
}
