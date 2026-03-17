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
  // Staff & Human Resources
  { name: 'Staff Salaries', icon: '💰', color: '#6366f1', description: 'Monthly salaries and wages for teaching and non-teaching staff' },
  { name: 'Staff Benefits', icon: '🏥', color: '#8b5cf6', description: 'Health insurance, provident fund, and other staff benefits' },
  { name: 'Professional Development', icon: '�', color: '#3b82f6', description: 'Training programs, workshops, and certifications for staff' },
  { name: 'Recruitment', icon: '👥', color: '#ec4899', description: 'Recruitment costs, advertising, and interview expenses' },
  
  // Infrastructure & Facilities
  { name: 'Building Maintenance', icon: '🏗️', color: '#f59e0b', description: 'Building repairs, renovations, and structural maintenance' },
  { name: 'Classroom Furniture', icon: '🪑', color: '#f97316', description: 'Desks, chairs, tables, and other classroom furniture' },
  { name: 'Laboratory Equipment', icon: '🔬', color: '#14b8a6', description: 'Science lab equipment, chemicals, and supplies' },
  { name: 'Computer Hardware', icon: '�', color: '#6b7280', description: 'Computers, printers, and IT hardware' },
  { name: 'Playground Equipment', icon: '🏀', color: '#10b981', description: 'Sports equipment, playground structures, and facilities' },
  
  // Academic Resources
  { name: 'Textbooks & Study Materials', icon: '📖', color: '#0ea5e9', description: 'Textbooks, reference books, and study materials' },
  { name: 'Stationery Supplies', icon: '✏️', color: '#84cc16', description: 'Pens, papers, notebooks, and office stationery' },
  { name: 'Library Resources', icon: '📚', color: '#a855f7', description: 'Library books, journals, and digital resources' },
  { name: 'Educational Software', icon: '💿', color: '#06b6d4', description: 'Educational software licenses and digital learning tools' },
  
  // Utilities & Services
  { name: 'Electricity Bills', icon: '⚡', color: '#f59e0b', description: 'Electricity and power consumption charges' },
  { name: 'Water & Sewage', icon: '�', color: '#3b82f6', description: 'Water supply and sewage services' },
  { name: 'Internet & Communication', icon: '🌐', color: '#6366f1', description: 'Internet, telephone, and communication services' },
  { name: 'Waste Management', icon: '🗑️', color: '#6b7280', description: 'Garbage disposal and waste management services' },
  
  // Transportation
  { name: 'School Buses', icon: '🚌', color: '#f59e0b', description: 'Bus maintenance, fuel, and transportation costs' },
  { name: 'Vehicle Insurance', icon: '🛡️', color: '#ef4444', description: 'Insurance for school vehicles' },
  { name: 'Transport Staff', icon: '👨‍✈️', color: '#8b5cf6', description: 'Drivers and transport staff salaries' },
  
  // Events & Activities
  { name: 'Annual Day', icon: '🎉', color: '#ec4899', description: 'Annual day celebration expenses' },
  { name: 'Sports Day', icon: '🏆', color: '#f59e0b', description: 'Sports events and competitions' },
  { name: 'Cultural Programs', icon: '🎭', color: '#a855f7', description: 'Cultural events and programs' },
  { name: 'Field Trips', icon: '🚌', color: '#3b82f6', description: 'Educational field trips and excursions' },
  
  // Administration & Operations
  { name: 'Office Supplies', icon: '📋', color: '#6b7280', description: 'General office supplies and administrative materials' },
  { name: 'Legal & Professional Fees', icon: '⚖️', color: '#6366f1', description: 'Legal consultation, audit fees, and professional services' },
  { name: 'Banking Charges', icon: '🏦', color: '#14b8a6', description: 'Bank charges and transaction fees' },
  { name: 'Insurance Premiums', icon: '🛡️', color: '#ef4444', description: 'School insurance and premium payments' },
  
  // Health & Safety
  { name: 'Medical Supplies', icon: '💊', color: '#ef4444', description: 'First aid, medical supplies, and health room expenses' },
  { name: 'Security Services', icon: '🔒', color: '#6b7280', description: 'Security personnel and surveillance systems' },
  { name: 'Fire Safety', icon: '🔥', color: '#f97316', description: 'Fire safety equipment and maintenance' },
  
  // Miscellaneous
  { name: 'Miscellaneous', icon: '📦', color: '#6b7280', description: 'Other miscellaneous expenses' },
];

export const fmt = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

export const PAYMENT_METHODS = ['cash', 'bank_transfer', 'cheque', 'upi', 'card', 'other'];
