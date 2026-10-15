import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Instagram, Linkedin, MessageCircle, Twitter, type LucideIcon } from 'lucide-react';
import { siteConfig } from '../../config/siteConfig';

const SOCIAL_ICONS: Record<(typeof siteConfig.socials)[number]['key'], LucideIcon> = {
  x: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
  whatsapp: MessageCircle,
  website: Globe,
};

export function ArenaFooter() {
  const currentYear = new Date().getFullYear();

  const productLinks = [
    { label: 'Exam Arena', to: siteConfig.urls.examArena },
    { label: 'Mock Setup', to: siteConfig.urls.mockSetup },
    { label: 'Question Bank', to: siteConfig.urls.questionBank },
    { label: 'Falke AI', to: siteConfig.urls.falkeAi },
    { label: 'Leaderboard', to: siteConfig.urls.leaderboard },
  ];

  const supportLinks = [
    { label: 'Help Center', to: siteConfig.urls.helpCenter },
    { label: 'Contact Us', to: siteConfig.urls.contactUs },
    { label: 'System Status', to: siteConfig.urls.systemStatus },
  ];

  const legalLinks = [
    { label: 'Privacy Policy', to: siteConfig.urls.privacyPolicy },
    { label: 'Terms of Service', to: siteConfig.urls.termsOfService },
  ];

  return (
    <footer className="border-t border-[var(--arena-border)] bg-[var(--arena-surface)] text-[var(--arena-text-secondary)] transition-colors">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand & Support Channel Column (Spans 2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <img
                src="/aurikrex-logo.png"
                alt="Aurikrex Logo"
                className="h-7 w-7 rounded-lg object-contain"
              />
              <span className="text-base font-bold text-[var(--arena-text-primary)]">
                {siteConfig.name}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[var(--arena-text-secondary)] leading-relaxed max-w-sm">
              A serious computer-based test cockpit for Nigerian UTME candidates. Built by a founder who sat the exam, for the candidates sitting it next.
            </p>

            <div className="pt-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--arena-text-muted)] mb-1.5">
                Verified support channels
              </div>
              <div className="space-y-1 text-xs sm:text-sm font-medium">
                <div>
                  <a
                    href={`mailto:${siteConfig.supportEmail}`}
                    className="text-[var(--arena-text-primary)] hover:text-[var(--arena-primary)] transition-colors"
                  >
                    {siteConfig.supportEmail}
                  </a>
                </div>
                <div>
                  <a
                    href={`tel:${siteConfig.supportPhone}`}
                    className="text-[var(--arena-text-primary)] hover:text-[var(--arena-primary)] transition-colors"
                  >
                    {siteConfig.supportPhoneDisplay}
                  </a>
                </div>
              </div>
            </div>

            <ul className="flex flex-wrap items-center gap-2 pt-2" aria-label="Aurikrex on social media">
              {siteConfig.socials.map((social) => {
                const Icon = SOCIAL_ICONS[social.key];
                return (
                  <li key={social.key}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${social.label} (opens in a new tab)`}
                      title={social.label}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--arena-border)] bg-[var(--arena-surface)] text-[var(--arena-text-secondary)] transition-colors hover:border-[var(--arena-primary)] hover:text-[var(--arena-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--arena-primary)]"
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--arena-text-primary)] mb-4">
              Product
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              {productLinks.map((link) => (
                <li key={link.label}>
                  {link.to.startsWith('/') ? (
                    <Link
                      to={link.to}
                      className="transition-colors hover:text-[var(--arena-text-primary)]"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      href={link.to}
                      className="transition-colors hover:text-[var(--arena-text-primary)]"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--arena-text-primary)] mb-4">
              Support
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  {link.to.startsWith('/') ? (
                    <Link
                      to={link.to}
                      className="transition-colors hover:text-[var(--arena-text-primary)]"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      href={link.to}
                      className="transition-colors hover:text-[var(--arena-text-primary)]"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--arena-text-primary)] mb-4">
              Legal
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="transition-colors hover:text-[var(--arena-text-primary)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Disclaimer and Copyright Row */}
        <div className="mt-12 pt-8 border-t border-[var(--arena-border-subtle)] flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-[var(--arena-text-muted)]">
          <div>
            © {currentYear} Aurikrex Technologies. {siteConfig.founderNotice}{' '}
            <span className="block sm:inline sm:ml-1">
              {siteConfig.legalNotice}
            </span>
          </div>
          <div className="text-center md:text-right">
            {siteConfig.disclaimer}
          </div>
        </div>
      </div>
    </footer>
  );
}
