import React from 'react';
import { Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { siteConfig } from '../../config/siteConfig';

export function ArenaNavbar() {
  const { theme, setTheme } = useTheme();

  // Determine current effective theme (defaults to dark in ThemeContext if not light)
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--arena-border)] bg-[var(--arena-surface)]/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand: Logo + Wordmark + Beta Badge */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group" aria-label="Aurikrex Exam Arena Home">
            <img
              src="/aurikrex-logo.png"
              alt="Aurikrex Logo"
              className="h-8 w-8 rounded-lg object-contain shadow-sm transition-transform group-hover:scale-105"
            />
            <span className="text-base font-bold tracking-tight text-[var(--arena-text-primary)]">
              {siteConfig.name}
            </span>
          </Link>
          <span className="rounded-full border border-[var(--arena-badge-border)] bg-[var(--arena-badge-bg)] px-2 py-0.5 text-[11px] font-semibold text-[var(--arena-badge-text)]">
            Beta
          </span>
        </div>

        {/* Center Nav Links (Hidden on small mobile, visible on md+) */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-[var(--arena-text-secondary)]">
          <a
            href="#how-it-works"
            className="transition-colors hover:text-[var(--arena-text-primary)]"
          >
            How it works
          </a>
          <a
            href="#whats-included"
            className="transition-colors hover:text-[var(--arena-text-primary)]"
          >
            What's included
          </a>
          <a
            href="#subjects"
            className="transition-colors hover:text-[var(--arena-text-primary)]"
          >
            Subjects
          </a>
          <a
            href="#access"
            className="transition-colors hover:text-[var(--arena-text-primary)]"
          >
            Access
          </a>
        </nav>

        {/* Right Actions: Theme Toggle, Sign In, Create Free Account */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--arena-border)] bg-[var(--arena-surface)] text-[var(--arena-text-secondary)] transition-colors hover:bg-[var(--arena-bg-subtle)] hover:text-[var(--arena-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--arena-primary)]"
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-700" />
            )}
          </button>

          <Link
            to={siteConfig.urls.signIn}
            className="text-xs sm:text-sm font-semibold text-[var(--arena-text-primary)] transition-colors hover:text-[var(--arena-primary)]"
          >
            Sign in
          </Link>

          <Link
            to={siteConfig.urls.register}
            className="rounded-lg bg-[var(--arena-primary)] px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--arena-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--arena-primary)] focus-visible:ring-offset-2"
          >
            Create free account
          </Link>
        </div>
      </div>
    </header>
  );
}
