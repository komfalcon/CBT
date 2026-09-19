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
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary font-sans text-text-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="text-sm font-medium text-text-secondary">Verifying your study session…</p>
        </div>
      </div>
    );
  }
  if (state === 'unauthenticated') return <Navigate to="/auth?mode=login" replace />;
  return <>{children}</>;
}
