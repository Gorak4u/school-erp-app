// @ts-nocheck

import React from 'react';

export interface FeeItem {
  id: string;
  name: string;
  category: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'partial' | 'overdue';
  paidAmount: number;
  discount: number;
  frequency: 'monthly' | 'quarterly' | 'yearly' | 'one-time';
  academicYear: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
  lateFee?: number;
  discountAvailable?: boolean;
  waivedAmount?: number;
  isFine?: boolean;
  fineId?: string;
  fineNumber?: string;
  pendingAmount?: number;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  fee?: number;
}

export interface EnhancedFeeCollectionProps {
  theme: 'dark' | 'light';
  onClose?: () => void;
  studentId?: string;
  studentData?: any;
  onPaymentSuccess?: () => void;
}

export interface ReceiptPaymentItem {
  id: string;
  feeRecordId: string;
  name: string;
  category: string;
  academicYear: string;
  totalAmount: number;
  amountPaid: number;
  paidAmount: number;
  discount: number;
  balance: number;
  status: string;
  receiptNumber: string;
  transactionId?: string;
  remarks?: string;
  paymentDate?: string;
  isFine?: boolean;
  fineNumber?: string;
}

export interface ReceiptData {
  studentData: {
    studentName: string;
    studentClass: string;
    admissionNo: string;
    rollNo: string;
    fatherName: string;
    parentName: string;
    collectedBy: string;
  };
  paymentData: {
    currentYearFees: ReceiptPaymentItem[];
    statementRecords: any[];
    includedReceiptNumbers: string[];
  };
  receiptNumber: string;
  paymentDate: string;
  paymentMethod: string;
}

export interface FinesStats {
  totalFines: number;
  totalFinesPaid: number;
  totalFinesPending: number;
  totalFinesWaived: number;
  pendingFinesCount: number;
}

export interface FeeStats {
  totalFees: number;
  pendingFees: number;
  paidFees: number;
  overdueFees: number;
  totalAmount: number;
  totalPaid: number;
  totalPending: number;
  totalDiscount: number;
  selectedFeesTotal: number;
}

export interface ProcessedPayment {
  fee: FeeItem;
  amount: number;
  paymentResult: any;
}

export interface Colors {
  primary: string;
  success: string;
  warning: string;
  danger: string;
  purple: string;
  cyan: string;
  pink: string;
}

export type TabType = 'overview' | 'fees' | 'fines' | 'payment' | 'discounts' | 'history';
