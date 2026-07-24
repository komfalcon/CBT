import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Key, 
  CreditCard, 
  Database,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    navigate('/auth?mode=login', { replace: true });
  };

  const navItems = [
    { name: 'Overview', path: '/admin/overview', icon: LayoutDashboard },
    { name: 'Candidates', path: '/admin/candidates', icon: Users },
    { name: 'Activation Keys', path: '/admin/keys', icon: Key },
    { name: 'Billing', path: '/admin/billing', icon: CreditCard },
    { name: 'Question Bank', path: '/admin/questions', icon: Database },
  ];

  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-bg-card border-r border-border transform transition-transform duration-300 ease-in-out flex flex-col ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20">
              A
            </div>
            <span className="font-bold text-text-primary tracking-tight">Admin Portal</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
          <div className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2 px-2">
            Main Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all
                  ${isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 border-b border-border bg-bg-card/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm lg:text-base font-bold text-text-primary hidden sm:block">Control Center</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
