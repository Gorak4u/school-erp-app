// Production-Grade Input Component
// Based on the School Management ERP UI Design Documents

'use client';

import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import theme from '../tokens/theme';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      variant = 'default',
      size = 'md',
      fullWidth = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles: React.CSSProperties = {
      fontFamily: theme.typography.fontFamily.sans.join(', '),
      fontSize: '1rem',
      lineHeight: '1.5',
      borderRadius: theme.borderRadius.lg,
      border: `1px solid ${error ? theme.colors.error[500] : theme.colors.border.primary}`,
      backgroundColor: theme.colors.background.primary,
      color: theme.colors.text.primary,
      transition: 'all 0.2s ease-in-out',
      outline: 'none',
      width: fullWidth ? '100%' : 'auto',
    };

    const sizeStyles = {
      sm: {
        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
        minHeight: '2rem',
        fontSize: '0.875rem',
      },
      md: {
        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
        minHeight: '2.5rem',
        fontSize: '1rem',
      },
      lg: {
        padding: `${theme.spacing.md} ${theme.spacing.lg}`,
        minHeight: '3rem',
        fontSize: '1.125rem',
      },
    };

    const variantStyles = {
      default: {
        boxShadow: theme.shadows.sm,
        '&:focus': {
          borderColor: theme.colors.primary[500],
          boxShadow: `0 0 0 3px ${theme.colors.primary[100]}`,
        },
      },
      filled: {
        backgroundColor: theme.colors.background.secondary,
        border: `1px solid transparent`,
        '&:focus': {
          backgroundColor: theme.colors.background.primary,
          borderColor: theme.colors.primary[500],
          boxShadow: `0 0 0 3px ${theme.colors.primary[100]}`,
        },
      },
      outlined: {
        backgroundColor: 'transparent',
        borderWidth: '2px',
        '&:focus': {
          borderColor: theme.colors.primary[500],
          boxShadow: `0 0 0 3px ${theme.colors.primary[100]}`,
        },
      },
    };

    const inputStyles = {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant],
      paddingLeft: leftIcon ? '2.5rem' : undefined,
      paddingRight: rightIcon ? '2.5rem' : undefined,
    };

    const labelStyles: React.CSSProperties = {
      display: 'block',
      fontSize: '0.875rem',
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.xs,
    };

    const errorStyles: React.CSSProperties = {
      fontSize: '0.75rem',
      color: theme.colors.error[600],
      marginTop: theme.spacing.xs,
    };

    const helperTextStyles: React.CSSProperties = {
      fontSize: '0.75rem',
      color: theme.colors.text.tertiary,
      marginTop: theme.spacing.xs,
    };

    const iconStyles: React.CSSProperties = {
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex',
      alignItems: 'center',
      color: theme.colors.text.tertiary,
    };

    return (
      <div className={className} style={{ width: fullWidth ? '100%' : 'auto' }}>
        {label && (
          <label style={labelStyles}>
            {label}
            {props.required && <span style={{ color: theme.colors.error[500] }}> *</span>}
          </label>
        )}
        
        <div style={{ position: 'relative' }}>
          {leftIcon && (
            <div style={{ ...iconStyles, left: theme.spacing.sm }}>
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            style={inputStyles}
            {...props}
          />
          
          {rightIcon && (
            <div style={{ ...iconStyles, right: theme.spacing.sm }}>
              {rightIcon}
            </div>
          )}
        </div>
        
        {error && <div style={errorStyles}>{error}</div>}
        {helperText && !error && <div style={helperTextStyles}>{helperText}</div>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
