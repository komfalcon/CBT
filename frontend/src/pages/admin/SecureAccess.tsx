import React, { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Key, ShieldAlert } from 'lucide-react';
import { login } from '../../features/auth/api';
import { Button, Input } from '../../components';
import { ThemeToggle } from '../../components/ThemeToggle';

export default function SecureAccess() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage('Verifying secure credentials...');
      
      const response = await login({ email, password });
      
      if (response.accessToken) {
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken || '');
        navigate('/admin/overview', { replace: true });
      } else {
        setMessage('Access Denied. Invalid token.');
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Access Denied. Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4 relative overflow-hidden">
      {/* Abstract Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-bg-card border border-border rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col items-center gap-4 mb-8 text-center">
            <div className="h-16 w-16 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
              <ShieldAlert className="h-8 w-8 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text-primary">System Access</h1>
              <p className="text-sm text-text-muted mt-1">Authorized personnel only.</p>
            </div>
          </div>

          <form onSubmit={handleAdminLogin} className="flex flex-col gap-5">
            <Input
              label="Admin Email"
              type="email"
              placeholder="sysadmin@aurikex.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            <Input
              label="Admin Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {message && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium px-4 py-3 rounded-xl flex items-center justify-center text-center">
                {message}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-2 group relative overflow-hidden"
              size="lg"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-rose-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center justify-center gap-2">
                <Lock className="w-5 h-5" />
                {loading ? 'Authenticating...' : 'Authenticate'}
              </div>
            </Button>
          </form>
        </div>
        
        <p className="text-center text-xs text-text-muted mt-8 font-mono opacity-50 hover:opacity-100 transition-opacity">
          IP LOGGED • ENCRYPTED SESSION
        </p>
      </div>
    </div>
  );
}
