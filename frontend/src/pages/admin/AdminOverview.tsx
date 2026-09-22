import React, { useState, useEffect } from 'react';
import {
  Users,
  Key,
  CreditCard,
  Award,
  BookOpen,
  TrendingUp,
  Wrench,
  ShieldCheck,
  Power,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { OverviewStats } from './types';
import { useToast } from '../../components/ToastProvider';

export default function AdminOverview() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const { addToast } = useToast();

  const getHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
      const res = await fetch(`${apiBase}/admin/stats/overview`, {
        headers: getHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to load overview statistics');
      const data = await res.json();
      setStats(data);
    } catch (e: any) {
      addToast({ type: 'error', title: 'Error', message: e.message || 'Error fetching metrics' });
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchMaintenanceStatus = async () => {
    try {
      const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
      const res = await fetch(`${apiBase}/admin/maintenance/status`, {
        headers: getHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setIsMaintenance(Boolean(data.isMaintenance));
        if (data.updatedAt) {
          setLastUpdated(new Date(data.updatedAt).toLocaleString());
        }
      } else {
        const pubRes = await fetch(`${apiBase}/system/maintenance-status`, { cache: 'no-store' });
        if (pubRes.ok) {
          const pubData = await pubRes.json();
          setIsMaintenance(Boolean(pubData.isMaintenance));
          if (pubData.updatedAt) {
            setLastUpdated(new Date(pubData.updatedAt).toLocaleString());
          }
        }
      }
    } catch (e: any) {
      console.warn('Could not fetch maintenance status', e);
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const handleToggleMaintenance = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!passwordInput) {
      setPasswordError('Please enter the master verification password.');
      return;
    }
    setToggling(true);
    setPasswordError(null);
    try {
      const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
      const targetState = !isMaintenance;
      const res = await fetch(`${apiBase}/admin/maintenance/toggle`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          password: passwordInput,
          isMaintenance: targetState,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.message || 'Incorrect master password. Verification failed.');
        return;
      }

      setIsMaintenance(data.isMaintenance);
      if (data.updatedAt) {
        setLastUpdated(new Date(data.updatedAt).toLocaleString());
      }
      setShowPasswordModal(false);
      setPasswordInput('');
      addToast({
        type: 'success',
        title: data.isMaintenance ? 'Maintenance Mode Activated' : 'Maintenance Mode Deactivated',
        message: data.isMaintenance
          ? 'Platform is now locked in maintenance mode. Non-admin routes are displaying the maintenance screen.'
          : 'Platform is now LIVE and accessible to all students and visitors.',
      });
    } catch (err: any) {
      setPasswordError(err.message || 'Network error while attempting to toggle maintenance mode.');
    } finally {
      setToggling(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchMaintenanceStatus();
  }, []);

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Platform Maintenance Mode Control Card */}
      <div
        className={`rounded-2xl border p-5 sm:p-6 transition-all duration-300 relative overflow-hidden ${
          isMaintenance
            ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5'
            : 'bg-bg-card border-border shadow-sm'
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-xl shrink-0 ${
                isMaintenance ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/10 text-emerald-500'
              }`}
            >
              {isMaintenance ? (
                <Wrench className="h-6 w-6 animate-pulse" />
              ) : (
                <ShieldCheck className="h-6 w-6" />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-base font-bold text-text-primary">
                  System Maintenance Mode
                </h2>
                {maintenanceLoading ? (
                  <span className="text-xs text-text-muted animate-pulse">Checking status...</span>
                ) : isMaintenance ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                    Under Maintenance
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Platform Live
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-text-secondary max-w-2xl">
                {isMaintenance
                  ? 'Maintenance mode is currently ACTIVE. All non-admin visitors see the scheduled maintenance screen. Admin portals remain operational.'
                  : 'Platform is LIVE. Candidate mock exams, registration, login, and all student features are running normally.'}
              </p>
              {lastUpdated && (
                <p className="text-[11px] text-text-muted">
                  Status last updated: {lastUpdated}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={() => {
                setPasswordInput('');
                setPasswordError(null);
                setShowPassword(false);
                setShowPasswordModal(true);
              }}
              className={`w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all duration-200 cursor-pointer ${
                isMaintenance
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 active:scale-[0.98]'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 active:scale-[0.98]'
              }`}
            >
              <Power className="h-4 w-4" />
              {isMaintenance ? 'Disable Maintenance (Go Live)' : 'Turn Maintenance ON'}
            </button>
          </div>
        </div>
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-bg-secondary border border-border animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Total Candidates Card */}
            <div className="bg-bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-16 w-16 bg-primary/5 rounded-bl-full group-hover:bg-primary/10 transition-colors" />
              <div className="flex justify-between items-start">
                <span className="text-xs text-text-muted font-semibold tracking-wider uppercase">Registered Candidates</span>
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span className="text-2xl font-bold text-text-primary">{stats.candidates.total}</span>
                <p className="text-xs text-text-muted mt-1">Excludes voucher placeholder accounts</p>
              </div>
            </div>

            {/* Active Vouchers Card */}
            <div className="bg-bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-16 w-16 bg-violet-500/5 rounded-bl-full group-hover:bg-violet-500/10 transition-colors" />
              <div className="flex justify-between items-start">
                <span className="text-xs text-text-muted font-semibold tracking-wider uppercase">Vouchers Generated</span>
                <Key className="h-5 w-5 text-violet-500 dark:text-violet-400" />
              </div>
              <div>
                <span className="text-2xl font-bold text-text-primary">{stats.candidates.vouchers}</span>
                <p className="text-xs text-text-muted mt-1">Unassigned active vouchers</p>
              </div>
            </div>

            {/* Completed Exams Card */}
            <div className="bg-bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/5 rounded-bl-full group-hover:bg-emerald-500/10 transition-colors" />
              <div className="flex justify-between items-start">
                <span className="text-xs text-text-muted font-semibold tracking-wider uppercase">Completed Mock Exams</span>
                <BookOpen className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
              </div>
              <div>
                <span className="text-2xl font-bold text-text-primary">{stats.exams.total}</span>
                <div className="flex items-center gap-1 mt-1 text-xs">
                  <span className="text-emerald-500 dark:text-emerald-400 font-medium">{stats.exams.today} completed today</span>
                  <span className="text-text-muted">|</span>
                  <span className="text-text-muted">{stats.exams.yesterday} yesterday</span>
                </div>
              </div>
            </div>

            {/* Revenue Card */}
            <div className="bg-bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-16 w-16 bg-amber-500/5 rounded-bl-full group-hover:bg-amber-500/10 transition-colors" />
              <div className="flex justify-between items-start">
                <span className="text-xs text-text-muted font-semibold tracking-wider uppercase">Estimated Revenue</span>
                <CreditCard className="h-5 w-5 text-amber-500 dark:text-amber-400" />
              </div>
              <div>
                <span className="text-2xl font-bold text-text-primary">₦{stats.revenue.total.toLocaleString()}</span>
                <div className="flex items-center gap-1 text-xs text-text-muted mt-1">
                  <TrendingUp className="h-3 w-3 text-amber-500 dark:text-amber-400" />
                  <span>Based on verified Paystack transactions</span>
                </div>
              </div>
            </div>
          </div>

          {/* Subscriptions Overview & Activity Logs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-bg-card border border-border rounded-2xl p-5 flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-text-primary">System Subscription Summary</h3>
              <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-xl border border-border">
                <div>
                  <p className="text-xs text-text-muted">Total Premium Users</p>
                  <p className="text-lg font-bold text-text-primary mt-1">{stats.subscriptions.active}</p>
                </div>
                <Award className="h-8 w-8 text-primary/45" />
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Users are assigned tiers (Plus, Pro, Max) automatically upon verified payments. Only users with active premium tiers get full CBT features and unlimited AI operations.
              </p>
            </div>

            <div className="bg-bg-card border border-border rounded-2xl p-5 flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-text-primary">Platform Health & Status</h3>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs py-1 border-b border-border">
                  <span className="text-text-muted">MongoDB database</span>
                  <span className="text-emerald-500 dark:text-emerald-400 font-medium">Connected</span>
                </div>
                <div className="flex justify-between items-center text-xs py-1 border-b border-border">
                  <span className="text-text-muted">Rate Limiter (Throttler)</span>
                  <span className="text-emerald-500 dark:text-emerald-400 font-medium">Active (Global)</span>
                </div>
                <div className="flex justify-between items-center text-xs py-1 border-b border-border">
                  <span className="text-text-muted">CORS Whitelist protection</span>
                  <span className="text-emerald-500 dark:text-emerald-400 font-medium">Enforced</span>
                </div>
                <div className="flex justify-between items-center text-xs py-1">
                  <span className="text-text-muted">Maintenance Gate</span>
                  <span className={isMaintenance ? 'text-amber-400 font-bold' : 'text-emerald-500 dark:text-emerald-400 font-medium'}>
                    {isMaintenance ? 'ACTIVE (Platform Locked)' : 'STANDBY (Platform Live)'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="p-8 text-center text-text-muted">Failed to load statistics.</div>
      )}

      {/* Password Verification Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-bg-card border border-border rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 relative">
            {/* Modal Header */}
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  isMaintenance ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                }`}
              >
                <Lock className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-text-primary">
                  {isMaintenance ? 'Deactivate Maintenance Mode' : 'Activate Maintenance Mode'}
                </h3>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                  {isMaintenance
                    ? 'Entering the master password will restore full public access to the platform for all candidates.'
                    : 'Entering the master password will immediately block all non-admin visitors and display the maintenance page across all routes.'}
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleToggleMaintenance} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-text-secondary">
                  Admin Master Password <span className="text-rose-400 font-normal">(Case-sensitive)</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    placeholder="Enter verification password"
                    autoFocus
                    className="w-full bg-bg-secondary border border-border rounded-xl px-4 py-2.5 pr-11 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-xs font-medium text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>{passwordError}</span>
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={toggling}
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordInput('');
                    setPasswordError(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={toggling || !passwordInput}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer disabled:opacity-50 ${
                    isMaintenance
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 active:scale-[0.98]'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 active:scale-[0.98]'
                  }`}
                >
                  {toggling ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>{isMaintenance ? 'Confirm & Go Live' : 'Confirm & Lock Platform'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
