import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { ThemeToggle } from '../../components/ThemeToggle';
import { AurikrexAppsSwitcher } from '../../components/AurikrexAppsSwitcher';
import type { AuthStatus } from '../../hooks/useAuthStatus';
import { ActionLink } from './ActionLink';
import { NAV_LINKS, SITE_NAME } from './content';

interface Props {
  status: AuthStatus;
  onOpenKey: () => void;
}

export function LandingHeader({ status, onOpenKey }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const signedIn = status === 'signed-in';

  // Handle ESC key and scroll lock
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    // Lock body scroll on small devices when mobile menu is active
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const close = () => {
    setMenuOpen(false);
    document.body.style.overflow = '';
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg-primary/95 backdrop-blur-md">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-bg-card focus:px-4 focus:py-2 focus:text-text-primary"
      >
        Skip to content
      </a>

      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link to="/" className="flex min-w-0 items-center gap-2" aria-label={`${SITE_NAME} home`}>
          <img src="/aurikrex-logo.png" onError={(e) => { (e.target as HTMLImageElement).src = '/favicon.svg'; }} alt="" width={26} height={26} className="h-6 w-6 shrink-0 rounded-lg object-cover sm:h-7 sm:w-7" />
          <span className="truncate font-display text-sm font-semibold text-text-primary sm:text-[15px]">{SITE_NAME}</span>
          <span className="rounded-full border border-border px-1.5 py-0.5 text-[11px] font-medium text-text-secondary sm:text-xs">Beta</span>
        </Link>

        {/* Desktop in-page navigation */}
        <nav aria-label="Page sections" className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-sm text-text-secondary hover:text-text-primary">
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right action group */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="hidden sm:block">
            <AurikrexAppsSwitcher iconOnly />
          </div>

          <ThemeToggle />

          {signedIn ? (
            <ActionLink to="/dashboard" variant="primary" size="md" className="hidden sm:inline-flex">
              Dashboard
            </ActionLink>
          ) : (
            <>
              <ActionLink to="/auth?mode=login" variant="quiet" size="md" className="hidden md:inline-flex">
                Sign in
              </ActionLink>
              <ActionLink to="/auth?mode=register" variant="primary" size="md" className="hidden sm:inline-flex">
                Create free account
              </ActionLink>
            </>
          )}

          {/* Mobile hamburger menu toggle with 44px minimum tap target */}
          <button
            ref={toggleRef}
            type="button"
            aria-expanded={menuOpen}
            aria-controls="landing-mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-text-primary hover:bg-bg-secondary focus-visible:outline-none lg:hidden"
          >
            {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Accessible mobile drawer with backdrop and smooth interaction */}
      {menuOpen && (
        <div
          id="landing-mobile-menu"
          className="fixed inset-x-0 top-14 bottom-0 z-50 flex flex-col justify-between overflow-y-auto border-t border-border bg-bg-primary p-4 shadow-xl sm:top-16 sm:p-6 lg:hidden"
        >
          {/* Mobile links */}
          <div className="flex flex-col gap-1">
            <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              Navigation
            </p>
            <nav aria-label="Mobile page sections" className="flex flex-col">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className="flex min-h-[44px] items-center rounded-lg px-3 text-[15px] font-medium text-text-primary hover:bg-bg-secondary active:bg-bg-card"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Mobile Auth and Ecosystem actions */}
          <div className="mt-6 flex flex-col gap-3 border-t border-border pt-4">
            {signedIn ? (
              <ActionLink to="/dashboard" variant="primary" size="lg" className="w-full" onClick={close}>
                Go to dashboard
              </ActionLink>
            ) : (
              <>
                <ActionLink to="/auth?mode=register" variant="primary" size="lg" className="w-full" onClick={close}>
                  Create free account
                </ActionLink>
                <ActionLink to="/auth?mode=login" size="lg" className="w-full" onClick={close}>
                  Sign in
                </ActionLink>
                <ActionLink
                  variant="quiet"
                  size="md"
                  className="w-full"
                  onClick={() => {
                    close();
                    onOpenKey();
                  }}
                >
                  Have a CBT key?
                </ActionLink>
              </>
            )}

            <div className="mt-2 flex items-center justify-between rounded-lg bg-bg-secondary px-3 py-2 text-xs text-text-secondary">
              <span>Aurikrex apps</span>
              <AurikrexAppsSwitcher iconOnly />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
