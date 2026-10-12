import { useEffect, useState } from 'react';
import { getMe } from '../features/auth/api';

export type AuthStatus = 'signed-in' | 'signed-out';

/** Same keys that `features/auth/api.ts` reads and writes. */
function hasStoredToken(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem('accessToken') || localStorage.getItem('token'));
}

/**
 * Public-page view of the visitor's session.
 *
 * `ProtectedRoute` decides access with `getMe()`, so this does the same rather than trusting a
 * token that may be stale. A stored token is treated as signed in straight away to avoid a
 * flash of sign-up buttons, then confirmed with the server. Only a 401/403 flips it back to
 * signed out; a network error leaves the optimistic state alone.
 *
 * Anonymous visitors (no stored token) never trigger a request.
 */
export function useAuthStatus(): AuthStatus {
  const [status, setStatus] = useState<AuthStatus>(() => (hasStoredToken() ? 'signed-in' : 'signed-out'));

  useEffect(() => {
    if (!hasStoredToken()) return;
    let active = true;
    getMe()
      .then(() => {
        if (active) setStatus('signed-in');
      })
      .catch((error: { response?: { status?: number } }) => {
        const code = error?.response?.status;
        if (active && (code === 401 || code === 403)) setStatus('signed-out');
      });
    return () => {
      active = false;
    };
  }, []);

  return status;
}
