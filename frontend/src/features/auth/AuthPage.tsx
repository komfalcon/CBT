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
import { Lock, Mail, User, Phone, Key, HelpCircle, ArrowRight, ShieldAlert, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button, Alert, Card, Input, Modal } from '../../components';
import { ThemeToggle } from '../../components/ThemeToggle';

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
  const [registerState, setRegisterState] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' });

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

  // Re-initialize/render Google button on mode changes when SDK is loaded
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
          google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleLoginResponse,
          });
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
      
      if (response.requiresMFA && response.tempToken) {
        setTempToken(response.tempToken);
        setMode('login'); // Will show OTP form
        setMessage('MFA required. Enter your 6-digit OTP code.');
      } else if (response.accessToken && response.refreshToken) {
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        setMessage('Google login successful!');
        setMessageType('success');
        navigate('/dashboard');
      } else {
        setMessageType('error');
        setMessage('Google sign-in failed: no tokens returned. Please try again.');
      }
    } catch (err: any) {
      console.error(err);
      setMessageType('error');
      setMessage('Google authentication failed. Use Email or CBT Key.');
    }
  };

  const handleGoogleMockLogin = async () => {
    try {
      setMessageType('info');
      setMessage('Simulating sandbox sign-in...');
      
      const dummyPassword = 'MockPassword123!';
      try {
        await register({
          fullName: mockGoogleName,
          email: mockGoogleEmail,
          password: dummyPassword,
          role: 'student',
        });
      } catch (e) {
        // Ignore if already registered
      }

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

    if (registerState.password !== registerState.confirmPassword) {
      setMessageType('error');
      setMessage('Passwords do not match.');
      return;
    }

    // Password requirements verification
    const pass = registerState.password;
    const hasMinLength = pass.length >= 8;
    const hasUpper = /[A-Z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);

    if (!hasMinLength || !hasUpper || !hasNumber || !hasSpecial) {
      setMessageType('error');
      setMessage('Password does not meet the requirements.');
      return;
    }

    try {
      setMessageType('info');
      setMessage('Creating account...');
      const response = await register({
        fullName: registerState.fullName,
        email: registerState.email,
        phone: registerState.phone,
        password: registerState.password,
      });
      
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

  // Password Requirement Checks
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
    <div className="min-h-screen bg-bg-primary text-text-primary flex items-center justify-center font-sans p-6 overflow-hidden relative">
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>
      {/* Glow Orbs */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-500/5 blur-[150px] pointer-events-none" />

      {/* Floating Auth Card */}
      <Card className="w-full max-w-md rounded-3xl border border-border bg-bg-card/40 backdrop-blur-xl p-8 shadow-2xl relative">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            CBT Portal
          </h1>
          <p className="text-xs text-text-secondary">
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
          <div className="grid grid-cols-3 gap-1 bg-bg-primary/80 rounded-xl p-1 mb-6 border border-border">
            <button
              onClick={() => setMode('login')}
              className={`rounded-lg py-2 text-xs font-bold transition-all duration-200 ${
                mode === 'login' ? 'bg-primary text-text-on-accent shadow-md' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('register')}
              className={`rounded-lg py-2 text-xs font-bold transition-all duration-200 ${
                mode === 'register' ? 'bg-primary text-text-on-accent shadow-md' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => setMode('cbt-key-login')}
              className={`rounded-lg py-2 text-xs font-bold transition-all duration-200 ${
                mode === 'cbt-key-login' ? 'bg-primary text-text-on-accent shadow-md' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              CBT Key
            </button>
          </div>
        )}

        {/* Main Forms */}
        {mode === 'login' && !tempToken && (
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-text-secondary tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-text-muted" />
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={loginState.email}
                  onChange={(e) => setLoginState((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-xl bg-bg-secondary border border-border pl-10 pr-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/25 outline-none transition-all duration-150"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase text-text-secondary tracking-wider">Password</label>
                <button
                  type="button"
                  onClick={() => setMode('forgot-password')}
                  className="text-[10px] text-primary hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-text-muted" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginState.password}
                  onChange={(e) => setLoginState((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full rounded-xl bg-bg-secondary border border-border pl-10 pr-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/25 outline-none transition-all duration-150"
                />
              </div>
            </div>

            <Button type="submit" fullWidth>
              Sign In <ArrowRight className="h-4 w-4" />
            </Button>

            {/* Google Authentication Section - repositioned under password form */}
            <div className="pt-2">
              <div className="relative flex py-2 items-center mb-4">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-4 text-[10px] text-slate-500 font-semibold uppercase">Or join with</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>
              {isGoogleAvailable ? (
                <div className="flex justify-center w-full" id="google-signin-btn"></div>
              ) : (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setIsGoogleMockOpen(true)}
                    className="flex items-center justify-center gap-2 rounded-full bg-slate-950 border border-slate-800 hover:border-slate-700 px-6 py-2.5 text-xs font-semibold text-text-primary dark:text-slate-200 transition-colors shadow-lg active:scale-95"
                  >
                    <span className="h-4 w-4 rounded-full border border-indigo-400/30 flex items-center justify-center bg-indigo-500/10 text-[9px] font-bold text-indigo-400">G</span>
                    Sign in with Google
                  </button>
                </div>
              )}
            </div>
          </form>
        )}

        {mode === 'register' && (
          <form className="space-y-4" onSubmit={handleRegister}>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-text-secondary tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-text-muted" />
                <input
                  type="text"
                  required
                  placeholder="Chinedu Okafor"
                  value={registerState.fullName}
                  onChange={(e) => setRegisterState((prev) => ({ ...prev, fullName: e.target.value }))}
                  className="w-full rounded-xl bg-bg-secondary border border-border pl-10 pr-4 py-3 text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/25 outline-none transition-all duration-150"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-text-secondary tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-text-muted" />
                <input
                  type="email"
                  required
                  placeholder="candidate@domain.ng"
                  value={registerState.email}
                  onChange={(e) => setRegisterState((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-xl bg-bg-secondary border border-border pl-10 pr-4 py-3 text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/25 outline-none transition-all duration-150"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-text-secondary tracking-wider">Phone (Optional)</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="08012345678"
                  value={registerState.phone}
                  onChange={(e) => setRegisterState((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full rounded-xl bg-bg-secondary border border-border pl-10 pr-4 py-3 text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/25 outline-none transition-all duration-150"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-text-secondary tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-text-muted" />
                <input
                  type="password"
                  required
                  placeholder="Create password"
                  value={registerState.password}
                  onChange={(e) => setRegisterState((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full rounded-xl bg-bg-secondary border border-border pl-10 pr-4 py-3 text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/25 outline-none transition-all duration-150"
                />
              </div>

              {/* Password strength and requirements with animations */}
              {pass.length > 0 && (
                <div className="pt-2 pb-1 space-y-2 animate-slide-up">
                  {/* Strength Bar */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-text-secondary">Password Strength:</span>
                    <span className="text-[10px] font-bold text-text-primary">{strengthText}</span>
                  </div>
                  <div className="h-1.5 w-full bg-bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${strengthColor} transition-all duration-500`} 
                      style={{ width: `${(strengthCount / 4) * 100}%` }}
                    />
                  </div>

                  {/* Checklist */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                    <div className="flex items-center gap-1.5 transition-colors duration-300">
                      {reqs.length ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 text-text-muted dark:text-slate-600 shrink-0" />
                      )}
                      <span className={reqs.length ? 'text-emerald-400' : 'text-slate-500'}>Min 8 characters</span>
                    </div>
                    <div className="flex items-center gap-1.5 transition-colors duration-300">
                      {reqs.upper ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 text-text-muted dark:text-slate-600 shrink-0" />
                      )}
                      <span className={reqs.upper ? 'text-emerald-400' : 'text-slate-500'}>1 uppercase letter</span>
                    </div>
                    <div className="flex items-center gap-1.5 transition-colors duration-300">
                      {reqs.number ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 text-text-muted dark:text-slate-600 shrink-0" />
                      )}
                      <span className={reqs.number ? 'text-emerald-400' : 'text-slate-500'}>1 number</span>
                    </div>
                    <div className="flex items-center gap-1.5 transition-colors duration-300">
                      {reqs.special ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 text-text-muted dark:text-slate-600 shrink-0" />
                      )}
                      <span className={reqs.special ? 'text-emerald-400' : 'text-slate-500'}>1 special character</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-text-muted dark:text-slate-400 tracking-wider">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="Repeat password"
                  value={registerState.confirmPassword}
                  onChange={(e) => setRegisterState((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full rounded-xl bg-bg-secondary border border-border pl-10 pr-4 py-3 text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/25 outline-none transition-all duration-150"
                />
              </div>
              {registerState.confirmPassword.length > 0 && registerState.password !== registerState.confirmPassword && (
                <p className="text-[10px] text-error animate-slide-up">Passwords do not match.</p>
              )}
            </div>

            <Button type="submit" fullWidth>
              Register Candidate <ArrowRight className="h-4 w-4" />
            </Button>

            {/* Google Authentication Section - repositioned under password form */}
            <div className="pt-2">
              <div className="relative flex py-2 items-center mb-4">
                <div className="flex-grow border-t border-border"></div>
                <span className="flex-shrink mx-4 text-[10px] text-text-muted font-semibold uppercase">Or join with</span>
                <div className="flex-grow border-t border-border"></div>
              </div>
              {isGoogleAvailable ? (
                <div className="flex justify-center w-full" id="google-signin-btn"></div>
              ) : (
                <div className="flex justify-center">
                  <Button
                    type="button"
                    onClick={() => setIsGoogleMockOpen(true)}
                    variant="secondary"
                    size="sm"
                    className="rounded-full px-6"
                  >
                    <span className="h-4 w-4 rounded-full border border-primary/30 flex items-center justify-center bg-primary/10 text-[9px] font-bold text-primary">G</span>
                    Sign up with Google
                  </Button>
                </div>
              )}
            </div>
          </form>
        )}

        {mode === 'cbt-key-login' && (
          <form className="space-y-4" onSubmit={handleCbtKeyLogin}>
            <Alert variant="info" title="Quick Cafe Roaming Access">
              Type your 8-digit unique access key (e.g. CBT-AB12XY) allotted during registration to login directly without typing your password.
            </Alert>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-text-secondary tracking-wider">CBT Access Key</label>
              <div className="relative">
                <Key className="absolute left-3.5 top-3.5 h-4 w-4 text-text-muted" />
                <input
                  type="text"
                  required
                  placeholder="CBT-XXXXXX"
                  value={cbtKey}
                  onChange={(e) => setCbtKey(e.target.value)}
                  className="w-full rounded-xl bg-bg-secondary border border-border pl-10 pr-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/25 outline-none transition-all duration-150 font-mono tracking-wide"
                />
              </div>
            </div>

            <Button type="submit" fullWidth>
              Quick Login <ArrowRight className="h-4 w-4" />
            </Button>

            {/* Google Authentication Section - repositioned under password form */}
            <div className="pt-2">
              <div className="relative flex py-2 items-center mb-4">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-4 text-[10px] text-slate-500 font-semibold uppercase">Or join with</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>
              {isGoogleAvailable ? (
                <div className="flex justify-center w-full" id="google-signin-btn"></div>
              ) : (
                <div className="flex justify-center">
                  <Button
                    type="button"
                    onClick={() => setIsGoogleMockOpen(true)}
                    variant="secondary"
                    size="sm"
                    className="rounded-full px-6"
                  >
                    <span className="h-4 w-4 rounded-full border border-primary/30 flex items-center justify-center bg-primary/10 text-[9px] font-bold text-primary">G</span>
                    Sign in with Google
                  </Button>
                </div>
              )}
            </div>
          </form>
        )}

        {tempToken && (
          <form className="mt-4 space-y-4 animate-fade-in" onSubmit={handleVerifyOtp}>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-text-secondary tracking-wider">MFA Security Code</label>
              <input
                type="text"
                required
                placeholder="6-digit OTP code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full rounded-xl bg-bg-secondary border border-border pl-4 pr-4 py-3 text-sm text-center font-mono tracking-widest text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/25 outline-none transition-all duration-150"
              />
            </div>
            <Button type="submit" fullWidth>
              Verify OTP Code
            </Button>
          </form>
        )}

        {mode === 'verify-email' && (
          <form className="space-y-4 animate-fade-in" onSubmit={handleVerifyEmail}>
            <Alert variant="info" title="Check Browser Console (F12)">
              Copy the 6-digit verification code printed in the browser console logs and enter it below.
            </Alert>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-text-secondary tracking-wider">Email Address</label>
              <input
                type="email"
                required
                placeholder="candidate@domain.com"
                value={verifyEmailAddress}
                onChange={(e) => setVerifyEmailAddress(e.target.value)}
                className="w-full rounded-xl bg-bg-secondary border border-border pl-4 pr-4 py-3 text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/25 outline-none transition-all duration-150"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-text-secondary tracking-wider">6-Digit Verification Code</label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={verificationToken}
                onChange={(e) => setVerificationToken(e.target.value)}
                className="w-full rounded-xl bg-bg-secondary border border-border pl-4 pr-4 py-3 text-sm text-center font-mono tracking-widest text-primary focus:border-primary focus:ring-2 focus:ring-primary/25 outline-none transition-all duration-150"
              />
            </div>
            <Button type="submit" fullWidth className="animate-pulse">
              Complete Email Verification
            </Button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full text-center text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              Back to Login
            </button>
          </form>
        )}

        {mode === 'forgot-password' && (
          <form className="space-y-4 animate-fade-in" onSubmit={handleForgotPassword}>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-text-secondary tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-text-muted" />
                <input
                  type="email"
                  required
                  placeholder="registered@email.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full rounded-xl bg-bg-secondary border border-border pl-10 pr-4 py-3 text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/25 outline-none transition-all duration-150"
                />
              </div>
            </div>
            <Button type="submit" fullWidth>
              Generate Reset Token
            </Button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full text-center text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              Back to Sign In
            </button>
          </form>
        )}

        {mode === 'reset-password' && (
          <form className="space-y-4 animate-fade-in" onSubmit={handleResetPassword}>
            <Alert variant="info" title="Check Browser Console (F12)">
              Enter the 6-digit reset code printed in the browser console logs below.
            </Alert>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-text-secondary tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-text-muted" />
                <input
                  type="email"
                  required
                  placeholder="candidate@domain.com"
                  value={verifyEmailAddress}
                  onChange={(e) => setVerifyEmailAddress(e.target.value)}
                  className="w-full rounded-xl bg-bg-secondary border border-border pl-10 pr-4 py-3 text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/25 outline-none transition-all duration-150"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-text-secondary tracking-wider">6-Digit Reset Code</label>
              <div className="relative">
                <Key className="absolute left-3.5 top-3.5 h-4 w-4 text-text-muted" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  className="w-full rounded-xl bg-bg-secondary border border-border pl-10 pr-4 py-3 text-sm text-center font-mono tracking-widest text-primary focus:border-primary focus:ring-2 focus:ring-primary/25 outline-none transition-all duration-150"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-text-secondary tracking-wider">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-text-muted" />
                <input
                  type="password"
                  required
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl bg-bg-secondary border border-border pl-10 pr-4 py-3 text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/25 outline-none transition-all duration-150"
                />
              </div>
            </div>
            <Button type="submit" fullWidth>
              Update Password
            </Button>
          </form>
        )}

        {/* Global Feedback Banner */}
        {message && (
          <Alert variant={messageType === 'error' ? 'error' : messageType === 'success' ? 'success' : 'info'} className="mt-6">
            {message}
          </Alert>
        )}
      </Card>

      {/* Mock Google Login modal */}
      <Modal
        isOpen={isGoogleMockOpen}
        onClose={() => setIsGoogleMockOpen(false)}
        title="Google Sandbox Mock Auth"
        maxWidth="sm"
      >
        <div className="space-y-6">
          <Alert variant="warning">
            No Client ID configuration was detected in the environment. Use this local sandbox dropdown to simulate returning valid authenticated details from Google OAuth.
          </Alert>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-text-secondary">Profile Name</label>
              <input
                type="text"
                required
                placeholder="Jane Doe"
                value={mockGoogleName}
                onChange={(e) => setMockGoogleName(e.target.value)}
                className="w-full rounded-xl bg-bg-secondary border border-border pl-4 pr-4 py-2.5 text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/25 outline-none transition-all duration-150"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-text-secondary">Profile Email</label>
              <input
                type="email"
                required
                placeholder="jane.doe@gmail.com"
                value={mockGoogleEmail}
                onChange={(e) => setMockGoogleEmail(e.target.value)}
                className="w-full rounded-xl bg-bg-secondary border border-border pl-4 pr-4 py-2.5 text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/25 outline-none transition-all duration-150"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsGoogleMockOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleGoogleMockLogin}
            >
              Simulate Login
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
