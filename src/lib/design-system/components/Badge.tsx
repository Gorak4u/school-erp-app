// Production-Grade Badge Component
// Based on the School Management ERP UI Design Documents

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import theme from '../tokens/theme';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  rounded?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  rounded = 'md',
  className = '',
}) => {
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: theme.typography.fontFamily.sans.join(', '),
    fontWeight: theme.typography.fontWeight.medium,
    whiteSpace: 'nowrap',
  };

  const sizeStyles = {
    sm: {
      fontSize: '0.75rem',
      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
      borderRadius: theme.borderRadius[rounded === 'full' ? 'full' : rounded as keyof typeof theme.borderRadius],
    },
    md: {
      fontSize: '0.875rem',
      padding: `${theme.spacing.xs} ${theme.spacing.md}`,
      borderRadius: theme.borderRadius[rounded === 'full' ? 'full' : rounded as keyof typeof theme.borderRadius],
    },
    lg: {
      fontSize: '1rem',
      padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
      borderRadius: theme.borderRadius[rounded === 'full' ? 'full' : rounded as keyof typeof theme.borderRadius],
    },
  };

  const variantStyles = {
    default: {
      backgroundColor: theme.colors.secondary[100],
      color: theme.colors.secondary[700],
      border: `1px solid ${theme.colors.secondary[200]}`,
    },
    primary: {
      backgroundColor: theme.colors.primary[100],
      color: theme.colors.primary[700],
      border: `1px solid ${theme.colors.primary[200]}`,
    },
    secondary: {
      backgroundColor: theme.colors.secondary[100],
      color: theme.colors.secondary[700],
      border: `1px solid ${theme.colors.secondary[200]}`,
    },
    success: {
      backgroundColor: theme.colors.success[100],
      color: theme.colors.success[700],
      border: `1px solid ${theme.colors.success[200]}`,
    },
    warning: {
      backgroundColor: theme.colors.warning[100],
      color: theme.colors.warning[700],
      border: `1px solid ${theme.colors.warning[200]}`,
    },
    error: {
      backgroundColor: theme.colors.error[100],
      color: theme.colors.error[700],
      border: `1px solid ${theme.colors.error[200]}`,
    },
  };

  const styles = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };

  return (
    <motion.span
      style={styles}
      className={className}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.span>
  );
};

export default Badge;
