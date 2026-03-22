// @ts-nocheck
import { FeeStructure, FeeRecord, StudentFeeSummary, FeeCollection, Discount } from '../types';

export function createFeeActionHandlers(ctx: any) {
  const { feeRecords, feeStructureForm, feeStructures, isClient, searchTerm, selectedClass, selectedStatus, setFeeRecords, setFeeStructureForm, setFeeStructures, setShowFeeStructureModal, studentFeeSummaries, visibleStudentFeeSummaries } = ctx;

  // Filter functions
  const filteredFeeRecords = feeRecords.filter(record => {
    const studentName = record.student?.name || '';
    const feeStructureName = record.feeStructure?.name || '';
    const studentClass = record.student?.class || '';
    
    const matchesClass = selectedClass === 'all' || studentClass.includes(selectedClass);
    const matchesStatus = selectedStatus === 'all' || record.status === selectedStatus;
    const matchesSearch = (studentName && studentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (feeStructureName && feeStructureName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesClass && matchesStatus && matchesSearch;
  });

  const filteredStudentSummaries = visibleStudentFeeSummaries || studentFeeSummaries;

  // Export functions
  const exportFeeRecords = () => {
    const csvContent = [
      ['Student Name', 'Class', 'Fee Type', 'Amount', 'Paid', 'Pending', 'Due Date', 'Status', 'Payment Method'],
      ...filteredFeeRecords.map(record => [
        record.student?.name || '',
        record.student?.class || '',
        record.feeStructure?.name || '',
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
  const handleCreateFeeStructure = async () => {
    try {
      const { feeStructuresApi } = await import('@/lib/apiClient');
      const result = await feeStructuresApi.create({
        name: feeStructureForm.name || '',
        category: feeStructureForm.category || 'tuition',
        amount: Number(feeStructureForm.amount) || 0,
        frequency: feeStructureForm.frequency || 'monthly',
        dueDate: Number(feeStructureForm.dueDate) || 1,
        lateFee: Number(feeStructureForm.lateFee) || 0,
        description: feeStructureForm.description || '',
        applicableClasses: JSON.stringify(feeStructureForm.applicableClasses || []),
        applicableCategories: JSON.stringify(feeStructureForm.applicableCategories || []),
        isActive: feeStructureForm.isActive ?? true,
        academicYear: '2024-25',
      });
      if (result.structure) {
        setFeeStructures([...feeStructures, result.structure]);
      }
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
    } catch (err) {
      console.error('Failed to create fee structure:', err);
    }
  };

  return { exportFeeRecords, filteredFeeRecords, filteredStudentSummaries, handleCreateFeeStructure };
}
