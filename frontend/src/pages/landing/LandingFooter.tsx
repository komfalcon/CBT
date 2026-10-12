import { Link } from 'react-router-dom';
import { FOOTER_GROUPS, SITE_NAME, SUPPORT } from './content';

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-bg-secondary">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-8 sm:gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          {/* Brand info & direct support */}
          <div>
            <p className="font-display text-base font-semibold text-text-primary">{SITE_NAME}</p>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-text-secondary sm:text-body-md">
              Computer-based practice for the JAMB UTME.
            </p>
            <div className="mt-4 flex flex-col gap-1 text-xs text-text-secondary sm:text-sm">
              <a
                className="inline-flex min-h-[36px] items-center hover:text-text-primary focus-visible:outline-none"
                href={`mailto:${SUPPORT.email}`}
              >
                {SUPPORT.email}
              </a>
              <a
                className="inline-flex min-h-[36px] items-center hover:text-text-primary focus-visible:outline-none"
                href={SUPPORT.phoneLink}
              >
                {SUPPORT.phoneDisplay}
              </a>
            </div>
          </div>

          {/* Navigation link groups with 40px+ touch targets on mobile */}
          {FOOTER_GROUPS.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-text-primary sm:text-sm sm:normal-case sm:tracking-normal">
                {group.title}
              </h2>
              <ul className="mt-2.5 space-y-1 sm:mt-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    {'to' in link ? (
                      <Link
                        to={link.to}
                        className="inline-flex min-h-[40px] items-center text-xs text-text-secondary hover:text-text-primary sm:min-h-9 sm:text-sm"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="inline-flex min-h-[40px] items-center text-xs text-text-secondary hover:text-text-primary sm:min-h-9 sm:text-sm"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Disclaimer and copyright */}
        <div className="mt-8 space-y-2 border-t border-border pt-6 text-xs leading-normal text-text-secondary sm:mt-10 sm:text-sm">
          <p>
            {SITE_NAME} is an independent practice platform. It is not affiliated with or endorsed by JAMB.
          </p>
          <p>
            © {new Date().getFullYear()} {SITE_NAME} by Aurikrex. Founded by Omotosho Korede Samuel.
          </p>
        </div>
      </div>
    </footer>
  );
}
