// Registration Component - Simple Version
// Based on the School Management ERP UI Design Documents

'use client';

import React, { useState } from 'react';
import { Button } from './Button-simple';
import { colors } from '../tokens/colors-simple';

export interface RegisterProps {
  onRegister?: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: 'student' | 'teacher' | 'parent' | 'admin';
  }) => void;
  onLogin?: () => void;
  loading?: boolean;
  error?: string;
}

export const Register: React.FC<RegisterProps> = ({
  onRegister,
  onLogin,
  loading = false,
  error = '',
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student' as 'student' | 'teacher' | 'parent' | 'admin',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onRegister && formData.password === formData.confirmPassword) {
      onRegister(formData);
    }
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: '450px',
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

  const nameGroupStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
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

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
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
    textAlign: 'center',
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

  const isFormValid = 
    formData.firstName &&
    formData.lastName &&
    formData.email &&
    formData.password &&
    formData.confirmPassword &&
    formData.password === formData.confirmPassword;

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>Create Account</h1>
        <p style={subtitleStyle}>Join the School ERP platform</p>
      </header>

      {error && (
        <div style={errorStyle} role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={formStyle}>
        <div style={nameGroupStyle}>
          <div style={inputGroupStyle}>
            <label htmlFor="firstName" style={labelStyle}>
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              placeholder="Enter your first name"
              required
              style={inputStyle}
            />
          </div>

          <div style={inputGroupStyle}>
            <label htmlFor="lastName" style={labelStyle}>
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              placeholder="Enter your last name"
              required
              style={inputStyle}
            />
          </div>
        </div>

        <div style={inputGroupStyle}>
          <label htmlFor="email" style={labelStyle}>
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="Enter your email"
            required
            style={inputStyle}
          />
        </div>

        <div style={inputGroupStyle}>
          <label htmlFor="role" style={labelStyle}>
            Role
          </label>
          <select
            id="role"
            value={formData.role}
            onChange={(e) => handleChange('role', e.target.value)}
            style={selectStyle}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="parent">Parent</option>
            <option value="admin">Administrator</option>
          </select>
        </div>

        <div style={inputGroupStyle}>
          <label htmlFor="password" style={labelStyle}>
            Password
          </label>
          <div style={passwordContainerStyle}>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Create a password"
              required
              style={{
                ...inputStyle,
                paddingRight: '4rem',
              }}
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

        <div style={inputGroupStyle}>
          <label htmlFor="confirmPassword" style={labelStyle}>
            Confirm Password
          </label>
          <div style={passwordContainerStyle}>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              placeholder="Confirm your password"
              required
              style={{
                ...inputStyle,
                paddingRight: '4rem',
              }}
            />
            <button
              type="button"
              style={toggleButtonStyle}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <Button
          variant="primary"
          disabled={loading || !isFormValid}
          onClick={() => onRegister?.(formData)}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>

      <footer style={footerStyle}>
        <p style={{ color: colors.neutral[600], marginBottom: '0.5rem' }}>
          Already have an account?
        </p>
        <button
          type="button"
          style={linkStyle}
          onClick={onLogin}
        >
          Sign In
        </button>
      </footer>
    </div>
  );
};

export default Register;
