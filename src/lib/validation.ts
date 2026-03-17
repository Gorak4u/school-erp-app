export function stripNonDigits(value?: string | null): string {
  if (!value) return '';
  return value.replace(/\D/g, '');
}

export function isValidEmail(email?: string | null): boolean {
  if (!email) return false;
  const trimmed = email.trim();
  if (!trimmed) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]*$/;
  return emailRegex.test(trimmed);
}

export function isValidPhone(phone?: string | null): boolean {
  if (!phone) return false;
  const digits = stripNonDigits(phone);
  return digits.length >= 10 && digits.length <= 15;
}

export function isValidAadhar(aadhar?: string | null): boolean {
  if (!aadhar) return true; // optional
  const digits = stripNonDigits(aadhar);
  return digits.length === 12;
}

export function isValidPinCode(pinCode?: string | null): boolean {
  if (!pinCode) return true;
  const digits = stripNonDigits(pinCode);
  return digits.length === 6;
}

export function isValidIFSC(ifsc?: string | null): boolean {
  if (!ifsc) return true;
  return /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(ifsc.trim());
}

export function isValidDate(value?: string | null): boolean {
  if (!value) return false;
  return !Number.isNaN(Date.parse(value));
}

export function isValidGender(value?: string | null): boolean {
  if (!value) return true;
  const allowed = new Set(['Male', 'Female', 'Other']);
  return allowed.has(value);
}
