// @ts-nocheck
import { FeeStructure, FeeRecord, StudentFeeSummary, FeeCollection, Discount } from '../types';

export function createFeeActionHandlers(ctx: any) {
  const { collectionForm, feeRecords, feeStructureForm, feeStructures, isClient, searchTerm, selectedClass, selectedStatus, setCollectionForm, setFeeRecords, setFeeStructureForm, setFeeStructures, setShowCollectionModal, setShowFeeStructureModal, studentFeeSummaries } = ctx;

  // Filter functions
  const filteredFeeRecords = feeRecords.filter(record => {
    const matchesClass = selectedClass === 'all' || record.studentClass.includes(selectedClass);
    const matchesStatus = selectedStatus === 'all' || record.status === selectedStatus;
    const matchesSearch = record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.feeStructureName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesClass && matchesStatus && matchesSearch;
  });

  const filteredStudentSummaries = studentFeeSummaries.filter((student: StudentFeeSummary) => {
    const matchesClass = selectedClass === 'all' || student.studentClass.includes(selectedClass);
    const matchesStatus = selectedStatus === 'all' || student.paymentStatus === selectedStatus;
    const matchesSearch = student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.rollNo.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesClass && matchesStatus && matchesSearch;
  });

  // Export functions
  const exportFeeRecords = () => {
    const csvContent = [
      ['Student Name', 'Class', 'Fee Type', 'Amount', 'Paid', 'Pending', 'Due Date', 'Status', 'Payment Method'],
      ...filteredFeeRecords.map(record => [
        record.studentName,
        record.studentClass,
        record.feeStructureName,
        record.amount,
        record.paidAmount,
        record.pendingAmount,
        record.dueDate,
        record.status,
        record.paymentMethod || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fee_records_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Handler functions
  const handleCreateFeeStructure = () => {
    const newFeeStructure: FeeStructure = {
      id: Date.now().toString(),
      name: feeStructureForm.name || '',
      category: feeStructureForm.category || 'tuition',
      amount: feeStructureForm.amount || 0,
      frequency: feeStructureForm.frequency || 'monthly',
      dueDate: feeStructureForm.dueDate || 1,
      lateFee: feeStructureForm.lateFee || 0,
      description: feeStructureForm.description || '',
      applicableClasses: feeStructureForm.applicableClasses || [],
      applicableCategories: feeStructureForm.applicableCategories || [],
      isActive: feeStructureForm.isActive || true,
      createdAt: new Date().toISOString()
    };

    setFeeStructures([...feeStructures, newFeeStructure]);
    setShowFeeStructureModal(false);
    setFeeStructureForm({
      name: '',
      category: 'tuition',
      amount: 0,
      frequency: 'monthly',
      dueDate: 1,
      lateFee: 0,
      description: '',
      applicableClasses: [],
      applicableCategories: [],
      isActive: true
    });
  };

  const handleCollectFee = () => {
    const newRecord: FeeRecord = {
      id: Date.now().toString(),
      studentId: collectionForm.studentId,
      studentName: 'Student Name', // This would come from student data
      studentClass: '10A',
      feeStructureId: collectionForm.feeStructureId,
      feeStructureName: feeStructures.find(f => f.id === collectionForm.feeStructureId)?.name || '',
      amount: collectionForm.amount,
      paidAmount: collectionForm.amount,
      pendingAmount: 0,
      dueDate: new Date().toISOString(),
      paidDate: new Date().toISOString(),
      status: 'paid',
      paymentMethod: collectionForm.paymentMethod,
      transactionId: collectionForm.transactionId,
      receiptNumber: `RCP${Date.now()}`,
      collectedBy: 'Admin',
      remarks: collectionForm.remarks,
      createdAt: new Date().toISOString()
    };

    setFeeRecords([...feeRecords, newRecord]);
    setShowCollectionModal(false);
    setCollectionForm({
      studentId: '',
      feeStructureId: '',
      amount: 0,
      paymentMethod: 'cash',
      transactionId: '',
      remarks: ''
    });
  };

  return { exportFeeRecords, filteredFeeRecords, filteredStudentSummaries, handleCollectFee, handleCreateFeeStructure };
}
