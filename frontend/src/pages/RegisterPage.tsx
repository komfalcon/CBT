import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  BarChart3,
  Check,
  Clock,
  Eye,
  EyeOff,
  Key,
  Moon,
  Sparkles,
  Sun,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { siteConfig } from '../config/siteConfig';
import { register, login, loginWithCbtKey } from '../features/auth/api';

type ActiveTab = 'cbt-key' | 'sign-in' | 'register';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme, setTheme } = useTheme();

  // Tab state
  const [activeTab, setActiveTab] = useState<ActiveTab>('register');

  // Register form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Sign In form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // CBT Key form state
  const [cbtKey, setCbtKey] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handle URL params for preselected tabs
  useEffect(() => {
    const tabParam = searchParams.get('tab') || searchParams.get('mode');
    const keyParam = searchParams.get('key') || searchParams.get('cbt_key');

    if (keyParam) {
      setCbtKey(keyParam);
      setActiveTab('cbt-key');
    } else if (tabParam === 'cbt-key' || tabParam === 'cbt_key' || tabParam === 'cbtkey') {
      setActiveTab('cbt-key');
    } else if (tabParam === 'sign-in' || tabParam === 'login') {
      setActiveTab('sign-in');
    } else {
      setActiveTab('register');
    }
  }, [searchParams]);

  // Theme detection
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  // Password rules checklist
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  const rulesPassed = [hasLength, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;
  const strengthLabel =
    rulesPassed === 0 ? '' : rulesPassed <= 2 ? 'Weak' : rulesPassed === 3 ? 'Medium' : 'Strong';
  const strengthColor =
    rulesPassed === 0
      ? 'bg-slate-300 dark:bg-slate-700'
      : rulesPassed <= 2
      ? 'bg-rose-500'
      : rulesPassed === 3
      ? 'bg-amber-500'
      : 'bg-emerald-500';

  // Nigerian phone validation: optional, but if present must match +234 or 0 followed by 10 digits
  const validateNigerianPhone = (val: string): boolean => {
    if (!val.trim()) return true; // optional
    const cleaned = val.replace(/[\s-]/g, '');
    return /^(?:\+234|0)[789][01]\d{8}$/.test(cleaned);
  };

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    setErrorMessage('');
    setSuccessMessage('');
    setSearchParams({ tab });
  };

  // Handle Registration Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (phone.trim() && !validateNigerianPhone(phone)) {
      setErrorMessage('Please enter a valid Nigerian phone number (e.g. +234 803 000 0000 or 0803 000 0000).');
      return;
    }
    if (!hasLength) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const data = await register({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
      });
      setSuccessMessage(data.message || 'Candidate profile created successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to create candidate profile. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle Sign In Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!loginEmail.trim() || !loginPassword) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login({ email: loginEmail.trim(), password: loginPassword });
      setSuccessMessage('Signed in successfully! Redirecting...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // Handle CBT Key Submit
  const handleCbtKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!cbtKey.trim()) {
      setErrorMessage('Please enter your 12-character CBT key.');
      return;
    }

    setLoading(true);
    try {
      await loginWithCbtKey({ cbtKey: cbtKey.trim().toUpperCase() });
      setSuccessMessage('CBT Key verified! Entering exam arena...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Invalid or expired CBT key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--arena-bg)] text-[var(--arena-text-primary)] transition-colors antialiased flex flex-col justify-center py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      {/* Container: Max width 1080px split panel */}
      <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-[var(--arena-border)] shadow-xl grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr]">
        
        {/* ========================================================= */}
        {/* LEFT PANEL: Branding, Value Props, and Beta Assurance     */}
        {/* ========================================================= */}
        <div className="flex flex-col justify-between bg-[var(--arena-reg-left-bg)] p-8 sm:p-10 border-b lg:border-b-0 lg:border-r border-[var(--arena-border)]">
          <div>
            {/* Logo + Brand Wordmark */}
            <Link to="/" className="flex items-center gap-2.5 group w-fit" aria-label="Aurikrex Exam Arena Home">
              <img
                src="/aurikrex-logo.png"
                alt="Aurikrex Logo"
                className="h-8 w-8 rounded-lg object-contain shadow-sm transition-transform group-hover:scale-105"
              />
              <span className="text-base font-bold text-[var(--arena-text-primary)]">
                {siteConfig.name}
              </span>
            </Link>

            {/* Headline & Subcopy */}
            <div className="mt-12 sm:mt-16">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--arena-text-primary)] leading-tight">
                Your UTME cockpit, ready when you are.
              </h1>
              <p className="mt-3 text-xs sm:text-sm text-[var(--arena-text-secondary)] leading-relaxed">
                Practise under real exam conditions and see exactly where every mark goes.
              </p>
            </div>

            {/* 3 Benefit Rows with Tinted Icons */}
            <div className="mt-10 space-y-5">
              <div className="flex items-center gap-3.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25">
                  <Clock className="h-4 w-4" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-[var(--arena-text-primary)]">
                  Full 180-question timed CBT mocks
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-[var(--arena-text-primary)]">
                  Subject-by-subject readiness diagnostics
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-[var(--arena-text-primary)]">
                  Falke AI explanations in English or Pidgin
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Badge */}
          <div className="mt-12 pt-6">
            <div className="inline-block rounded-lg border border-[var(--arena-border)] bg-[var(--arena-surface)]/70 px-3.5 py-2 text-[11px] font-medium text-[var(--arena-text-secondary)] shadow-sm">
              Public beta · Free access, no payment card required.
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT PANEL: Tabs & Interactive Candidate Register Form    */}
        {/* ========================================================= */}
        <div className="flex flex-col justify-between bg-[var(--arena-reg-right-bg)] p-8 sm:p-10">
          <div>
            {/* Header: Tabs + Theme Toggle */}
            <div className="flex items-center justify-between gap-4 border-b border-[var(--arena-border)] pb-4 mb-8">
              {/* Tabs: CBT Key | Sign In | Register */}
              <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[var(--arena-bg-subtle)] border border-[var(--arena-border)] text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => handleTabChange('cbt-key')}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    activeTab === 'cbt-key'
                      ? 'bg-[var(--arena-surface)] text-[var(--arena-text-primary)] shadow-sm'
                      : 'text-[var(--arena-text-secondary)] hover:text-[var(--arena-text-primary)]'
                  }`}
                >
                  CBT Key
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('sign-in')}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    activeTab === 'sign-in'
                      ? 'bg-[var(--arena-surface)] text-[var(--arena-text-primary)] shadow-sm'
                      : 'text-[var(--arena-text-secondary)] hover:text-[var(--arena-text-primary)]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('register')}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    activeTab === 'register'
                      ? 'bg-[var(--arena-surface)] text-[var(--arena-text-primary)] shadow-sm font-bold'
                      : 'text-[var(--arena-text-secondary)] hover:text-[var(--arena-text-primary)]'
                  }`}
                >
                  Register
                </button>
              </div>

              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--arena-border)] bg-[var(--arena-surface)] text-[var(--arena-text-secondary)] transition-colors hover:text-[var(--arena-text-primary)]"
              >
                {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
              </button>
            </div>

            {/* Error or Success feedback message */}
            {errorMessage && (
              <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-700 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs text-emerald-700 dark:text-emerald-400">
                <Check className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* TAB CONTENT: Register */}
            {activeTab === 'register' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--arena-text-primary)]">
                    Create your candidate profile
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-[var(--arena-text-secondary)]">
                    Free during the public beta.
                  </p>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label
                      htmlFor="fullName"
                      className="block text-xs font-semibold text-[var(--arena-text-primary)] mb-1.5"
                    >
                      Full name
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Amaka Okafor"
                      className="w-full rounded-lg border border-[var(--arena-input-border)] bg-[var(--arena-input-bg)] px-3.5 py-2.5 text-xs sm:text-sm text-[var(--arena-text-primary)] placeholder-[var(--arena-text-muted)] focus:border-[var(--arena-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--arena-primary)] transition-all"
                    />
                  </div>

                  {/* Email & Phone Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-xs font-semibold text-[var(--arena-text-primary)] mb-1.5"
                      >
                        Email address
                      </label>
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.ng"
                        className="w-full rounded-lg border border-[var(--arena-input-border)] bg-[var(--arena-input-bg)] px-3.5 py-2.5 text-xs sm:text-sm text-[var(--arena-text-primary)] placeholder-[var(--arena-text-muted)] focus:border-[var(--arena-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--arena-primary)] transition-all"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-xs font-semibold text-[var(--arena-text-primary)] mb-1.5"
                      >
                        Phone (optional)
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+234 803 000 0000"
                        className="w-full rounded-lg border border-[var(--arena-input-border)] bg-[var(--arena-input-bg)] px-3.5 py-2.5 text-xs sm:text-sm text-[var(--arena-text-primary)] placeholder-[var(--arena-text-muted)] focus:border-[var(--arena-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--arena-primary)] transition-all"
                      />
                    </div>
                  </div>

                  {/* Password with Live Strength Meter & Checklist */}
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-xs font-semibold text-[var(--arena-text-primary)] mb-1.5"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-lg border border-[var(--arena-input-border)] bg-[var(--arena-input-bg)] px-3.5 py-2.5 pr-10 text-xs sm:text-sm text-[var(--arena-text-primary)] focus:border-[var(--arena-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--arena-primary)] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--arena-text-muted)] hover:text-[var(--arena-text-primary)]"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Live Strength Meter Bar */}
                    {password && (
                      <div className="mt-2.5 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[var(--arena-text-muted)]">Password strength</span>
                          <span className="font-semibold text-[var(--arena-text-primary)]">{strengthLabel}</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--arena-bg-subtle)] border border-[var(--arena-border-subtle)]">
                          <div
                            className={`h-full ${strengthColor} transition-all duration-300`}
                            style={{ width: `${(rulesPassed / 4) * 100}%` }}
                          />
                        </div>

                        {/* 4-Rule Checklist (2x2 grid) */}
                        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                          <div className={`flex items-center gap-1.5 ${hasLength ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-[var(--arena-text-muted)]'}`}>
                            {hasLength ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                            <span>At least 8 characters</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-[var(--arena-text-muted)]'}`}>
                            {hasUpper ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                            <span>One uppercase letter</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-[var(--arena-text-muted)]'}`}>
                            {hasNumber ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                            <span>One number</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${hasSymbol ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-[var(--arena-text-muted)]'}`}>
                            {hasSymbol ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                            <span>One symbol</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-xs font-semibold text-[var(--arena-text-primary)] mb-1.5"
                    >
                      Confirm password
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-lg border border-[var(--arena-input-border)] bg-[var(--arena-input-bg)] px-3.5 py-2.5 pr-10 text-xs sm:text-sm text-[var(--arena-text-primary)] focus:border-[var(--arena-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--arena-primary)] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--arena-text-muted)] hover:text-[var(--arena-text-primary)]"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-lg bg-[var(--arena-primary)] py-3 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--arena-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--arena-primary)] disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      <span>Create profile</span>
                    </button>
                  </div>
                </form>

                {/* Terms / Privacy line */}
                <div className="mt-5 text-center text-[11px] text-[var(--arena-text-muted)]">
                  By creating a profile you agree to the{' '}
                  <Link to="/terms" className="underline hover:text-[var(--arena-text-primary)]">
                    Terms
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="underline hover:text-[var(--arena-text-primary)]">
                    Privacy Policy
                  </Link>
                  .
                </div>
              </div>
            )}

            {/* TAB CONTENT: Sign In */}
            {activeTab === 'sign-in' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--arena-text-primary)]">
                    Sign in to your cockpit
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-[var(--arena-text-secondary)]">
                    Continue your exam practice sessions.
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="loginEmail" className="block text-xs font-semibold text-[var(--arena-text-primary)] mb-1.5">
                      Email address
                    </label>
                    <input
                      id="loginEmail"
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="you@example.ng"
                      className="w-full rounded-lg border border-[var(--arena-input-border)] bg-[var(--arena-input-bg)] px-3.5 py-2.5 text-xs sm:text-sm text-[var(--arena-text-primary)] focus:border-[var(--arena-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--arena-primary)] transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="loginPassword" className="block text-xs font-semibold text-[var(--arena-text-primary)] mb-1.5">
                      Password
                    </label>
                    <input
                      id="loginPassword"
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full rounded-lg border border-[var(--arena-input-border)] bg-[var(--arena-input-bg)] px-3.5 py-2.5 text-xs sm:text-sm text-[var(--arena-text-primary)] focus:border-[var(--arena-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--arena-primary)] transition-all"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-lg bg-[var(--arena-primary)] py-3 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--arena-primary-hover)] disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      <span>Sign In</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB CONTENT: CBT Key */}
            {activeTab === 'cbt-key' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--arena-text-primary)]">
                    Enter your CBT key
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-[var(--arena-text-secondary)]">
                    School-issued or center key to unlock full mocks.
                  </p>
                </div>

                <form onSubmit={handleCbtKeySubmit} className="space-y-4">
                  <div>
                    <label htmlFor="cbtKey" className="block text-xs font-semibold text-[var(--arena-text-primary)] mb-1.5">
                      12-Character CBT Key
                    </label>
                    <div className="relative">
                      <input
                        id="cbtKey"
                        type="text"
                        required
                        value={cbtKey}
                        onChange={(e) => setCbtKey(e.target.value.toUpperCase())}
                        placeholder="CBT-XXXX-XXXX"
                        maxLength={14}
                        className="w-full rounded-lg border border-[var(--arena-input-border)] bg-[var(--arena-input-bg)] px-3.5 py-2.5 font-mono text-xs sm:text-sm text-[var(--arena-text-primary)] tracking-wider focus:border-[var(--arena-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--arena-primary)] transition-all"
                      />
                      <Key className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--arena-text-muted)]" />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-lg bg-[var(--arena-primary)] py-3 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--arena-primary-hover)] disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      <span>Verify & Enter Arena</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
