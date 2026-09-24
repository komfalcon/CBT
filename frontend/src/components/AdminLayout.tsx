import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Key,
  CreditCard,
  Database,
  LogOut,
  Menu,
  X,
  Shield,
  Wrench,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { getMe, logout } from '../features/auth/api';
import { getMaintenanceStatus } from '../features/admin/api';

const navItems = [
  { name: 'Overview', path: '/admin/overview', icon: LayoutDashboard, badge: null },
  { name: 'Candidates', path: '/admin/candidates', icon: Users, badge: null },
  { name: 'Activation Keys', path: '/admin/keys', icon: Key, badge: null },
  { name: 'Billing Ledger', path: '/admin/billing', icon: CreditCard, badge: 'Beta' },
  { name: 'Question Bank', path: '/admin/questions', icon: Database, badge: null },
];

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<{ fullName?: string; email?: string; role?: string } | null>(null);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    getMe()
      .then((profile) => {
        if (mounted && profile) {
          setAdminUser({
            fullName: profile.fullName || 'Administrator',
            email: profile.email || 'admin@aurikrex.tech',
            role: profile.role || 'admin',
          });
        }
      })
      .catch(() => {
        // Fallback to local storage if network glitch
        const role = localStorage.getItem('user_role') || 'admin';
        setAdminUser({ fullName: 'Administrator', email: 'admin@aurikrex.tech', role });
      });

    const checkMaintenance = () => {
      getMaintenanceStatus()
        .then((res) => {
          if (mounted) setIsMaintenance(Boolean(res.isMaintenance));
        })
        .catch(() => {});
    };

    checkMaintenance();
    const interval = setInterval(checkMaintenance, 20000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user_role');
      navigate('/sys/auth-checkpoint', { replace: true });
    }
  };

  // Find current active route name
  const currentNav = navItems.find((item) => location.pathname.startsWith(item.path)) || {
    name: 'Dashboard',
    icon: LayoutDashboard,
  };

  const getInitials = (name?: string) => {
    if (!name) return 'AD';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex h-screen bg-bg-primary text-text-primary overflow-hidden font-body selection:bg-primary/20 selection:text-primary">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-bg-card border-r border-border transform transition-all duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-18 flex items-center justify-between px-6 border-b border-border bg-bg-card/80">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary via-indigo-500 to-blue-500 flex items-center justify-center font-black text-white shadow-lg shadow-primary/25 text-lg">
              A
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-sm tracking-tight text-text-primary leading-tight">
                Aurikrex CBT
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-primary">
                Control Center
              </span>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 text-text-muted hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 custom-scrollbar">
          <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-3 px-3 flex items-center justify-between">
            <span>Management</span>
            <Shield className="h-3 w-3 text-text-muted" />
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) => `
                  group relative flex items-center justify-between px-3.5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer
                  ${
                    isActive
                      ? 'bg-primary/10 text-primary shadow-sm shadow-primary/5 font-bold'
                      : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-primary' : 'text-text-muted group-hover:text-text-primary'
                        }`}
                      />
                      <span>{item.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          {item.badge}
                        </span>
                      )}
                      {isActive && (
                        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      )}
                    </div>
                  </>
                )}
              </NavLink>
            );
          })}

          <div className="pt-6">
            <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-3 px-3">
              Quick Links
            </div>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors"
            >
              <span>View Candidate Portal</span>
              <ExternalLink className="h-3.5 w-3.5 text-text-muted" />
            </a>
          </div>
        </nav>

        {/* Maintenance Indicator Widget in Sidebar */}
        <div className="px-4 py-3 border-t border-border/80 bg-bg-secondary/20">
          <NavLink
            to="/admin/overview"
            onClick={() => setIsSidebarOpen(false)}
            className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
              isMaintenance
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${isMaintenance ? 'bg-amber-500/20' : 'bg-emerald-500/20'}`}>
              {isMaintenance ? <Wrench className="h-4 w-4 animate-pulse" /> : <CheckCircle2 className="h-4 w-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold tracking-tight uppercase">
                {isMaintenance ? 'Maintenance Active' : 'Platform Live'}
              </div>
              <div className="text-[10px] text-text-muted truncate">
                {isMaintenance ? 'Public routes locked' : 'All systems normal'}
              </div>
            </div>
          </NavLink>
        </div>

        {/* User Card & Sign Out */}
        <div className="p-4 border-t border-border bg-bg-card">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0">
              {getInitials(adminUser?.fullName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-text-primary truncate">
                {adminUser?.fullName || 'System Administrator'}
              </div>
              <div className="text-[11px] text-text-muted truncate">
                {adminUser?.email || 'admin@aurikrex.tech'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-xs font-bold text-rose-500 hover:text-white bg-rose-500/10 hover:bg-rose-500 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{loggingOut ? 'Signing Out...' : 'Sign Out of Control Center'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-18 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-border bg-bg-card/75 backdrop-blur-xl shrink-0 z-10">
          {/* Left: Mobile hamburger & Breadcrumbs */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-xl transition-colors cursor-pointer shrink-0"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold truncate">
              <span className="text-text-muted hidden sm:inline">Admin</span>
              <ChevronRight className="h-3.5 w-3.5 text-text-muted hidden sm:inline" />
              <span className="text-text-primary font-bold tracking-tight">{currentNav.name}</span>
            </div>
          </div>

          {/* Right: Controls & Badges */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Live Status Capsule */}
            <NavLink
              to="/admin/overview"
              className={`hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide border transition-all ${
                isMaintenance
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
                  : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${isMaintenance ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
              <span>{isMaintenance ? 'Under Maintenance' : 'Platform Live'}</span>
            </NavLink>

            {/* Dark / Light Theme Toggle */}
            <ThemeToggle />

            {/* Admin Avatar Pill */}
            <div className="hidden md:flex items-center gap-2.5 pl-3 border-l border-border">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-blue-500/20 border border-primary/30 flex items-center justify-center font-bold text-xs text-primary">
                {getInitials(adminUser?.fullName)}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-text-primary leading-tight">
                  {adminUser?.fullName?.split(' ')[0] || 'Admin'}
                </span>
                <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                  {adminUser?.role || 'Staff'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
