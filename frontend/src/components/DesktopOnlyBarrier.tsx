import React, { useEffect, useState, useCallback } from 'react';
import { Monitor, Smartphone, AlertTriangle, Maximize2, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';

const MIN_DESKTOP_WIDTH = 1024;

export const DesktopOnlyBarrier: React.FC = () => {
  const [windowWidth, setWindowWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false);
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(false);

  const checkDevice = useCallback(() => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    setWindowWidth(width);

    // Detect mobile / tablet user agents
    const userAgent = navigator.userAgent || navigator.vendor || (window as unknown as { opera?: string }).opera || '';
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
    const isMobileUA = mobileRegex.test(userAgent);

    // Also consider touch-first small devices
    const isTouchSmall = ('ontouchstart' in window || navigator.maxTouchPoints > 0) && width < MIN_DESKTOP_WIDTH;

    const isMobile = isMobileUA || isTouchSmall;
    const tooSmall = width < MIN_DESKTOP_WIDTH;

    setIsMobileDevice(isMobile);
    setIsSmallScreen(tooSmall || isMobile);
  }, []);

  useEffect(() => {
    checkDevice();

    const handleResize = () => {
      checkDevice();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [checkDevice]);

  // Lock body scroll when barrier is active
  useEffect(() => {
    if (isSmallScreen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isSmallScreen]);

  if (!isSmallScreen) {
    return null;
  }

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="Desktop interface required"
      className="fixed inset-0 z-[9999999] bg-[#070b14]/98 backdrop-blur-xl text-slate-100 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in"
    >
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/30 via-transparent to-transparent" />

      <div className="relative max-w-xl w-full bg-[#0d1527] border border-cyan-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/50 my-auto">
        {/* Top Branding Pill */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-semibold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Aurikrex Exam Arena • Strict Desktop Policy
          </div>
        </div>

        {/* Visual Device Comparison Graphic */}
        <div className="flex items-center justify-center gap-6 sm:gap-10 mb-6">
          {/* Mobile (Blocked) */}
          <div className="flex flex-col items-center gap-2 opacity-60">
            <div className="relative p-3.5 rounded-xl bg-red-950/30 border border-red-500/30">
              <Smartphone className="w-8 h-8 text-red-400" />
              <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-md">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <span className="text-xs text-red-400 font-medium">Mobile / Tablet</span>
          </div>

          <div className="text-slate-600 font-mono text-sm tracking-widest">━━━━▶</div>

          {/* Desktop (Required) */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative p-4 rounded-xl bg-cyan-950/50 border border-cyan-400/50 shadow-lg shadow-cyan-500/20">
              <Monitor className="w-10 h-10 text-cyan-400" />
              <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white rounded-full p-0.5 shadow-md">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <span className="text-xs text-cyan-300 font-bold tracking-wide">Desktop / Laptop</span>
          </div>
        </div>

        {/* Primary Alert Heading */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
            Desktop Interface Required
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            The <strong className="text-cyan-300 font-semibold">Aurikrex Exam Arena</strong> is exclusively restricted to desktop and laptop computers to guarantee standard JAMB UTME examination conditions.
          </p>
        </div>

        {/* Why Desktop Policy Cards */}
        <div className="bg-[#080d1a] border border-slate-800 rounded-xl p-4 sm:p-5 mb-6 text-left space-y-3.5">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Why Desktop Is Mandatory:
          </div>

          <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
            <span className="flex-shrink-0 w-5 h-5 rounded-md bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono font-bold text-xs">
              1
            </span>
            <div>
              <strong className="text-white">Authentic JAMB UTME Simulation:</strong>
              <p className="text-slate-400 text-xs mt-0.5">
                Official JAMB examination centers use widescreen desktop terminals with full split-screen question layouts and instant side-by-side calculators.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
            <span className="flex-shrink-0 w-5 h-5 rounded-md bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono font-bold text-xs">
              2
            </span>
            <div>
              <strong className="text-white">8-Key Physical Keyboard Navigation:</strong>
              <p className="text-slate-400 text-xs mt-0.5">
                Candidates must use physical keyboard hotkeys (<span className="text-cyan-300 font-mono">A, B, C, D, P, N, S, R</span>) for fast answering, just like in the real examination hall.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
            <span className="flex-shrink-0 w-5 h-5 rounded-md bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono font-bold text-xs">
              3
            </span>
            <div>
              <strong className="text-white">Falke AI Proctoring & Complex Diagrams:</strong>
              <p className="text-slate-400 text-xs mt-0.5">
                Live webcam proctoring, multi-step math formulas, and high-resolution chemical structures require a minimum screen width of 1024px.
              </p>
            </div>
          </div>
        </div>

        {/* Live Display Status Pill */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs mb-6">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>
              Current display width: <strong className="text-white font-mono">{windowWidth}px</strong>
            </span>
          </div>
          <div className="text-cyan-400 font-mono font-medium">
            Minimum required: {MIN_DESKTOP_WIDTH}px
          </div>
        </div>

        {/* Helpful Desktop Tip & Action */}
        <div className="space-y-3 text-center">
          <p className="text-xs text-slate-400">
            {isMobileDevice ? (
              <span>Please switch to a computer or laptop to access the exam arena and practice tests.</span>
            ) : (
              <span>
                Already on a computer? <strong>Maximize your browser window</strong> or press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] text-cyan-300">F11</kbd> to enter full-screen mode.
              </span>
            )}
          </p>

          <button
            type="button"
            onClick={checkDevice}
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-600/25 transition-all duration-200 active:scale-[0.99]"
          >
            <Maximize2 className="w-4 h-4" />
            Re-check Screen Resolution
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesktopOnlyBarrier;
