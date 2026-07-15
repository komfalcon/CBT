import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  variant?: 'primary' | 'secondary';
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  variant = 'primary',
  className = '',
  ...props
}) => {
  const baseStyle = 'border rounded-2xl p-6 transition-all duration-250';
  
  const bgStyles = {
    primary: 'bg-bg-card border-border',
    secondary: 'bg-bg-secondary border-border',
  };

  const hoverStyle = hoverable
    ? 'hover:border-primary hover:-translate-y-1 hover:shadow-lg shadow-black/20'
    : '';

  return (
    <div
      className={`${baseStyle} ${bgStyles[variant]} ${hoverStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
