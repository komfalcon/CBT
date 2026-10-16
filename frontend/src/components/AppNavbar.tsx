import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Play, User, ExternalLink } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { AurikrexAppsSwitcher } from './AurikrexAppsSwitcher';
import { AuriCoinBadge } from './AuriCoinBadge';
import { getMe, logout } from '../features/auth/api';

export interface AppNavbarProps {
  student?: any;
  titleBadge?: string;
  rightAction?: React.ReactNode;
}

export function AppNavbar({ student: propStudent, titleBadge, rightAction }: AppNavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [internalStudent, setInternalStudent] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (propStudent) {
      setInternalStudent(propStudent);
    } else {
      getMe()
        .then((data) => setInternalStudent(data))
        .catch(() => {});
    }
  }, [propStudent]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const currentStudent = propStudent || internalStudent;

  // Format Aurikrex ID cleanly (prevent displaying raw database strings like ax_7S68BT51V76S8F913AV1)
  const rawId = String(currentStudent?.aurikrex_id || currentStudent?.id || '').trim();
  const aurikrexId = rawId.startsWith('AKX-')
    ? rawId
    : rawId
    ? `AKX-${rawId.replace(/^ax_/, '').slice(0, 6).toUpperCase()}`
    : 'AKX-SCHOLAR';

  const initials = currentStudent?.fullName
    ? currentStudent.fullName
        .split(' ')
        .map((n: string) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'CA';

  // Core navigation routes - clean text tabs without bloated inline icons on desktop
  const desktopNavLinks = [
    { label: 'Arena', path: '/mock-setup', activePrefix: ['/mock-setup', '/arena'] },
    { label: 'Question Bank', path: '/questions', activePrefix: ['/questions'] },
    { label: 'Syllabus', path: '/study', activePrefix: ['/study', '/syllabus', '/exam-hub'] },
    { label: 'Leaderboard', path: '/leaderboard', activePrefix: ['/leaderboard'] },
    { label: 'Falke AI', path: '/falke-ai', activePrefix: ['/falke-ai', '/falke'] },
  ];

  // Drawer nav links with icons
  const drawerNavLinks = [
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard', activePrefix: ['/dashboard'] },
    { label: 'Arena', path: '/mock-setup', icon: 'sports_score', activePrefix: ['/mock-setup', '/arena'] },
    { label: 'Question Bank', path: '/questions', icon: 'menu_book', activePrefix: ['/questions'] },
    { label: 'Syllabus & Timetable', path: '/study', icon: 'analytics', activePrefix: ['/study', '/syllabus', '/exam-hub'] },
    { label: 'Leaderboard', path: '/leaderboard', icon: 'leaderboard', activePrefix: ['/leaderboard'] },
    { label: 'Falke AI Studio', path: '/falke-ai', icon: 'smart_toy', activePrefix: ['/falke-ai', '/falke'] },
  ];

  const isLinkActive = (prefixes: string[]) => {
    return prefixes.some((prefix) => location.pathname.startsWith(prefix));
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore
    } finally {
      navigate('/auth?mode=login');
    }
  };

  return (
    <header className="bg-bg-secondary/95 backdrop-blur-md border-b border-border sticky top-0 z-50 shadow-sm w-full transition-colors">
      <div className="max-w-[1440px] mx-auto h-16 px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Anchor (Left) */}
        <div className="flex items-center gap-3 sm:gap-6 shrink-0 min-w-0">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 sm:gap-3 group active:scale-[0.98] transition-transform min-w-0"
            title="Return to Student Dashboard"
          >
            <div className="w-8 h-8 rounded-lg border border-primary/20 overflow-hidden shadow-sm flex items-center justify-center bg-surface-container shrink-0 group-hover:scale-105 transition-transform">
              <img
                src="/aurikrex-logo.png"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/favicon.svg';
                }}
                alt="Aurikrex Emblem"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-headline-sm text-sm sm:text-[17px] font-bold text-text-primary tracking-tight leading-tight truncate">
                  Exam Arena
                </span>
                {titleBadge && (
                  <span className="hidden md:inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono-data font-semibold uppercase tracking-wider bg-accent-royal-blue/15 text-primary border border-accent-royal-blue/30">
                    {titleBadge}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-mono-data text-text-muted leading-none hidden sm:block">
                Candidate CBT Cockpit
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links (Clean, text-only tabs on large screens) */}
          <nav className="hidden xl:flex items-center gap-6 pl-6 border-l border-border h-7">
            {desktopNavLinks.map((item) => {
              const active = isLinkActive(item.activePrefix);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`text-label-md font-label-md text-sm transition-colors py-1 relative ${
                    active
                      ? 'text-primary font-semibold'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <span>{item.label}</span>
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full -mb-1.5" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Trailing Controls (Right) */}
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          {/* Real-time AuriCoin Capsule */}
          <AuriCoinBadge compact={true} />

          {/* System Icon Actions */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            <AurikrexAppsSwitcher iconOnly={true} />
            <ThemeToggle className="min-h-9 min-w-9" />
          </div>

          {/* Candidate Identity Pill (Desktop & Tablet) */}
          <div
            onClick={() => navigate('/profile')}
            className={`hidden md:flex items-center gap-2.5 pl-1.5 pr-2.5 sm:pr-3 py-1 rounded-full bg-surface-container border cursor-pointer transition-all hover:bg-surface-container-high ${
              location.pathname === '/profile'
                ? 'border-accent-royal-blue ring-1 ring-accent-royal-blue/30'
                : 'border-border hover:border-accent-royal-blue/40'
            }`}
            title="Candidate Profile & CBT Key"
          >
            <div className="w-7 h-7 rounded-full bg-surface-container-high border border-primary/40 flex items-center justify-center text-primary text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="hidden lg:flex flex-col text-left leading-tight">
              <span className="text-label-sm font-label-sm text-text-primary font-medium max-w-[110px] truncate">
                {currentStudent?.fullName || 'Candidate'}
              </span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
                <span className="text-[10px] font-mono-data text-secondary">{aurikrexId}</span>
              </div>
            </div>
          </div>

          {/* Optional Custom Right Action (if provided explicitly) */}
          {rightAction && (
            <div className="hidden sm:block">
              {rightAction}
            </div>
          )}

          {/* Mobile/Tablet Menu Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-container transition-colors active:scale-95"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-border bg-bg-secondary px-4 py-4 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
          {/* Candidate Identity Card in Drawer */}
          <div
            onClick={() => navigate('/profile')}
            className="flex items-center justify-between p-3 rounded-xl bg-surface-container border border-border cursor-pointer hover:border-accent-royal-blue transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-container-high border border-primary/40 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {initials}
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm text-text-primary">
                  {currentStudent?.fullName || 'Candidate Scholar'}
                </div>
                <div className="text-xs font-mono-data text-secondary flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
                  <span>{aurikrexId}</span>
                </div>
              </div>
            </div>
            <span className="text-xs text-primary font-semibold flex items-center gap-1">
              Profile
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="grid gap-1">
            {drawerNavLinks.map((item) => {
              const active = isLinkActive(item.activePrefix);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-sm font-medium transition-colors ${
                    active
                      ? 'bg-accent-royal-blue/15 text-primary font-semibold border border-accent-royal-blue/30'
                      : 'text-text-secondary hover:bg-surface-container hover:text-text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Drawer Actions */}
          <div className="pt-3 border-t border-border flex flex-col gap-2">
            {!location.pathname.startsWith('/mock-setup') && (
              <button
                onClick={() => navigate('/mock-setup')}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent-royal-blue text-white font-semibold text-sm shadow-md active:scale-[0.98] transition-all"
              >
                <Play className="h-4 w-4 fill-white" />
                <span>Launch UTME Mock</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-border text-text-secondary hover:text-accent-streak-rose hover:border-accent-streak-rose/30 transition-colors text-sm"
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
