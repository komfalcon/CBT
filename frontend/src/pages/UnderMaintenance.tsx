import React, { useState } from 'react';
import { Wrench, RefreshCw, ShieldAlert, Sparkles, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface UnderMaintenanceProps {
  onCheckStatus?: () => Promise<boolean>;
}

export default function UnderMaintenance({ onCheckStatus }: UnderMaintenanceProps) {
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleRefresh = async () => {
    setChecking(true);
    setStatusMessage(null);
    try {
      const apiBase = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, '');
      const res = await fetch(`${apiBase}/system/maintenance-status`, { cache: 'no-store' });
      const data = await res.json();
      if (!data.isMaintenance) {
        setStatusMessage('Platform is back online! Redirecting...');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setStatusMessage('Maintenance is still underway. Please check back shortly.');
      }
    } catch {
      setStatusMessage('Unable to reach server. Please check your internet connection.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0a1020] text-slate-100 flex flex-col justify-between relative overflow-hidden font-body selection:bg-amber-500/30 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-[700px] rounded-full bg-amber-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-500/10 blur-[120px]" />

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-amber-500/20">
            A
          </div>
          <div>
            <span className="font-display font-bold text-base tracking-tight text-white">Aurikrex Exam Arena</span>
            <span className="hidden sm:inline-block ml-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
              Maintenance Mode
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-semibold text-amber-300 tracking-wide uppercase">Scheduled Upgrades</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="max-w-2xl w-full text-center space-y-8 animate-fade-in">
          {/* Animated Graphic Icon */}
          <div className="relative mx-auto flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-amber-500/20 blur-xl animate-pulse" />
            <div className="relative flex h-full w-full items-center justify-center rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 via-[#131d38] to-slate-900 shadow-2xl">
              <Wrench className="h-10 w-10 sm:h-12 sm:w-12 text-amber-400 animate-bounce duration-1000" />
            </div>
          </div>

          {/* Headings */}
          <div className="space-y-3">
            <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
              Under Scheduled Maintenance
            </h1>
            <p className="max-w-lg mx-auto text-xs sm:text-base leading-6 text-slate-400">
              We are currently performing critical system upgrades, question engine optimizations, and security maintenance. We will be back online shortly!
            </p>
          </div>

          {/* Details Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-5 sm:p-6 text-left max-w-lg mx-auto shadow-xl">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" /> What's being improved
            </h2>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Upgrading database performance for instantaneous test score computations</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Optimizing UTME question bank routing and diagram caching</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Applying security protocols and core engine enhancements</span>
              </li>
            </ul>
          </div>

          {/* Action Button & Status Feedback */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={checking}
              className="inline-flex items-center gap-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-bold px-6 py-3.5 text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all duration-200 cursor-pointer disabled:opacity-75"
            >
              <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Checking platform status...' : 'Check Status / Refresh'}
            </button>

            {statusMessage && (
              <p className="text-xs font-semibold text-amber-300 animate-fade-in">
                {statusMessage}
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Footer with Discreet Admin Entry */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Aurikrex Exam Arena. All student records remain securely protected.</p>
        <div className="flex items-center gap-4">
          <a href="mailto:info@aurikrex.com" className="transition hover:text-white">
            Support: info@aurikrex.com
          </a>
          <span className="text-slate-700">|</span>
          <Link
            to="/sys/auth-checkpoint"
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors"
            title="Administrator Sign-in Checkpoint"
          >
            <Lock className="h-3 w-3" />
            <span>Admin Control</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
