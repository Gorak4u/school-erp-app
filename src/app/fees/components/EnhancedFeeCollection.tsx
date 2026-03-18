// @ts-nocheck
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useSchoolConfig } from '@/contexts/SchoolConfigContext';
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Zap, 
  Shield, 
  Award, 
  Target,
  QrCode,
  X,
  Share
} from 'lucide-react';
import PaymentReceipt from './PaymentReceipt';
import { PDFGenerator } from '@/utils/pdfGenerator';

interface EnhancedFeeCollectionProps {
  theme: 'dark' | 'light';
  onClose?: () => void;
  studentId?: string;
  studentData?: any;
  onPaymentSuccess?: () => void; // Add callback for payment success
}

interface FeeItem {
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
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  fee?: number;
}

export default function EnhancedFeeCollection({ theme, onClose, studentId, studentData, onPaymentSuccess }: EnhancedFeeCollectionProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { getSetting, refresh } = useSchoolConfig();

  // Get payment settings
  const razorpayKeyId = getSetting('payment_gateway', 'api_key', '');
  const razorpayKeySecret = getSetting('payment_gateway', 'api_secret', '');
  const upiId = getSetting('payment_gateway', 'upi_id', '');
  const paymentGatewayEnabled = getSetting('payment_gateway', 'enabled', 'false') === 'true';

  // Refresh settings on component mount to get latest data
  useEffect(() => {
    refresh();
  }, [refresh]);

  // UPI QR Code state
  const [showUpiQr, setShowUpiQr] = useState(false);
  const [upiQrCode, setUpiQrCode] = useState('');
  const [upiPaymentStatus, setUpiPaymentStatus] = useState<'pending' | 'checking' | 'confirmed'>('pending');
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [sharingQr, setSharingQr] = useState(false);

  // Get current user's full name
  const getCurrentUserName = () => {
    if (session?.user) {
      const firstName = session.user.firstName || session.user.name?.split(' ')[0] || '';
      const lastName = session.user.lastName || session.user.name?.split(' ')[1] || '';
      return firstName && lastName ? `${firstName} ${lastName}` : session.user.name || 'Unknown User';
    }
    return 'Unknown User';
  };

  // UPI Payment confirmation functions
  const handleUpiPaymentConfirmation = async () => {
    setCheckingPayment(true);
    setUpiPaymentStatus('checking');
    
    try {
      // Process the payment as received
      const { paymentsApi } = await import('@/lib/apiClient');
      const processedPayments: Array<{ fee: FeeItem; amount: number; paymentResult: any }> = [];

      for (const feeId of selectedFees) {
        const fee = filteredFees.find(f => f.id === feeId);
        if (!fee || fee.status === 'paid') continue;
        const amount = customAmounts[feeId] || (fee.amount - fee.paidAmount - (fee.discount || 0));
        const paymentResult = await paymentsApi.process({
          feeRecordId: feeId,
          amount,
          paymentMethod: 'upi',
          collectedBy: getCurrentUserName(),
          remarks: 'UPI payment - QR code',
        });
        processedPayments.push({ fee, amount, paymentResult });
      }

      if (processedPayments.length === 0) {
        throw new Error('No unpaid fee selected for payment');
      }

      const receiptPayload = buildLatestReceiptPayload(processedPayments);
      setLatestReceipt(receiptPayload);
      setSelectedFees([]);
      setCustomAmounts({});
      setUpiPaymentStatus('confirmed');

      if ((window as any).toast) {
        (window as any).toast({
          type: 'success',
          title: 'UPI Payment Confirmed',
          message: `UPI payment of ₹${stats.selectedFeesTotal.toLocaleString()} processed successfully`,
          action: { label: 'View Receipt', onClick: () => {
            setShowUpiQr(false);
            setShowReceipt(true);
          }}
        });
      }
      
      // Call the success callback to refresh fee data
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
      
      // Send payment confirmation email asynchronously
      sendPaymentConfirmationEmail(receiptPayload, 'upi');
      
      // Close QR modal after 2 seconds
      setTimeout(() => {
        setShowUpiQr(false);
        setShowReceipt(true);
      }, 2000);
      
    } catch (err: any) {
      setUpiPaymentStatus('pending');
      if ((window as any).toast) {
        (window as any).toast({ 
          type: 'error', 
          title: 'Payment Confirmation Failed', 
          message: err.message || 'Failed to confirm UPI payment' 
        });
      }
    } finally {
      setCheckingPayment(false);
    }
  };

  // Auto-check payment status (polling mechanism)
  useEffect(() => {
    if (showUpiQr && upiPaymentStatus === 'pending') {
      const interval = setInterval(async () => {
        // Here you could implement an API call to check if payment was received
        // For now, we'll just show a message after 30 seconds suggesting manual confirmation
        setTimeout(() => {
          if (upiPaymentStatus === 'pending' && (window as any).toast) {
            (window as any).toast({
              type: 'info',
              title: 'Payment Status',
              message: 'If you have completed the UPI payment, please click "Mark as Paid" to confirm.',
              duration: 5000
            });
          }
        }, 30000);
      }, 10000); // Check every 10 seconds

      return () => clearInterval(interval);
    }
  }, [showUpiQr, upiPaymentStatus]);

  // Share QR Code function
  const handleShareQrCode = async () => {
    setSharingQr(true);
    
    try {
      // Create email content with QR code
      const emailContent = {
        subject: `UPI Payment Request - ${studentData?.name || studentData?.studentName} - ₹${stats.selectedFeesTotal.toLocaleString()}`,
        body: `
Dear Parent/Guardian,

Please find the UPI QR code below for the fee payment of ₹${stats.selectedFeesTotal.toLocaleString()}.

Student: ${studentData?.name || studentData?.studentName}
Amount: ₹${stats.selectedFeesTotal.toLocaleString()}
UPI ID: ${upiId}

Instructions:
1. Open any UPI app (PhonePe, PayTM, Google Pay, etc.)
2. Scan the QR code or click the UPI link below
3. Complete the payment
4. Share the payment screenshot with the school for confirmation

UPI Payment Link: upi://pay?pa=${upiId}&pn=${encodeURIComponent(studentData?.name || studentData?.studentName || 'Student')}&am=${stats.selectedFeesTotal}&cu=INR&tn=${encodeURIComponent('Fee Payment')}

The QR code is attached to this email for your convenience.

Best regards,
${getCurrentUserName()}
School Administration
        `,
        attachments: [{
          filename: `UPI_QR_${studentData?.name || studentData?.studentName}_${Date.now()}.png`,
          content: upiQrCode.split(',')[1], // Remove data:image/png;base64, prefix
          encoding: 'base64'
        }]
      };

      // Send emails to parents and logged-in user
      const emailRecipients = [
        studentData?.fatherEmail || studentData?.parentEmail,
        studentData?.motherEmail,
        session?.user?.email // Also send to logged-in user
      ].filter(Boolean); // Filter out empty emails

      // Send emails individually since school-email API expects single recipient
      const emailPromises = emailRecipients.map(recipient => 
        fetch('/api/school-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: recipient,
            subject: emailContent.subject,
            html: emailContent.body.replace(/\n/g, '<br>') // Convert line breaks to HTML
          })
        })
      );

      // For QR code attachments, we need to send a separate request with attachments
      if (emailContent.attachments && emailContent.attachments.length > 0) {
        const attachmentPromises = emailRecipients.map(recipient =>
          fetch('/api/school-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: recipient,
              subject: emailContent.subject,
              html: emailContent.body.replace(/\n/g, '<br>'),
              attachments: emailContent.attachments
            })
          })
        );
        
        await Promise.all(attachmentPromises);
      } else {
        await Promise.all(emailPromises);
      }
      
    } catch (error) {
      console.error('Error sharing QR code:', error);
      if ((window as any).toast) {
        (window as any).toast({
          type: 'error',
          title: 'Failed to Share',
          message: 'Could not share QR code via email. Please try again.',
          duration: 5000
        });
      }
    } finally {
      setSharingQr(false);
    }
  };

  // Send payment confirmation email with PDF receipt
  const sendPaymentConfirmationEmail = async (receiptData: any, paymentMethod: string) => {
    try {
      // Generate PDF receipt
      const pdfBlob = await PDFGenerator.generateReceiptPDF(receiptData);
      const pdfBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(pdfBlob);
      });

      // Create email content
      const emailContent = {
        subject: `Payment Confirmation - ${studentData?.name || studentData?.studentName} - ₹${receiptData.paymentData?.currentYearFees?.reduce((sum: number, item: any) => sum + Number(item.amountPaid || item.paidAmount || 0), 0).toLocaleString()}`,
        body: `
Dear Parent/Guardian,

We are pleased to confirm that we have received your payment for the school fees.

Student: ${studentData?.name || studentData?.studentName}
Class: ${studentData?.class || studentData?.studentClass}
Amount Paid: ₹${receiptData.paymentData?.currentYearFees?.reduce((sum: number, item: any) => sum + Number(item.amountPaid || item.paidAmount || 0), 0).toLocaleString()}
Payment Method: ${paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}
Payment Date: ${new Date().toLocaleDateString()}
Receipt Number: ${receiptData.receiptNumber}

The detailed receipt is attached to this email for your records.

Thank you for your prompt payment. If you have any questions, please feel free to contact the school office.

Best regards,
${getCurrentUserName()}
School Administration
        `,
        attachments: [{
          filename: `Receipt_${receiptData.receiptNumber}.pdf`,
          content: (pdfBase64 as string).split(',')[1], // Remove data:application/pdf;base64, prefix
          encoding: 'base64'
        }]
      };

      // Send email to all configured email addresses
      const emailRecipients = [
        studentData?.fatherEmail || studentData?.parentEmail,
        studentData?.motherEmail,
        studentData?.email, // Student's own email if available
        session?.user?.email // Also send to logged-in user
      ].filter(Boolean);

      if (emailRecipients.length === 0) {
        console.warn('No email recipients found for payment confirmation');
        return;
      }

      // Send emails asynchronously
      const emailPromises = emailRecipients.map(recipient => 
        fetch('/api/school-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: recipient,
            subject: emailContent.subject,
            html: emailContent.body,
            attachments: emailContent.attachments
          })
        })
      );

      // Send emails asynchronously (don't wait for completion)
      Promise.all(emailPromises).then(() => {
        console.log('Payment confirmation emails sent successfully');
      }).catch(error => {
        console.error('Error sending payment confirmation emails:', error);
      });

    } catch (error) {
      console.error('Error generating payment confirmation email:', error);
    }
  };

  const [activeTab, setActiveTab] = useState<'overview' | 'fees' | 'payment' | 'history'>('overview');
  const [selectedFees, setSelectedFees] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState('all');
  const [academicYears, setAcademicYears] = useState<Array<{id: string; year: string; name: string}>>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [feeCategories, setFeeCategories] = useState<Array<string>>([]);

  const normalizeCategory = (value?: string) => {
    if (!value || typeof value !== 'string') return '';
    return value.trim().toLowerCase();
  };
  const [customAmounts, setCustomAmounts] = useState<{[key: string]: number}>({});
  const [showReceipt, setShowReceipt] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDetailedReceipt, setShowDetailedReceipt] = useState(false);
  const [latestReceipt, setLatestReceipt] = useState<any>(null);
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<any>(null);
  const [showHistoryReceipt, setShowHistoryReceipt] = useState(false);
  const [paymentStep, setPaymentStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [promoCode, setPromoCode] = useState('');
  const [installmentPlan, setInstallmentPlan] = useState(false);
  
  // Optimized payment history state
  const [paymentHistoryData, setPaymentHistoryData] = useState<any>(null);
  const [loadingPaymentHistory, setLoadingPaymentHistory] = useState(false);

  // Fetch optimized payment history when history tab is activated
  useEffect(() => {
    // Fetch academic years from database
    const fetchAcademicYears = async () => {
      try {
        const response = await fetch('/api/school-structure/academic-years');
        if (response.ok) {
          const data = await response.json();
          setAcademicYears(data.academicYears || []);
        }
      } catch (error) {
        console.error('Failed to fetch academic years:', error);
      }
    };

    // Fetch fee categories from database
    const fetchFeeCategories = async () => {
      try {
        const response = await fetch('/api/fees/structures');
        if (response.ok) {
          const data = await response.json();
          const structures = data.feeStructures || [];
          const dbCategories = [...new Set(structures
            .map((fs: any) => normalizeCategory(fs.category))
            .filter(Boolean))];
          const fallbackCategories = ['academic', 'transport', 'extracurricular', 'other'];
          const allCategories = [...new Set([...dbCategories, ...fallbackCategories])];
          setFeeCategories(allCategories);
        }
      } catch (error) {
        console.error('Failed to fetch fee categories:', error);
        // Set fallback categories on error
        setFeeCategories(['academic', 'transport', 'extracurricular', 'other']);
      }
    };

    fetchAcademicYears();
    fetchFeeCategories();
  }, []);

  useEffect(() => {
    const fetchPaymentHistory = async () => {
      if (activeTab !== 'history' || !studentId) return;
      
      setLoadingPaymentHistory(true);
      try {
        const params = new URLSearchParams({
          page: '1',
          pageSize: '1000', // Get all records for history tab
        });
        
        const response = await fetch(`/api/fees/students/${studentId}/payment-history?${params}`);
        const data = await response.json();
        
        if (data.success) {
          setPaymentHistoryData(data.data);
        }
      } catch (e) {
        console.error('Failed to load payment history', e);
      } finally {
        setLoadingPaymentHistory(false);
      }
    };
    
    fetchPaymentHistory();
  }, [activeTab, studentId]);

  const isDark = theme === 'dark';
  
  // Enhanced color scheme
  const colors = {
    primary: isDark ? '#3b82f6' : '#2563eb',
    success: isDark ? '#10b981' : '#059669',
    warning: isDark ? '#f59e0b' : '#d97706',
    danger: isDark ? '#ef4444' : '#dc2626',
    purple: isDark ? '#8b5cf6' : '#7c3aed',
    cyan: isDark ? '#06b6d4' : '#0891b2',
    pink: isDark ? '#ec4899' : '#db2777',
  };

  const cardCls = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const inputCls = isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500';

  // Enhanced payment methods
  const paymentMethods: PaymentMethod[] = [
    { 
      id: 'cash', 
      name: 'Cash Payment', 
      icon: <DollarSign className="w-5 h-5" />, 
      color: colors.success,
      description: 'Pay with cash at the counter',
      fee: 0
    },
    { 
      id: 'card', 
      name: 'Credit/Debit Card', 
      icon: <CreditCard className="w-5 h-5" />, 
      color: colors.primary,
      description: 'Secure card payment (2% processing fee)',
      fee: 50
    },
    { 
      id: 'upi', 
      name: 'UPI Payment', 
      icon: <Zap className="w-5 h-5" />, 
      color: colors.cyan,
      description: 'Instant UPI transfer (1% processing fee)',
      fee: 25
    },
    { 
      id: 'netbanking', 
      name: 'Net Banking', 
      icon: <Shield className="w-5 h-5" />, 
      color: colors.purple,
      description: 'Bank transfer (₹10 processing fee)',
      fee: 10
    },
    { 
      id: 'wallet', 
      name: 'Digital Wallet', 
      icon: <Award className="w-5 h-5" />, 
      color: colors.pink,
      description: 'PayTM, PhonePe etc. (₹5 processing fee)',
      fee: 5
    },
  ];

  // Get real fee data from studentData prop (comes from database via fees page)
  const allFeeData: FeeItem[] = useMemo(() => {
    if (!studentData?.feeRecords || studentData.feeRecords.length === 0) {
      return [];
    }
    
    return studentData.feeRecords.map((record: any) => {
      const category = normalizeCategory(record.category || record.feeStructure?.category || (record as any).feeStructureName) || 'academic';
      
      return {
        id: record.id,
        name: record.feeStructure?.name || record.name || (record as any).feeStructureName || 'Fee',
        category: category,
        amount: record.amount || 0,
        dueDate: record.dueDate || '',
        status: record.status || 'pending',
        paidAmount: record.paidAmount || 0,
        discount: record.discount || 0,
        frequency: record.feeStructure?.frequency || 'one-time',
        academicYear: record.academicYear || '2025-26',
        description: record.feeStructure?.description || '',
        priority: record.status === 'overdue' ? 'high' : 'medium',
        lateFee: record.feeStructure?.lateFee || 0,
        discountAvailable: false,
      };
    });
  }, [studentData]);

  // Computed values for enhanced UI
  const filteredFees = useMemo(() => {
    const filtered = allFeeData.filter(fee => {
      const yearMatch = selectedYear === 'all' || fee.academicYear === selectedYear;
      const categoryMatch = selectedCategory === 'all' || fee.category === selectedCategory;
      
      return yearMatch && categoryMatch;
    });
    
    return filtered;
  }, [allFeeData, selectedYear, selectedCategory]);

  const totalAmount = useMemo(() => {
    return filteredFees.reduce((sum, fee) => sum + fee.amount, 0);
  }, [filteredFees]);

  const totalPaid = useMemo(() => {
    return filteredFees.reduce((sum, fee) => sum + fee.paidAmount, 0);
  }, [filteredFees]);

  const totalPending = useMemo(() => {
    return filteredFees.reduce((sum, fee) => sum + (fee.amount - fee.paidAmount - (fee.discount || 0)), 0);
  }, [filteredFees]);

  const selectedFeesTotal = useMemo(() => {
    return filteredFees
      .filter(fee => selectedFees.includes(fee.id))
      .reduce((sum, fee) => sum + (customAmounts[fee.id] || (fee.amount - fee.paidAmount - (fee.discount || 0))), 0);
  }, [filteredFees, selectedFees, customAmounts]);

  const overdueFees = useMemo(() => {
    return filteredFees.filter(fee => fee.status === 'overdue');
  }, [filteredFees]);

  const totalDiscount = useMemo(() => {
    return filteredFees.reduce((sum, fee) => sum + (fee.discount || 0), 0);
  }, [filteredFees]);

  const stats = useMemo(() => ({
    totalFees: filteredFees.length,
    pendingFees: filteredFees.filter(f => f.status === 'pending').length,
    paidFees: filteredFees.filter(f => f.status === 'paid').length,
    overdueFees: overdueFees.length,
    totalAmount,
    totalPaid,
    totalPending,
    totalDiscount,
    selectedFeesTotal
  }), [filteredFees, overdueFees, totalAmount, totalPaid, totalPending, totalDiscount, selectedFeesTotal]);

  const buildReceiptStudentData = (collectedByOverride?: string) => ({
    studentName: studentData?.name || studentData?.studentName || 'N/A',
    studentClass: [studentData?.class || studentData?.studentClass, studentData?.section].filter(Boolean).join(' ') || studentData?.class || studentData?.studentClass || 'N/A',
    admissionNo: studentData?.admissionNo || studentData?.rollNo || 'N/A',
    rollNo: studentData?.rollNo || studentData?.admissionNo || 'N/A',
    fatherName: studentData?.fatherName || studentData?.parentName || 'Parent',
    parentName: studentData?.parentName || studentData?.fatherName || 'Parent',
    collectedBy: collectedByOverride || getCurrentUserName()
  });

  const buildLatestReceiptPayload = (processedPayments: Array<{ fee: FeeItem; amount: number; paymentResult: any }>) => {
    const includedReceiptNumbers = processedPayments
      .map(({ paymentResult }) => paymentResult?.receiptNumber || paymentResult?.payment?.receiptNumber)
      .filter(Boolean);

    const firstProcessed = processedPayments[0];
    const statementRecords = (studentData?.feeRecords || []).map((record: any) => {
      const processedMatch = processedPayments.find(({ fee }) => fee.id === record.id);
      if (!processedMatch) return record;

      const updatedPaidAmount = Number(processedMatch.paymentResult?.feeRecord?.paidAmount ?? record.paidAmount ?? 0);
      const updatedDiscount = Number(processedMatch.paymentResult?.feeRecord?.discount ?? record.discount ?? processedMatch.fee.discount ?? 0);
      const updatedPendingAmount = Number(
        processedMatch.paymentResult?.feeRecord?.pendingAmount
        ?? Math.max(0, Number(record.amount ?? processedMatch.fee.amount ?? 0) - updatedPaidAmount - updatedDiscount)
      );

      return {
        ...record,
        amount: Number(record.amount ?? processedMatch.fee.amount ?? 0),
        paidAmount: updatedPaidAmount,
        pendingAmount: updatedPendingAmount,
        discount: updatedDiscount,
        status: processedMatch.paymentResult?.feeRecord?.status || record.status,
        academicYear: record.academicYear || processedMatch.fee.academicYear,
        feeStructure: record.feeStructure || { name: processedMatch.fee.name, category: processedMatch.fee.category },
        receiptNumber: processedMatch.paymentResult?.receiptNumber || processedMatch.paymentResult?.payment?.receiptNumber || record.receiptNumber,
      };
    });

    return {
      studentData: buildReceiptStudentData(firstProcessed?.paymentResult?.payment?.collectedBy),
      paymentData: {
        currentYearFees: processedPayments.map(({ fee, amount, paymentResult }) => ({
          id: paymentResult?.payment?.id || fee.id,
          feeRecordId: fee.id,
          name: fee.name,
          category: fee.category,
          academicYear: fee.academicYear,
          totalAmount: fee.amount,
          amountPaid: amount,
          paidAmount: amount,
          discount: fee.discount || 0,
          balance: Number(paymentResult?.feeRecord?.pendingAmount ?? Math.max(0, fee.amount - fee.paidAmount - (fee.discount || 0) - amount)),
          status: paymentResult?.feeRecord?.status || 'partial',
          receiptNumber: paymentResult?.receiptNumber || paymentResult?.payment?.receiptNumber || '',
          transactionId: paymentResult?.payment?.transactionId || '',
          remarks: paymentResult?.payment?.remarks || '',
          paymentDate: paymentResult?.payment?.paymentDate || paymentResult?.feeRecord?.paidDate || new Date().toISOString(),
        })),
        statementRecords,
        includedReceiptNumbers,
      },
      receiptNumber: includedReceiptNumbers[0] || `RCPT-${Date.now()}`,
      paymentDate: firstProcessed?.paymentResult?.payment?.paymentDate || firstProcessed?.paymentResult?.feeRecord?.paidDate || new Date().toISOString(),
      paymentMethod: firstProcessed?.paymentResult?.payment?.paymentMethod || paymentMethod,
    };
  };

  const handleFeeSelection = (feeId: string) => {
    const wasSelected = selectedFees.includes(feeId);
    const newSelection = wasSelected 
      ? selectedFees.filter(id => id !== feeId)
      : [...selectedFees, feeId];
    
    setSelectedFees(newSelection);
    
    // Show toast for fee selection/deselection
    if ((window as any).toast) {
      const fee = filteredFees.find(f => f.id === feeId);
      if (fee) {
        (window as any).toast({
          type: wasSelected ? 'info' : 'success',
          title: wasSelected ? 'Fee Deselected' : 'Fee Selected',
          message: `${fee.name} ${wasSelected ? 'removed from' : 'added to'} payment`,
          duration: 2000
        });
      }
    }
  };

  const handleSelectAll = () => {
    const unpaidFees = filteredFees.filter(fee => fee.status !== 'paid');
    const unpaidIds = unpaidFees.map(fee => fee.id);
    setSelectedFees(unpaidIds);
    
    // Show toast for select all
    if ((window as any).toast) {
      (window as any).toast({
        type: 'success',
        title: 'All Fees Selected',
        message: `${unpaidIds.length} unpaid fees added to payment`,
        duration: 2000
      });
    }
  };

  const handleClearSelection = () => {
    const count = selectedFees.length;
    setSelectedFees([]);
    setCustomAmounts({});
    
    // Show toast for clear selection
    if ((window as any).toast && count > 0) {
      (window as any).toast({
        type: 'info',
        title: 'Selection Cleared',
        message: `${count} fees removed from payment`,
        duration: 2000
      });
    }
  };

  const handleCustomAmountChange = (feeId: string, amount: number) => {
    const fee = filteredFees.find(f => f.id === feeId);
    if (!fee) return;
    
    const maxAmount = fee.amount - fee.paidAmount - (fee.discount || 0);
    const validAmount = Math.min(Math.max(0, amount), maxAmount);
    
    setCustomAmounts(prev => ({
      ...prev,
      [feeId]: validAmount
    }));
    
    // Auto-select the fee if custom amount is set
    if (validAmount > 0 && !selectedFees.includes(feeId)) {
      setSelectedFees(prev => [...prev, feeId]);
    } else if (validAmount === 0) {
      setSelectedFees(prev => prev.filter(id => id !== feeId));
    }
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    
    if ((window as any).toast) {
      (window as any).toast({
        type: 'info',
        title: 'Processing Payment',
        message: `Processing ₹${stats.selectedFeesTotal.toLocaleString()} payment via ${paymentMethods.find(m => m.id === paymentMethod)?.name}`,
        duration: 3000
      });
    }
    
    try {
      // Check payment method and handle accordingly
      if (paymentMethod === 'cash') {
        // Process cash payment directly (existing logic)
        const { paymentsApi } = await import('@/lib/apiClient');
        const processedPayments: Array<{ fee: FeeItem; amount: number; paymentResult: any }> = [];

        for (const feeId of selectedFees) {
          const fee = filteredFees.find(f => f.id === feeId);
          if (!fee || fee.status === 'paid') continue;
          const amount = customAmounts[feeId] || (fee.amount - fee.paidAmount - (fee.discount || 0));
          const paymentResult = await paymentsApi.process({
            feeRecordId: feeId,
            amount,
            paymentMethod: paymentMethod,
            collectedBy: getCurrentUserName(),
            remarks: promoCode ? `Promo: ${promoCode}` : undefined,
          });
          processedPayments.push({ fee, amount, paymentResult });
        }

        if (processedPayments.length === 0) {
          throw new Error('No unpaid fee selected for payment');
        }

        const receiptPayload = buildLatestReceiptPayload(processedPayments);
        setLatestReceipt(receiptPayload);
        setSelectedFees([]);
        setCustomAmounts({});

        if ((window as any).toast) {
          (window as any).toast({
            type: 'success',
            title: 'Payment Successful',
            message: `Payment of ₹${stats.selectedFeesTotal.toLocaleString()} processed successfully`,
            action: { label: 'View Receipt', onClick: () => setShowReceipt(true) }
          });
        }
        
        // Call the success callback to refresh fee data
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
        
        // Send payment confirmation email asynchronously
        sendPaymentConfirmationEmail(receiptPayload, 'cash');
        
        setShowReceipt(true);
        
      } else if (paymentMethod === 'upi') {
        // Handle UPI payment with QR code
        if (!paymentGatewayEnabled || !upiId) {
          throw new Error('UPI payment is not configured. Please configure UPI ID in settings.');
        }
        
        // Generate UPI QR code
        const upiAmount = stats.selectedFeesTotal;
        const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(studentData?.name || studentData?.studentName || 'Student')}&am=${upiAmount}&cu=INR&tn=${encodeURIComponent('Fee Payment')}`;
        
        // Generate QR code (you'll need to install qrcode package)
        try {
          const QRCode = await import('qrcode');
          const qrDataUrl = await QRCode.toDataURL(upiUrl, {
            width: 256,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          setUpiQrCode(qrDataUrl);
          setShowUpiQr(true);
          
          if ((window as any).toast) {
            (window as any).toast({
              type: 'info',
              title: 'UPI QR Code Generated',
              message: 'Scan the QR code with any UPI app to complete payment.',
              duration: 5000
            });
          }
        } catch (qrError) {
          throw new Error('Failed to generate UPI QR code. Please try again.');
        }
        
        // Reset payment status when opening QR modal
        setUpiPaymentStatus('pending');
        
      } else {
        // Handle Razorpay payment for card, netbanking, wallet
        if (!paymentGatewayEnabled || !razorpayKeyId) {
          throw new Error('Online payment is not configured. Please configure Razorpay in settings.');
        }
        
        // Create Razorpay order server-side (production-ready)
        try {
          const orderResponse = await fetch('/api/razorpay/create-order', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              amount: stats.selectedFeesTotal,
              currency: 'INR',
              receipt: `fee_receipt_${studentId}_${Date.now()}`,
              notes: {
                studentId,
                studentName: studentData?.name || studentData?.studentName,
                feeIds: selectedFees,
                paymentMethod,
              }
            })
          });

          const orderData = await orderResponse.json();
          
          if (!orderData.success) {
            throw new Error(orderData.error || 'Failed to create payment order');
          }

          // Load Razorpay script
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.async = true;
          document.body.appendChild(script);
          
          script.onload = () => {
            const options = {
              key: razorpayKeyId,
              amount: orderData.order.amount,
              currency: orderData.order.currency,
              name: studentData?.name || studentData?.studentName || 'Student Fee Payment',
              description: `Fee payment for ${selectedFees.length} fees`,
              order_id: orderData.order.id, // Use server-created order
              image: '/favicon.ico',
              prefill: {
                name: studentData?.name || studentData?.studentName || '',
                email: studentData?.email || '',
                contact: studentData?.phone || ''
              },
              theme: {
                color: '#3399cc'
              },
              modal: {
                ondismiss: function() {
                  setIsProcessing(false);
                  if ((window as any).toast) {
                    (window as any).toast({
                      type: 'info',
                      title: 'Payment Cancelled',
                      message: 'Payment was cancelled by user.',
                      duration: 3000
                    });
                  }
                },
                escape: true,
                handleback: true,
              }
            };

            const rzp = new (window as any).Razorpay(options);
            
            // Handle payment success
            rzp.on('payment.success', async (response: any) => {
              try {
                // Verify payment on server (production-ready)
                const verificationResponse = await fetch('/api/razorpay/verify-payment', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    feeIds: selectedFees,
                    studentId,
                    studentData,
                    customAmounts,
                  })
                });

                const verificationData = await verificationResponse.json();
                
                if (verificationData.success && verificationData.verified) {
                  // Payment verified successfully
                  const receiptPayload = verificationData.receipt;
                  setLatestReceipt(receiptPayload);
                  setSelectedFees([]);
                  setCustomAmounts({});

                  if ((window as any).toast) {
                    (window as any).toast({
                      type: 'success',
                      title: 'Payment Successful',
                      message: `Payment of ₹${stats.selectedFeesTotal.toLocaleString()} processed successfully via Razorpay`,
                      action: { label: 'View Receipt', onClick: () => setShowReceipt(true) }
                    });
                  }
                  
                  // Call the success callback to refresh fee data
                  if (onPaymentSuccess) {
                    onPaymentSuccess();
                  }
                  
                  // Send payment confirmation email asynchronously
                  sendPaymentConfirmationEmail(receiptPayload, paymentMethod);
                  
                  setShowReceipt(true);
                } else {
                  throw new Error('Payment verification failed');
                }
                
              } catch (error: any) {
                if ((window as any).toast) {
                  (window as any).toast({
                    type: 'error',
                    title: 'Payment Processing Failed',
                    message: 'Payment was successful but verification failed. Please contact support.',
                    duration: 5000
                  });
                }
              } finally {
                setIsProcessing(false);
              }
            });
            
            // Handle payment failure
            rzp.on('payment.failed', (response: any) => {
              setIsProcessing(false);
              if ((window as any).toast) {
                (window as any).toast({
                  type: 'error',
                  title: 'Payment Failed',
                  message: `Payment failed: ${response.error.description || 'Unknown error'}`,
                  duration: 5000
                });
              }
            });

            rzp.open();
          };
          
          script.onerror = () => {
            throw new Error('Failed to load Razorpay. Please try again.');
          };
          
        } catch (orderError: any) {
          throw new Error(`Failed to create payment order: ${orderError.message}`);
        }
        
        setIsProcessing(false);
        return;
      }
      
    } catch (err: any) {
      if ((window as any).toast) {
        (window as any).toast({ type: 'error', title: 'Payment Failed', message: err.message || 'Something went wrong' });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Enhanced UI helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return colors.success;
      case 'pending': return colors.warning;
      case 'partial': return colors.primary;
      case 'overdue': return colors.danger;
      default: return colors.primary;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return colors.danger;
      case 'medium': return colors.warning;
      case 'low': return colors.success;
      default: return colors.primary;
    }
  };

  
  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push('/fees')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          isDark 
            ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700' 
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 border border-gray-300'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Fees
      </button>
      
      {/* Tab Navigation */}
      <div className={`rounded-xl border overflow-hidden ${cardCls}`}>
        <div className={`flex gap-1 p-2 border-b ${isDark ? 'border-gray-700 bg-gray-900/40' : 'border-gray-100 bg-gray-50'}`}>
          {[
            { id: 'overview', label: 'Overview', icon: <TrendingUp className="w-4 h-4" /> },
            { id: 'fees', label: 'Fee Details', icon: <DollarSign className="w-4 h-4" /> },
            { id: 'payment', label: 'Make Payment', icon: <CreditCard className="w-4 h-4" /> },
            { id: 'history', label: 'History', icon: <Clock className="w-4 h-4" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark
                    ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
                    : 'hover:bg-white text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className={`${cardCls} p-6 rounded-xl border`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${textSecondary}`}>Total Fees</p>
                    <p className={`text-2xl font-bold ${textPrimary}`}>₹{stats.totalAmount.toLocaleString()}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className={`${cardCls} p-6 rounded-xl border`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${textSecondary}`}>Paid Amount</p>
                    <p className={`text-2xl font-bold ${textPrimary}`}>₹{stats.totalPaid.toLocaleString()}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-green-900/20' : 'bg-green-50'}`}>
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className={`${cardCls} p-6 rounded-xl border`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${textSecondary}`}>Discount</p>
                    <p className={`text-2xl font-bold ${textPrimary}`}>₹{stats.totalDiscount.toLocaleString()}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-purple-900/20' : 'bg-purple-50'}`}>
                    <Award className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
              
              <div className={`${cardCls} p-6 rounded-xl border`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${textSecondary}`}>Pending</p>
                    <p className={`text-2xl font-bold ${textPrimary}`}>₹{stats.totalPending.toLocaleString()}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-yellow-900/20' : 'bg-yellow-50'}`}>
                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>
              
              <div className={`${cardCls} p-6 rounded-xl border`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${textSecondary}`}>Overdue</p>
                    <p className={`text-2xl font-bold ${textPrimary}`}>{stats.overdueFees}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-red-900/20' : 'bg-red-50'}`}>
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className={`${cardCls} p-6 rounded-xl border`}>
              <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={handleSelectAll}
                  className={`p-4 rounded-lg border transition-colors ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  <Target className="w-6 h-6 mb-2 mx-auto text-blue-600" />
                  <p className="font-medium">Select All Pending</p>
                  <p className={`text-sm ${textSecondary}`}>Select all pending fees</p>
                </button>
                
                <button
                  onClick={handleClearSelection}
                  className={`p-4 rounded-lg border transition-colors ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-white' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  <Users className="w-6 h-6 mb-2 mx-auto text-purple-600" />
                  <p className="font-medium">Clear Selection</p>
                  <p className={`text-sm ${textSecondary}`}>Clear all selections</p>
                </button>
                
                <button
                  onClick={() => setActiveTab('payment')}
                  disabled={selectedFees.length === 0}
                  className={`p-4 rounded-lg border transition-colors ${
                    selectedFees.length === 0
                      ? 'opacity-50 cursor-not-allowed'
                      : isDark 
                        ? 'bg-green-900/20 border-green-700 hover:bg-green-900/30 text-green-400' 
                        : 'bg-green-50 border-green-200 hover:bg-green-100 text-green-600'
                  }`}
                >
                  <CreditCard className="w-6 h-6 mb-2 mx-auto" />
                  <p className="font-medium">Proceed to Payment</p>
                  <p className={`text-sm ${textSecondary}`}>₹{stats.selectedFeesTotal.toLocaleString()}</p>
                </button>
              </div>
            </div>

                      </motion.div>
        )}

        {/* Fees Tab */}
        {activeTab === 'fees' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Filters and Actions */}
            <div className={`flex flex-wrap gap-4 items-center justify-between ${cardCls} p-4 rounded-xl border`}>
              <div className="flex flex-wrap gap-4">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className={`px-4 py-2 rounded-lg border ${inputCls}`}
                >
                  <option value="all">All Years</option>
                  {academicYears.map((year) => (
                    <option key={year.id} value={year.year}>
                      {year.name || year.year}
                    </option>
                  ))}
                </select>
                
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={`px-4 py-2 rounded-lg border ${inputCls}`}
                >
                  <option value="all">All Categories</option>
                  {feeCategories.map((category) => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selection Actions */}
              <div className="flex gap-2 items-center">
                {selectedFees.length > 0 && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isDark 
                      ? 'bg-green-900/30 text-green-400 border border-green-700' 
                      : 'bg-green-100 text-green-700 border border-green-300'
                  }`}>
                    {selectedFees.length} selected
                  </span>
                )}
                <button
                  onClick={handleSelectAll}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDark 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  Select All Unpaid
                </button>
                <button
                  onClick={handleClearSelection}
                  disabled={selectedFees.length === 0}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedFees.length === 0
                      ? 'opacity-50 cursor-not-allowed'
                      : isDark 
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Fee Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFees.map((fee) => {
                const isSelected = selectedFees.includes(fee.id);
                const pendingAmount = fee.amount - fee.paidAmount - (fee.discount || 0);
                
                return (
                  <motion.div
                    key={fee.id}
                    whileHover={{ scale: 1.02 }}
                    className={`${cardCls} p-6 rounded-xl border-2 cursor-pointer transition-all relative ${
                      isSelected 
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg' 
                        : fee.status === 'paid'
                          ? 'border-gray-200 dark:border-gray-700 opacity-60 cursor-not-allowed'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:shadow-md'
                    }`}
                    onClick={() => fee.status !== 'paid' && handleFeeSelection(fee.id)}
                  >
                    {/* Selection Indicator */}
                    {fee.status === 'paid' ? (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : isSelected && (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className={`font-semibold ${textPrimary}`}>{fee.name}</h3>
                        <p className={`text-sm ${textSecondary}`}>{fee.description}</p>
                      </div>
                      {fee.priority && (
                        <span
                          className={`px-2 py-1 text-xs rounded-full`}
                          style={{ backgroundColor: getPriorityColor(fee.priority) + '20', color: getPriorityColor(fee.priority) }}
                        >
                          {fee.priority}
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className={`text-sm ${textSecondary}`}>Amount:</span>
                        <span className={`font-medium ${textPrimary}`}>₹{fee.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${textSecondary}`}>Paid:</span>
                        <span className="font-medium text-green-500">₹{fee.paidAmount.toLocaleString()}</span>
                      </div>
                      {fee.discount && fee.discount > 0 && (
                        <div className="flex justify-between">
                          <span className={`text-sm ${textSecondary}`}>Discount:</span>
                          <span className="font-medium text-purple-500">-₹{fee.discount.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className={`text-sm ${textSecondary}`}>Pending:</span>
                        <span className="font-medium text-red-500">₹{pendingAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${textSecondary}`}>Status:</span>
                        <span
                          className={`px-2 py-1 text-xs rounded-full`}
                          style={{ backgroundColor: getStatusColor(fee.status) + '20', color: getStatusColor(fee.status) }}
                        >
                          {fee.status}
                        </span>
                      </div>
                      {fee.lateFee && fee.status === 'overdue' && (
                        <div className="flex justify-between">
                          <span className={`text-sm ${textSecondary}`}>Late Fee:</span>
                          <span className="text-red-600 font-medium">+₹{fee.lateFee}</span>
                        </div>
                      )}
                      
                      {/* Custom Amount Input */}
                      {fee.status !== 'paid' && (
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                          <label className={`text-xs font-medium ${textSecondary} block mb-2`}>
                            Pay Custom Amount:
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">₹</span>
                            <input
                              type="number"
                              min="0"
                              max={pendingAmount}
                              value={customAmounts[fee.id] || ''}
                              onChange={(e) => handleCustomAmountChange(fee.id, parseInt(e.target.value) || 0)}
                              onClick={(e) => e.stopPropagation()}
                              className={`flex-1 px-3 py-2 text-sm rounded-lg border ${inputCls}`}
                              placeholder={`Max: ₹${pendingAmount.toLocaleString()}`}
                            />
                          </div>
                          <p className={`text-xs mt-1 ${textSecondary}`}>
                            Max: ₹{pendingAmount.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {fee.discountAvailable && (
                      <div className={`mt-4 p-2 rounded-lg ${isDark ? 'bg-green-900/20' : 'bg-green-50'}`}>
                        <p className={`text-xs ${textSecondary}`}>Discount Available</p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Selected Fees Summary */}
            {selectedFees.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`${cardCls} p-6 rounded-xl border border-green-500 ${isDark ? 'bg-green-900/10' : 'bg-green-50'}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className={`text-lg font-semibold ${textPrimary}`}>Selected Fees</h3>
                    <p className={`text-sm ${textSecondary}`}>{selectedFees.length} fees selected</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${textPrimary}`}>₹{stats.selectedFeesTotal.toLocaleString()}</p>
                    <button
                      onClick={() => setActiveTab('payment')}
                      className={`px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors`}
                    >
                      Proceed to Payment
                    </button>
                  </div>
                </div>
                
                {/* Fee breakdown */}
                <div className="space-y-2 pt-4 border-t border-green-200 dark:border-green-800">
                  {selectedFees.map(feeId => {
                    const fee = filteredFees.find(f => f.id === feeId);
                    if (!fee) return null;
                    const customAmount = customAmounts[feeId] || (fee.amount - fee.paidAmount - (fee.discount || 0));
                    const isCustom = customAmounts[feeId] && customAmounts[feeId] !== (fee.amount - fee.paidAmount - (fee.discount || 0));
                    
                    return (
                      <div key={feeId} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <span className={textSecondary}>{fee.name}</span>
                          {isCustom && (
                            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                              Custom
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isCustom && (
                            <span className={`line-through ${textSecondary}`}>₹{fee.amount.toLocaleString()}</span>
                          )}
                          <span className={`font-medium ${textPrimary}`}>₹{customAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Payment Tab */}
        {activeTab === 'payment' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-6"
          >
            {/* Payment Methods */}
            <div className={`${cardCls} p-6 rounded-xl border`}>
              <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Select Payment Method</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentMethods.map((method) => {
                  const isExternalPayment = method.id !== 'cash';
                  const isConfigured = paymentGatewayEnabled && (method.id === 'upi' ? upiId : razorpayKeyId);
                  
                  return (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      disabled={isExternalPayment && !isConfigured}
                      className={`p-4 rounded-lg border transition-all ${
                        paymentMethod === method.id
                          ? 'border-blue-500 ring-2 ring-blue-500/20'
                          : cardCls
                      } ${isExternalPayment && !isConfigured ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: method.color + '20' }}
                        >
                          {method.icon}
                        </div>
                        <div className="text-left">
                          <p className={`font-medium ${textPrimary}`}>{method.name}</p>
                          <p className={`text-sm ${textSecondary}`}>{method.description}</p>
                          {method.fee && (
                            <p className={`text-xs ${textSecondary}`}>Processing fee: ₹{method.fee}</p>
                          )}
                          {isExternalPayment && (
                            <div className="mt-1">
                              {isConfigured ? (
                                <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-full">
                                  {method.id === 'upi' ? '→ Generate UPI QR' : '→ Redirect to Razorpay'}
                                </span>
                              ) : (
                                <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full">
                                  ⚠️ Not Configured
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment Summary */}
            <div className={`${cardCls} p-6 rounded-xl border`}>
              <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Payment Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className={`${textSecondary}`}>Selected Fees:</span>
                  <span className={`${textPrimary}`}>{selectedFees.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`${textSecondary}`}>Subtotal:</span>
                  <span className={`${textPrimary}`}>₹{stats.selectedFeesTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`${textSecondary}`}>Processing Fee:</span>
                  <span className={`${textPrimary}`}>₹{paymentMethods.find(m => m.id === paymentMethod)?.fee || 0}</span>
                </div>
                <div className={`pt-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex justify-between">
                    <span className={`font-semibold ${textPrimary}`}>Total Amount:</span>
                    <span className={`font-bold text-xl ${textPrimary}`}>
                      ₹{(stats.selectedFeesTotal + (paymentMethods.find(m => m.id === paymentMethod)?.fee || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Promo Code */}
            <div className={`${cardCls} p-6 rounded-xl border`}>
              <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Promo Code</h3>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Enter promo code"
                  className={`flex-1 px-4 py-2 rounded-lg border ${inputCls}`}
                />
                <button
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    isDark 
                      ? 'bg-gray-800 hover:bg-gray-700 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePayment}
              disabled={isProcessing || selectedFees.length === 0 || (paymentMethod !== 'cash' && (!paymentGatewayEnabled || (paymentMethod === 'upi' ? !upiId : !razorpayKeyId)))}
              className={`w-full py-4 rounded-lg font-medium transition-colors ${
                isProcessing || selectedFees.length === 0 || (paymentMethod !== 'cash' && (!paymentGatewayEnabled || (paymentMethod === 'upi' ? !upiId : !razorpayKeyId)))
                  ? 'opacity-50 cursor-not-allowed bg-gray-400'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isProcessing ? 'Processing...' : (
                paymentMethod === 'cash' 
                  ? `Pay ₹${(stats.selectedFeesTotal + (paymentMethods.find(m => m.id === paymentMethod)?.fee || 0)).toLocaleString()}`
                  : paymentMethod === 'upi'
                    ? `Generate UPI QR - ₹${(stats.selectedFeesTotal + (paymentMethods.find(m => m.id === paymentMethod)?.fee || 0)).toLocaleString()}`
                    : `Redirect to Razorpay - ₹${(stats.selectedFeesTotal + (paymentMethods.find(m => m.id === paymentMethod)?.fee || 0)).toLocaleString()}`
              )}
            </button>
          </motion.div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Search + Print All */}
            <div className={`flex flex-wrap gap-3 items-center justify-between ${cardCls} p-4 rounded-xl border`}>
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search by fee name, receipt no, method..."
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border text-sm ${inputCls}`}
                />
              </div>
              <button
                onClick={() => window.print()}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                  isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
              >
                🖨️ Print All
              </button>
            </div>

            {/* Payment history entries */}
            {(() => {
              // Use optimized payment history data if available, otherwise fall back to feeRecords
              if (loadingPaymentHistory) {
                return (
                  <div className={`${cardCls} p-10 rounded-xl border text-center`}>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className={`${textPrimary} mt-4`}>Loading payment history...</p>
                  </div>
                );
              }

              const entries: any[] = paymentHistoryData?.payments?.map((payment: any) => ({
                id: payment.id,
                feeRecordId: payment.feeRecordId,
                feeName: payment.feeName || 'Fee',
                feeCategory: payment.feeCategory || 'General',
                academicYear: payment.academicYear || '',
                amount: payment.amount || 0,
                totalAmount: payment.feeAmount || 0,
                feeAmount: payment.feeAmount || 0,
                feeDiscount: payment.feeDiscount || 0,
                feePendingAmount: payment.feePendingAmount,
                feeStatus: payment.feeStatus,
                cumulativePaid: payment.amount || 0, // Will be calculated when receipt is clicked
                paymentMethod: payment.paymentMethod || 'cash',
                paymentDate: payment.paymentDate || payment.createdAt || '',
                receiptNumber: payment.receiptNumber || '',
                collectedBy: payment.collectedBy || 'Staff',
                transactionId: payment.transactionId || '',
                remarks: payment.remarks || '',
                status: 'paid',
              })) || [];

              const filteredEntries = entries
                .filter(e => {
                  const q = historySearch.toLowerCase();
                  return !q || e.feeName.toLowerCase().includes(q)
                    || e.receiptNumber.toLowerCase().includes(q)
                    || (e.paymentMethod || '').toLowerCase().includes(q)
                    || (e.collectedBy || '').toLowerCase().includes(q);
                })
                .sort((a, b) => {
                  // Sort by date descending (newest first)
                  const dateA = new Date(a.paymentDate || 0).getTime();
                  const dateB = new Date(b.paymentDate || 0).getTime();
                  return dateB - dateA;
                });

              if (filteredEntries.length === 0) {
                return (
                  <div className={`${cardCls} p-10 rounded-xl border text-center`}>
                    <p className={`text-4xl mb-3`}>📭</p>
                    <p className={`${textPrimary} font-medium`}>No payment history found</p>
                    <p className={`text-sm ${textSecondary} mt-1`}>{historySearch ? 'Try a different search term' : 'No paid fees yet'}</p>
                  </div>
                );
              }

              return (
                <div className={`${cardCls} rounded-xl border overflow-hidden`}>
                  <table className="w-full text-sm">
                    <thead className={`${isDark ? 'bg-gray-800' : 'bg-gray-50'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      <tr>
                        {['Receipt No.', 'Fee Name', 'AY', 'Amount', 'Method', 'Received By', 'Date', 'Action'].map(h => (
                          <th key={h} className={`px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide ${textSecondary}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {filteredEntries.map((entry, i) => (
                        <tr key={entry.id} className={`${
                          i % 2 === 0 ? (isDark ? 'bg-gray-900' : 'bg-white') : (isDark ? 'bg-gray-800/50' : 'bg-gray-50/50')
                        } hover:${isDark ? 'bg-gray-700' : 'bg-blue-50/30'} transition-colors`}>
                          <td className="px-4 py-3">
                            <span className={`font-mono text-xs px-2 py-1 rounded ${isDark ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                              {entry.receiptNumber}
                            </span>
                          </td>
                          <td className={`px-4 py-3 font-medium ${textPrimary}`}>
                            {entry.feeName}
                            {entry.academicYear && <span className={`block text-xs ${textSecondary}`}>{entry.academicYear}</span>}
                          </td>
                          <td className={`px-4 py-3 ${textSecondary}`}>{entry.academicYear || '-'}</td>
                          <td className={`px-4 py-3 font-semibold text-green-600`}>₹{Number(entry.amount).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                              entry.paymentMethod === 'cash'
                                ? isDark ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700'
                                : entry.paymentMethod === 'online'
                                  ? isDark ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700'
                                  : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {entry.paymentMethod || 'cash'}
                            </span>
                          </td>
                          <td className={`px-4 py-3 ${textSecondary}`}>
                            <div className="flex items-center gap-1">
                              <span>👤</span>
                              <span>{entry.collectedBy || 'Staff'}</span>
                            </div>
                          </td>
                          <td className={`px-4 py-3 ${textSecondary} text-xs`}>
                            {entry.paymentDate
                              ? new Date(entry.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                              : '-'}
                            {entry.paymentDate && (
                              <span className="block opacity-60">
                                {new Date(entry.paymentDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => {
                                // Calculate cumulative paid amount up to this payment's date
                                const paymentDate = new Date(entry.paymentDate);
                                const cumulativePaid = paymentHistoryData?.payments
                                  ?.filter((p: any) => {
                                    const pDate = new Date(p.paymentDate);
                                    return pDate <= paymentDate && p.feeRecordId === entry.feeRecordId;
                                  })
                                  .reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || entry.amount;
                                
                                setSelectedHistoryEntry({
                                  ...entry,
                                  cumulativePaid: cumulativePaid
                                });
                                setShowHistoryReceipt(true);
                              }}
                              title="View Receipt"
                              className={`p-1.5 rounded-lg text-sm transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                            >
                              🧾
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className={`px-4 py-3 border-t ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'} text-sm ${textSecondary}`}>
                    {filteredEntries.length} transaction{filteredEntries.length !== 1 ? 's' : ''} &nbsp;·&nbsp;
                    Total paid: <span className="font-semibold text-green-600">₹{filteredEntries.reduce((s, e) => s + Number(e.amount), 0).toLocaleString()}</span>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </div>

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowReceipt(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`${cardCls} p-6 rounded-xl max-w-md w-full`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className={`text-xl font-bold ${textPrimary} mb-2`}>Payment Successful!</h3>
                <p className={`${textSecondary} mb-6`}>Your payment has been processed successfully.</p>
                
                {/* Receipt Actions */}
                <div className="space-y-3 mb-6">
                  <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <p className={`text-sm ${textSecondary} mb-2`}>Receipt Number</p>
                    <p className={`font-mono font-bold ${textPrimary}`}>{latestReceipt?.receiptNumber || 'Receipt Ready'}</p>
                  </div>
                  <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <p className={`text-sm ${textSecondary} mb-1`}>Amount Paid</p>
                    <p className={`text-2xl font-bold ${textPrimary}`}>₹{(latestReceipt?.paymentData?.currentYearFees || []).reduce((sum: number, item: any) => sum + Number(item.amountPaid || item.paidAmount || 0), 0).toLocaleString()}</p>
                    <p className={`text-sm ${textSecondary}`}>via {paymentMethods.find(m => m.id === latestReceipt?.paymentMethod)?.name || paymentMethods.find(m => m.id === paymentMethod)?.name}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setShowReceipt(false);
                        setShowDetailedReceipt(true);
                      }}
                      className={`px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View Detailed Receipt
                    </button>
                    <button
                      onClick={() => {
                        setShowReceipt(false);
                        setShowDetailedReceipt(true);
                      }}
                      className={`px-4 py-3 ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${textPrimary} rounded-lg font-medium transition-colors flex items-center justify-center gap-2`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Quick Print
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowReceipt(false)}
                  className={`w-full mt-3 px-6 py-3 ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} ${textPrimary} rounded-lg font-medium transition-colors`}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detailed Receipt Modal */}
      <AnimatePresence>
        {showDetailedReceipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full h-full max-w-6xl max-h-[90vh] overflow-hidden rounded-xl"
            >
              <div className="rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Fee Receipt</h3>
                  <button
                    onClick={() => setShowDetailedReceipt(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <PaymentReceipt
                  theme={theme}
                  studentData={latestReceipt?.studentData || buildReceiptStudentData()}
                  paymentData={latestReceipt?.paymentData || { currentYearFees: [] }}
                  receiptNumber={latestReceipt?.receiptNumber || 'Receipt'}
                  paymentDate={latestReceipt?.paymentDate || new Date().toISOString()}
                  paymentMethod={latestReceipt?.paymentMethod || paymentMethod}
                  onDownload={() => {
                    const receiptNum = latestReceipt?.receiptNumber || 'Receipt';
                    const filename = `Receipt_${receiptNum.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
                    PDFGenerator.generateFromElement('receipt-print', filename);
                  }}
                  onClose={() => setShowDetailedReceipt(false)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Receipt Modal */}
      <AnimatePresence>
        {showHistoryReceipt && selectedHistoryEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-[900px] max-h-[90vh] overflow-hidden rounded-xl"
            >
              <div className="rounded-lg p-0 w-full max-w-[900px] max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Receipt</h3>
                  <button
                    onClick={() => setShowHistoryReceipt(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <PaymentReceipt
                  theme={theme}
                  studentData={buildReceiptStudentData(selectedHistoryEntry.collectedBy || 'Accounts Department')}
                  paymentData={{
                    currentYearFees: [(() => {
                      const matchedRecord = (studentData?.feeRecords || []).find((record: any) => record.id === selectedHistoryEntry.feeRecordId);
                      const recordDiscount = Number(selectedHistoryEntry.feeDiscount ?? matchedRecord?.discount ?? 0);
                      const totalAmount = Number(selectedHistoryEntry.feeAmount || matchedRecord?.amount || selectedHistoryEntry.amount || 0);
                      const balance = selectedHistoryEntry.feePendingAmount !== undefined && selectedHistoryEntry.feePendingAmount !== null
                        ? Number(selectedHistoryEntry.feePendingAmount || 0)
                        : Math.max(0, totalAmount - Number(selectedHistoryEntry.cumulativePaid || selectedHistoryEntry.amount || 0) - recordDiscount);

                      return {
                        id: selectedHistoryEntry.id,
                        name: selectedHistoryEntry.feeName || matchedRecord?.feeStructure?.name || 'Fee',
                        category: selectedHistoryEntry.feeCategory || matchedRecord?.feeStructure?.category || 'General',
                        academicYear: selectedHistoryEntry.academicYear || matchedRecord?.academicYear || new Date().getFullYear().toString(),
                        totalAmount,
                        amountPaid: Number(selectedHistoryEntry.amount || 0),
                        paidAmount: Number(selectedHistoryEntry.amount || 0),
                        discount: recordDiscount,
                        balance,
                        status: selectedHistoryEntry.feeStatus || (balance <= 0 ? 'paid' : 'partial'),
                        receiptNumber: selectedHistoryEntry.receiptNumber,
                        transactionId: selectedHistoryEntry.transactionId,
                        remarks: selectedHistoryEntry.remarks,
                        paymentDate: selectedHistoryEntry.paymentDate,
                      };
                    })()],
                    statementRecords: studentData?.feeRecords || [],
                    includedReceiptNumbers: [selectedHistoryEntry.receiptNumber].filter(Boolean)
                  }}
                  receiptNumber={selectedHistoryEntry.receiptNumber}
                  paymentDate={selectedHistoryEntry.paymentDate}
                  paymentMethod={selectedHistoryEntry.paymentMethod}
                  onDownload={() => {
                    const receiptNum = selectedHistoryEntry.receiptNumber;
                    const filename = `Receipt_${receiptNum.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
                    PDFGenerator.generateFromElement('receipt-print', filename);
                  }}
                  onClose={() => setShowHistoryReceipt(false)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* UPI QR Code Modal */}
        <AnimatePresence>
          {showUpiQr && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000]"
              onClick={() => setShowUpiQr(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`relative w-full max-w-md mx-4 ${cardCls} rounded-2xl border shadow-2xl`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
                        <QrCode className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <div>
                        <h3 className={`text-xl font-bold ${textPrimary}`}>UPI Payment</h3>
                        <p className={`text-sm ${textSecondary}`}>Scan QR to pay</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowUpiQr(false)}
                      className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="text-center space-y-4">
                    <div className="bg-white p-4 rounded-xl inline-block relative">
                      {upiQrCode && (
                        <img 
                          src={upiQrCode} 
                          alt="UPI QR Code" 
                          className="w-64 h-64"
                        />
                      )}
                      {upiPaymentStatus === 'checking' && (
                        <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-xl">
                          <div className="text-center">
                            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <p className="text-gray-600">Confirming payment...</p>
                          </div>
                        </div>
                      )}
                      {upiPaymentStatus === 'confirmed' && (
                        <div className="absolute inset-0 bg-green-50/90 flex items-center justify-center rounded-xl">
                          <div className="text-center">
                            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-2" />
                            <p className="text-green-600 font-semibold">Payment Confirmed!</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <p className={`text-lg font-semibold ${textPrimary}`}>
                        Amount: ₹{stats.selectedFeesTotal.toLocaleString()}
                      </p>
                      <p className={`text-sm ${textSecondary}`}>
                        Pay to: {upiId}
                      </p>
                      <p className={`text-xs ${textSecondary}`}>
                        Scan with any UPI app (PhonePe, PayTM, Google Pay, etc.)
                      </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                      {upiPaymentStatus === 'pending' && (
                        <>
                          <button
                            onClick={() => {
                              // Copy UPI link to clipboard
                              const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(studentData?.name || studentData?.studentName || 'Student')}&am=${stats.selectedFeesTotal}&cu=INR&tn=${encodeURIComponent('Fee Payment')}`;
                              navigator.clipboard.writeText(upiUrl);
                              if ((window as any).toast) {
                                (window as any).toast({
                                  type: 'success',
                                  title: 'UPI Link Copied',
                                  message: 'UPI payment link copied to clipboard',
                                  duration: 3000
                                });
                              }
                            }}
                            className="flex-1 py-2 px-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
                          >
                            Copy UPI Link
                          </button>
                          <button
                            onClick={handleShareQrCode}
                            disabled={sharingQr}
                            className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {sharingQr ? 'Sharing...' : 'Share QR'}
                          </button>
                          <button
                            onClick={handleUpiPaymentConfirmation}
                            disabled={checkingPayment}
                            className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {checkingPayment ? 'Confirming...' : 'Mark as Paid'}
                          </button>
                        </>
                      )}
                      {upiPaymentStatus === 'confirmed' && (
                        <button
                          onClick={() => {
                            setShowUpiQr(false);
                            setShowReceipt(true);
                          }}
                          className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        >
                          View Receipt
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </AnimatePresence>
    </div>
  </div>
);
}
