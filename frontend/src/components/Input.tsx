import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full rounded-xl bg-bg-secondary border border-border p-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/25 outline-none transition-all duration-150 ${
          error ? 'border-error focus:border-error focus:ring-error/25' : ''
        } ${className}`}
        {...props}
      />
      {error && <span className="text-[10px] font-semibold text-error block">{error}</span>}
    </div>
  );
};
