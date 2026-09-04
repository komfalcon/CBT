import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getMe } from '../features/auth/api';

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'loading' | 'admin' | 'forbidden' | 'unauthenticated'>('loading');

  useEffect(() => {
    let mounted = true;
    getMe()
      .then((profile) => mounted && setState(profile.role === 'admin' || profile.role === 'super_admin' ? 'admin' : 'forbidden'))
      .catch(() => mounted && setState('unauthenticated'));
    return () => { mounted = false; };
  }, []);

  if (state === 'loading') return <div className="min-h-screen bg-bg-primary flex items-center justify-center text-text-secondary">Checking your admin session…</div>;
  if (state === 'unauthenticated') return <Navigate to="/auth?mode=login" replace />;
  if (state === 'forbidden') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
