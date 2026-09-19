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

  if (state === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary font-sans text-text-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="text-sm font-medium text-text-secondary">Verifying administrator credentials…</p>
        </div>
      </div>
    );
  }
  if (state === 'unauthenticated') return <Navigate to="/auth?mode=login" replace />;
  if (state === 'forbidden') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
