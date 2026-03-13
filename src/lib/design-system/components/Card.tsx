// Production-Grade Card Component
// Based on the School Management ERP UI Design Documents

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import theme from '../tokens/theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  rounded = 'lg',
  shadow = 'md',
  className = '',
  hover = false,
  onClick,
}) => {
  const baseStyles: React.CSSProperties = {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius[rounded as keyof typeof theme.borderRadius],
    transition: 'all 0.3s ease-in-out',
    position: 'relative',
    overflow: 'hidden',
  };

  const variantStyles = {
    default: {
      border: `1px solid ${theme.colors.border.primary}`,
      boxShadow: theme.shadows[shadow as keyof typeof theme.shadows],
    },
    elevated: {
      border: `1px solid ${theme.colors.border.primary}`,
      boxShadow: theme.shadows.xl,
    },
    outlined: {
      border: `2px solid ${theme.colors.border.secondary}`,
      boxShadow: 'none',
    },
    filled: {
      backgroundColor: theme.colors.background.secondary,
      border: '1px solid transparent',
      boxShadow: theme.shadows.sm,
    },
  };

  const paddingStyles = {
    none: { padding: '0' },
    sm: { padding: theme.spacing.sm },
    md: { padding: theme.spacing.lg },
    lg: { padding: theme.spacing.xl },
    xl: { padding: theme.spacing['2xl'] },
  };

  const hoverStyles = hover
    ? {
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows['2xl'],
        },
      }
    : {};

  const styles = {
    ...baseStyles,
    ...variantStyles[variant],
    ...paddingStyles[padding],
    cursor: onClick ? 'pointer' : 'default',
  };

  return (
    <motion.div
      style={styles}
      className={className}
      onClick={onClick}
      whileHover={hover ? { y: -4, boxShadow: theme.shadows['2xl'] } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
  const styles: React.CSSProperties = {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottom: `1px solid ${theme.colors.border.primary}`,
  };

  return (
    <div style={styles} className={className}>
      {children}
    </div>
  );
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
  const styles: React.CSSProperties = {
    padding: theme.spacing.lg,
  };

  return (
    <div style={styles} className={className}>
      {children}
    </div>
  );
};

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
  const styles: React.CSSProperties = {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTop: `1px solid ${theme.colors.border.primary}`,
    backgroundColor: theme.colors.background.secondary,
  };

  return (
    <div style={styles} className={className}>
      {children}
    </div>
  );
};

export { Card, CardHeader, CardContent, CardFooter };
export default Card;
