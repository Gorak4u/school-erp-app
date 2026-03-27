import React from 'react';

interface CardProps {
  children: React.ReactNode;
  theme: 'dark' | 'light';
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'sm' | 'md' | 'lg' | 'none';
}

const Card: React.FC<CardProps> = ({
  children,
  theme,
  className = '',
  padding = 'md',
  shadow = 'md'
}) => {
  const paddingStyles = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const shadowStyles = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  };

  const themeStyles = theme === 'dark'
    ? 'bg-gray-800 border-gray-700 text-white'
    : 'bg-white border-gray-200 text-gray-900';

  return (
    <div className={`rounded-xl border ${paddingStyles[padding]} ${shadowStyles[shadow]} ${themeStyles} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
