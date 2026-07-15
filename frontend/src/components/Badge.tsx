import React from 'react';

interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'draft' | 'info' | 'ai-flag';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'info',
  children,
  className = '',
}) => {
  const styles = {
    primary: 'bg-primary text-text-on-accent border border-primary',
    info: 'bg-transparent text-primary border border-primary',
    success: 'bg-success/15 text-success border border-success/35',
    warning: 'bg-warning/15 text-warning border border-warning/35',
    error: 'bg-error/15 text-error border border-error/35',
    draft: 'bg-bg-secondary text-text-muted border border-border',
    'ai-flag': 'bg-ai-flag text-text-on-accent border border-ai-flag font-semibold uppercase tracking-wider',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
