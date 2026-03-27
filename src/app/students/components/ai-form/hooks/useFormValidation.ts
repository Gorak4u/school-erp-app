import { useState, useCallback } from 'react';
import { StudentFormData, FormErrors } from '../types';

// Advanced Validation Functions
export const digitsOnly = (value: string | undefined | null) => (value || '').replace(/\D/g, '');

export const isPhoneValid = (value: string | undefined | null) => {
  if (!value) return false;
  const digits = digitsOnly(value);
  return digits.length >= 10 && digits.length <= 15;
};

export const isAadharValid = (value: string | undefined | null) => {
  if (!value) return true;
  return digitsOnly(value).length === 12;
};

export const isPinValid = (value: string | undefined | null) => {
  if (!value) return true;
  return digitsOnly(value).length === 6;
};

export const isIFSCValid = (value: string | undefined | null) => {
  if (!value) return true;
  return /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(value.trim());
};

export const useFormValidation = () => {
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = useCallback((data: StudentFormData) => {
    const newErrors: FormErrors = {};
    
    // Personal Validation
    if (!data.name.trim()) {
      newErrors.name = 'Full Name is required';
    } else if (data.name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters long';
    } else if (!/^[a-zA-Z\s]+$/.test(data.name.trim())) {
      newErrors.name = 'Name should contain only letters and spaces';
    }
    
    if (!data.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of Birth is required';
    } else {
      const dob = new Date(data.dateOfBirth);
      const today = new Date();
      const age = Math.floor((today.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 3 || age > 25) {
        newErrors.dateOfBirth = 'Age should be between 3 and 25 years';
      }
    }
    
    if (!data.gender) newErrors.gender = 'Gender is required';
    if (!data.nationality) newErrors.nationality = 'Nationality is required';
    if (!data.bloodGroup) newErrors.bloodGroup = 'Blood Group is required';
    
    // Aadhar validation (optional but if provided must be valid)
    if (data.aadharNumber && !isAadharValid(data.aadharNumber)) {
      newErrors.aadharNumber = 'Aadhar number must be 12 digits';
    }
    
    // Contact Validation
    if (!data.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!isPhoneValid(data.phone)) {
      newErrors.phone = 'Phone number must be 10-15 digits';
    }
    
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!data.address.trim()) {
      newErrors.address = 'Address is required';
    } else if (data.address.trim().length < 10) {
      newErrors.address = 'Address must be at least 10 characters long';
    }
    
    if (!data.city.trim()) newErrors.city = 'City is required';
    if (!data.state.trim()) newErrors.state = 'State is required';
    
    if (!data.pincode) {
      newErrors.pincode = 'PIN code is required';
    } else if (!isPinValid(data.pincode)) {
      newErrors.pincode = 'PIN code must be 6 digits';
    }
    
    // Academic Validation
    if (!data.admissionNo.trim()) {
      newErrors.admissionNo = 'Admission Number is required';
    }
    
    if (!data.admissionDate) {
      newErrors.admissionDate = 'Admission Date is required';
    }
    
    if (!data.classId) newErrors.classId = 'Class is required';
    if (!data.sectionId) newErrors.sectionId = 'Section is required';
    if (!data.mediumId) newErrors.mediumId = 'Language Medium is required';
    if (!data.boardId) newErrors.boardId = 'Board is required';
    
    // Roll number validation (optional but if provided must be valid)
    if (data.rollNumber && !/^[A-Za-z0-9\-/]+$/.test(data.rollNumber.trim())) {
      newErrors.rollNumber = 'Roll number can only contain letters, numbers, hyphens and slashes';
    }
    
    // Parent Validation
    if (!data.fatherName.trim()) {
      newErrors.fatherName = 'Father Name is required';
    } else if (data.fatherName.trim().length < 3) {
      newErrors.fatherName = 'Father Name must be at least 3 characters long';
    }
    
    if (!data.fatherPhone) {
      newErrors.fatherPhone = 'Father Phone is required';
    } else if (!isPhoneValid(data.fatherPhone)) {
      newErrors.fatherPhone = 'Father phone must be 10-15 digits';
    }
    
    if (data.fatherEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.fatherEmail)) {
      newErrors.fatherEmail = 'Invalid father email format';
    }
    
    if (!data.motherName.trim()) {
      newErrors.motherName = 'Mother Name is required';
    } else if (data.motherName.trim().length < 3) {
      newErrors.motherName = 'Mother Name must be at least 3 characters long';
    }
    
    if (!data.motherPhone) {
      newErrors.motherPhone = 'Mother Phone is required';
    } else if (!isPhoneValid(data.motherPhone)) {
      newErrors.motherPhone = 'Mother phone must be 10-15 digits';
    }
    
    if (data.motherEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.motherEmail)) {
      newErrors.motherEmail = 'Invalid mother email format';
    }
    
    if (!data.emergencyContact.trim()) {
      newErrors.emergencyContact = 'Emergency Contact is required';
    }
    
    if (!data.emergencyPhone) {
      newErrors.emergencyPhone = 'Emergency Phone is required';
    } else if (!isPhoneValid(data.emergencyPhone)) {
      newErrors.emergencyPhone = 'Emergency phone must be 10-15 digits';
    }
    
    // Bank Validation (only if bank details are provided)
    if (data.bankAccountNumber && data.bankAccountNumber.length < 9) {
      newErrors.bankAccountNumber = 'Account number must be at least 9 digits';
    }
    
    if (data.bankIfsc && !isIFSCValid(data.bankIfsc)) {
      newErrors.bankIfsc = 'Invalid IFSC code format';
    }
    
    // Transport Validation (if transport is selected)
    if (data.transport === 'Yes') {
      // Add transport-specific validation if needed
    }
    
    // Hostel Validation (if hostel is selected)
    if (data.hostel === 'Yes') {
      // Add hostel-specific validation if needed
    }
    
    setErrors(newErrors);
    
    // Return validation result and error messages
    const isValid = Object.keys(newErrors).length === 0;
    
    if (!isValid) {
      // Scroll to first error field
      const errorFields = Object.keys(newErrors);
      const firstErrorField = errorFields[0];
      
      // Try to find and focus the first error field
      setTimeout(() => {
        const element = document.getElementById(firstErrorField) || 
                       document.querySelector(`[name="${firstErrorField}"]`) ||
                       document.querySelector(`input[name="${firstErrorField}"]`) ||
                       document.querySelector(`select[name="${firstErrorField}"]`);
        
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.focus();
          // Add visual highlight
          element.classList.add('ring-2', 'ring-red-500', 'ring-offset-2');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-red-500', 'ring-offset-2');
          }, 3000);
        }
      }, 100);
    }
    
    return isValid;
  }, []);

  const validateField = useCallback((field: string, value: any) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'phone':
      case 'fatherPhone':
      case 'motherPhone':
      case 'emergencyPhone':
        if (value && !isPhoneValid(value)) {
          newErrors[field] = 'Phone number must be 10-15 digits';
        } else {
          delete newErrors[field];
        }
        break;
      case 'pincode':
        if (value && !isPinValid(value)) {
          newErrors[field] = 'PIN code must be 6 digits';
        } else {
          delete newErrors[field];
        }
        break;
      case 'bankIfsc':
        if (value && !isIFSCValid(value)) {
          newErrors[field] = 'Invalid IFSC code format';
        } else {
          delete newErrors[field];
        }
        break;
      case 'email':
      case 'fatherEmail':
      case 'motherEmail':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors[field] = 'Invalid email format';
        } else {
          delete newErrors[field];
        }
        break;
      case 'aadharNumber':
        if (value && !isAadharValid(value)) {
          newErrors[field] = 'Aadhar number must be 12 digits';
        } else {
          delete newErrors[field];
        }
        break;
      case 'rollNumber':
        if (value && !/^[A-Za-z0-9\-/]+$/.test(value.trim())) {
          newErrors[field] = 'Roll number can only contain letters, numbers, hyphens and slashes';
        } else {
          delete newErrors[field];
        }
        break;
      default:
        if (!value || (typeof value === 'string' && !value.trim())) {
          newErrors[field] = 'This field is required';
        } else {
          delete newErrors[field];
        }
    }
    
    setErrors(newErrors);
  }, [errors]);

  return {
    errors,
    setErrors,
    validateForm,
    validateField,
    // Export validation functions for use in components
    isPhoneValid,
    isAadharValid,
    isPinValid,
    isIFSCValid,
    digitsOnly
  };
};
