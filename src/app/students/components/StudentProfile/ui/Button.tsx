import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  onClick,
  disabled = false,
  className = '',
  type = 'button'
}) => {
  const baseStyles = 'relative overflow-hidden font-medium transition-all duration-300 flex items-center gap-2';
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2 text-sm rounded-xl',
    lg: 'px-6 py-3 text-base rounded-2xl'
  };
  
  const variantStyles = {
    primary: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30',
    secondary: 'backdrop-blur-sm bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 hover:text-white dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white',
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30'
  };
  
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95';
  
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${disabledStyles} ${className}`}
    >
      <span className="relative z-10 flex items-center gap-2">
        {Icon && <Icon className={size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'} />}
        {children}
      </span>
      
      {/* Hover gradient effect for primary buttons */}
      {variant === 'primary' && !disabled && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600"
          initial={{ x: '-100%' }}
          whileHover={{ x: '0%' }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.button>
  );
};

export default Button;
