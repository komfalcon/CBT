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
    'inline-flex items-center justify-center font-body font-bold rounded-xl border select-none transition-[transform,background-color,border-color,box-shadow,color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary active:scale-[0.97] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none';

  const variants = {
    primary:
      'border-primary bg-primary text-text-on-accent shadow-[0_8px_20px_rgba(77,107,255,0.22)] hover:-translate-y-0.5 hover:bg-primary-hover hover:border-primary-hover hover:shadow-[0_12px_26px_rgba(77,107,255,0.3)]',
    secondary:
      'border-border bg-bg-secondary text-text-primary shadow-sm hover:-translate-y-0.5 hover:border-primary/55 hover:bg-primary/10 hover:text-primary hover:shadow-md',
    ghost:
      'border-transparent bg-transparent text-text-secondary hover:bg-bg-secondary hover:text-text-primary',
    gradient:
      'border-primary/60 bg-gradient-to-r from-primary to-[#6678e8] text-white shadow-[0_8px_22px_rgba(77,107,255,0.26)] hover:-translate-y-0.5 hover:from-primary-hover hover:to-[#7889f1] hover:shadow-[0_12px_28px_rgba(77,107,255,0.34)]',
  };

  const sizes = {
    sm: 'min-h-8 gap-1.5 px-3.5 py-1.5 text-xs',
    md: 'min-h-10 gap-2 px-5 py-2.5 text-sm',
    lg: 'min-h-12 gap-2.5 px-6 py-3.5 text-base',
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
