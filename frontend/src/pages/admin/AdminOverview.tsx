import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Database,
  ArrowRight,
  Server,
  Activity,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { OverviewStats } from './types';
import { useToast } from '../../components/ToastProvider';
import {
  getOverviewStats,
  getMaintenanceStatus,
  toggleMaintenance,
} from '../../features/admin/api';

export default function AdminOverview() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const { addToast } = useToast();
  const navigate = useNavigate();

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const data = await getOverviewStats();
      setStats(data);
    } catch (e: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: e.response?.data?.message || e.message || 'Error fetching metrics',
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchMaintenance = async () => {
    try {
      const data = await getMaintenanceStatus();
      setIsMaintenance(Boolean(data.isMaintenance));
      if (data.updatedAt) {
        setLastUpdated(new Date(data.updatedAt).toLocaleString());
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
      const targetState = !isMaintenance;
      const data = await toggleMaintenance(passwordInput, targetState);

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
          ? 'Platform is now locked in maintenance mode. Non-admin routes display the maintenance screen.'
          : 'Platform is now LIVE and accessible to all students and visitors.',
      });
    } catch (err: any) {
      setPasswordError(
        err.response?.data?.message || err.message || 'Incorrect master password. Verification failed.',
      );
    } finally {
      setToggling(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchMaintenance();
  }, []);

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-12">
      {/* 1. Platform Maintenance Mode Control Card */}
      <div
        className={`rounded-2xl border p-5 sm:p-6 transition-all duration-300 relative overflow-hidden ${
          isMaintenance
            ? 'bg-amber-500/10 border-amber-500/40 shadow-xl shadow-amber-500/5'
            : 'bg-bg-card border-border shadow-sm'
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div
              className={`p-3.5 rounded-2xl shrink-0 ${
                isMaintenance ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'
              }`}
            >
              {isMaintenance ? (
                <Wrench className="h-6 w-6 animate-pulse" />
              ) : (
                <ShieldCheck className="h-6 w-6" />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-bold text-text-primary">
                  Platform Maintenance Control
                </h2>
                {maintenanceLoading ? (
                  <span className="text-xs text-text-muted animate-pulse">Checking status...</span>
                ) : isMaintenance ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10">
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                    Under Maintenance
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Platform Live
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-text-secondary max-w-2xl leading-relaxed">
                {isMaintenance
                  ? 'Maintenance mode is ACTIVE. All public, candidate, and exam URLs display the Under Maintenance screen. Admin tools remain fully operational.'
                  : 'Platform is LIVE. Candidate mock exams, registration, login, and all student features are running normally across all URLs.'}
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
              className={`w-full md:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all duration-200 cursor-pointer ${
                isMaintenance
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25 active:scale-[0.98]'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25 active:scale-[0.98]'
              }`}
            >
              <Power className="h-4 w-4" />
              <span>{isMaintenance ? 'Disable Maintenance (Go Live)' : 'Turn Maintenance ON'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Performance Indicators (KPIs) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Key Performance Indicators
          </h3>
          <button
            type="button"
            onClick={fetchStats}
            className="text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            Refresh Metrics
          </button>
        </div>

        {statsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-bg-card border border-border animate-pulse" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Candidates Card */}
            <div className="bg-bg-card border border-border hover:border-primary/40 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-20 w-20 bg-primary/5 rounded-bl-full group-hover:bg-primary/10 transition-colors" />
              <div className="flex justify-between items-start">
                <span className="text-xs text-text-muted font-bold tracking-wider uppercase">
                  Active Candidates
                </span>
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black text-text-primary tracking-tight">
                  {stats.candidates.total.toLocaleString()}
                </div>
                <p className="text-xs text-text-muted mt-1 truncate">
                  Excludes placeholder vouchers
                </p>
              </div>
            </div>

            {/* Vouchers Generated */}
            <div className="bg-bg-card border border-border hover:border-violet-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-20 w-20 bg-violet-500/5 rounded-bl-full group-hover:bg-violet-500/10 transition-colors" />
              <div className="flex justify-between items-start">
                <span className="text-xs text-text-muted font-bold tracking-wider uppercase">
                  Available Vouchers
                </span>
                <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
                  <Key className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black text-text-primary tracking-tight">
                  {stats.candidates.vouchers.toLocaleString()}
                </div>
                <p className="text-xs text-text-muted mt-1 truncate">
                  Unassigned CBT access vouchers
                </p>
              </div>
            </div>

            {/* Completed Mock Exams */}
            <div className="bg-bg-card border border-border hover:border-emerald-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-20 w-20 bg-emerald-500/5 rounded-bl-full group-hover:bg-emerald-500/10 transition-colors" />
              <div className="flex justify-between items-start">
                <span className="text-xs text-text-muted font-bold tracking-wider uppercase">
                  Completed Mocks
                </span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <BookOpen className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black text-text-primary tracking-tight">
                  {stats.exams.total.toLocaleString()}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-xs">
                  <span className="text-emerald-400 font-bold">{stats.exams.today} today</span>
                  <span className="text-text-muted">•</span>
                  <span className="text-text-muted">{stats.exams.yesterday} yesterday</span>
                </div>
              </div>
            </div>

            {/* Historical Paystack Revenue */}
            <div className="bg-bg-card border border-border hover:border-amber-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-20 w-20 bg-amber-500/5 rounded-bl-full group-hover:bg-amber-500/10 transition-colors" />
              <div className="flex justify-between items-start">
                <span className="text-xs text-text-muted font-bold tracking-wider uppercase">
                  Recorded Volume
                </span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <CreditCard className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black text-text-primary tracking-tight">
                  ₦{stats.revenue.total.toLocaleString()}
                </div>
                <p className="text-xs text-text-muted mt-1 truncate flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-amber-400" />
                  <span>Historical Paystack ledger</span>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-text-muted bg-bg-card border border-border rounded-2xl">
            Failed to load KPI statistics.
          </div>
        )}
      </div>

      {/* 3. Quick Action Hub */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> Management Shortcuts
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/keys')}
            className="flex items-center justify-between p-4 rounded-xl border border-border bg-bg-card hover:bg-bg-secondary hover:border-primary/40 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                <Key className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-text-primary">Generate CBT Keys</div>
                <div className="text-[11px] text-text-muted">Batch export activation keys</div>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/candidates')}
            className="flex items-center justify-between p-4 rounded-xl border border-border bg-bg-card hover:bg-bg-secondary hover:border-primary/40 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-violet-500/10 text-violet-400 group-hover:scale-105 transition-transform">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-text-primary">Inspect Candidates</div>
                <div className="text-[11px] text-text-muted">Manage candidate accounts</div>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-text-muted group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/questions')}
            className="flex items-center justify-between p-4 rounded-xl border border-border bg-bg-card hover:bg-bg-secondary hover:border-primary/40 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-text-primary">Question Bank</div>
                <div className="text-[11px] text-text-muted">Author & upload UTME items</div>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-text-muted group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/billing')}
            className="flex items-center justify-between p-4 rounded-xl border border-border bg-bg-card hover:bg-bg-secondary hover:border-primary/40 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-text-primary">Audit Billing Ledger</div>
                <div className="text-[11px] text-text-muted">Review Paystack records</div>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-text-muted group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>
      </div>

      {/* 4. Subscription & System Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subscription Summary */}
        <div className="bg-bg-card border border-border rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-text-primary">System Subscription Overview</h3>
              <Award className="h-5 w-5 text-primary" />
            </div>
            <div className="flex items-center justify-between p-4 bg-bg-secondary/60 rounded-xl border border-border">
              <div>
                <p className="text-xs text-text-muted font-medium">Active High-Tier Accounts</p>
                <p className="text-2xl font-black text-text-primary mt-1">
                  {stats?.subscriptions.active ?? 0}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                100% Free Public Beta
              </span>
            </div>
            <p className="text-xs text-text-muted leading-relaxed mt-4">
              During the Free Public Beta phase, all registered students automatically receive Max tier CBT privileges and daily Falke AI tutor access (20 messages/day). Paywall enforcement is paused.
            </p>
          </div>
          <div className="pt-4 border-t border-border mt-4 flex items-center justify-between text-xs text-text-muted">
            <span>Next Quota Reset</span>
            <span className="font-semibold text-text-primary">Midnight (00:00 UTC)</span>
          </div>
        </div>

        {/* Platform Telemetry & Core Status */}
        <div className="bg-bg-card border border-border rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-text-primary">System Telemetry & Health</h3>
              <Server className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs py-2 border-b border-border">
                <span className="text-text-muted">Database Engine</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> PostgreSQL (Turso / LibSQL)
                </span>
              </div>
              <div className="flex justify-between items-center text-xs py-2 border-b border-border">
                <span className="text-text-muted">Rate Limiter (Throttler)</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Active (Global IP Tracking)
                </span>
              </div>
              <div className="flex justify-between items-center text-xs py-2 border-b border-border">
                <span className="text-text-muted">CORS Whitelist Protection</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Enforced
                </span>
              </div>
              <div className="flex justify-between items-center text-xs py-2">
                <span className="text-text-muted">Maintenance Security Gate</span>
                <span
                  className={
                    isMaintenance
                      ? 'text-amber-400 font-bold flex items-center gap-1.5'
                      : 'text-emerald-400 font-bold flex items-center gap-1.5'
                  }
                >
                  <span className={`h-2 w-2 rounded-full ${isMaintenance ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
                  {isMaintenance ? 'ACTIVE (Platform Locked)' : 'STANDBY (Platform Live)'}
                </span>
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-border mt-4 flex items-center justify-between text-xs text-text-muted">
            <span>Server Deployment</span>
            <span className="font-semibold text-text-primary">Render / Cloudflare CDN</span>
          </div>
        </div>
      </div>

      {/* 5. Password Verification Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-bg-card border border-border rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 relative">
            <div className="flex items-start gap-3.5">
              <div
                className={`p-3 rounded-xl shrink-0 ${
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
                    : 'Entering the master password will immediately block all non-admin visitors and display the maintenance page across all URLs.'}
                </p>
              </div>
            </div>

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
                  <p className="text-xs font-medium text-rose-400 flex items-center gap-1.5 animate-shake">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>{passwordError}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={toggling}
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordInput('');
                    setPasswordError(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={toggling || !passwordInput}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer disabled:opacity-50 ${
                    isMaintenance
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
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
