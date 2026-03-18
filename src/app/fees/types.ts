// Types and Interfaces
export interface FeeStructure {
  id: string;
  name: string;
  category: 'tuition' | 'transport' | 'hostel' | 'library' | 'lab' | 'exam' | 'other';
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'yearly' | 'one-time';
  dueDate: number; // day of month
  lateFee: number;
  description: string;
  applicableClasses: string[];
  applicableCategories: string[];
  isActive: boolean;
  createdAt: string;
}

export interface FeeRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  feeStructureId: string;
  feeStructureName: string;
  amount: number;
  paidAmount: number;
  pendingAmount: number;
  dueDate: string;
  paidDate?: string;
  status: 'paid' | 'pending' | 'overdue' | 'partial';
  paymentMethod?: 'cash' | 'cheque' | 'online' | 'bank_transfer';
  transactionId?: string;
  receiptNumber?: string;
  collectedBy: string;
  remarks?: string;
  createdAt: string;
}

export interface StudentFeeSummary {
  studentId: string;
  studentName: string;
  studentClass: string;
  studentStatus?: string;
  rollNo: string;
  totalFees: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  totalDiscount: number;
  feeRecords: FeeRecord[];
  lastPaymentDate?: string;
  paymentStatus: 'fully_paid' | 'partially_paid' | 'no_payment' | 'overdue';
  discountApplied: number;
  netPayable: number;
}

export interface FeeCollection {
  id: string;
  date: string;
  totalAmount: number;
  cashAmount: number;
  onlineAmount: number;
  chequeAmount: number;
  bankTransferAmount: number;
  transactionCount: number;
  collectedBy: string;
  status: 'completed' | 'pending' | 'reconciled';
}

export interface Discount {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  applicableClasses: string[];
  applicableCategories: string[];
  maxDiscountAmount?: number;
  isActive: boolean;
  validFrom: string;
  validTo: string;
  description: string;
}
