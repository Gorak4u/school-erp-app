// Login Component - Simple Version
// Based on the School Management ERP UI Design Documents

'use client';

import React, { useState } from 'react';
import { Button } from './Button-simple';
import { colors } from '../tokens/colors-simple';

export interface LoginProps {
  onLogin?: (credentials: { email: string; password: string }) => void;
  onForgotPassword?: () => void;
  onRegister?: () => void;
  loading?: boolean;
  error?: string;
}

export const Login: React.FC<LoginProps> = ({
  onLogin,
  onForgotPassword,
  onRegister,
  loading = false,
  error = '',
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onLogin && email && password) {
      onLogin({ email, password });
    }
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: '400px',
    margin: '0 auto',
    padding: '2rem',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  };

  const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '2rem',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: colors.primary[500],
    marginBottom: '0.5rem',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '1rem',
    color: colors.neutral[600],
    marginBottom: '0',
  };

  const formStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  };

  const inputGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: colors.neutral[700],
  };

  const inputStyle: React.CSSProperties = {
    padding: '0.75rem',
    border: `1px solid ${colors.neutral[300]}`,
    borderRadius: '6px',
    fontSize: '1rem',
    transition: 'border-color 0.2s ease',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };

  const passwordContainerStyle: React.CSSProperties = {
    position: 'relative',
  };

  const toggleButtonStyle: React.CSSProperties = {
    position: 'absolute',
    right: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: colors.neutral[500],
    cursor: 'pointer',
    fontSize: '0.875rem',
  };

  const errorStyle: React.CSSProperties = {
    padding: '0.75rem',
    backgroundColor: colors.error[50],
    color: colors.error[700],
    border: `1px solid ${colors.error[200]}`,
    borderRadius: '6px',
    fontSize: '0.875rem',
    textAlign: 'center',
  };

  const footerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '1.5rem',
    paddingTop: '1.5rem',
    borderTop: `1px solid ${colors.neutral[200]}`,
  };

  const linkStyle: React.CSSProperties = {
    color: colors.primary[500],
    textDecoration: 'none',
    fontSize: '0.875rem',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: '0',
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>Welcome Back</h1>
        <p style={subtitleStyle}>Sign in to your School ERP account</p>
      </header>

      {error && (
        <div style={errorStyle} role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={formStyle}>
        <div style={inputGroupStyle}>
          <label htmlFor="email" style={labelStyle}>
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            style={inputStyle}
            aria-describedby="email-error"
          />
        </div>

        <div style={inputGroupStyle}>
          <label htmlFor="password" style={labelStyle}>
            Password
          </label>
          <div style={passwordContainerStyle}>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              style={{
                ...inputStyle,
                paddingRight: '4rem',
              }}
              aria-describedby="password-error"
            />
            <button
              type="button"
              style={toggleButtonStyle}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <Button
          variant="primary"
          disabled={loading || !email || !password}
          onClick={() => onLogin?.({ email, password })}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <footer style={footerStyle}>
        <button
          type="button"
          style={linkStyle}
          onClick={onForgotPassword}
        >
          Forgot Password?
        </button>
        <button
          type="button"
          style={linkStyle}
          onClick={onRegister}
        >
          Create Account
        </button>
      </footer>
    </div>
  );
};

export default Login;
