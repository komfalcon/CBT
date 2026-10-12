import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  forgotPassword,
  login,
  register,
  verifyEmail,
  verifyOtp,
  resetPassword,
  googleLogin,
  loginWithCbtKey,
} from './api';
import { Lock, Mail, User, Phone, Key, ArrowRight, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button, Alert } from '../../components';
import { ThemeToggle } from '../../components/ThemeToggle';

type AuthMode = 'cbt-key-login' | 'login' | 'register' | 'verify-email' | 'forgot-password' | 'reset-password';

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [mode, setMode] = useState<AuthMode>('cbt-key-login');
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'info' | 'error' | 'success'>('info');

  // Tokens & States
  const [tempToken, setTempToken] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [verificationToken, setVerificationToken] = useState<string>('');
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [cbtKey, setCbtKey] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [resetToken, setResetToken] = useState<string>('');
  const [verifyEmailAddress, setVerifyEmailAddress] = useState<string>('');

  // Form Inputs
  const [loginState, setLoginState] = useState({ email: '', password: '' });
  const [registerState, setRegisterState] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' });

  // Verify Reset Password token & CBT Key from URL query params
  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const modeParam = searchParams.get('mode');
    const keyParam = searchParams.get('key') || searchParams.get('cbt_key') || searchParams.get('cbtkey');

    if (keyParam) {
      setCbtKey(keyParam);
      setMode('cbt-key-login');
    }
    if (tokenParam) {
      setResetToken(tokenParam);
      setMode('reset-password');
    } else if (modeParam === 'register') {
      setMode('register');
    } else if (modeParam === 'login') {
      setMode('login');
    } else if (modeParam === 'cbtkey' || modeParam === 'cbt_key' || modeParam === 'cbt-key') {
      setMode('cbt-key-login');
    }
  }, [searchParams]);

  // Load Google GIS SDK once on mount
  useEffect(() => {
    let clientScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]') as HTMLScriptElement;
    if (!clientScript) {
      clientScript = document.createElement('script');
      clientScript.src = 'https://accounts.google.com/gsi/client';
      clientScript.async = true;
      clientScript.defer = true;
      clientScript.onload = () => {
        initializeGoogleAuth();
      };
      document.body.appendChild(clientScript);
    } else if ((window as any).google) {
      initializeGoogleAuth();
    }
  }, []);

  // Re-initialize Google button on mode changes
  useEffect(() => {
    if ((window as any).google) {
      initializeGoogleAuth();
    }
  }, [mode]);

  const initializeGoogleAuth = () => {
    const google = (window as any).google;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

    if (google && clientId) {
      setTimeout(() => {
        try {
          if (!(window as any).googleInitialized) {
            google.accounts.id.initialize({
              client_id: clientId,
              callback: handleGoogleLoginResponse,
            });
            (window as any).googleInitialized = true;
          }
          const googleBtn = document.getElementById('google-signin-btn');
          if (googleBtn) {
            google.accounts.id.renderButton(
              googleBtn,
              { theme: 'dark', size: 'large', shape: 'pill', type: 'standard' }
            );
          }
        } catch (err) {
          console.warn('Google client init failed. Falling back to sandbox mode.', err);
        }
      }, 50);
    }
  };

  const handleGoogleLoginResponse = async (googleRes: any) => {
    try {
      setMessageType('info');
      setMessage('Signing in with Google...');
      const response = await googleLogin({ credential: googleRes.credential });
      
      if (typeof response === 'string') {
        throw new Error('Received HTML response instead of JSON. Check backend connection.');
      }

      if (response.requiresMFA) {
        setTempToken('cookie');
        setMode('login');
        setMessage('MFA required. Enter your 6-digit OTP code.');
      } else if (!response.requiresMFA) {
        setMessage('Google login successful!');
        setMessageType('success');
        navigate('/dashboard');
      } else {
        setMessageType('error');
        setMessage('Google sign-in failed. Please try again.');
      }
    } catch (err: any) {
      console.error(err);
      setMessageType('error');
      setMessage(err.message || 'Google authentication failed. Use Email or CBT Key.');
    }
  };

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault();

    if (registerState.password !== registerState.confirmPassword) {
      setMessageType('error');
      setMessage('Passwords do not match.');
      return;
    }

    const p = registerState.password;
    if (p.length < 8 || !/[A-Z]/.test(p) || !/[0-9]/.test(p) || !/[^A-Za-z0-9]/.test(p)) {
      setMessageType('error');
      setMessage('Password does not meet the minimum security requirements.');
      return;
    }

    try {
      setMessageType('info');
      setMessage('Creating candidate account...');
      const response = await register({
        fullName: registerState.fullName,
        email: registerState.email,
        phone: registerState.phone,
        password: registerState.password,
      });

      setVerifyEmailAddress(registerState.email);
      setMessage(response.message || 'Registration successful! Enter the 6-digit verification code below.');
      setMessageType('success');
      setMode('verify-email');
    } catch (error: any) {
      setMessageType('error');
      setMessage(error.response?.data?.message || 'Registration failed. Check password requirements.');
    }
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setMessageType('info');
      setMessage('Verifying credentials...');
      const response = await login(loginState);

      if (response.requiresMFA) {
        setTempToken('cookie');
        setMessage('MFA required. Enter your 6-digit OTP code.');
      } else {
        setMessage('Login successful. Redirecting...');
        setMessageType('success');
        navigate('/dashboard');
      }
    } catch (error: any) {
      setMessageType('error');
      setMessage(error.response?.data?.message || 'Invalid email or password.');
    }
  };

  const handleCbtKeyLogin = async (event: FormEvent) => {
    event.preventDefault();
    if (!cbtKey.trim()) return;

    try {
      setMessageType('info');
      setMessage('Validating CBT Access Key...');
      await loginWithCbtKey({ cbtKey: cbtKey.trim() });
      setMessage('CBT Key Login successful. Redirecting...');
      setMessageType('success');
      navigate('/dashboard');
    } catch (error: any) {
      setMessageType('error');
      setMessage(error.response?.data?.message || 'Invalid or unverified CBT Access Key.');
    }
  };

  const handleVerifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    if (!tempToken || !otp) return;

    try {
      setMessageType('info');
      setMessage('Checking OTP code...');
      await verifyOtp({ otp });
      setMessage('MFA authentication complete!');
      setMessageType('success');
      setTempToken('');
      setOtp('');
      navigate('/dashboard');
    } catch (error: any) {
      setMessageType('error');
      setMessage(error.response?.data?.message || 'Invalid OTP code.');
    }
  };

  const handleVerifyEmail = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setMessageType('info');
      setMessage('Verifying email code...');
      const response = await verifyEmail({ email: verifyEmailAddress, code: verificationToken });
      setMessage(response.message || 'Email verified successfully. You can log in.');
      setMessageType('success');
      setMode('login');
    } catch (error: any) {
      setMessageType('error');
      setMessage(error.response?.data?.message || 'Invalid or expired verification code.');
    }
  };

  const handleForgotPassword = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setMessageType('info');
      setMessage('Sending reset code...');
      const response = await forgotPassword(forgotEmail);
      setMessage(response.message || 'If registered, a 6-digit reset code has been sent.');
      setMessageType('success');
      setVerifyEmailAddress(forgotEmail);
      setMode('reset-password');
    } catch (error: any) {
      setMessageType('error');
      setMessage(error.response?.data?.message || 'Forgot password failed.');
    }
  };

  const handleResetPassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!resetToken || !newPassword) return;

    try {
      setMessageType('info');
      setMessage('Updating password...');
      const response = await resetPassword({
        email: verifyEmailAddress || forgotEmail,
        code: resetToken,
        password: newPassword,
      });
      setMessage(response.message || 'Password updated! Please log in.');
      setMessageType('success');
      setSearchParams({});
      setMode('login');
    } catch (error: any) {
      setMessageType('error');
      setMessage(error.response?.data?.message || 'Failed to reset password. Code might be expired.');
    }
  };

  const isGoogleAvailable = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  const pass = registerState.password;
  const reqs = {
    length: pass.length >= 8,
    upper: /[A-Z]/.test(pass),
    number: /[0-9]/.test(pass),
    special: /[^A-Za-z0-9]/.test(pass),
  };

  const strengthCount = Object.values(reqs).filter(Boolean).length;
  const strengthText =
    strengthCount === 0 ? '' :
    strengthCount <= 2 ? 'Weak' :
    strengthCount === 3 ? 'Medium' : 'Strong';
  const strengthColor =
    strengthCount === 0 ? 'bg-slate-800' :
    strengthCount <= 2 ? 'bg-rose-500' :
    strengthCount === 3 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col justify-between selection:bg-accent-royal-blue selection:text-white antialiased">
      {/* Top Navigation Header adapted from Stitch Spec */}
      <header className="bg-bg-secondary w-full border-b border-border sticky top-0 z-50 shadow-sm backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto h-16 px-4 md:px-8 flex justify-between items-center">
          {/* Brand & Product */}
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-full border border-primary-container overflow-hidden shadow-sm flex items-center justify-center bg-surface-container group-hover:scale-105 transition-transform">
                <img
                  src="https://cbt.aurikrex.com/pwa-192x192.png"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/favicon.svg';
                  }}
                  alt="Aurikrex Exam Arena Circular Emblem"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm font-bold text-text-primary tracking-tight">
                  Aurikrex Exam Arena
                </span>
                <span className="font-body-sm text-label-sm text-text-muted">
                  by Aurikrex · Candidate CBT Portal
                </span>
              </div>
            </a>
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container border border-border font-mono-data text-label-sm text-tertiary">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
              Public Beta — 100% Free Access
            </span>
          </div>

          {/* Trailing Controls & Telemetry */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-border">
              <span className="material-symbols-outlined text-accent-ai-gold text-lg" data-weight="fill">
                monetization_on
              </span>
              <span className="font-mono-data text-mono-data font-semibold text-text-primary">
                5,000 Coins
              </span>
              <span className="font-label-sm text-label-sm text-text-muted border-l border-border pl-2">
                Sign-up Grant
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low border border-border text-text-secondary font-mono-data text-label-sm">
              <span className="material-symbols-outlined text-secondary text-sm">shield</span>
              <span>NODE: LAG-NG-CBT-01</span>
            </div>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Canvas (Split Dual-Pane Authentication Card) */}
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 md:p-10 max-w-[1440px] w-full mx-auto">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 rounded-2xl bg-bg-card border border-border shadow-2xl overflow-hidden relative">
          {/* Ambient Radial Glow Backdrop */}
          <div className="absolute top-0 right-1/3 -translate-y-1/2 w-96 h-96 bg-accent-royal-blue/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 translate-y-1/3 w-80 h-80 bg-tertiary-container/10 rounded-full blur-3xl pointer-events-none" />

          {/* LEFT PANE: Brand & Value Proposition (5 Cols) - Desktop Only */}
          <div className="hidden lg:flex lg:col-span-5 p-6 sm:p-10 bg-bg-secondary/80 backdrop-blur-md border-b lg:border-b-0 lg:border-r border-border flex-col justify-between relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-surface-container border border-border text-primary font-mono-data text-label-sm mb-6">
                <span className="material-symbols-outlined text-xs">terminal</span>
                <span>UTME_2025 // SECURE_AUTH_GATE</span>
              </div>

              <h1 className="font-headline-lg text-headline-lg text-text-primary tracking-tight mb-4">
                Practice with Purpose.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-tertiary">
                  Score 300+
                </span> in JAMB UTME.
              </h1>

              <p className="font-body-md text-body-md text-text-secondary leading-relaxed mb-8">
                Unified candidate authentication for computer-based testing, algorithmic deficit triage, and Falke AI tutoring. Built strictly around real JAMB CBT keyboard macros and timed pressure.
              </p>

              {/* Core Academic & Cafe Trust Metrics */}
              <div className="grid grid-cols-2 gap-3.5 mb-8">
                <div className="p-3.5 rounded-xl bg-surface-container border border-border hover:border-accent-royal-blue/40 transition-colors">
                  <div className="flex items-center gap-2 text-secondary mb-1">
                    <span className="material-symbols-outlined text-sm">storage</span>
                    <span className="font-headline-sm text-headline-sm font-bold text-text-primary">1,000,000+</span>
                  </div>
                  <span className="font-body-sm text-label-sm text-text-muted">Past Questions & Solutions</span>
                </div>
                <div className="p-3.5 rounded-xl bg-surface-container border border-border hover:border-tertiary/40 transition-colors">
                  <div className="flex items-center gap-2 text-tertiary mb-1">
                    <span className="material-symbols-outlined text-sm">verified</span>
                    <span className="font-headline-sm text-headline-sm font-bold text-text-primary">17</span>
                  </div>
                  <span className="font-body-sm text-label-sm text-text-muted">Accredited UTME Subjects</span>
                </div>
                <div className="p-3.5 rounded-xl bg-surface-container border border-border hover:border-accent-ai-gold/40 transition-colors">
                  <div className="flex items-center gap-2 text-accent-ai-gold mb-1">
                    <span className="material-symbols-outlined text-sm">bolt</span>
                    <span className="font-headline-sm text-headline-sm font-bold text-text-primary">0ms</span>
                  </div>
                  <span className="font-body-sm text-label-sm text-text-muted">Falke AI Cache Hits</span>
                </div>
                <div className="p-3.5 rounded-xl bg-surface-container border border-border hover:border-accent-royal-blue/40 transition-colors">
                  <div className="flex items-center gap-2 text-primary mb-1">
                    <span className="material-symbols-outlined text-sm">vpn_key</span>
                    <span className="font-headline-sm text-headline-sm font-bold text-text-primary">Zero Leak</span>
                  </div>
                  <span className="font-body-sm text-label-sm text-text-muted">Cyber-Cafe CBT Key Login</span>
                </div>
              </div>

              {/* Cyber-Cafe Terminal Security Architecture */}
              <div className="p-4 rounded-xl bg-surface-container-low border border-border relative overflow-hidden">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-xl mt-0.5">
                    shield
                  </span>
                  <div>
                    <h4 className="font-label-md text-label-md font-semibold text-text-primary mb-1">
                      Cyber-Cafe Zero-Leakage Architecture
                    </h4>
                    <p className="font-body-sm text-body-sm text-text-secondary leading-normal">
                      Single-use 6-character CBT session keys prevent keystroke logging and password compromise on shared public cyber-cafe computers across Nigeria.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Public Beta Guarantee Banner */}
            <div className="mt-8 pt-6 border-t border-border flex items-center gap-3 text-label-sm">
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-accent-ai-gold flex-shrink-0">
                <span className="material-symbols-outlined text-lg">redeem</span>
              </div>
              <p className="font-body-sm text-label-sm text-text-secondary">
                <strong className="text-text-primary">Public Beta Guarantee:</strong> Free 5,000 AuriCoins credited automatically upon account activation. No scratch card required.
              </p>
            </div>
          </div>

          {/* RIGHT PANE: Authentication Form with 3 Tabs (7 Cols) */}
          <div className="lg:col-span-7 p-4 sm:p-10 flex flex-col justify-between bg-bg-card relative z-10">
            <div>
              {/* Mobile Spec Incentive Banner (Aligns with Stitch Mobile Spec) */}
              <div className="lg:hidden mb-4 p-3 rounded-xl bg-surface-container-low border border-border flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono-data text-text-secondary">
                  <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                  <span>Public Beta · 100% Free</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono-data font-semibold text-accent-ai-gold">
                  <span className="material-symbols-outlined text-sm" data-weight="fill">monetization_on</span>
                  <span>+5,000 Coins</span>
                </div>
              </div>

              {/* Tab Headers */}
              {(mode === 'cbt-key-login' || mode === 'login' || mode === 'register') && (
                <div className="grid grid-cols-3 gap-1 sm:gap-2 p-1 sm:p-1.5 bg-surface-container-low rounded-xl border border-border mb-6 sm:mb-8">
                  {/* Tab 1: CBT Key (Default Active) */}
                  <button
                    onClick={() => { setMode('cbt-key-login'); setMessage(''); }}
                    className={`flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 px-1.5 sm:px-3 rounded-lg font-label-md text-xs sm:text-label-md transition-all ${
                      mode === 'cbt-key-login'
                        ? 'bg-surface-container text-primary border border-primary/30 shadow-sm font-semibold'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-container/50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm shrink-0">key</span>
                    <span>CBT Key</span>
                    <span className="hidden md:inline-block px-1.5 py-0.5 rounded text-[10px] bg-accent-royal-blue/30 text-accent-royal-blue dark:text-primary-fixed font-bold border border-primary-container/40">
                      Cafe Fast
                    </span>
                  </button>

                  {/* Tab 2: Candidate Login */}
                  <button
                    onClick={() => { setMode('login'); setMessage(''); }}
                    className={`flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 px-1.5 sm:px-3 rounded-lg font-label-md text-xs sm:text-label-md transition-all ${
                      mode === 'login'
                        ? 'bg-surface-container text-primary border border-primary/30 shadow-sm font-semibold'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-container/50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm shrink-0">person</span>
                    <span><span className="hidden sm:inline">Candidate </span>Login</span>
                  </button>

                  {/* Tab 3: Register */}
                  <button
                    onClick={() => { setMode('register'); setMessage(''); }}
                    className={`flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 px-1.5 sm:px-3 rounded-lg font-label-md text-xs sm:text-label-md transition-all ${
                      mode === 'register'
                        ? 'bg-surface-container text-primary border border-primary/30 shadow-sm font-semibold'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-container/50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm shrink-0">how_to_reg</span>
                    <span>Register<span className="hidden sm:inline"> Free</span></span>
                  </button>
                </div>
              )}

              {/* Status Message */}
              {message && (
                <Alert
                  variant={messageType === 'error' ? 'error' : messageType === 'success' ? 'success' : 'info'}
                  className="mb-6"
                >
                  {message}
                </Alert>
              )}

              {/* TAB 1: CBT Key Form */}
              {mode === 'cbt-key-login' && (
                <form className="space-y-6" onSubmit={handleCbtKeyLogin}>
                  <div className="p-4 rounded-xl bg-surface-container-low border border-border text-label-sm text-text-secondary leading-relaxed">
                    <div className="flex items-center gap-2 font-semibold text-text-primary mb-1">
                      <span className="material-symbols-outlined text-secondary text-base">vpn_key</span>
                      Single-Use Cyber-Cafe Authentication
                    </div>
                    Enter your permanent Aurikrex ID (<span className="font-mono-data text-primary">AKX-XXXXXX</span>) or generated cafe session key. No passwords stored on shared center terminals.
                  </div>

                  <div className="space-y-2">
                    <label className="text-label-sm font-label-sm text-text-secondary block font-medium">
                      Aurikrex ID or 256-Bit CBT Access Key
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3.5 top-3.5 h-4 w-4 text-text-muted" />
                      <input
                        type="text"
                        required
                        placeholder="CBT-XXXXXX or AKX-XXXXXX"
                        value={cbtKey}
                        onChange={(e) => setCbtKey(e.target.value)}
                        className="w-full rounded-xl border border-border bg-surface-container-low py-3.5 pl-10 pr-4 font-mono-data text-[15px] tracking-wide text-text-primary outline-none transition placeholder:text-text-muted focus:border-accent-royal-blue focus:ring-2 focus:ring-accent-royal-blue/20"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-accent-royal-blue hover:bg-primary-container text-white font-label-md text-label-md font-bold shadow-lg shadow-accent-royal-blue/20 active:scale-[0.98] transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">bolt</span>
                    <span>Authenticate Cafe Terminal</span>
                  </button>

                  <div className="pt-2">
                    <div className="relative flex items-center gap-3 py-2">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-xs font-mono-data text-text-muted uppercase">Or standard authentication</span>
                      <div className="h-px flex-1 bg-border" />
                    </div>

                    <div className="mt-3 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setMode('login')}
                        className="flex-1 py-2.5 px-4 rounded-xl border border-border bg-surface-container hover:bg-surface-variant text-text-primary font-label-md text-label-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">login</span>
                        <span>Sign in with Email</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode('register')}
                        className="flex-1 py-2.5 px-4 rounded-xl border border-border bg-surface-container hover:bg-surface-variant text-text-primary font-label-md text-label-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">person_add</span>
                        <span>Create Account</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* TAB 2: Candidate Email/Password Login */}
              {mode === 'login' && !tempToken && (
                <form className="space-y-5" onSubmit={handleLogin}>
                  <div className="space-y-2">
                    <label className="text-label-sm font-label-sm text-text-secondary block font-medium">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-text-muted" />
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="scholar@aurikrex.com"
                        value={loginState.email}
                        onChange={(e) => setLoginState((prev) => ({ ...prev, email: e.target.value }))}
                        className="w-full rounded-xl border border-border bg-surface-container-low py-3.5 pl-10 pr-4 text-body-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-accent-royal-blue focus:ring-2 focus:ring-accent-royal-blue/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-label-sm font-label-sm text-text-secondary font-medium">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setMode('forgot-password')}
                        className="text-xs text-primary hover:underline transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-text-muted" />
                      <input
                        type="password"
                        required
                        autoComplete="current-password"
                        placeholder="••••••••••••"
                        value={loginState.password}
                        onChange={(e) => setLoginState((prev) => ({ ...prev, password: e.target.value }))}
                        className="w-full rounded-xl border border-border bg-surface-container-low py-3.5 pl-10 pr-4 text-body-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-accent-royal-blue focus:ring-2 focus:ring-accent-royal-blue/20"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-accent-royal-blue hover:bg-primary-container text-white font-label-md text-label-md font-bold shadow-lg shadow-accent-royal-blue/20 active:scale-[0.98] transition-all"
                  >
                    <span>Sign In to Cockpit</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <div className="pt-2">
                    <div className="relative flex items-center gap-3 py-2">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-xs font-mono-data text-text-muted uppercase">Or federated sign-in</span>
                      <div className="h-px flex-1 bg-border" />
                    </div>

                    {isGoogleAvailable ? (
                      <div className="mt-3 flex w-full justify-center min-h-[44px]" id="google-signin-btn" />
                    ) : (
                      <div className="mt-3 flex justify-center">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setMessage('Google sign-in is not configured. Please use Email or CBT Key.')}
                        >
                          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-blue-400/30 bg-blue-400/10 text-xs font-bold text-accent-royal-blue dark:text-blue-300 mr-2">G</span>
                          Sign in with Google
                        </Button>
                      </div>
                    )}
                  </div>
                </form>
              )}

              {/* MFA OTP Verification */}
              {mode === 'login' && tempToken && (
                <form className="space-y-5 animate-slide-up" onSubmit={handleVerifyOtp}>
                  <div className="rounded-xl border border-accent-royal-blue/30 bg-accent-royal-blue/10 p-4 text-body-sm text-text-secondary">
                    <div className="flex items-center gap-2 font-semibold text-text-primary mb-1">
                      <ShieldAlert className="h-4 w-4 text-secondary" />
                      <span>Two-Factor Authentication Required</span>
                    </div>
                    <p>Enter the 6-digit verification code from your authenticator device.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-label-sm font-label-sm text-text-secondary block font-medium">
                      Authenticator Code
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="000000"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full rounded-xl border border-border bg-surface-container-low py-3.5 pl-4 pr-4 text-center font-mono-timer text-2xl tracking-[0.4em] text-text-primary outline-none focus:border-accent-royal-blue"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-accent-royal-blue hover:bg-primary-container text-white font-label-md text-label-md font-bold shadow-lg"
                  >
                    <span>Verify Code & Continue</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => { setTempToken(''); setOtp(''); setMessage(''); }}
                    className="w-full text-center text-label-sm text-text-muted hover:text-text-primary"
                  >
                    Cancel and go back
                  </button>
                </form>
              )}

              {/* TAB 3: Candidate Registration */}
              {mode === 'register' && (
                <form className="space-y-4" onSubmit={handleRegister}>
                  <div className="space-y-1.5">
                    <label className="text-label-sm font-label-sm text-text-secondary block font-medium">
                      Candidate Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 h-4 w-4 text-text-muted" />
                      <input
                        type="text"
                        required
                        autoComplete="name"
                        placeholder="Enter full name"
                        value={registerState.fullName}
                        onChange={(e) => setRegisterState((prev) => ({ ...prev, fullName: e.target.value }))}
                        className="w-full rounded-xl border border-border bg-surface-container-low py-3 pl-10 pr-4 text-body-sm text-text-primary outline-none focus:border-accent-royal-blue"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-label-sm font-label-sm text-text-secondary block font-medium">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-text-muted" />
                        <input
                          type="email"
                          required
                          autoComplete="email"
                          placeholder="candidate@aurikrex.com"
                          value={registerState.email}
                          onChange={(e) => setRegisterState((prev) => ({ ...prev, email: e.target.value }))}
                          className="w-full rounded-xl border border-border bg-surface-container-low py-3 pl-10 pr-4 text-body-sm text-text-primary outline-none focus:border-accent-royal-blue"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-label-sm font-label-sm text-text-secondary block font-medium">
                        Phone (Optional)
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-text-muted" />
                        <input
                          type="tel"
                          autoComplete="tel"
                          placeholder="08012345678"
                          value={registerState.phone}
                          onChange={(e) => setRegisterState((prev) => ({ ...prev, phone: e.target.value }))}
                          className="w-full rounded-xl border border-border bg-surface-container-low py-3 pl-10 pr-4 text-body-sm text-text-primary outline-none focus:border-accent-royal-blue"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-label-sm font-label-sm text-text-secondary block font-medium">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-text-muted" />
                        <input
                          type="password"
                          required
                          autoComplete="new-password"
                          placeholder="Create password"
                          value={registerState.password}
                          onChange={(e) => setRegisterState((prev) => ({ ...prev, password: e.target.value }))}
                          className="w-full rounded-xl border border-border bg-surface-container-low py-3 pl-10 pr-4 text-body-sm text-text-primary outline-none focus:border-accent-royal-blue"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-label-sm font-label-sm text-text-secondary block font-medium">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-text-muted" />
                        <input
                          type="password"
                          required
                          autoComplete="new-password"
                          placeholder="Repeat password"
                          value={registerState.confirmPassword}
                          onChange={(e) => setRegisterState((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                          className="w-full rounded-xl border border-border bg-surface-container-low py-3 pl-10 pr-4 text-body-sm text-text-primary outline-none focus:border-accent-royal-blue"
                        />
                      </div>
                    </div>
                  </div>

                  {pass.length > 0 && (
                    <div className="rounded-xl border border-border bg-surface-container-low p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-muted">Password Strength:</span>
                        <span className="font-semibold text-text-primary">{strengthText}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-surface-container-high">
                        <div
                          className={`h-full ${strengthColor} transition-all duration-500`}
                          style={{ width: `${(strengthCount / 4) * 100}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                        {[
                          [reqs.length, 'Min 8 characters'],
                          [reqs.upper, '1 uppercase letter'],
                          [reqs.number, '1 number'],
                          [reqs.special, '1 special character'],
                        ].map(([valid, lbl]) => (
                          <div key={lbl as string} className={`flex items-center gap-1.5 ${valid ? 'text-tertiary' : 'text-text-muted'}`}>
                            {valid ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                            <span>{lbl as string}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-accent-royal-blue hover:bg-primary-container text-white font-label-md text-label-md font-bold shadow-lg shadow-accent-royal-blue/20 active:scale-[0.98] transition-all"
                  >
                    <span>Register Candidate Profile (Free)</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <div className="pt-2">
                    <div className="relative flex items-center gap-3 py-2">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-xs font-mono-data text-text-muted uppercase">Or Google Sign-Up</span>
                      <div className="h-px flex-1 bg-border" />
                    </div>

                    {isGoogleAvailable ? (
                      <div className="mt-3 flex w-full justify-center min-h-[44px]" id="google-signin-btn" />
                    ) : (
                      <div className="mt-3 flex justify-center">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setMessage('Google sign-in is not configured. Please register with Email.')}
                        >
                          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-blue-400/30 bg-blue-400/10 text-xs font-bold text-accent-royal-blue dark:text-blue-300 mr-2">G</span>
                          Sign up with Google
                        </Button>
                      </div>
                    )}
                  </div>
                </form>
              )}

              {/* Email Verification */}
              {mode === 'verify-email' && (
                <form className="space-y-5 animate-fade-in" onSubmit={handleVerifyEmail}>
                  <div className="rounded-xl border border-border bg-surface-container-low p-4 text-body-sm text-text-secondary">
                    <p className="font-semibold text-text-primary mb-1">Verify Your Email Address</p>
                    <p>A 6-digit confirmation code has been dispatched to your email. Enter it below to activate your candidate profile.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-label-sm font-label-sm text-text-secondary block font-medium">Email Address</label>
                    <input
                      type="email"
                      required
                      value={verifyEmailAddress}
                      onChange={(e) => setVerifyEmailAddress(e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface-container-low px-4 py-3 text-body-sm text-text-primary outline-none focus:border-accent-royal-blue"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-label-sm font-label-sm text-text-secondary block font-medium">6-Digit Code</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="123456"
                      value={verificationToken}
                      onChange={(e) => setVerificationToken(e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface-container-low px-4 py-3 text-center font-mono-timer text-2xl tracking-[0.4em] text-primary outline-none focus:border-accent-royal-blue"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-accent-royal-blue hover:bg-primary-container text-white font-label-md text-label-md font-bold shadow-lg"
                  >
                    <span>Activate Profile & Log In</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="w-full text-center text-label-sm text-text-muted hover:text-text-primary"
                  >
                    Back to sign in
                  </button>
                </form>
              )}

              {/* Forgot Password */}
              {mode === 'forgot-password' && (
                <form className="space-y-5 animate-fade-in" onSubmit={handleForgotPassword}>
                  <div className="rounded-xl border border-border bg-surface-container-low p-4 text-body-sm text-text-secondary">
                    Enter the email registered with your candidate profile. We will generate a secure one-time password reset code.
                  </div>

                  <div className="space-y-2">
                    <label className="text-label-sm font-label-sm text-text-secondary block font-medium">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-text-muted" />
                      <input
                        type="email"
                        required
                        placeholder="candidate@aurikrex.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full rounded-xl border border-border bg-surface-container-low py-3.5 pl-10 pr-4 text-body-sm text-text-primary outline-none focus:border-accent-royal-blue"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-accent-royal-blue hover:bg-primary-container text-white font-label-md text-label-md font-bold shadow-lg"
                  >
                    <span>Generate Reset Code</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="w-full text-center text-label-sm text-text-muted hover:text-text-primary"
                  >
                    Back to sign in
                  </button>
                </form>
              )}

              {/* Reset Password */}
              {mode === 'reset-password' && (
                <form className="space-y-5 animate-fade-in" onSubmit={handleResetPassword}>
                  <div className="rounded-xl border border-border bg-surface-container-low p-4 text-body-sm text-text-secondary">
                    Enter your email, the 6-digit reset code received, and your new account password.
                  </div>

                  <div className="space-y-2">
                    <label className="text-label-sm font-label-sm text-text-secondary block font-medium">Email Address</label>
                    <input
                      type="email"
                      required
                      value={verifyEmailAddress || forgotEmail}
                      onChange={(e) => {
                        setVerifyEmailAddress(e.target.value);
                        setForgotEmail(e.target.value);
                      }}
                      className="w-full rounded-xl border border-border bg-surface-container-low px-4 py-3 text-body-sm text-text-primary outline-none focus:border-accent-royal-blue"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-label-sm font-label-sm text-text-secondary block font-medium">6-Digit Reset Code</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="123456"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface-container-low px-4 py-3 text-center font-mono-timer text-xl tracking-widest text-primary outline-none focus:border-accent-royal-blue"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-label-sm font-label-sm text-text-secondary block font-medium">New Password</label>
                    <input
                      type="password"
                      required
                      autoComplete="new-password"
                      placeholder="Min. 8 characters with numbers & symbols"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface-container-low px-4 py-3 text-body-sm text-text-primary outline-none focus:border-accent-royal-blue"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-accent-royal-blue hover:bg-primary-container text-white font-label-md text-label-md font-bold shadow-lg"
                  >
                    <span>Update Password & Log In</span>
                  </button>
                </form>
              )}
            </div>

            {/* Bottom Disclaimer */}
            <p className="mt-8 text-center text-xs text-text-muted leading-relaxed">
              By authenticating, you agree to official CBT test regulations, academic integrity guidelines, and the Aurikrex candidate code of conduct.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-text-muted border-t border-border">
        Aurikrex Exam Arena · © 2025/2026 Aurikrex. All rights reserved.
      </footer>
    </div>
  );
}
