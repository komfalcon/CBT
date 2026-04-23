import { FormEvent, useState } from 'react';
import {
  forgotPassword,
  login,
  refreshToken,
  register,
  verifyEmail,
  verifyOtp,
} from './api';

type AuthMode = 'login' | 'register' | 'verify-email' | 'forgot-password';

const initialLoginState = { email: '', password: '' };
const initialRegisterState = { fullName: '', email: '', phone: '', password: '' };

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [message, setMessage] = useState<string>('');
  const [tempToken, setTempToken] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [verificationToken, setVerificationToken] = useState<string>('');
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [tokens, setTokens] = useState<{ accessToken?: string; refreshToken?: string }>({});
  const [loginState, setLoginState] = useState(initialLoginState);
  const [registerState, setRegisterState] = useState(initialRegisterState);

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const response = await register({
        fullName: registerState.fullName,
        email: registerState.email,
        phone: registerState.phone || undefined,
        password: registerState.password,
      });
      setMessage(response.message);
      setMode('verify-email');
    } catch (error) {
      setMessage('Registration failed.');
      console.error(error);
    }
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const response = await login(loginState);
      if (response.requiresMFA && response.tempToken) {
        setTempToken(response.tempToken);
        setMessage('MFA required. Enter OTP to continue.');
      } else {
        setTokens({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        });
        setMessage('Login successful.');
      }
    } catch (error) {
      setMessage('Login failed.');
      console.error(error);
    }
  };

  const handleVerifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    if (!tempToken) {
      return;
    }

    try {
      const response = await verifyOtp({ tempToken, otp });
      setTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });
      setTempToken('');
      setOtp('');
      setMessage('MFA verification successful.');
    } catch (error) {
      setMessage('OTP verification failed.');
      console.error(error);
    }
  };

  const handleVerifyEmail = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const response = await verifyEmail(verificationToken);
      setMessage(response.message);
      setMode('login');
    } catch (error) {
      setMessage('Email verification failed.');
      console.error(error);
    }
  };

  const handleForgotPassword = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const response = await forgotPassword(forgotEmail);
      setMessage(response.message);
    } catch (error) {
      setMessage('Request failed.');
      console.error(error);
    }
  };

  const handleRefreshToken = async () => {
    if (!tokens.refreshToken) {
      setMessage('No refresh token available.');
      return;
    }

    try {
      const response = await refreshToken(tokens.refreshToken);
      setTokens(response);
      setMessage('Access token refreshed.');
    } catch (error) {
      setMessage('Token refresh failed.');
      console.error(error);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-xl bg-background p-6 text-text-primary">
      <h1 className="mb-4 text-2xl font-semibold">Authentication</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        <button className="rounded border px-3 py-1" onClick={() => setMode('login')}>
          Login
        </button>
        <button className="rounded border px-3 py-1" onClick={() => setMode('register')}>
          Register
        </button>
        <button className="rounded border px-3 py-1" onClick={() => setMode('verify-email')}>
          Verify Email
        </button>
        <button className="rounded border px-3 py-1" onClick={() => setMode('forgot-password')}>
          Forgot Password
        </button>
      </div>

      {mode === 'register' && (
        <form className="space-y-3" onSubmit={handleRegister}>
          <input
            className="w-full rounded border p-2"
            placeholder="Full name"
            value={registerState.fullName}
            onChange={(event) =>
              setRegisterState((prev) => ({ ...prev, fullName: event.target.value }))
            }
            required
          />
          <input
            className="w-full rounded border p-2"
            placeholder="Email"
            type="email"
            value={registerState.email}
            onChange={(event) => setRegisterState((prev) => ({ ...prev, email: event.target.value }))}
            required
          />
          <input
            className="w-full rounded border p-2"
            placeholder="Phone"
            value={registerState.phone}
            onChange={(event) => setRegisterState((prev) => ({ ...prev, phone: event.target.value }))}
          />
          <input
            className="w-full rounded border p-2"
            placeholder="Password"
            type="password"
            value={registerState.password}
            onChange={(event) =>
              setRegisterState((prev) => ({ ...prev, password: event.target.value }))
            }
            required
          />
          <button className="rounded bg-primary px-4 py-2 text-white" type="submit">
            Create account
          </button>
        </form>
      )}

      {mode === 'login' && (
        <form className="space-y-3" onSubmit={handleLogin}>
          <input
            className="w-full rounded border p-2"
            placeholder="Email"
            type="email"
            value={loginState.email}
            onChange={(event) => setLoginState((prev) => ({ ...prev, email: event.target.value }))}
            required
          />
          <input
            className="w-full rounded border p-2"
            placeholder="Password"
            type="password"
            value={loginState.password}
            onChange={(event) => setLoginState((prev) => ({ ...prev, password: event.target.value }))}
            required
          />
          <button className="rounded bg-primary px-4 py-2 text-white" type="submit">
            Login
          </button>
        </form>
      )}

      {tempToken && (
        <form className="mt-4 space-y-3" onSubmit={handleVerifyOtp}>
          <input
            className="w-full rounded border p-2"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
            required
          />
          <button className="rounded bg-primary px-4 py-2 text-white" type="submit">
            Verify OTP
          </button>
        </form>
      )}

      {mode === 'verify-email' && (
        <form className="space-y-3" onSubmit={handleVerifyEmail}>
          <textarea
            className="min-h-24 w-full rounded border p-2"
            placeholder="Paste verification token"
            value={verificationToken}
            onChange={(event) => setVerificationToken(event.target.value)}
            required
          />
          <button className="rounded bg-primary px-4 py-2 text-white" type="submit">
            Verify Email
          </button>
        </form>
      )}

      {mode === 'forgot-password' && (
        <form className="space-y-3" onSubmit={handleForgotPassword}>
          <input
            className="w-full rounded border p-2"
            placeholder="Email"
            type="email"
            value={forgotEmail}
            onChange={(event) => setForgotEmail(event.target.value)}
            required
          />
          <button className="rounded bg-primary px-4 py-2 text-white" type="submit">
            Send reset link
          </button>
        </form>
      )}

      {tokens.accessToken && (
        <section className="mt-6 space-y-2 rounded border p-3">
          <p className="text-sm">Access token is active.</p>
          <button className="rounded border px-3 py-1" onClick={handleRefreshToken}>
            Refresh access token
          </button>
        </section>
      )}

      {message && <p className="mt-4 rounded border border-blue-200 bg-blue-50 p-3 text-sm">{message}</p>}
    </main>
  );
}
