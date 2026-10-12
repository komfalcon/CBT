import type { ComponentProps, ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'quiet';
type Size = 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg border font-semibold leading-none ' +
  'transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60';

const variants: Record<Variant, string> = {
  // accent-royal-blue gives white text AA contrast (6:1) in both themes; the lighter `primary` does not in dark.
  primary:
    'border-accent-royal-blue bg-accent-royal-blue text-white hover:brightness-110 active:brightness-95',
  secondary:
    'border-border bg-bg-card text-text-primary hover:border-border-hover hover:bg-bg-secondary',
  quiet: 'border-transparent text-text-secondary hover:text-text-primary',
};

const sizes: Record<Size, string> = {
  md: 'min-h-10 px-4 text-sm',
  lg: 'min-h-12 px-6 text-[15px]',
};

interface Common {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

type RouterProps = Common & { to: string } & Omit<ComponentProps<typeof Link>, 'to' | 'className' | 'children'>;
type AnchorProps = Common & { href: string; to?: undefined } & Omit<ComponentProps<'a'>, 'href' | 'className' | 'children'>;
type ButtonProps = Common & { to?: undefined; href?: undefined } & Omit<ComponentProps<'button'>, 'className' | 'children'>;

/**
 * One button style for router links, in-page anchors and real buttons, so the hierarchy
 * (primary / secondary / quiet) is identical wherever an action appears on the landing page.
 */
export function ActionLink(props: RouterProps | AnchorProps | ButtonProps) {
  const { variant = 'secondary', size = 'md', className = '', children, ...rest } = props;
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  if ('to' in rest && rest.to) {
    return (
      <Link {...(rest as Omit<RouterProps, keyof Common>)} className={classes}>
        {children}
      </Link>
    );
  }
  if ('href' in rest && rest.href) {
    return (
      <a {...(rest as Omit<AnchorProps, keyof Common>)} className={classes}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" {...(rest as Omit<ButtonProps, keyof Common>)} className={classes}>
      {children}
    </button>
  );
}
