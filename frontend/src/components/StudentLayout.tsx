import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  GraduationCap,
  FileQuestion,
  BookOpen,
  Bot,
  BarChart3,
  Folder,
  Menu,
  X,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { AuriCoinBadge } from './AuriCoinBadge';
import { getMe, logout } from '../features/auth/api';

export interface StudentLayoutProps {
  children: React.ReactNode;
  student?: any;
}

export function StudentLayout({ children, student: propStudent }: StudentLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [internalStudent, setInternalStudent] = useState<any>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (propStudent) {
      setInternalStudent(propStudent);
    } else {
      getMe()
        .then((data) => setInternalStudent(data))
        .catch(() => {});
    }
  }, [propStudent]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentStudent = propStudent || internalStudent;

  const rawId = String(currentStudent?.aurikrex_id || currentStudent?.id || '').trim();
  const aurikrexId = rawId.startsWith('AKX-')
    ? rawId
    : rawId
    ? `AKX-${rawId.replace(/^ax_/, '').slice(0, 6).toUpperCase()}`
    : 'AKX-64AA/7F5';

  const fullName = currentStudent?.fullName || 'Candidate';
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'KO';

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore
    } finally {
      navigate('/auth?mode=login');
    }
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Mock Exams', path: '/mock-setup', icon: ClipboardList },
    { label: 'Practice by Subject', path: '/practice', icon: GraduationCap },
    { label: 'Syllabus', path: '/study', icon: BookOpen },
    { label: 'AI Study Assistant', path: '/falke-ai', icon: Bot },
    { label: 'Performance', path: '/leaderboard', icon: BarChart3 },
    { label: 'Resources', path: '/exam-hub', icon: Folder },
  ];

  const isItemActive = (itemPath: string) => {
    return location.pathname === itemPath || location.pathname.startsWith(`${itemPath}/`);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full justify-between p-4 select-none">
      <div className="space-y-6">
        {/* Brand Header */}
        <Link
          to="/dashboard"
          className="flex items-center gap-3 px-2 py-1 group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-primary/20 shrink-0 group-hover:scale-105 transition-transform">
            <span className="font-display font-extrabold text-lg tracking-wider">A</span>
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-base text-text-primary tracking-tight leading-tight">
              Aurikrex
            </span>
            <span className="text-xs font-semibold text-primary tracking-wide">
              Exam Arena
            </span>
          </div>
        </Link>

        {/* Navigation List */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = isItemActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-primary text-white shadow-sm font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-container'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-text-muted'}`} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Progress Card & Footer */}
      <div className="space-y-4 pt-4 border-t border-border">
        {/* Progress reminder widget */}
        <div className="p-3.5 rounded-xl bg-surface-container border border-border">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold text-text-primary">Your progress matters</span>
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed">
            Consistent practice builds real results. Keep up your streak today!
          </p>
        </div>

        {/* Version & Brand Indicator */}
        <div className="flex items-center justify-between px-2 text-[11px] text-text-muted font-mono">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-primary/20 text-primary flex items-center justify-center text-[9px] font-bold">
              AKX
            </div>
            <span className="text-text-secondary font-medium">CBT Cockpit</span>
          </div>
          <span>v2.4.0</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex font-body antialiased selection:bg-primary selection:text-white">
      {/* Desktop Sidebar (Left Pinned) */}
      <aside className="hidden lg:flex w-64 shrink-0 border-r border-border bg-bg-secondary flex-col sticky top-0 h-screen overflow-y-auto custom-scroll z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-72 bg-bg-secondary border-r border-border z-50 transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-2 flex justify-end">
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-container"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarContent />
        </div>
      </aside>

      {/* Main Column (Right of Sidebar) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 px-4 md:px-8 border-b border-border bg-bg-primary/95 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between gap-3">
          {/* Left Title / Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-container transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm md:text-base text-text-primary tracking-tight">
                  CBT Cockpit
                </span>
                <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-border" />
                <span className="hidden sm:inline-block text-xs text-text-muted font-medium">
                  Smarter Practice. Higher Scores.
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Coins Badge */}
            <AuriCoinBadge />

            {/* Dark / Light Mode Toggle */}
            <ThemeToggle />

            {/* Notification Bell */}
            <button
              type="button"
              className="relative p-2 rounded-full border border-border bg-bg-secondary text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
            </button>

            {/* User Profile Pill & Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1 rounded-full border border-border bg-bg-secondary hover:border-border-hover hover:bg-surface-container transition-all"
              >
                <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold tracking-tight">
                  {initials}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-semibold text-text-primary leading-tight truncate max-w-[120px]">
                    {fullName}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-text-muted font-mono leading-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{aurikrexId}</span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-bg-card border border-border shadow-xl py-2 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
                  <div className="px-4 py-2 border-b border-border">
                    <p className="text-xs font-bold text-text-primary truncate">{fullName}</p>
                    <p className="text-[11px] text-text-muted font-mono truncate">{currentStudent?.email || aurikrexId}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/profile"
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-container transition-colors"
                    >
                      <User className="w-4 h-4 text-primary" />
                      <span>Candidate Profile</span>
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-container transition-colors"
                    >
                      <Settings className="w-4 h-4 text-text-muted" />
                      <span>Exam Settings</span>
                    </Link>
                  </div>
                  <div className="pt-1 border-t border-border">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-500 hover:bg-rose-500/10 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default StudentLayout;
