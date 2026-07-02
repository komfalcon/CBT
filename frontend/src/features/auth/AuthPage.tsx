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
import { Lock, Mail, User, Phone, Key, HelpCircle, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';

type AuthMode = 'login' | 'register' | 'verify-email' | 'forgot-password' | 'reset-password' | 'cbt-key-login';

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [mode, setMode] = useState<AuthMode>('login');
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
  const [registerState, setRegisterState] = useState({ fullName: '', email: '', phone: '', password: '' });

  // Sandbox Google Mock state
  const [isGoogleMockOpen, setIsGoogleMockOpen] = useState<boolean>(false);
  const [mockGoogleEmail, setMockGoogleEmail] = useState<string>('guest@google.com');
  const [mockGoogleName, setMockGoogleName] = useState<string>('Guest Candidate');

  // Verify Reset Password token from URL query params
  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const modeParam = searchParams.get('mode');
    
    if (tokenParam) {
      setResetToken(tokenParam);
      setMode('reset-password');
    } else if (modeParam === 'register') {
      setMode('register');
    } else if (modeParam === 'cbtkey') {
      setMode('cbt-key-login');
    }
  }, [searchParams]);

  // Load Google GIS SDK
  useEffect(() => {
    const clientScript = document.createElement('script');
    clientScript.src = 'https://accounts.google.com/gsi/client';
    clientScript.async = true;
    clientScript.defer = true;
    clientScript.onload = () => {
      initializeGoogleAuth();
    };
    document.body.appendChild(clientScript);

    return () => {
      document.body.removeChild(clientScript);
    };
  }, []);

  const initializeGoogleAuth = () => {
    // Check if google is loaded in global window
    const google = (window as any).google;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    
    if (google && clientId) {
      try {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleLoginResponse,
        });
        google.accounts.id.renderButton(
          document.getElementById('google-signin-btn'),
          { theme: 'dark', size: 'large', width: 340, shape: 'pill' }
        );
      } catch (err) {
        console.warn('Google client init failed. Falling back to sandbox mode.', err);
      }
    }
  };

  const handleGoogleLoginResponse = async (googleRes: any) => {
    try {
      setMessageType('info');
      setMessage('Signing in with Google...');
      const response = await googleLogin({ credential: googleRes.credential });
      
      if (response.requiresMFA && response.tempToken) {
        setTempToken(response.tempToken);
        setMode('login'); // Will show OTP form
        setMessage('MFA required. Enter your 6-digit OTP code.');
      } else {
        localStorage.setItem('accessToken', response.accessToken || '');
        localStorage.setItem('refreshToken', response.refreshToken || '');
        setMessage('Google login successful!');
        setMessageType('success');
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      setMessageType('error');
      setMessage('Google authentication failed. Use Email or CBT Key.');
    }
  };

  // Development bypass / sandbox mock Google login handler
  const handleGoogleMockLogin = async () => {
    // We construct a mock JWT payload representing verified Google user info
    // For local backend validation bypass, we send a mocked id_token or create the user directly.
    // In our backend `loginWithGoogle` verifies via oauth2.googleapis.com, so we simulate this by calling register
    // or we tell the developer how to add VITE_GOOGLE_CLIENT_ID.
    // Here we can trigger registering/logging in a student profile.
    try {
      setMessageType('info');
      setMessage('Simulating sandbox sign-in...');
      
      // We will perform a custom mock auth registration/login payload
      const dummyPassword = 'MockPassword123!';
      try {
        // Try registering user first
        await register({
          fullName: mockGoogleName,
          email: mockGoogleEmail,
          password: dummyPassword,
          role: 'student',
        });
      } catch (e) {
        // Ignore if already registered
      }

      // Login using credentials
      const response = await login({ email: mockGoogleEmail, password: dummyPassword });
      localStorage.setItem('accessToken', response.accessToken || '');
      localStorage.setItem('refreshToken', response.refreshToken || '');
      setMessage('Sandbox sign-in successful!');
      setMessageType('success');
      setIsGoogleMockOpen(false);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setMessageType('error');
      setMessage('Sandbox login failed.');
    }
  };

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setMessageType('info');
      setMessage('Creating account...');
      const response = await register(registerState);
      
      if (response.token) {
        console.log('--- Development Email Verification Code ---');
        console.log('%c' + response.token, 'font-size: 20px; color: #6366f1; font-weight: bold; background: #1e1b4b; padding: 4px 8px; rounded: 4px;');
        console.log('Copy this 6-digit code to verify your email.');
      }
      
      setVerifyEmailAddress(registerState.email);
      setMessage(response.message || 'Registration successful! Enter the 6-digit code below.');
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
      
      if (response.requiresMFA && response.tempToken) {
        setTempToken(response.tempToken);
        setMessage('MFA required. Enter your 6-digit OTP code.');
      } else {
        localStorage.setItem('accessToken', response.accessToken || '');
        localStorage.setItem('refreshToken', response.refreshToken || '');
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
      const response = await loginWithCbtKey({ cbtKey });

      localStorage.setItem('accessToken', response.accessToken || '');
      localStorage.setItem('refreshToken', response.refreshToken || '');
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
      setMessage('Checking OTP...');
      const response = await verifyOtp({ tempToken, otp });
      
      localStorage.setItem('accessToken', response.accessToken || '');
      localStorage.setItem('refreshToken', response.refreshToken || '');
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
      
      if (response.token) {
        console.log('--- Development Password Reset Code ---');
        console.log('%c' + response.token, 'font-size: 20px; color: #a855f7; font-weight: bold; background: #3b0764; padding: 4px 8px; rounded: 4px;');
        console.log('Copy this 6-digit code to reset your password.');
      }

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
      setSearchParams({}); // Clear query parameters
      setMode('login');
    } catch (error: any) {
      setMessageType('error');
      setMessage(error.response?.data?.message || 'Failed to reset password. Code might be expired.');
    }
  };

  const isGoogleAvailable = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans p-6 overflow-hidden relative">
      {/* Glow Orbs */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-900/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-violet-900/10 blur-[150px] pointer-events-none" />

      {/* Floating Auth Card */}
      <div className="w-full max-w-md rounded-3xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-xl p-8 shadow-2xl relative">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-indigo-400" />
            CBT Portal
          </h1>
          <p className="text-xs text-slate-400">
            {mode === 'login' && 'Sign in to start practicing exams'}
            {mode === 'register' && 'Create your candidate profile'}
            {mode === 'cbt-key-login' && 'Device Roaming Cafe Quick Access'}
            {mode === 'verify-email' && 'Verify your student account'}
            {mode === 'forgot-password' && 'Enter email to receive reset code'}
            {mode === 'reset-password' && 'Enter your new account password'}
          </p>
        </div>

        {/* Tab Controls for Auth modes */}
        {(mode === 'login' || mode === 'register' || mode === 'cbt-key-login') && (
          <div className="grid grid-cols-3 gap-1 bg-slate-950/80 rounded-xl p-1 mb-6 border border-slate-850">
            <button
              onClick={() => setMode('login')}
              className={`rounded-lg py-2 text-xs font-semibold transition-all ${
                mode === 'login' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('register')}
              className={`rounded-lg py-2 text-xs font-semibold transition-all ${
                mode === 'register' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => setMode('cbt-key-login')}
              className={`rounded-lg py-2 text-xs font-semibold transition-all ${
                mode === 'cbt-key-login' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              CBT Key
            </button>
          </div>
        )}

        {/* Google Authentication container */}
        {(mode === 'login' || mode === 'register' || mode === 'cbt-key-login') && (
          <div className="space-y-4 mb-6">
            {isGoogleAvailable ? (
              <div className="flex justify-center" id="google-signin-btn"></div>
            ) : (
              <button
                type="button"
                onClick={() => setIsGoogleMockOpen(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 py-3 text-sm font-semibold text-slate-200 transition-colors shadow-lg active:scale-95"
              >
                <span className="h-4 w-4 rounded-full border border-indigo-400/30 flex items-center justify-center bg-indigo-500/10 text-[10px] font-bold text-indigo-400">G</span>
                Sign in with Google (Sandbox)
              </button>
            )}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-[10px] text-slate-500 font-semibold uppercase">Or email address</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>
          </div>
        )}

        {/* Main Forms */}
        {mode === 'login' && !tempToken && (
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={loginState.email}
                  onChange={(e) => setLoginState((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800/80 pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-slate-650 focus:border-indigo-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Password</label>
                <button
                  type="button"
                  onClick={() => setMode('forgot-password')}
                  className="text-[10px] text-indigo-400 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginState.password}
                  onChange={(e) => setLoginState((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800/80 pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-slate-650 focus:border-indigo-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 text-sm font-bold text-white transition-all transform active:scale-95 shadow-lg shadow-indigo-600/20"
            >
              Sign In <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {mode === 'register' && (
          <form className="space-y-4" onSubmit={handleRegister}>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="Chinedu Okafor"
                  value={registerState.fullName}
                  onChange={(e) => setRegisterState((prev) => ({ ...prev, fullName: e.target.value }))}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800/80 pl-10 pr-4 py-3 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="candidate@domain.ng"
                  value={registerState.email}
                  onChange={(e) => setRegisterState((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800/80 pl-10 pr-4 py-3 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Phone (Optional)</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="08012345678"
                  value={registerState.phone}
                  onChange={(e) => setRegisterState((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800/80 pl-10 pr-4 py-3 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="Min. 8 chars (A-z, 0-9, special)"
                  value={registerState.password}
                  onChange={(e) => setRegisterState((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800/80 pl-10 pr-4 py-3 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 text-sm font-bold text-white transition-all transform active:scale-95 shadow-lg shadow-indigo-600/20"
            >
              Register Candidate <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {mode === 'cbt-key-login' && (
          <form className="space-y-4" onSubmit={handleCbtKeyLogin}>
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-4 text-[11px] text-indigo-300 leading-normal space-y-1">
              <strong>Quick Cafe Roaming Access:</strong>
              <p>Type your 8-digit unique access key (e.g. CBT-AB12XY) allotted during registration to login directly without typing your password.</p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">CBT Access Key</label>
              <div className="relative">
                <Key className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="CBT-XXXXXX"
                  value={cbtKey}
                  onChange={(e) => setCbtKey(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800/80 pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-slate-650 focus:border-indigo-500 focus:outline-none transition-colors font-mono tracking-wide"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 text-sm font-bold text-white transition-all transform active:scale-95"
            >
              Quick Login <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {tempToken && (
          <form className="mt-4 space-y-4 animate-fade-in" onSubmit={handleVerifyOtp}>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">MFA Security Code</label>
              <input
                type="text"
                required
                placeholder="6-digit OTP code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-4 pr-4 py-3 text-sm text-center font-mono tracking-widest text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 text-sm font-bold text-white transition-all"
            >
              Verify OTP Code
            </button>
          </form>
        )}

        {mode === 'verify-email' && (
          <form className="space-y-4 animate-fade-in" onSubmit={handleVerifyEmail}>
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-[11px] text-indigo-300 leading-normal">
              <strong>Check Browser Console (F12):</strong>
              <p>Copy the 6-digit verification code printed in the browser console logs and enter it below.</p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Email Address</label>
              <input
                type="email"
                required
                placeholder="candidate@domain.com"
                value={verifyEmailAddress}
                onChange={(e) => setVerifyEmailAddress(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-4 pr-4 py-3 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">6-Digit Verification Code</label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={verificationToken}
                onChange={(e) => setVerificationToken(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-4 pr-4 py-3 text-sm text-center font-mono tracking-widest text-indigo-400 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 text-sm font-bold text-white transition-all animate-pulse"
            >
              Complete Email Verification
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full text-center text-xs text-slate-400 hover:text-white"
            >
              Back to Login
            </button>
          </form>
        )}

        {mode === 'forgot-password' && (
          <form className="space-y-4 animate-fade-in" onSubmit={handleForgotPassword}>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="registered@email.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-10 pr-4 py-3 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 text-sm font-bold text-white transition-all"
            >
              Generate Reset Token
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full text-center text-xs text-slate-400 hover:text-white"
            >
              Back to Sign In
            </button>
          </form>
        )}

        {mode === 'reset-password' && (
          <form className="space-y-4 animate-fade-in" onSubmit={handleResetPassword}>
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-[11px] text-indigo-300 leading-normal">
              <strong>Check Browser Console (F12):</strong>
              <p>Enter the 6-digit reset code printed in the browser console logs below.</p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="candidate@domain.com"
                  value={verifyEmailAddress}
                  onChange={(e) => setVerifyEmailAddress(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-10 pr-4 py-3 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">6-Digit Reset Code</label>
              <div className="relative">
                <Key className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-10 pr-4 py-3 text-sm text-center font-mono tracking-widest text-indigo-400 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-10 pr-4 py-3 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 text-sm font-bold text-white transition-all"
            >
              Update Password
            </button>
          </form>
        )}

        {/* Global Feedback Banner */}
        {message && (
          <div className={`mt-6 rounded-xl border p-4 text-xs flex gap-2 items-start animate-fade-in ${
            messageType === 'error'
              ? 'border-rose-500/20 bg-rose-500/10 text-rose-300'
              : messageType === 'success'
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
              : 'border-blue-500/20 bg-blue-500/10 text-blue-300'
          }`}>
            <HelpCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div className="leading-normal flex-1">{message}</div>
          </div>
        )}
      </div>

      {/* Mock Google Login modal */}
      {isGoogleMockOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-850 bg-slate-900 p-6 space-y-6">
            <div className="flex items-center gap-2 text-indigo-400 pb-2 border-b border-slate-800">
              <ShieldAlert className="h-5 w-5" />
              <h3 className="text-base font-bold text-white">Google Sandbox Mock Auth</h3>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              No Client ID configuration was detected in the environment. Use this local sandbox dropdown to simulate returning valid authenticated details from Google OAuth.
            </p>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Profile Name</label>
                <input
                  type="text"
                  required
                  placeholder="Jane Doe"
                  value={mockGoogleName}
                  onChange={(e) => setMockGoogleName(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-4 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Profile Email</label>
                <input
                  type="email"
                  required
                  placeholder="jane.doe@gmail.com"
                  value={mockGoogleEmail}
                  onChange={(e) => setMockGoogleEmail(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-4 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsGoogleMockOpen(false)}
                className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGoogleMockLogin}
                className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white"
              >
                Simulate Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
