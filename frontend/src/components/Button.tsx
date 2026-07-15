import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyle =
    'inline-flex items-center justify-center font-body font-bold rounded-xl transition-all duration-200 focus:outline-none select-none active:scale-[0.97] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100';

  const variants = {
    primary:
      'bg-primary text-text-on-accent border border-primary hover:bg-primary-hover hover:border-primary-hover shadow-md hover:-translate-y-[1px]',
    secondary:
      'bg-transparent text-primary border border-primary hover:bg-[color-mix(in_srgb,var(--color-accent-primary)_15%,transparent)]',
    ghost:
      'bg-transparent text-text-secondary border border-transparent hover:text-primary',
    gradient:
      'bg-gradient-to-r from-primary to-indigo-600 text-white hover:from-primary-hover hover:to-indigo-500 shadow-md hover:-translate-y-[1px]',
  };

  const sizes = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5',
    md: 'text-sm px-5 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
