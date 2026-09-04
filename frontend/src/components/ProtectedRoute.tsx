import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getMe } from '../features/auth/api';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    let mounted = true;
    getMe().then(() => mounted && setState('authenticated')).catch(() => mounted && setState('unauthenticated'));
    return () => { mounted = false; };
  }, []);

  if (state === 'loading') {
    return <div className="min-h-screen bg-bg-primary flex items-center justify-center text-text-secondary">Checking your session…</div>;
  }
  if (state === 'unauthenticated') return <Navigate to="/auth?mode=login" replace />;
  return <>{children}</>;
}
