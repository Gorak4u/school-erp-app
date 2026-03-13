// @ts-nocheck
import { FeeStructure, FeeRecord, StudentFeeSummary, FeeCollection, Discount } from '../types';

export function createFeeDataHandlers(ctx: any) {
  const { discounts, feeRecords, feeStructures, setDiscounts, setFeeCollections, setFeeRecords, setFeeStructures, setIsClient, setStudentFeeSummaries, theme } = ctx;

  // Function to calculate fee summaries for all students
  const calculateStudentFeeSummaries = (students: any[], records: FeeRecord[]): StudentFeeSummary[] => {
    return students.map(student => {
      const studentRecords = records.filter(record => record.studentId === student.id);
      
      const totalFees = studentRecords.reduce((sum, record) => sum + record.amount, 0);
      const totalPaid = studentRecords.reduce((sum, record) => sum + record.paidAmount, 0);
      const totalPending = studentRecords.reduce((sum, record) => sum + record.pendingAmount, 0);
      const totalOverdue = studentRecords
        .filter(record => record.status === 'overdue')
        .reduce((sum, record) => sum + record.pendingAmount, 0);
      
      const lastPaymentDate = studentRecords
        .filter(record => record.paidDate)
        .sort((a, b) => new Date(b.paidDate!).getTime() - new Date(a.paidDate!).getTime())[0]?.paidDate;
      
      let paymentStatus: 'fully_paid' | 'partially_paid' | 'no_payment' | 'overdue';
      if (totalOverdue > 0) {
        paymentStatus = 'overdue';
      } else if (totalPaid === 0) {
        paymentStatus = 'no_payment';
      } else if (totalPaid >= totalFees) {
        paymentStatus = 'fully_paid';
      } else {
        paymentStatus = 'partially_paid';
      }
      
      // Calculate discount (simplified - in real app would be based on discount rules)
      const discountApplied = Math.floor(Math.random() * 500);
      const netPayable = totalFees - discountApplied;
      
      return {
        studentId: student.id,
        studentName: student.name,
        studentClass: student.class,
        rollNo: student.rollNo,
        totalFees,
        totalPaid,
        totalPending,
        totalOverdue,
        feeRecords: studentRecords,
        lastPaymentDate,
        paymentStatus,
        discountApplied,
        netPayable
      };
    });
  };

  // Calculate statistics
  const calculateStatistics = () => {
    const totalFees = feeStructures.reduce((sum, fee) => sum + fee.amount, 0);
    const collectedFees = feeRecords
      .filter(record => record.status === 'paid')
      .reduce((sum, record) => sum + record.paidAmount, 0);
    const pendingFees = feeRecords
      .filter(record => record.status === 'pending' || record.status === 'overdue')
      .reduce((sum, record) => sum + record.pendingAmount, 0);
    const overdueFees = feeRecords
      .filter(record => record.status === 'overdue')
      .reduce((sum, record) => sum + record.pendingAmount, 0);

    return {
      totalFees,
      collectedFees,
      pendingFees,
      overdueFees,
      collectionRate: totalFees > 0 ? (collectedFees / totalFees) * 100 : 0
    };
  };

  const stats = calculateStatistics();

  // Chart data preparations
  const prepareMonthlyCollectionData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      labels: months,
      datasets: [
        {
          label: 'Monthly Collections',
          data: [45000, 52000, 48000, 55000, 58000, 60000, 62000, 65000, 63000, 61000, 59000, 57000],
          borderColor: theme === 'dark' ? '#3B82F6' : '#2563EB',
          backgroundColor: theme === 'dark' ? '#3B82F620' : '#2563EB20',
          tension: 0.4
        }
      ]
    };
  };

  const prepareFeeCategoryData = () => {
    return {
      labels: ['Tuition', 'Transport', 'Lab', 'Exam', 'Other'],
      datasets: [
        {
          data: [60, 20, 10, 7, 3],
          backgroundColor: [
            '#3B82F6',
            '#10B981',
            '#F59E0B',
            '#EF4444',
            '#8B5CF6'
          ]
        }
      ]
    };
  };

  const preparePaymentMethodData = () => {
    return {
      labels: ['Online', 'Cash', 'Cheque', 'Bank Transfer'],
      datasets: [
        {
          data: [45, 30, 15, 10],
          backgroundColor: [
            '#3B82F6',
            '#10B981',
            '#F59E0B',
            '#EF4444'
          ]
        }
      ]
    };
  };

  return { calculateStatistics, calculateStudentFeeSummaries, prepareFeeCategoryData, prepareMonthlyCollectionData, preparePaymentMethodData, stats };
}
