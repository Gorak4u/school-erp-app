// Button Component - Simple Version
import React from 'react';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'error';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
}) => {
  const baseStyles = {
    border: 'none',
    borderRadius: '6px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'Inter, sans-serif',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  };

  const variantStyles = {
    primary: {
      backgroundColor: '#2196f3',
      color: 'white',
    },
    secondary: {
      backgroundColor: '#03a9f4',
      color: 'white',
    },
    success: {
      backgroundColor: '#4caf50',
      color: 'white',
    },
    error: {
      backgroundColor: '#f44336',
      color: 'white',
    },
  };

  const sizeStyles = {
    sm: {
      fontSize: '14px',
      padding: '8px 16px',
      minHeight: '32px',
    },
    md: {
      fontSize: '16px',
      padding: '12px 24px',
      minHeight: '40px',
    },
    lg: {
      fontSize: '18px',
      padding: '16px 32px',
      minHeight: '48px',
    },
  };

  const styles = {
    ...baseStyles,
    ...variantStyles[variant],
    ...sizeStyles[size],
    opacity: disabled ? 0.6 : 1,
  };

  return (
    <button
      style={styles}
      disabled={disabled}
      onClick={onClick}
      aria-disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
