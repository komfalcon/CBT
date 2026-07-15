import React from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  className = '',
}) => {
  const styles = {
    info: 'border-primary/20 bg-primary/5 text-primary',
    success: 'border-success/20 bg-success/5 text-success',
    warning: 'border-warning/20 bg-warning/5 text-warning',
    error: 'border-error/20 bg-error/5 text-error',
  };

  const Icons = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: AlertTriangle,
  };

  const IconComponent = Icons[variant];

  return (
    <div className={`rounded-xl border p-4 text-xs flex gap-3 ${styles[variant]} ${className}`}>
      <IconComponent className="h-4 w-4 flex-shrink-0" />
      <div className="space-y-1">
        {title && <h4 className="font-bold text-text-primary text-sm leading-none">{title}</h4>}
        <div className="leading-relaxed text-text-secondary">{children}</div>
      </div>
    </div>
  );
};
