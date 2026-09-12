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
        throw new Error('Received HTML response instead of JSON. Your VITE_API_BASE_URL is likely misconfigured on Render.');
      }

      if (response.requiresMFA) {
        setTempToken('cookie');
        setMode('login'); // Will show OTP form
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
      const response = await loginWithCbtKey({ cbtKey });

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
      const response = await verifyOtp({ otp });

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
      setSearchParams({}); // Clear query parameters
      setMode('login');
    } catch (error: any) {
      setMessageType('error');
      setMessage(error.response?.data?.message || 'Failed to reset password. Code might be expired.');
    }
  };

  const isGoogleAvailable = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

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
    <div className="auth-page relative min-h-screen overflow-hidden font-body text-text-primary">
      <div className="auth-grid pointer-events-none absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute left-[8%] top-[12%] h-64 w-64 rounded-full bg-blue-500/10 blur-[110px]" />
      <div className="pointer-events-none absolute bottom-[8%] right-[10%] h-72 w-72 rounded-full bg-violet-500/10 blur-[120px]" />
      <div className="absolute right-6 top-6 z-50"><ThemeToggle /></div>

      <div className="auth-layout relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="auth-shell grid min-w-0 w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/[0.10] bg-[#0d172b]/90 shadow-[0_32px_90px_rgba(0,0,0,0.38)] backdrop-blur-xl lg:grid-cols-[0.82fr_1.18fr]">
          <aside className="auth-brand-panel relative hidden overflow-hidden border-r border-white/[0.08] bg-[linear-gradient(150deg,rgba(40,67,137,0.32),rgba(16,24,46,0.7)_55%,rgba(79,54,156,0.2))] p-10 lg:flex lg:flex-col lg:justify-between">
            <div className="pointer-events-none absolute -right-20 top-20 h-64 w-64 rounded-full border border-blue-300/10" />
            <div className="pointer-events-none absolute -right-8 top-32 h-40 w-40 rounded-full border border-violet-300/10" />
            <div>
              <div className="flex items-center gap-3">
                <img src="/favicon.svg" alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover shadow-[0_10px_24px_rgba(74,91,255,0.28)]" />
                <div><p className="font-display text-[15px] font-semibold tracking-[-0.02em] text-white">Aurikrex Exam Arena</p><p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-blue-300">by Aurikrex</p></div>
              </div>
              <div className="mt-20 max-w-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Your next score starts here</div>
                <h2 className="mt-5 font-display text-4xl font-semibold leading-[1.06] tracking-[-0.06em] text-white">A calmer way to prepare for JAMB.</h2>
                <p className="mt-5 text-[15px] leading-7 text-blue-100/65">Practice in a realistic environment, understand every answer, and keep your progress moving forward.</p>
              </div>
            </div>
            <div className="relative mt-16 rounded-2xl border border-white/10 bg-white/[0.05] p-5">
              <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300"><ShieldAlert className="h-4 w-4" /></div><div><p className="text-[14px] font-semibold text-white">Built for real exam confidence</p><p className="mt-1 text-xs text-blue-100/55">Beta Access are already practicing.</p></div></div>
              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/[0.08] pt-4"><div><p className="font-display text-xl font-semibold tracking-[-0.04em] text-white">17</p><p className="mt-1 text-xs text-blue-100/50">subjects</p></div><div><p className="font-display text-xl font-semibold tracking-[-0.04em] text-white">1M+</p><p className="mt-1 text-xs text-blue-100/50">questions</p></div><div><p className="font-display text-xl font-semibold tracking-[-0.04em] text-white">4.9</p><p className="mt-1 text-xs text-blue-100/50">rating</p></div></div>
            </div>
          </aside>

          <section className="auth-form-panel min-w-0 max-h-[calc(100vh-48px)] overflow-y-auto p-4 sm:p-9 lg:p-10">
            <div className="mx-auto min-w-0 w-full max-w-md">
              <div className="mb-8 flex items-start justify-between gap-6">
                <div><div className="auth-form-brand mb-4 flex items-center gap-2 lg:hidden"><img src="/favicon.svg" alt="" className="h-9 w-9 shrink-0 rounded-xl object-cover" /><span className="font-display text-[15px] font-semibold text-white">Aurikrex Exam Arena</span></div><div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">Candidate portal</div><h1 className="auth-title mt-3 font-display text-3xl font-semibold tracking-[-0.055em] text-white">{mode === 'login' && 'Welcome back.'}{mode === 'register' && 'Create your profile.'}{mode === 'cbt-key-login' && 'Use your CBT key.'}{mode === 'verify-email' && 'Verify your email.'}{mode === 'forgot-password' && 'Reset your password.'}{mode === 'reset-password' && 'Set a new password.'}</h1><p className="auth-subtitle mt-2 text-[14px] leading-6 text-slate-400">{mode === 'login' && 'Sign in to continue practicing.'}{mode === 'register' && 'Create a candidate profile and start practicing.'}{mode === 'cbt-key-login' && 'Quick access for shared devices and cafe sessions.'}{mode === 'verify-email' && 'Confirm your email to activate your account.'}{mode === 'forgot-password' && 'Enter your email to receive a reset code.'}{mode === 'reset-password' && 'Enter your new account password below.'}</p></div>
                <span className="auth-secure-badge mt-1 hidden shrink-0 whitespace-nowrap rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-2.5 py-1 text-xs font-semibold text-emerald-300 sm:inline-flex">Secure access</span>
              </div>

              {(mode === 'login' || mode === 'register' || mode === 'cbt-key-login') && (
                <div className="auth-tabs mb-7 grid grid-cols-3 gap-1 rounded-xl border border-white/[0.08] bg-black/20 p-1">
                  <button onClick={() => setMode('login')} className={mode === 'login' ? 'min-h-11 rounded-lg py-2.5 text-xs font-semibold transition bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)]' : 'min-h-11 rounded-lg py-2.5 text-xs font-semibold transition text-slate-500 hover:text-slate-200'}>Sign in</button>
                  <button onClick={() => setMode('register')} className={mode === 'register' ? 'min-h-11 rounded-lg py-2.5 text-xs font-semibold transition bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)]' : 'min-h-11 rounded-lg py-2.5 text-xs font-semibold transition text-slate-500 hover:text-slate-200'}>Sign up</button>
                  <button onClick={() => setMode('cbt-key-login')} className={mode === 'cbt-key-login' ? 'min-h-11 rounded-lg py-2.5 text-xs font-semibold transition bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)]' : 'min-h-11 rounded-lg py-2.5 text-xs font-semibold transition text-slate-500 hover:text-slate-200'}>CBT key</button>
                </div>
              )}

              {mode === 'login' && !tempToken && (
                <form className="space-y-5" onSubmit={handleLogin}>
                  <div className="space-y-2"><label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Email</label><div className="relative"><Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" /><input type="email" required placeholder="name@domain.com" value={loginState.email} onChange={(e) => setLoginState((prev) => ({ ...prev, email: e.target.value }))} className="w-full rounded-xl border border-white/[0.10] bg-white/[0.045] py-3.5 pl-10 pr-4 text-[14px] text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-blue-500/10" /></div></div>
                  <div className="space-y-2"><div className="flex items-center justify-between"><label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Password</label><button type="button" onClick={() => setMode('forgot-password')} className="text-xs font-medium text-blue-300 transition hover:text-blue-200">Forgot password?</button></div><div className="relative"><Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" /><input type="password" required placeholder="••••••••" value={loginState.password} onChange={(e) => setLoginState((prev) => ({ ...prev, password: e.target.value }))} className="w-full rounded-xl border border-white/[0.10] bg-white/[0.045] py-3.5 pl-10 pr-4 text-[14px] text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-blue-500/10" /></div></div>
                  <Button type="submit" fullWidth>Sign in <ArrowRight className="h-4 w-4" /></Button>
                  <div className="pt-2"><div className="relative flex items-center gap-3 py-2"><div className="h-px flex-1 bg-white/[0.08]" /><span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-600">Or continue with</span><div className="h-px flex-1 bg-white/[0.08]" /></div>{isGoogleAvailable ? <div className="mt-3 flex w-full justify-center" id="google-signin-btn"></div> : <div className="mt-3 flex justify-center"><button type="button" onClick={() => setMessage('Google sign-in is not configured. Please use email or CBT key.')} className="flex items-center justify-center gap-2 rounded-lg border border-white/[0.10] bg-white/[0.04] px-5 py-3 text-[14px] font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.08]"><span className="flex h-5 w-5 items-center justify-center rounded-full border border-blue-400/30 bg-blue-400/10 text-xs font-bold text-blue-300">G</span> Sign in with Google</button></div>}</div>
                </form>
              )}

              {mode === 'login' && tempToken && (
                <form className="space-y-5 animate-slide-up" onSubmit={handleVerifyOtp}>
                  <div className="auth-callout rounded-xl border border-blue-400/15 bg-blue-400/[0.07] p-4 text-[14px] leading-6 text-blue-100/75"><div className="flex items-center gap-2 font-semibold text-blue-200"><ShieldAlert className="h-4 w-4" /> Two-step verification</div><p className="mt-1.5">Enter the 6-digit code from your authenticator to continue.</p></div>
                  <div className="space-y-2"><label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Authenticator code</label><div className="relative"><ShieldAlert className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" /><input type="text" required placeholder="000000" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} className="w-full rounded-xl border border-white/[0.10] bg-white/[0.045] py-3.5 pl-10 pr-4 text-center font-mono text-[14px] tracking-[0.5em] text-white outline-none transition focus:border-blue-400/60 focus:ring-4 focus:ring-blue-500/10" /></div></div>
                  <Button type="submit" fullWidth>Verify code <ArrowRight className="h-4 w-4" /></Button><button type="button" onClick={() => { setTempToken(''); setOtp(''); setMessage(''); }} className="w-full text-center text-[14px] text-slate-500 transition hover:text-white">Cancel and go back</button>
                </form>
              )}

              {mode === 'register' && (
                <form className="space-y-4" onSubmit={handleRegister}>
                  {[["Full name", User, 'fullName', 'Chinedu Okafor'], ["Email address", Mail, 'email', 'candidate@domain.ng'], ["Phone (optional)", Phone, 'phone', '08012345678']].map(([label, Icon, key, placeholder]) => <div key={key as string} className="space-y-2"><label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label as string}</label><div className="relative"><Icon className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" /><input type={key === 'email' ? 'email' : 'text'} required={key !== 'phone'} placeholder={placeholder as string} value={registerState[key as 'fullName' | 'email' | 'phone']} onChange={(e) => setRegisterState((prev) => ({ ...prev, [key as 'fullName' | 'email' | 'phone']: e.target.value }))} className="w-full rounded-xl border border-white/[0.10] bg-white/[0.045] py-3.5 pl-10 pr-4 text-[14px] text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-blue-500/10" /></div></div>)}
                  <div className="space-y-2"><label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Password</label><div className="relative"><Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" /><input type="password" required placeholder="Create password" value={registerState.password} onChange={(e) => setRegisterState((prev) => ({ ...prev, password: e.target.value }))} className="w-full rounded-xl border border-white/[0.10] bg-white/[0.045] py-3.5 pl-10 pr-4 text-[14px] text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-blue-500/10" /></div>{pass.length > 0 && <div className="auth-password-box space-y-2 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 animate-slide-up"><div className="flex items-center justify-between"><span className="text-xs font-medium text-slate-500">Password strength</span><span className="text-xs font-semibold text-slate-300">{strengthText}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]"><div className={'h-full ' + strengthColor + ' transition-all duration-500'} style={{ width: ((strengthCount / 4) * 100) + '%' }} /></div><div className="grid grid-cols-2 gap-2 pt-1 text-xs">{[[reqs.length, 'Min 8 characters'], [reqs.upper, '1 uppercase letter'], [reqs.number, '1 number'], [reqs.special, '1 special character']].map(([valid, label]) => <div key={label as string} className={'flex items-center gap-1.5 ' + (valid ? 'text-emerald-300' : 'text-slate-500')}>{valid ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}<span>{label as string}</span></div>)}</div></div>}</div>
                  <div className="space-y-2"><label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Confirm password</label><div className="relative"><Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" /><input type="password" required placeholder="Repeat password" value={registerState.confirmPassword} onChange={(e) => setRegisterState((prev) => ({ ...prev, confirmPassword: e.target.value }))} className="w-full rounded-xl border border-white/[0.10] bg-white/[0.045] py-3.5 pl-10 pr-4 text-[14px] text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-blue-500/10" /></div>{registerState.confirmPassword.length > 0 && registerState.password !== registerState.confirmPassword && <p className="text-xs text-rose-300">Passwords do not match.</p>}</div>
                  <Button type="submit" fullWidth>Register candidate <ArrowRight className="h-4 w-4" /></Button>
                  <div className="pt-2"><div className="relative flex items-center gap-3 py-2"><div className="h-px flex-1 bg-white/[0.08]" /><span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-600">Or continue with</span><div className="h-px flex-1 bg-white/[0.08]" /></div>{isGoogleAvailable ? <div className="mt-3 flex w-full justify-center" id="google-signin-btn"></div> : <div className="mt-3 flex justify-center"><Button type="button" variant="secondary" size="sm" onClick={() => setMessage('Google sign-in is not configured. Please use email or CBT key.')}><span className="flex h-5 w-5 items-center justify-center rounded-full border border-blue-400/30 bg-blue-400/10 text-xs font-bold text-blue-300">G</span> Sign up with Google</Button></div>}</div>
                </form>
              )}

              {mode === 'cbt-key-login' && <form className="space-y-5" onSubmit={handleCbtKeyLogin}><Alert variant="info" title="Quick cafe roaming access">Type your 8-digit unique access key allotted during registration to login directly without typing your password.</Alert><div className="space-y-2"><label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">CBT access key</label><div className="relative"><Key className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" /><input type="text" required placeholder="CBT-XXXXXX" value={cbtKey} onChange={(e) => setCbtKey(e.target.value)} className="w-full rounded-xl border border-white/[0.10] bg-white/[0.045] py-3.5 pl-10 pr-4 font-mono text-[14px] tracking-wide text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/60 focus:ring-4 focus:ring-blue-500/10" /></div></div><Button type="submit" fullWidth>Quick login <ArrowRight className="h-4 w-4" /></Button><div className="pt-2"><div className="relative flex items-center gap-3 py-2"><div className="h-px flex-1 bg-white/[0.08]" /><span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-600">Or continue with</span><div className="h-px flex-1 bg-white/[0.08]" /></div>{isGoogleAvailable ? <div className="mt-3 flex w-full justify-center" id="google-signin-btn"></div> : <div className="mt-3 flex justify-center"><Button type="button" variant="secondary" size="sm" onClick={() => setMessage('Google sign-in is not configured. Please use email or CBT key.')}><span className="flex h-5 w-5 items-center justify-center rounded-full border border-blue-400/30 bg-blue-400/10 text-xs font-bold text-blue-300">G</span> Sign in with Google</Button></div>}</div></form>}

              {mode === 'verify-email' && <form className="space-y-5 animate-fade-in" onSubmit={handleVerifyEmail}><Alert variant="info" title="Check your inbox">A 6-digit verification code has been sent to your email address. Please enter it below.</Alert><div className="space-y-2"><label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Email address</label><input type="email" required placeholder="candidate@domain.com" value={verifyEmailAddress} onChange={(e) => setVerifyEmailAddress(e.target.value)} className="w-full rounded-xl border border-white/[0.10] bg-white/[0.045] px-4 py-3.5 text-[14px] text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/60 focus:ring-4 focus:ring-blue-500/10" /></div><div className="space-y-2"><label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">6-digit verification code</label><input type="text" required maxLength={6} placeholder="123456" value={verificationToken} onChange={(e) => setVerificationToken(e.target.value)} className="w-full rounded-xl border border-white/[0.10] bg-white/[0.045] px-4 py-3.5 text-center font-mono text-[14px] tracking-widest text-blue-200 outline-none transition focus:border-blue-400/60 focus:ring-4 focus:ring-blue-500/10" /></div><Button type="submit" fullWidth>Complete verification</Button><button type="button" onClick={() => setMode('login')} className="w-full text-center text-[14px] text-slate-500 transition hover:text-white">Back to sign in</button></form>}

              {mode === 'forgot-password' && <form className="space-y-5 animate-fade-in" onSubmit={handleForgotPassword}><div className="auth-callout rounded-xl border border-blue-400/15 bg-blue-400/[0.07] p-4 text-[14px] leading-6 text-blue-100/75">Enter the email connected to your candidate profile and we will generate a secure reset code.</div><div className="space-y-2"><label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Email address</label><div className="relative"><Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" /><input type="email" required placeholder="registered@email.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="w-full rounded-xl border border-white/[0.10] bg-white/[0.045] py-3.5 pl-10 pr-4 text-[14px] text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/60 focus:ring-4 focus:ring-blue-500/10" /></div></div><Button type="submit" fullWidth>Generate reset token</Button><button type="button" onClick={() => setMode('login')} className="w-full text-center text-[14px] text-slate-500 transition hover:text-white">Back to sign in</button></form>}

              {mode === 'reset-password' && <form className="space-y-5 animate-fade-in" onSubmit={handleResetPassword}><Alert variant="info" title="Check your inbox">A 6-digit password reset code has been sent to your email address. Please enter it below.</Alert><div className="space-y-2"><label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Email address</label><div className="relative"><Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" /><input type="email" required placeholder="candidate@domain.com" value={verifyEmailAddress} onChange={(e) => setVerifyEmailAddress(e.target.value)} className="w-full rounded-xl border border-white/[0.10] bg-white/[0.045] py-3.5 pl-10 pr-4 text-[14px] text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/60 focus:ring-4 focus:ring-blue-500/10" /></div></div><div className="space-y-2"><label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">6-digit reset code</label><div className="relative"><Key className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" /><input type="text" required maxLength={6} placeholder="123456" value={resetToken} onChange={(e) => setResetToken(e.target.value)} className="w-full rounded-xl border border-white/[0.10] bg-white/[0.045] py-3.5 pl-10 pr-4 text-center font-mono text-[14px] tracking-widest text-blue-200 outline-none transition focus:border-blue-400/60 focus:ring-4 focus:ring-blue-500/10" /></div></div><div className="space-y-2"><label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">New password</label><div className="relative"><Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" /><input type="password" required placeholder="Min. 8 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full rounded-xl border border-white/[0.10] bg-white/[0.045] py-3.5 pl-10 pr-4 text-[14px] text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/60 focus:ring-4 focus:ring-blue-500/10" /></div></div><Button type="submit" fullWidth>Update password</Button></form>}

              {message && <Alert variant={messageType === 'error' ? 'error' : messageType === 'success' ? 'success' : 'info'} className="mt-6">{message}</Alert>}
              <p className="mt-8 text-center text-xs leading-5 text-slate-600">By continuing, you agree to prepare responsibly and keep your account details secure.</p>
            </div>
          </section>
        </div>
      </div>


    </div>
  );
}
