// Production-Grade Button Component
// Based on the School Management ERP UI Design Documents

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import theme from '../tokens/theme';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  onClick,
  type = 'button',
}) => {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    fontFamily: theme.typography.fontFamily.sans.join(', '),
    fontWeight: theme.typography.fontWeight.medium,
    borderRadius: theme.borderRadius.lg,
    transition: 'all 0.2s ease-in-out',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    position: 'relative' as const,
    overflow: 'hidden',
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    xs: {
      fontSize: '0.75rem',
      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
      minHeight: '1.5rem',
    },
    sm: {
      fontSize: '0.875rem',
      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
      minHeight: '2rem',
    },
    md: {
      fontSize: '1rem',
      padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
      minHeight: '2.5rem',
    },
    lg: {
      fontSize: '1.125rem',
      padding: `${theme.spacing.md} ${theme.spacing.xl}`,
      minHeight: '3rem',
    },
    xl: {
      fontSize: '1.25rem',
      padding: `${theme.spacing.lg} ${theme.spacing['2xl']}`,
      minHeight: '3.5rem',
    },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: disabled ? theme.colors.primary[300] : theme.colors.primary[600],
      color: theme.colors.text.inverse,
      border: `1px solid ${theme.colors.primary[600]}`,
      boxShadow: theme.shadows.sm,
    },
    secondary: {
      backgroundColor: disabled ? theme.colors.secondary[100] : theme.colors.secondary[600],
      color: theme.colors.text.inverse,
      border: `1px solid ${theme.colors.secondary[600]}`,
      boxShadow: theme.shadows.sm,
    },
    outline: {
      backgroundColor: 'transparent',
      color: disabled ? theme.colors.text.tertiary : theme.colors.primary[600],
      border: `1px solid ${disabled ? theme.colors.border.tertiary : theme.colors.primary[600]}`,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: disabled ? theme.colors.text.tertiary : theme.colors.text.secondary,
      border: '1px solid transparent',
    },
    link: {
      backgroundColor: 'transparent',
      color: disabled ? theme.colors.text.tertiary : theme.colors.primary[600],
      border: 'none',
      textDecoration: disabled ? 'none' : 'underline',
      textUnderlineOffset: '2px',
    },
  };

  const styles: React.CSSProperties = {
    ...baseStyles,
    ...sizeStyles[size],
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.6 : 1,
  };

  const LoadingSpinner = () => (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      style={{
        width: '1em',
        height: '1em',
        border: '2px solid transparent',
        borderTop: `2px solid currentColor`,
        borderRadius: '50%',
      }}
    />
  );

  return (
    <motion.button
      style={styles}
      className={className}
      onClick={disabled || loading ? undefined : onClick}
      type={type}
      disabled={disabled || loading}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
    >
      {loading && <LoadingSpinner />}
      {!loading && leftIcon && leftIcon}
      {children}
      {!loading && rightIcon && rightIcon}
    </motion.button>
  );
};

export default Button;
