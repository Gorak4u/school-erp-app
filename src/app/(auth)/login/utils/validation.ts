export interface LoginFormData {
  email: string;
  password: string;
}

export interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export const validateEmail = (email: string): string | null => {
  if (!email) {
    return 'Email address is required';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'Password is required';
  }
  
  if (password.length < 6) {
    return 'Password must be at least 6 characters long';
  }
  
  return null;
};

export const validateLoginForm = (formData: LoginFormData): FormErrors => {
  const errors: FormErrors = {};
  
  const emailError = validateEmail(formData.email);
  if (emailError) {
    errors.email = emailError;
  }
  
  const passwordError = validatePassword(formData.password);
  if (passwordError) {
    errors.password = passwordError;
  }
  
  return errors;
};

export const hasFormErrors = (errors: FormErrors): boolean => {
  return Object.keys(errors).length > 0;
};

export const getErrorMessage = (error: string | undefined): string => {
  if (!error) return '';
  
  // Map common error messages to user-friendly ones
  const errorMap: Record<string, string> = {
    'Invalid credentials': 'Invalid email or password. Please try again.',
    'No account found with this email': 'No account found with this email address.',
    'Invalid password': 'Incorrect password. Please try again.',
    'Account is inactive': 'Your account has been deactivated. Please contact support.',
    'Invalid email or Employee ID format': 'Please enter a valid email address.',
    'Network Error': 'Unable to connect. Please check your internet connection.',
  };
  
  return errorMap[error] || error;
};
