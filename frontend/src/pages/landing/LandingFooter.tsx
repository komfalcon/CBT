import { Link } from 'react-router-dom';
import { FOOTER_GROUPS, SITE_NAME, SUPPORT } from './content';

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-bg-secondary">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <p className="font-display text-base font-semibold text-text-primary">{SITE_NAME}</p>
            <p className="mt-2 max-w-xs text-body-md text-text-secondary">
              Computer-based practice for the JAMB UTME.
            </p>
            <p className="mt-4 text-sm text-text-secondary">
              <a className="hover:text-text-primary" href={`mailto:${SUPPORT.email}`}>
                {SUPPORT.email}
              </a>
              <br />
              <a className="hover:text-text-primary" href={SUPPORT.phoneLink}>
                {SUPPORT.phoneDisplay}
              </a>
            </p>
          </div>
          {FOOTER_GROUPS.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="text-sm font-semibold text-text-primary">{group.title}</h2>
              <ul className="mt-3 space-y-1">
                {group.links.map((link) => (
                  <li key={link.label}>
                    {'to' in link ? (
                      <Link to={link.to} className="inline-flex min-h-9 items-center text-sm text-text-secondary hover:text-text-primary">
                        {link.label}
                      </Link>
                    ) : (
                      <a href={link.href} className="inline-flex min-h-9 items-center text-sm text-text-secondary hover:text-text-primary">
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-10 space-y-2 border-t border-border pt-6 text-sm text-text-secondary">
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
