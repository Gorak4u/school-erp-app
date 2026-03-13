// @ts-nocheck
import { FeeStructure, FeeRecord, StudentFeeSummary, FeeCollection, Discount } from '../types';

export function createFeeActionHandlers(ctx: any) {
  const { feeRecords, feeStructureForm, feeStructures, isClient, searchTerm, selectedClass, selectedStatus, setFeeRecords, setFeeStructureForm, setFeeStructures, setShowFeeStructureModal, studentFeeSummaries } = ctx;

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

  return { exportFeeRecords, filteredFeeRecords, filteredStudentSummaries, handleCreateFeeStructure };
}
