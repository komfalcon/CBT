import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Mail,
  Moon,
  RefreshCw,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { siteConfig } from '../config/siteConfig';
import { examConfig } from '../config/examConfig';
import {
  forgotPassword,
  googleLogin,
  login,
  loginWithCbtKey,
  register,
  resendVerification,
  resetPassword,
  verifyEmail,
  verifyOtp,
} from '../features/auth/api';
import { evaluatePassword, isValidNigerianPhone } from '../features/auth/validation';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type Tab = 'cbt-key' | 'sign-in' | 'register';
type View = Tab | 'verify-email' | 'forgot-password' | 'reset-password' | 'mfa';
type Feedback = { type: 'error' | 'success'; text: string } | null;

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'cbt-key', label: 'CBT Key' },
  { id: 'sign-in', label: 'Sign In' },
  { id: 'register', label: 'Register' },
];

const GOOGLE_CLIENT_ID: string = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const GIS_SRC = 'https://accounts.google.com/gsi/client';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    google?: any;
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function apiError(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string | string[] } }; message?: string };
  const msg = e?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(' ');
  return msg || fallback;
}

/** Map URL params (?tab= / ?mode= / ?token= / ?key= / ?code=) to an initial view. Supports legacy /auth and /verify-email links. */
function viewFromParams(params: URLSearchParams, fallback: Tab): View {
  if (params.get('token') && !params.get('code')) return 'reset-password';
  if (
    params.get('code') ||
    params.get('verify') ||
    params.get('status') === 'success' ||
    (typeof window !== 'undefined' && window.location.pathname === '/verify-email')
  ) {
    return 'verify-email';
  }
  if (params.get('key') || params.get('cbt_key') || params.get('cbtkey')) return 'cbt-key';
  const raw = (params.get('tab') || params.get('mode') || '').toLowerCase();
  if (['cbt-key', 'cbt_key', 'cbtkey'].includes(raw)) return 'cbt-key';
  if (['sign-in', 'signin', 'login'].includes(raw)) return 'sign-in';
  if (raw === 'register' || raw === 'signup') return 'register';
  if (raw === 'verify-email' || raw === 'verify') return 'verify-email';
  if (raw === 'forgot-password' || raw === 'forgot') return 'forgot-password';
  if (raw === 'reset-password' || raw === 'reset') return 'reset-password';
  return fallback;
}

/* ------------------------------------------------------------------ */
/* Small presentational pieces                                         */
/* ------------------------------------------------------------------ */

const inputClass =
  'w-full rounded-lg border border-[var(--arena-input-border)] bg-[var(--arena-input-bg)] px-3.5 py-2.5 text-xs sm:text-sm text-[var(--arena-text-primary)] placeholder-[var(--arena-text-muted)] focus:border-[var(--arena-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--arena-primary)] transition-all aria-[invalid=true]:border-[var(--arena-red)]';

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-[var(--arena-text-primary)] mb-1.5">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-[11px] font-medium text-[var(--arena-red)]">
          {error}
        </p>
      )}
    </div>
  );
}

function PasswordInput({
  id,
  value,
  onChange,
  label,
  autoComplete,
  error,
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  label: string;
  autoComplete: string;
  error?: string;
  describedBy?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <Field id={id} label={label} error={error}>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          required
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={[error ? `${id}-error` : '', describedBy || ''].filter(Boolean).join(' ') || undefined}
          className={`${inputClass} pr-10`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--arena-text-muted)] hover:text-[var(--arena-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--arena-primary)]"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </Field>
  );
}

function StrengthMeter({ id, password }: { id: string; password: string }) {
  const { results, passedCount, strength } = evaluatePassword(password);
  const barColor =
    passedCount === 0
      ? 'bg-slate-300 dark:bg-slate-700'
      : passedCount <= 2
      ? 'bg-rose-500'
      : passedCount === 3
      ? 'bg-amber-500'
      : 'bg-emerald-500';

  return (
    <div id={id} className="mt-2.5 space-y-2" aria-live="polite">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-[var(--arena-text-muted)]">Password strength</span>
        <span className="font-semibold text-[var(--arena-text-primary)]">{strength || '—'}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--arena-bg-subtle)] border border-[var(--arena-border-subtle)]">
        <div
          className={`h-full ${barColor} transition-all duration-300 motion-reduce:transition-none`}
          style={{ width: `${(passedCount / results.length) * 100}%` }}
        />
      </div>
      <ul className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
        {results.map((rule) => (
          <li
            key={rule.id}
            className={`flex items-center gap-1.5 ${
              rule.passed ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-[var(--arena-text-muted)]'
            }`}
          >
            {rule.passed ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <X className="h-3.5 w-3.5" aria-hidden="true" />}
            <span>
              {rule.label}
              <span className="sr-only">{rule.passed ? ' — met' : ' — not met'}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SubmitButton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      aria-busy={loading}
      className="w-full rounded-lg bg-[var(--arena-primary)] py-3 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--arena-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--arena-primary)] focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      <span>{children}</span>
    </button>
  );
}

function ViewHeader({ title, subtitle }: { title: string; subtitle: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--arena-text-primary)]">{title}</h2>
      <p className="mt-1 text-xs sm:text-sm text-[var(--arena-text-secondary)]">{subtitle}</p>
    </div>
  );
}

function BackLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--arena-primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--arena-primary)] rounded"
    >
      <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
      {children}
    </button>
  );
}

/** Official multicolour Google "G" mark (brand asset, not a UI icon). */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

/**
 * Google Sign-In: renders the official GIS button when VITE_GOOGLE_CLIENT_ID is set.
 * Without a client ID it renders a visibly disabled placeholder so the layout matches the design.
 */
function GoogleButton({
  isDark,
  onCredential,
  onFallbackClick,
  label,
}: {
  isDark: boolean;
  onCredential: (credential: string) => void;
  onFallbackClick?: () => void;
  label: 'signin_with' | 'signup_with';
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  callbackRef.current = onCredential;
  const [ready, setReady] = useState(Boolean(window.google?.accounts?.id));

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || ready) return;
    let script = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    const onLoad = () => setReady(true);
    if (!script) {
      script = document.createElement('script');
      script.src = GIS_SRC;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
    script.addEventListener('load', onLoad);
    return () => script?.removeEventListener('load', onLoad);
  }, [ready]);

  useEffect(() => {
    const google = window.google;
    const el = containerRef.current;
    if (!GOOGLE_CLIENT_ID || !ready || !google?.accounts?.id || !el) return;
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (res: { credential?: string }) => {
        if (res.credential) callbackRef.current(res.credential);
      },
    });
    el.innerHTML = '';
    google.accounts.id.renderButton(el, {
      theme: isDark ? 'filled_black' : 'outline',
      size: 'large',
      shape: 'rectangular',
      text: label,
      logo_alignment: 'center',
      width: Math.min(400, Math.max(200, el.offsetWidth || 320)),
    });
  }, [ready, isDark, label]);

  return (
    <div className="relative w-full">
      {/* Visual button that is ALWAYS the exact same length (w-full), height (py-3), radius, and styling as the Sign in button */}
      <button
        type="button"
        onClick={onFallbackClick}
        className="w-full flex items-center justify-center gap-2.5 rounded-lg border border-[var(--arena-border)] bg-[var(--arena-surface)] hover:bg-[var(--arena-bg-subtle)] active:scale-[0.99] py-3 text-xs sm:text-sm font-semibold text-[var(--arena-text-primary)] transition-all shadow-sm cursor-pointer"
      >
        <GoogleMark />
        <span>{label === 'signup_with' ? 'Sign up with Google' : 'Sign in with Google'}</span>
      </button>

      {/* When GIS client ID is configured, render the interactive GIS button invisibly over the entire button area so clicking anywhere triggers GIS */}
      {GOOGLE_CLIENT_ID && (
        <div
          ref={containerRef}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full opacity-[0.001] overflow-hidden flex items-center justify-center cursor-pointer pointer-events-auto [&>div]:!w-full [&>div]:!h-full [&_iframe]:!w-full [&_iframe]:!h-full [&_iframe]:!min-w-full [&_iframe]:!scale-125"
        />
      )}
    </div>
  );
}

function OrDivider({ text = 'or continue with Google' }: { text?: string }) {
  return (
    <div className="my-5 flex items-center gap-3 text-[11px] font-medium text-[var(--arena-text-muted)]">
      <span className="h-px flex-1 bg-[var(--arena-border)]" />
      {text}
      <span className="h-px flex-1 bg-[var(--arena-border)]" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function RegisterPage({ defaultTab = 'register' }: { defaultTab?: Tab }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme, setTheme } = useTheme();

  const [view, setView] = useState<View>(() => viewFromParams(searchParams, defaultTab));
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Register
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Sign in
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [otp, setOtp] = useState('');

  // CBT key
  const [cbtKey, setCbtKey] = useState(
    () => searchParams.get('key') || searchParams.get('cbt_key') || searchParams.get('cbtkey') || ''
  );

  // Verify email / forgot / reset
  const [pendingEmail, setPendingEmail] = useState(() => searchParams.get('email') || '');
  const [verificationCode, setVerificationCode] = useState(() => searchParams.get('code') || '');
  const [resetCode, setResetCode] = useState(() => searchParams.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Email verification link flow states
  const [autoVerifying, setAutoVerifying] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showManualCode, setShowManualCode] = useState(false);

  // Keep view in sync with back/forward navigation of ?tab=
  useEffect(() => {
    setView((current) => {
      const next = viewFromParams(searchParams, defaultTab);
      const isSubFlow = ['verify-email', 'mfa'].includes(current);
      return isSubFlow && !searchParams.get('tab') ? current : next;
    });
  }, [searchParams, defaultTab]);

  // Auto-verify if user lands via email link: ?email=...&code=...
  useEffect(() => {
    const urlEmail = searchParams.get('email');
    const urlCode = searchParams.get('code');
    const statusParam = searchParams.get('status');

    if (statusParam === 'success') {
      setEmailVerified(true);
      if (urlEmail) {
        setPendingEmail(urlEmail);
        setLoginEmail(urlEmail);
      }
      setFeedback({ type: 'success', text: 'Email verified successfully! You can now sign in.' });
      return;
    }

    if (urlEmail && urlCode && !emailVerified && !autoVerifying) {
      setPendingEmail(urlEmail);
      setVerificationCode(urlCode);
      setAutoVerifying(true);
      verifyEmail({ email: urlEmail, code: urlCode })
        .then((res) => {
          setEmailVerified(true);
          setLoginEmail(urlEmail);
          setFeedback({ type: 'success', text: res.message || 'Email verified successfully! You can now sign in.' });
        })
        .catch((err) => {
          setFeedback({
            type: 'error',
            text: apiError(err, 'Verification link has expired or is invalid. Please request a new link.'),
          });
        })
        .finally(() => {
          setAutoVerifying(false);
        });
    }
  }, [searchParams, emailVerified, autoVerifying]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const isDark =
    theme === 'dark' ||
    (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const goTo = useCallback(
    (next: View) => {
      setView(next);
      setFeedback(null);
      setErrors({});
      if (next === 'cbt-key' || next === 'sign-in' || next === 'register' || next === 'forgot-password') {
        setSearchParams({ tab: next }, { replace: true });
      }
    },
    [setSearchParams]
  );

  const enterArena = () => navigate(siteConfig.urls.dashboard);

  /* ---------------- Handlers ---------------- */

  const handleGoogle = async (credential: string) => {
    setFeedback(null);
    setLoading(true);
    try {
      const res = await googleLogin({ credential });
      if (res.requiresMFA) {
        goTo('mfa');
        setFeedback({ type: 'success', text: 'Enter the 6-digit code from your authenticator app.' });
      } else {
        enterArena();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: apiError(err, 'Google sign-in failed. Please use email or your CBT key.') });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const next: Record<string, string> = {};
    if (fullName.trim().length < 2) next.fullName = 'Enter your full name.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Enter a valid email address.';
    if (!isValidNigerianPhone(phone)) next.phone = 'Use a Nigerian number starting with +234 or 0.';
    if (!evaluatePassword(password).isValid) next.password = 'Your password must meet all four rules below.';
    if (confirmPassword !== password) next.confirmPassword = 'Passwords do not match.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      const res = await register({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.replace(/[\s-]/g, '') || undefined,
        password,
      });
      setPendingEmail(email.trim());
      setResendCooldown(60);
      goTo('verify-email');
      setFeedback({ type: 'success', text: res.message || 'Registration successful! Verification link sent to your inbox.' });
    } catch (err) {
      setFeedback({ type: 'error', text: apiError(err, 'We could not create your profile. Please try again.') });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!pendingEmail || resendCooldown > 0) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await resendVerification(pendingEmail);
      setResendCooldown(60);
      setFeedback({ type: 'success', text: res.message || 'A fresh verification link has been sent to your email.' });
    } catch (err) {
      setFeedback({ type: 'error', text: apiError(err, 'Could not resend verification link. Please try again.') });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);
    try {
      const res = await login({ email: loginEmail.trim(), password: loginPassword });
      if (res.requiresMFA) {
        goTo('mfa');
        setFeedback({ type: 'success', text: 'Enter the 6-digit code from your authenticator app.' });
      } else {
        enterArena();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: apiError(err, 'Invalid email or password.') });
    } finally {
      setLoading(false);
    }
  };

  const handleMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);
    try {
      await verifyOtp({ otp: otp.trim() });
      enterArena();
    } catch (err) {
      setFeedback({ type: 'error', text: apiError(err, 'That code is invalid or has expired.') });
    } finally {
      setLoading(false);
    }
  };

  const handleCbtKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!cbtKey.trim()) {
      setErrors({ cbtKey: 'Enter the CBT key on your slip or welcome email.' });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await loginWithCbtKey({ cbtKey: cbtKey.trim() });
      enterArena();
    } catch (err) {
      setFeedback({ type: 'error', text: apiError(err, 'That CBT key is invalid or not yet verified.') });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!verificationCode.trim()) {
      setFeedback({ type: 'error', text: 'Enter the 6-digit verification code.' });
      return;
    }
    setLoading(true);
    try {
      const res = await verifyEmail({ email: pendingEmail, code: verificationCode.trim() });
      setEmailVerified(true);
      setLoginEmail(pendingEmail);
      setFeedback({ type: 'success', text: res.message || 'Email verified successfully! You can now sign in.' });
    } catch (err) {
      setFeedback({ type: 'error', text: apiError(err, 'That code is invalid or has expired.') });
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!/^\S+@\S+\.\S+$/.test(pendingEmail.trim())) {
      setErrors({ forgotEmail: 'Enter the email linked to your account.' });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const res = await forgotPassword(pendingEmail.trim());
      goTo('reset-password');
      setFeedback({ type: 'success', text: res.message || 'If that email is registered, a 6-digit reset code is on its way.' });
    } catch (err) {
      setFeedback({ type: 'error', text: apiError(err, 'We could not send a reset code. Please try again.') });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const next: Record<string, string> = {};
    if (!pendingEmail.trim()) next.resetEmail = 'Enter the email linked to your account.';
    if (!resetCode.trim()) next.resetCode = 'Enter the 6-digit code from your email.';
    if (!evaluatePassword(newPassword).isValid) next.newPassword = 'Your new password must meet all four rules.';
    if (confirmNewPassword !== newPassword) next.confirmNewPassword = 'Passwords do not match.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      const res = await resetPassword({ email: pendingEmail.trim(), code: resetCode.trim(), password: newPassword });
      setLoginEmail(pendingEmail.trim());
      setNewPassword('');
      setConfirmNewPassword('');
      goTo('sign-in');
      setFeedback({ type: 'success', text: res.message || 'Password updated. Sign in with your new password.' });
    } catch (err) {
      setFeedback({ type: 'error', text: apiError(err, 'That code is invalid or has expired.') });
    } finally {
      setLoading(false);
    }
  };

  const activeTab: Tab | null = view === 'cbt-key' || view === 'sign-in' || view === 'register' ? view : null;

  /* ---------------- Render ---------------- */

  return (
    <div className="min-h-screen bg-[var(--arena-bg)] text-[var(--arena-text-primary)] transition-colors antialiased flex flex-col justify-center py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-[var(--arena-border)] shadow-xl grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr]">
        {/* LEFT PANEL */}
        <aside className="flex flex-col justify-between bg-[var(--arena-reg-left-bg)] p-8 sm:p-10 border-b lg:border-b-0 lg:border-r border-[var(--arena-border)]">
          <div>
            <Link to="/" className="flex items-center gap-2.5 group w-fit rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--arena-primary)]" aria-label={`${siteConfig.name} home`}>
              <img src="/aurikrex-logo.png" alt="" width={32} height={32} className="h-8 w-8 rounded-lg object-contain shadow-sm transition-transform group-hover:scale-105 motion-reduce:transition-none" />
              <span className="text-base font-bold text-[var(--arena-text-primary)]">{siteConfig.name}</span>
            </Link>

            <div className="mt-12 sm:mt-16">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--arena-text-primary)] leading-tight">
                Your UTME cockpit, ready when you are.
              </h1>
              <p className="mt-3 text-xs sm:text-sm text-[var(--arena-text-secondary)] leading-relaxed">
                Practise under real exam conditions and see exactly where every mark goes.
              </p>
            </div>

            <ul className="mt-10 space-y-5">
              <li className="flex items-center gap-3.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-xs sm:text-sm font-medium">Full {examConfig.totalQuestions}-question timed CBT mocks</span>
              </li>
              <li className="flex items-center gap-3.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25">
                  <BarChart3 className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-xs sm:text-sm font-medium">Subject-by-subject readiness diagnostics</span>
              </li>
              <li className="flex items-center gap-3.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-xs sm:text-sm font-medium">Falke AI explanations in English or Pidgin</span>
              </li>
            </ul>
          </div>

          <div className="mt-12 pt-6">
            <div className="inline-block rounded-lg border border-[var(--arena-border)] bg-[var(--arena-surface)]/70 px-3.5 py-2 text-[11px] font-medium text-[var(--arena-text-secondary)] shadow-sm">
              Public beta · Free access, no payment card required.
            </div>
          </div>
        </aside>

        {/* RIGHT PANEL */}
        <main className="flex flex-col bg-[var(--arena-reg-right-bg)] p-8 sm:p-10">
          <div className="flex items-center justify-between gap-4 border-b border-[var(--arena-border)] pb-4 mb-8">
            <div role="tablist" aria-label="Account access" className="flex items-center gap-1.5 p-1 rounded-lg bg-[var(--arena-bg-subtle)] border border-[var(--arena-border)] text-xs font-semibold">
              {TABS.map((tab) => {
                const selected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => goTo(tab.id)}
                    className={`px-3 py-1.5 rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--arena-primary)] ${
                      selected
                        ? 'bg-[var(--arena-surface)] text-[var(--arena-text-primary)] shadow-sm'
                        : 'text-[var(--arena-text-secondary)] hover:text-[var(--arena-text-primary)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              aria-pressed={isDark}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--arena-border)] bg-[var(--arena-surface)] text-[var(--arena-text-secondary)] transition-colors hover:text-[var(--arena-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--arena-primary)]"
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
            </button>
          </div>

          {feedback && (
            <div
              role={feedback.type === 'error' ? 'alert' : 'status'}
              className={`mb-6 flex items-start gap-2.5 rounded-lg border p-3 text-xs ${
                feedback.type === 'error'
                  ? 'border-[var(--arena-red-border)] bg-[var(--arena-red-bg)] text-[var(--arena-red)]'
                  : 'border-[var(--arena-green-border)] bg-[var(--arena-green-bg)] text-[var(--arena-green)]'
              }`}
            >
              {feedback.type === 'error' ? <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> : <Check className="h-4 w-4 shrink-0 mt-0.5" />}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* REGISTER */}
          {view === 'register' && (
            <section role="tabpanel" aria-label="Register">
              <ViewHeader title="Create your candidate profile" subtitle="Free during the public beta." />
              <form onSubmit={handleRegister} noValidate className="space-y-4">
                <Field id="fullName" label="Full name" error={errors.fullName}>
                  <input id="fullName" type="text" required autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Amaka Okafor" aria-invalid={Boolean(errors.fullName)} aria-describedby={errors.fullName ? 'fullName-error' : undefined} className={inputClass} />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field id="email" label="Email address" error={errors.email}>
                    <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.ng" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} className={inputClass} />
                  </Field>
                  <Field id="phone" label="Phone (optional)" error={errors.phone}>
                    <input id="phone" type="tel" autoComplete="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234 803 000 0000" aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'phone-error' : undefined} className={inputClass} />
                  </Field>
                </div>
                <div>
                  <PasswordInput id="password" label="Password" autoComplete="new-password" value={password} onChange={setPassword} error={errors.password} describedBy="password-rules" />
                  <StrengthMeter id="password-rules" password={password} />
                </div>
                <PasswordInput id="confirmPassword" label="Confirm password" autoComplete="new-password" value={confirmPassword} onChange={setConfirmPassword} error={errors.confirmPassword} />
                <div className="pt-2">
                  <SubmitButton loading={loading}>Create profile</SubmitButton>
                </div>
              </form>
              <OrDivider text="or continue with Google" />
              <GoogleButton
                isDark={isDark}
                onCredential={handleGoogle}
                onFallbackClick={() =>
                  setFeedback({
                    type: 'error',
                    text: 'Google Sign-In is initializing. You can sign up with your email above in seconds.',
                  })
                }
                label="signup_with"
              />
              <p className="mt-5 text-center text-[11px] text-[var(--arena-text-muted)]">
                By creating a profile you agree to the{' '}
                <Link to={siteConfig.urls.termsOfService} className="underline hover:text-[var(--arena-text-primary)]">Terms</Link>{' '}
                and{' '}
                <Link to={siteConfig.urls.privacyPolicy} className="underline hover:text-[var(--arena-text-primary)]">Privacy Policy</Link>.
              </p>
            </section>
          )}

          {/* SIGN IN */}
          {view === 'sign-in' && (
            <section role="tabpanel" aria-label="Sign in">
              <ViewHeader title="Welcome back" subtitle="Sign in to continue your practice." />
              <form onSubmit={handleSignIn} className="space-y-4">
                <Field id="loginEmail" label="Email address">
                  <input id="loginEmail" type="email" required autoComplete="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="you@example.ng" className={inputClass} />
                </Field>
                <div>
                  <PasswordInput id="loginPassword" label="Password" autoComplete="current-password" value={loginPassword} onChange={setLoginPassword} />
                  <div className="mt-2 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setPendingEmail(loginEmail);
                        goTo('forgot-password');
                      }}
                      className="text-[11px] font-semibold text-[var(--arena-primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--arena-primary)] rounded"
                    >
                      Forgot your password?
                    </button>
                  </div>
                </div>
                <div className="pt-2">
                  <SubmitButton loading={loading}>Sign in</SubmitButton>
                </div>
              </form>
              <OrDivider text="or continue with Google" />
              <GoogleButton
                isDark={isDark}
                onCredential={handleGoogle}
                onFallbackClick={() =>
                  setFeedback({
                    type: 'error',
                    text: 'Google Sign-In is initializing. Please sign in with your email or CBT key above.',
                  })
                }
                label="signin_with"
              />
              <p className="mt-5 text-center text-[11px] text-[var(--arena-text-muted)]">
                New here?{' '}
                <button type="button" onClick={() => goTo('register')} className="font-semibold text-[var(--arena-primary)] hover:underline">
                  Create a free account
                </button>
              </p>
            </section>
          )}

          {/* MFA */}
          {view === 'mfa' && (
            <section aria-label="Two-step verification">
              <ViewHeader title="Two-step verification" subtitle="Enter the 6-digit code from your authenticator app." />
              <form onSubmit={handleMfa} className="space-y-4">
                <Field id="otp" label="Authentication code">
                  <input id="otp" type="text" required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="000000" className={`${inputClass} font-mono tracking-[0.4em] text-center`} />
                </Field>
                <SubmitButton loading={loading}>Verify &amp; enter arena</SubmitButton>
              </form>
              <BackLink onClick={() => goTo('sign-in')}>Back to sign in</BackLink>
            </section>
          )}

          {/* CBT KEY */}
          {view === 'cbt-key' && (
            <section role="tabpanel" aria-label="CBT key">
              <ViewHeader title="Enter your CBT key" subtitle="Use the key on your slip or welcome email to jump straight in." />
              <form onSubmit={handleCbtKey} noValidate className="space-y-4">
                <Field id="cbtKey" label="CBT key" error={errors.cbtKey}>
                  <div className="relative">
                    <input id="cbtKey" type="text" required autoComplete="off" spellCheck={false} value={cbtKey} onChange={(e) => setCbtKey(e.target.value.toUpperCase())} placeholder="CBT-XXXX-XXXX" aria-invalid={Boolean(errors.cbtKey)} aria-describedby={errors.cbtKey ? 'cbtKey-error' : undefined} className={`${inputClass} pr-10 font-mono tracking-wider`} />
                    <Key className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--arena-text-muted)]" aria-hidden="true" />
                  </div>
                </Field>
                <div className="pt-2">
                  <SubmitButton loading={loading}>Verify &amp; enter arena</SubmitButton>
                </div>
              </form>
            </section>
          )}

          {/* VERIFY EMAIL */}
          {view === 'verify-email' && (
            <section aria-label="Verify your email">
              {autoVerifying ? (
                <div className="py-12 text-center flex flex-col items-center justify-center gap-4">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--arena-primary)]/20 border-t-[var(--arena-primary)]" />
                  <div>
                    <h2 className="text-lg font-bold text-[var(--arena-text-primary)]">Verifying your email...</h2>
                    <p className="text-xs text-[var(--arena-text-secondary)] mt-1">
                      Activating your Aurikrex candidate profile.
                    </p>
                  </div>
                </div>
              ) : emailVerified ? (
                <div className="py-6 text-center flex flex-col items-center justify-center">
                  <div className="h-14 w-14 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[var(--arena-text-primary)]">
                    Email verified successfully!
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm text-[var(--arena-text-secondary)] max-w-sm">
                    Your candidate account for <strong className="text-[var(--arena-text-primary)]">{pendingEmail || loginEmail}</strong> is now verified and active.
                  </p>
                  <div className="mt-6 w-full max-w-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginEmail(pendingEmail || loginEmail);
                        goTo('sign-in');
                      }}
                      className="w-full rounded-lg bg-[var(--arena-primary)] py-3 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--arena-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--arena-primary)]"
                    >
                      Sign In to Your Cockpit
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-center sm:text-left mb-6">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25 mb-4 shadow-sm">
                      <Mail className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--arena-text-primary)]">
                      Verify your email address
                    </h2>
                    <p className="mt-1.5 text-xs sm:text-sm text-[var(--arena-text-secondary)]">
                      We sent a verification link to{' '}
                      <strong className="text-[var(--arena-text-primary)]">{pendingEmail || 'your email'}</strong>.
                    </p>
                  </div>

                  {/* Guidance Box */}
                  <div className="rounded-xl border border-[var(--arena-border)] bg-[var(--arena-bg-subtle)] p-4 text-xs space-y-2.5 mb-6">
                    <div className="flex items-start gap-2.5 text-[var(--arena-text-primary)] font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--arena-primary)] mt-1.5 shrink-0" />
                      <span>Click the link in the email to activate your account.</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-[var(--arena-text-secondary)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                      <span>Sender: <strong className="text-[var(--arena-text-primary)]">info@aurikrex.com</strong></span>
                    </div>
                    <div className="flex items-start gap-2.5 text-[var(--arena-text-secondary)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                      <span>Can&apos;t find it? Check your Spam, Updates, or Junk folder.</span>
                    </div>
                  </div>

                  {/* Resend Action */}
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={loading || resendCooldown > 0 || !pendingEmail}
                      className="w-full rounded-lg border border-[var(--arena-border)] bg-[var(--arena-surface)] hover:bg-[var(--arena-bg-subtle)] py-2.5 text-xs sm:text-sm font-semibold text-[var(--arena-text-primary)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-[var(--arena-primary)]" />
                      ) : (
                        <RefreshCw className="h-4 w-4 text-[var(--arena-primary)]" />
                      )}
                      <span>
                        {resendCooldown > 0 ? `Resend link in ${resendCooldown}s` : 'Resend verification link'}
                      </span>
                    </button>

                    {/* Manual Code Expander */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setShowManualCode(!showManualCode)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--arena-text-secondary)] hover:text-[var(--arena-text-primary)] transition-colors"
                      >
                        {showManualCode ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        <span>Prefer to enter code manually?</span>
                      </button>

                      {showManualCode && (
                        <form onSubmit={handleVerifyEmail} className="mt-3 space-y-3 pt-3 border-t border-[var(--arena-border)]">
                          {!pendingEmail && (
                            <Field id="verifyEmailAddress" label="Email address">
                              <input
                                id="verifyEmailAddress"
                                type="email"
                                required
                                autoComplete="email"
                                value={pendingEmail}
                                onChange={(e) => setPendingEmail(e.target.value)}
                                className={inputClass}
                              />
                            </Field>
                          )}
                          <Field id="verificationCode" label="6-Digit Verification Code">
                            <input
                              id="verificationCode"
                              type="text"
                              required
                              inputMode="numeric"
                              autoComplete="one-time-code"
                              pattern="[0-9]{6}"
                              maxLength={6}
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                              placeholder="000000"
                              className={`${inputClass} font-mono tracking-[0.4em] text-center text-base`}
                            />
                          </Field>
                          <SubmitButton loading={loading}>Verify code &amp; activate</SubmitButton>
                        </form>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[var(--arena-border)] flex items-center justify-between text-xs">
                    <BackLink onClick={() => goTo('register')}>Wrong email? Back to register</BackLink>
                    <button
                      type="button"
                      onClick={() => goTo('sign-in')}
                      className="mt-5 font-semibold text-[var(--arena-text-secondary)] hover:text-[var(--arena-text-primary)] hover:underline"
                    >
                      Already verified? Sign in
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* FORGOT PASSWORD */}
          {view === 'forgot-password' && (
            <section aria-label="Forgot password">
              <ViewHeader title="Reset your password" subtitle="Enter your account email and we'll send a 6-digit recovery code." />
              <form onSubmit={handleForgot} noValidate className="space-y-4">
                <Field id="forgotEmail" label="Email address" error={errors.forgotEmail}>
                  <input id="forgotEmail" type="email" required autoComplete="email" value={pendingEmail} onChange={(e) => setPendingEmail(e.target.value)} placeholder="you@example.ng" aria-invalid={Boolean(errors.forgotEmail)} aria-describedby={errors.forgotEmail ? 'forgotEmail-error' : undefined} className={inputClass} />
                </Field>
                <SubmitButton loading={loading}>Send recovery code</SubmitButton>
              </form>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <BackLink onClick={() => goTo('sign-in')}>Back to sign in</BackLink>
                <button type="button" onClick={() => goTo('reset-password')} className="mt-5 text-[11px] font-semibold text-[var(--arena-text-secondary)] hover:text-[var(--arena-text-primary)] hover:underline">
                  I already have a code
                </button>
              </div>
            </section>
          )}

          {/* RESET PASSWORD */}
          {view === 'reset-password' && (
            <section aria-label="Choose a new password">
              <ViewHeader title="Choose a new password" subtitle="Enter the code from your email and set a new password." />
              <form onSubmit={handleReset} noValidate className="space-y-4">
                <Field id="resetEmail" label="Email address" error={errors.resetEmail}>
                  <input id="resetEmail" type="email" required autoComplete="email" value={pendingEmail} onChange={(e) => setPendingEmail(e.target.value)} placeholder="you@example.ng" aria-invalid={Boolean(errors.resetEmail)} aria-describedby={errors.resetEmail ? 'resetEmail-error' : undefined} className={inputClass} />
                </Field>
                <Field id="resetCode" label="Recovery code" error={errors.resetCode}>
                  <input id="resetCode" type="text" required inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={resetCode} onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))} placeholder="000000" aria-invalid={Boolean(errors.resetCode)} aria-describedby={errors.resetCode ? 'resetCode-error' : undefined} className={`${inputClass} font-mono tracking-[0.4em] text-center`} />
                </Field>
                <div>
                  <PasswordInput id="newPassword" label="New password" autoComplete="new-password" value={newPassword} onChange={setNewPassword} error={errors.newPassword} describedBy="new-password-rules" />
                  <StrengthMeter id="new-password-rules" password={newPassword} />
                </div>
                <PasswordInput id="confirmNewPassword" label="Confirm new password" autoComplete="new-password" value={confirmNewPassword} onChange={setConfirmNewPassword} error={errors.confirmNewPassword} />
                <div className="pt-2">
                  <SubmitButton loading={loading}>Update password</SubmitButton>
                </div>
              </form>
              <BackLink onClick={() => goTo('forgot-password')}>Resend code</BackLink>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
