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

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const close = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg-primary/95 backdrop-blur">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-bg-card focus:px-4 focus:py-2 focus:text-text-primary"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-2.5" aria-label={`${SITE_NAME} home`}>
          <img src="/favicon.svg" alt="" width={28} height={28} className="h-7 w-7 shrink-0" />
          <span className="truncate font-display text-[15px] font-semibold text-text-primary">{SITE_NAME}</span>
          <span className="rounded-full border border-border px-2 py-0.5 text-xs font-medium text-text-secondary">Beta</span>
        </Link>

        <nav aria-label="Page sections" className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-sm text-text-secondary hover:text-text-primary">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <AurikrexAppsSwitcher iconOnly />
          </div>
          <ThemeToggle />
          {signedIn ? (
            <ActionLink to="/dashboard" variant="primary" className="hidden sm:inline-flex">
              Dashboard
            </ActionLink>
          ) : (
            <>
              <ActionLink to="/auth?mode=login" variant="quiet" className="hidden md:inline-flex">
                Sign in
              </ActionLink>
              <ActionLink to="/auth?mode=register" variant="primary" className="hidden sm:inline-flex">
                Create free account
              </ActionLink>
            </>
          )}
          <button
            ref={toggleRef}
            type="button"
            aria-expanded={menuOpen}
            aria-controls="landing-mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-text-primary lg:hidden"
          >
            {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div id="landing-mobile-menu" className="border-t border-border bg-bg-primary lg:hidden">
          <nav aria-label="Page sections" className="mx-auto flex max-w-6xl flex-col px-4 py-2 sm:px-6">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={close} className="flex min-h-11 items-center text-text-primary">
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 pb-4 sm:px-6">
            {signedIn ? (
              <ActionLink to="/dashboard" variant="primary" onClick={close}>
                Go to dashboard
              </ActionLink>
            ) : (
              <>
                <ActionLink to="/auth?mode=register" variant="primary" onClick={close}>
                  Create free account
                </ActionLink>
                <ActionLink to="/auth?mode=login" onClick={close}>
                  Sign in
                </ActionLink>
                <ActionLink
                  variant="quiet"
                  onClick={() => {
                    close();
                    onOpenKey();
                  }}
                >
                  Have a CBT key?
                </ActionLink>
              </>
            )}
            <div className="flex items-center justify-between border-t border-border pt-3 text-sm text-text-secondary">
              <span>Other Aurikrex apps</span>
              <AurikrexAppsSwitcher iconOnly />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
