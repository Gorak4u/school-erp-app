// @ts-nocheck
import { FeeStructure, FeeRecord, StudentFeeSummary, FeeCollection, Discount } from '../types';

export function createFeeDataHandlers(ctx: any) {
  const { discounts, feeRecords, feeStructures, setDiscounts, setFeeCollections, setFeeRecords, setFeeStructures, setIsClient, setStudentFeeSummaries, theme } = ctx;

  const initializeMockData = () => {
    // Mock fee structures
    const mockFeeStructures: FeeStructure[] = [
      {
        id: '1',
        name: 'Tuition Fee',
        category: 'tuition',
        amount: 5000,
        frequency: 'monthly',
        dueDate: 5,
        lateFee: 100,
        description: 'Monthly tuition fee for all classes',
        applicableClasses: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        applicableCategories: ['General', 'OBC', 'SC', 'ST'],
        isActive: true,
        createdAt: '2024-01-01'
      },
      {
        id: '2',
        name: 'Transport Fee',
        category: 'transport',
        amount: 1500,
        frequency: 'monthly',
        dueDate: 10,
        lateFee: 50,
        description: 'Monthly transport fee for bus service',
        applicableClasses: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        applicableCategories: ['General', 'OBC', 'SC', 'ST'],
        isActive: true,
        createdAt: '2024-01-01'
      },
      {
        id: '3',
        name: 'Lab Fee',
        category: 'lab',
        amount: 500,
        frequency: 'monthly',
        dueDate: 15,
        lateFee: 25,
        description: 'Lab fee for science students',
        applicableClasses: ['9', '10', '11', '12'],
        applicableCategories: ['General', 'OBC', 'SC', 'ST'],
        isActive: true,
        createdAt: '2024-01-01'
      },
      {
        id: '4',
        name: 'Annual Exam Fee',
        category: 'exam',
        amount: 2000,
        frequency: 'yearly',
        dueDate: 1,
        lateFee: 200,
        description: 'Annual examination fee',
        applicableClasses: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        applicableCategories: ['General', 'OBC', 'SC', 'ST'],
        isActive: true,
        createdAt: '2024-01-01'
      }
    ];

    // Mock students data
    const mockStudents = [
      { id: '1', name: 'Rahul Kumar', class: '10A', rollNo: '101' },
      { id: '2', name: 'Priya Sharma', class: '9B', rollNo: '201' },
      { id: '3', name: 'Amit Singh', class: '11A', rollNo: '301' },
      { id: '4', name: 'Sneha Patel', class: '12B', rollNo: '401' },
      { id: '5', name: 'Vikram Reddy', class: '8C', rollNo: '501' },
      { id: '6', name: 'Anjali Gupta', class: '7A', rollNo: '601' },
      { id: '7', name: 'Rohit Sharma', class: '10B', rollNo: '102' },
      { id: '8', name: 'Kavita Singh', class: '9A', rollNo: '202' },
      { id: '9', name: 'Arjun Kumar', class: '11B', rollNo: '302' },
      { id: '10', name: 'Divya Reddy', class: '12A', rollNo: '402' },
      { id: '11', name: 'Mohammed Ali', class: '8A', rollNo: '502' },
      { id: '12', name: 'Fatima Begum', class: '7B', rollNo: '602' },
      { id: '13', name: 'Rajesh Kumar', class: '6C', rollNo: '701' },
      { id: '14', name: 'Meera Patel', class: '5A', rollNo: '801' },
      { id: '15', name: 'Sanjay Singh', class: '4B', rollNo: '901' }
    ];

    // Generate comprehensive fee records for all students
    const mockFeeRecords: FeeRecord[] = [];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    mockStudents.forEach(student => {
      // Tuition fee records for each student
      const tuitionDueDate = new Date(currentYear, currentMonth, 5);
      const random = Math.random();
      let tuitionStatus: 'paid' | 'pending' | 'overdue' | 'partial';
      let tuitionPaid: number;
      
      if (random > 0.6) {
        tuitionStatus = 'paid';
        tuitionPaid = 5000;
      } else if (random > 0.3) {
        tuitionStatus = 'partial';
        tuitionPaid = Math.floor(Math.random() * 3000) + 1000;
      } else if (random > 0.15) {
        tuitionStatus = 'pending';
        tuitionPaid = 0;
      } else {
        tuitionStatus = 'overdue';
        tuitionPaid = 0;
      }
      
      mockFeeRecords.push({
        id: `tuition_${student.id}`,
        studentId: student.id,
        studentName: student.name,
        studentClass: student.class,
        feeStructureId: '1',
        feeStructureName: 'Tuition Fee',
        amount: 5000,
        paidAmount: tuitionPaid,
        pendingAmount: 5000 - tuitionPaid,
        dueDate: tuitionDueDate.toISOString().split('T')[0],
        paidDate: tuitionStatus === 'paid' ? new Date(currentYear, currentMonth, Math.floor(Math.random() * 5) + 1).toISOString().split('T')[0] : undefined,
        status: tuitionStatus as any,
        paymentMethod: tuitionStatus === 'paid' ? ['cash', 'online', 'cheque'][Math.floor(Math.random() * 3)] as any : undefined,
        transactionId: tuitionStatus === 'paid' ? `TXN${Math.random().toString(36).substr(2, 9).toUpperCase()}` : undefined,
        receiptNumber: tuitionStatus === 'paid' ? `RCP${currentYear}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}` : undefined,
        collectedBy: 'Admin',
        createdAt: '2024-01-01'
      });

      // Transport fee for some students (70% take transport)
      if (Math.random() > 0.3) {
        const transportDueDate = new Date(currentYear, currentMonth, 10);
        const transportStatus = Math.random() > 0.2 ? 'paid' : 'pending';
        const transportPaid = transportStatus === 'paid' ? 1500 : 0;
        
        mockFeeRecords.push({
          id: `transport_${student.id}`,
          studentId: student.id,
          studentName: student.name,
          studentClass: student.class,
          feeStructureId: '2',
          feeStructureName: 'Transport Fee',
          amount: 1500,
          paidAmount: transportPaid,
          pendingAmount: 1500 - transportPaid,
          dueDate: transportDueDate.toISOString().split('T')[0],
          paidDate: transportStatus === 'paid' ? new Date(currentYear, currentMonth, Math.floor(Math.random() * 10) + 6).toISOString().split('T')[0] : undefined,
          status: transportStatus as any,
          paymentMethod: transportStatus === 'paid' ? 'cash' as any : undefined,
          transactionId: transportStatus === 'paid' ? `TXN${Math.random().toString(36).substr(2, 9).toUpperCase()}` : undefined,
          receiptNumber: transportStatus === 'paid' ? `RCP${currentYear}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}` : undefined,
          collectedBy: 'Admin',
          createdAt: '2024-01-01'
        });
      }

      // Lab fee for science students (classes 9-12)
      if (['9', '10', '11', '12'].includes(student.class.charAt(0))) {
        const labDueDate = new Date(currentYear, currentMonth, 15);
        const labStatus = Math.random() > 0.4 ? 'paid' : 'pending';
        const labPaid = labStatus === 'paid' ? 500 : 0;
        
        mockFeeRecords.push({
          id: `lab_${student.id}`,
          studentId: student.id,
          studentName: student.name,
          studentClass: student.class,
          feeStructureId: '3',
          feeStructureName: 'Lab Fee',
          amount: 500,
          paidAmount: labPaid,
          pendingAmount: 500 - labPaid,
          dueDate: labDueDate.toISOString().split('T')[0],
          paidDate: labStatus === 'paid' ? new Date(currentYear, currentMonth, Math.floor(Math.random() * 15) + 11).toISOString().split('T')[0] : undefined,
          status: labStatus as any,
          paymentMethod: labStatus === 'paid' ? 'online' as any : undefined,
          transactionId: labStatus === 'paid' ? `TXN${Math.random().toString(36).substr(2, 9).toUpperCase()}` : undefined,
          receiptNumber: labStatus === 'paid' ? `RCP${currentYear}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}` : undefined,
          collectedBy: 'Admin',
          createdAt: '2024-01-01'
        });
      }

      // Annual exam fee (once per year)
      if (currentMonth === 0) { // January
        const examDueDate = new Date(currentYear, 0, 1);
        const examStatus = Math.random() > 0.2 ? 'paid' : 'pending';
        const examPaid = examStatus === 'paid' ? 2000 : 0;
        
        mockFeeRecords.push({
          id: `exam_${student.id}`,
          studentId: student.id,
          studentName: student.name,
          studentClass: student.class,
          feeStructureId: '4',
          feeStructureName: 'Annual Exam Fee',
          amount: 2000,
          paidAmount: examPaid,
          pendingAmount: 2000 - examPaid,
          dueDate: examDueDate.toISOString().split('T')[0],
          paidDate: examStatus === 'paid' ? new Date(currentYear, 0, Math.floor(Math.random() * 31) + 1).toISOString().split('T')[0] : undefined,
          status: examStatus as any,
          paymentMethod: examStatus === 'paid' ? ['cash', 'online'][Math.floor(Math.random() * 2)] as any : undefined,
          transactionId: examStatus === 'paid' ? `TXN${Math.random().toString(36).substr(2, 9).toUpperCase()}` : undefined,
          receiptNumber: examStatus === 'paid' ? `RCP${currentYear}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}` : undefined,
          collectedBy: 'Admin',
          createdAt: '2024-01-01'
        });
      }
    });

    // Mock collections
    const mockCollections: FeeCollection[] = [
      {
        id: '1',
        date: '2024-03-01',
        totalAmount: 15000,
        cashAmount: 5000,
        onlineAmount: 8000,
        chequeAmount: 2000,
        bankTransferAmount: 0,
        transactionCount: 8,
        collectedBy: 'Admin',
        status: 'completed'
      },
      {
        id: '2',
        date: '2024-03-02',
        totalAmount: 12000,
        cashAmount: 3000,
        onlineAmount: 7000,
        chequeAmount: 1000,
        bankTransferAmount: 1000,
        transactionCount: 6,
        collectedBy: 'Admin',
        status: 'completed'
      }
    ];

    // Mock discounts
    const mockDiscounts: Discount[] = [
      {
        id: '1',
        name: 'Sibling Discount',
        type: 'percentage',
        value: 10,
        applicableClasses: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        applicableCategories: ['General', 'OBC', 'SC', 'ST'],
        maxDiscountAmount: 1000,
        isActive: true,
        validFrom: '2024-01-01',
        validTo: '2024-12-31',
        description: '10% discount for siblings'
      },
      {
        id: '2',
        name: 'Merit Scholarship',
        type: 'fixed',
        value: 2000,
        applicableClasses: ['9', '10', '11', '12'],
        applicableCategories: ['General', 'OBC', 'SC', 'ST'],
        isActive: true,
        validFrom: '2024-01-01',
        validTo: '2024-12-31',
        description: 'Fixed scholarship for meritorious students'
      }
    ];

    setFeeStructures(mockFeeStructures);
    setFeeRecords(mockFeeRecords);
    setFeeCollections(mockCollections);
    setDiscounts(mockDiscounts);
    
    // Calculate student fee summaries
    const summaries = calculateStudentFeeSummaries(mockStudents, mockFeeRecords);
    setStudentFeeSummaries(summaries);
  };

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


  return { calculateStatistics, calculateStudentFeeSummaries, initializeMockData, prepareFeeCategoryData, prepareMonthlyCollectionData, preparePaymentMethodData, stats };
}
