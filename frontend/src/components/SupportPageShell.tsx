import type { ComponentType, ReactNode } from 'react';
import { ArrowLeft, ExternalLink, Globe2, Mail, Phone } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

const SUPPORT_EMAIL = 'info@aurikrex.tech';
const SUPPORT_PHONE_DISPLAY = '+234 911 368 3395';
const SUPPORT_PHONE_LINK = '+2349113683395';

const supportNavigation = [
  { label: 'Help centre', to: '/help' },
  { label: 'Contact', to: '/contact' },
  { label: 'Privacy', to: '/privacy' },
  { label: 'Terms', to: '/terms' },
];

interface SupportPageShellProps { children: ReactNode; }

interface SupportHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  meta?: ReactNode;
}

interface SupportSectionProps {
  id?: string;
  eyebrow?: string;
  title: string;
  children: ReactNode;
  className?: string;
}

interface SupportContentsProps { sections: Array<{ id: string; label: string }>; }

export function SupportPageShell({ children }: SupportPageShellProps) {
  const { pathname } = useLocation();

  return (
    <div className="support-page min-h-screen overflow-x-hidden bg-bg-primary font-body text-text-primary selection:bg-primary/30">
      <header className="support-header sticky top-0 z-50 border-b border-border/80 backdrop-blur-xl">
        <div className="support-header-inner mx-auto flex h-[76px] max-w-7xl items-center justify-between px-8">
          <Link to="/" className="support-brand flex min-w-0 items-center gap-3" aria-label="JAMB UTME Prep home">
            <img src="/favicon.svg" alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover shadow-[0_10px_24px_rgba(74,91,255,0.28)]" />
            <span className="min-w-0 leading-tight">
              <span className="block truncate font-display text-[15px] font-semibold tracking-[-0.02em] text-text-primary">JAMB UTME Prep</span>
              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-300">by Aurikrex</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-xl border border-border bg-bg-secondary/60 p-1 lg:flex" aria-label="Support navigation">
            {supportNavigation.map((item) => {
              const active = pathname === item.to;
              return <Link key={item.to} to={item.to} className={`rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-colors ${active ? 'bg-primary/15 text-primary' : 'text-text-secondary hover:bg-bg-card hover:text-text-primary'}`}>{item.label}</Link>;
            })}
          </nav>

          <div className="support-header-actions flex shrink-0 items-center gap-3">
            <ThemeToggle />
            <Link to="/" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-bg-secondary/60 px-3.5 text-[13px] font-semibold text-text-secondary transition hover:border-border-hover hover:bg-bg-card hover:text-text-primary">
              <ArrowLeft className="h-4 w-4" />
              <span className="support-back-label">Back to prep</span>
            </Link>
          </div>
        </div>
      </header>

      {children}

      <footer className="border-t border-border/80 bg-bg-secondary/35 px-8 py-8">
        <div className="support-footer-inner mx-auto flex max-w-7xl items-center justify-between gap-8">
          <p className="text-xs leading-5 text-text-muted">© {new Date().getFullYear()} JAMB UTME Prep by Aurikrex. Study support for focused UTME preparation.</p>
          <div className="support-footer-links flex items-center gap-5 text-xs font-medium text-text-secondary">
            <a href={`mailto:${SUPPORT_EMAIL}`} className="inline-flex items-center gap-1.5 transition hover:text-primary"><Mail className="h-3.5 w-3.5" />{SUPPORT_EMAIL}</a>
            <a href={`tel:${SUPPORT_PHONE_LINK}`} className="inline-flex items-center gap-1.5 transition hover:text-primary"><Phone className="h-3.5 w-3.5" />{SUPPORT_PHONE_DISPLAY}</a>
            <a href="https://www.aurikrex.tech" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 transition hover:text-primary"><Globe2 className="h-3.5 w-3.5" />Aurikrex <ExternalLink className="h-3 w-3" /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function SupportHero({ eyebrow, title, description, icon: Icon, meta }: SupportHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border/70 px-8 py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_74%_22%,rgba(74,91,255,0.16),transparent_30%),radial-gradient(circle_at_16%_0%,rgba(56,189,248,0.07),transparent_25%)]" />
      <div className="relative mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_260px] items-end gap-16">
        <div className="max-w-3xl min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">{eyebrow}</p>
          <h1 className="mt-5 font-display text-[54px] font-semibold leading-[1.02] tracking-[-0.065em] text-text-primary">{title}</h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-8 text-text-secondary">{description}</p>
          {meta && <div className="mt-8">{meta}</div>}
        </div>
        <div className="support-hero-mark relative ml-auto flex h-40 w-40 shrink-0 items-center justify-center rounded-[32px] border border-primary/20 bg-primary/[0.08] text-primary shadow-[0_24px_70px_rgba(49,73,190,0.22)]"><Icon className="h-16 w-16" /></div>
      </div>
    </section>
  );
}

export function SupportSection({ id, eyebrow, title, children, className = '' }: SupportSectionProps) {
  return <section id={id} className={`scroll-mt-28 ${className}`}>{eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">{eyebrow}</p>}<h2 className="mt-3 font-display text-[28px] font-semibold tracking-[-0.045em] text-text-primary">{title}</h2><div className="mt-6">{children}</div></section>;
}

export function SupportContents({ sections }: SupportContentsProps) {
  return (
    <details className="support-mobile-toc">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between rounded-xl border border-border bg-bg-secondary/60 px-4 text-[13px] font-semibold text-text-primary marker:hidden"><span>On this page</span><span aria-hidden="true" className="text-lg leading-none text-primary">+</span></summary>
      <nav className="mt-2 rounded-xl border border-border bg-bg-secondary/60 p-2" aria-label="Page sections">
        {sections.map((section, index) => <a key={section.id} href={`#${section.id}`} className="support-toc-link flex min-h-11 items-center gap-3 rounded-lg px-3 text-[13px]"><span className="font-mono text-xs text-primary/80">{String(index + 1).padStart(2, '0')}</span><span>{section.label}</span></a>)}
      </nav>
    </details>
  );
}

export const supportChannels = { email: SUPPORT_EMAIL, phoneDisplay: SUPPORT_PHONE_DISPLAY, phoneLink: SUPPORT_PHONE_LINK };
