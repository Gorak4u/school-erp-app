export const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  pending:  { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-400' },
  approved: { bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-400' },
  rejected: { bg: 'bg-red-100',    text: 'text-red-800',    dot: 'bg-red-400' },
  paid:     { bg: 'bg-blue-100',   text: 'text-blue-800',   dot: 'bg-blue-400' },
};

export const PRIORITY_COLORS: Record<string, string> = {
  low:    'bg-gray-100 text-gray-700',
  medium: 'bg-orange-100 text-orange-700',
  high:   'bg-red-100 text-red-700',
};

export const DEFAULT_CATEGORIES = [
  { name: 'Staff & HR',      icon: '👥', color: '#6366f1' },
  { name: 'Infrastructure',  icon: '🏗️', color: '#f59e0b' },
  { name: 'Academics',       icon: '📚', color: '#10b981' },
  { name: 'Transport',       icon: '🚌', color: '#3b82f6' },
  { name: 'Utilities',       icon: '⚡', color: '#8b5cf6' },
  { name: 'Events',          icon: '🎉', color: '#ec4899' },
  { name: 'Administration',  icon: '🗂️', color: '#14b8a6' },
  { name: 'Miscellaneous',   icon: '📦', color: '#6b7280' },
];

export const fmt = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

export const PAYMENT_METHODS = ['cash', 'bank_transfer', 'cheque', 'upi', 'card', 'other'];
