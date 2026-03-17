// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { Student } from '../types';

export function createMobileHandlers(ctx: any) {
  // Destructure all needed state from context
  const { bulkOperations, currentPage, filteredStudents, pageSize, selectedStudents, setBulkOperations, setSelectedStudent, setSelectedStudents, setShowBulkOperationModal, setSortConfig, setStudents, setTotalPages, setVisibleColumns, sortConfig, students, theme, toggleStudentSelection } = ctx;

  // Mobile View Functions
  const renderMobileStudentCard = (student: Student) => (
    <motion.div
      key={student.id}
      whileHover={{ scale: 1.02 }}
      className={`rounded-xl border p-4 ${
        theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        <img
          src={student.photo}
          alt={student.name}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div className="flex-1">
          <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {student.name}
          </h4>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {student.class} • Roll: {student.rollNo}
          </p>
        </div>
        <input
          type="checkbox"
          checked={selectedStudents.includes(student.id)}
          onChange={() => toggleStudentSelection(student.id)}
          className="w-4 h-4 rounded border-gray-300"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Attendance:</span>
          <span className={`ml-1 ${
            student.attendance.percentage >= 75 ? 'text-green-500' : 'text-red-500'
          }`}>{student.attendance.percentage}%</span>
        </div>
        <div>
          <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>GPA:</span>
          <span className={`ml-1 ${
            student.academics.gpa >= 3.0 ? 'text-green-500' : 'text-yellow-500'
          }`}>{student.academics.gpa}</span>
        </div>
        <div>
          <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Status:</span>
          <span className={`ml-1 px-2 py-1 rounded text-xs ${
            student.status === 'active' ? 'bg-green-500/20 text-green-400' :
            student.status === 'inactive' ? 'bg-red-500/20 text-red-400' :
            'bg-gray-500/20 text-gray-400'
          }`}>{student.status}</span>
        </div>
        <div>
          <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Fees:</span>
          <span className={`ml-1 ${
            student.fees.pending > 0 ? 'text-red-500' : 'text-green-500'
          }`}>₹{student.fees.pending}</span>
        </div>
      </div>
      
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => setSelectedStudent(student)}
          className={`flex-1 px-3 py-1 rounded text-sm font-medium transition-colors ${
            theme === 'dark'
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          View Profile
        </button>
        <button
          onClick={() => {
            setSelectedStudents([student.id]);
            setShowBulkOperationModal(true);
          }}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            theme === 'dark'
              ? 'bg-gray-600 hover:bg-gray-700 text-white'
              : 'bg-gray-500 hover:bg-gray-600 text-white'
          }`}
        >
          Actions
        </button>
      </div>
    </motion.div>
  );

  const renderMobileGridView = (students: Student[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {students.map(renderMobileStudentCard)}
    </div>
  );

  const renderMobileListView = (students: Student[]) => (
    <div className="space-y-3">
      {students.map(renderMobileStudentCard)}
    </div>
  );

  // Sorting Functions
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Column Management Functions
  const toggleColumn = (columnKey: string) => {
    setVisibleColumns(prev => 
      prev.includes(columnKey) 
        ? prev.filter(col => col !== columnKey)
        : [...prev, columnKey]
    );
  };

  const reorderColumns = (newOrder: string[]) => {
    setVisibleColumns(newOrder);
  };

  const moveColumn = (columnKey: string, direction: 'up' | 'down') => {
    setVisibleColumns(prev => {
      const idx = prev.indexOf(columnKey);
      if (idx === -1) return prev;
      const next = [...prev];
      if (direction === 'up' && idx > 0) {
        [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      } else if (direction === 'down' && idx < next.length - 1) {
        [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      }
      return next;
    });
  };

  const resetColumns = () => {
    const defaultColumns = [
      'select', 'photo', 'admissionNo', 'rollNo', 'name', 'parents', 'phoneNumbers',
      'class', 'address', 'attendance', 'grade', 'status', 'actions'
    ];
    setVisibleColumns(defaultColumns);
    // Clear user-specific localStorage to force refresh
    if (typeof window !== 'undefined') {
      try {
        // Get current user identifier for user-specific storage
        const user = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (user) {
          const parsedUser = JSON.parse(user);
          // Handle null/undefined email with multiple fallbacks
          const userKey = parsedUser.email?.trim() || 
                        parsedUser.id?.toString()?.trim() || 
                        parsedUser.name?.trim() || 
                        parsedUser.role?.trim() || 
                        'anonymous';
          localStorage.removeItem(`students-page-visibleColumns-${userKey}`);
        }
      } catch {
        // Ignore errors
      }
    }
  };

  // CSV/Excel Import Functions
  const handleFileImport = async (file: File) => {
    setBulkOperations(prev => ({ 
      ...prev, 
      importFile: file, 
      importStatus: 'processing',
      importProgress: 0,
      importErrors: []
    }));

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    try {
      let parsedData: any[] = [];
      
      if (fileExtension === 'csv') {
        // Parse CSV file
        const result = await new Promise<any>((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            complete: resolve,
            error: reject,
            skipEmptyLines: true
          });
        });
        parsedData = result.data;
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Parse Excel file
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        parsedData = XLSX.utils.sheet_to_json(worksheet);
      } else {
        throw new Error('Unsupported file format. Please use CSV or Excel files.');
      }

      // Validate and process imported data
      const validationResults = await validateAndImportData(parsedData);
      
      setBulkOperations(prev => ({
        ...prev,
        importStatus: validationResults.success ? 'success' : 'error',
        importResults: validationResults.results,
        importErrors: validationResults.errors,
        importProgress: 100
      }));

    } catch (error) {
      setBulkOperations(prev => ({
        ...prev,
        importStatus: 'error',
        importErrors: [error instanceof Error ? error.message : 'Import failed'],
        importProgress: 0
      }));
    }
  };

  const validateAndImportData = async (data: any[]) => {
    const results = { total: data.length, successful: 0, failed: 0, duplicates: 0 };
    const errors: string[] = [];
    const newStudents: Student[] = [];

    // Check subscription limits before starting import
    try {
      const { studentsApi } = await import('@/lib/apiClient');
      // Get current subscription info
      const subscriptionResponse = await fetch('/api/subscription?cache=true');
      const subscriptionData = await subscriptionResponse.json();
      
      if (subscriptionData.subscription) {
        const { studentsUsed, maxStudents } = subscriptionData.subscription;
        const availableSlots = maxStudents - studentsUsed;
        
        if (availableSlots <= 0) {
          errors.push(`Cannot import: Student limit reached (${studentsUsed}/${maxStudents}). Please upgrade your plan to add more students.`);
          if ((window as any).toast) {
            (window as any).toast({
              type: 'warning',
              title: 'Student Limit Reached',
              message: `Cannot import students: limit reached (${studentsUsed}/${maxStudents}). Please upgrade your plan.`,
              duration: 6000,
              actions: [
                {
                  label: 'View Subscription',
                  action: () => {
                    window.location.href = '/subscription';
                  }
                },
                {
                  label: 'Upgrade Plan',
                  action: () => {
                    window.location.href = '/billing';
                  }
                }
              ]
            });
          }
          return { success: false, results, errors };
        } else if (data.length > availableSlots) {
          errors.push(`Warning: Only ${availableSlots} student slots available. Importing first ${availableSlots} students.`);
          // Trim data to available slots
          data = data.slice(0, availableSlots);
        }
      }
    } catch (err) {
      console.error('Failed to check subscription limits:', err);
    }

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      setBulkOperations(prev => ({ ...prev, importProgress: (i / data.length) * 100 }));

      try {
        // Validate required fields
        if (!row.name || !row.email || !row.class) {
          errors.push(`Row ${i + 1}: Missing required fields (name, email, class)`);
          results.failed++;
          continue;
        }

        // Check for duplicates
        const isDuplicate = students.some(s => 
          s.email === row.email || 
          s.rollNo === row.rollNo ||
          s.admissionNo === row.admissionNo
        );

        if (isDuplicate) {
          results.duplicates++;
          continue;
        }

        // Create student object
        const newStudent: Student = {
          id: Math.max(...students.map(s => s.id), 0) + 1,
          name: row.name || '',
          email: row.email || '',
          class: row.class || '',
          rollNo: row.rollNo || '',
          phone: row.phone || '',
          gpa: row.gpa || 0,
          status: row.status || 'active',
          admissionNo: row.admissionNo || `ADM${new Date().getFullYear()}${students.length + 1}`,
          dateOfBirth: row.dateOfBirth || '',
          gender: row.gender || 'Male',
          address: row.address || '',
          parentName: row.parentName || '',
          parentPhone: row.parentPhone || '',
          parentEmail: row.parentEmail || '',
          enrollmentDate: row.enrollmentDate || new Date().toISOString().split('T')[0],
          board: row.board || 'CBSE',
          section: row.section || 'A',
          bloodGroup: row.bloodGroup || 'O+',
          emergencyContact: row.emergencyContact || '',
          medicalConditions: row.medicalConditions || '',
          fees: {
            total: parseFloat(row.feesTotal) || 50000,
            paid: parseFloat(row.feesPaid) || 0,
            pending: parseFloat(row.feesPending) || 50000,
            lastPaymentDate: row.lastPaymentDate || ''
          },
          academics: {
            gpa: parseFloat(row.gpa) || 3.0,
            rank: parseInt(row.rank) || students.length + 1,
            totalSubjects: parseInt(row.totalSubjects) || 6,
            passedSubjects: parseInt(row.passedSubjects) || 6,
            failedSubjects: parseInt(row.failedSubjects) || 0
          },
          behavior: {
            disciplineScore: parseInt(row.disciplineScore) || 80,
            incidents: parseInt(row.incidents) || 0,
            achievements: parseInt(row.achievements) || 0
          },
          attendance: {
            present: parseInt(row.attendancePresent) || 0,
            absent: parseInt(row.attendanceAbsent) || 0,
            late: parseInt(row.attendanceLate) || 0,
            percentage: parseFloat(row.attendancePercentage) || 95
          },
          documents: {
            birthCertificate: row.birthCertificate === 'true',
            transferCertificate: row.transferCertificate === 'true',
            medicalCertificate: row.medicalCertificate === 'true',
            aadharCard: row.aadharCard === 'true',
            passportPhoto: row.passportPhoto === 'true',
            marksheet: row.marksheet === 'true',
            casteCertificate: row.casteCertificate === 'true',
            incomeCertificate: row.incomeCertificate === 'true'
          },
          nationality: row.nationality || 'Indian',
          religion: row.religion || '',
          category: row.category || '',
          motherTongue: row.motherTongue || '',
          city: row.city || '',
          state: row.state || '',
          pinCode: row.pinCode || '',
          emergencyRelation: row.emergencyRelation || '',
          admissionDate: row.admissionDate || new Date().toISOString().split('T')[0],
          previousSchool: row.previousSchool || '',
          previousClass: row.previousClass || '',
          transferCertificate: row.transferCertificateNumber || '',
          fatherName: row.fatherName || '',
          fatherOccupation: row.fatherOccupation || '',
          fatherPhone: row.fatherPhone || '',
          fatherEmail: row.fatherEmail || '',
          motherName: row.motherName || '',
          motherOccupation: row.motherOccupation || '',
          motherPhone: row.motherPhone || '',
          motherEmail: row.motherEmail || '',
          guardianName: row.guardianName || '',
          guardianRelation: row.guardianRelation || '',
          guardianPhone: row.guardianPhone || '',
          allergies: row.allergies || '',
          medications: row.medications || '',
          doctorName: row.doctorName || '',
          doctorPhone: row.doctorPhone || '',
          transport: row.transport || 'No',
          transportRoute: row.transportRoute || '',
          hostel: row.hostel || 'No',
          sibling: row.sibling || 'No',
          siblingName: row.siblingName || '',
          siblingClass: row.siblingClass || '',
          aadharNumber: row.aadharNumber || '',
          stsId: row.stsId || '',
          languageMedium: row.languageMedium || 'English',
          bankName: row.bankName || '',
          bankAccountNumber: row.bankAccountNumber || '',
          bankIfsc: row.bankIfsc || '',
          previousSchoolName: row.previousSchoolName || '',
          previousSchoolAddress: row.previousSchoolAddress || '',
          previousSchoolPhone: row.previousSchoolPhone || '',
          previousSchoolEmail: row.previousSchoolEmail || '',
          transferCertificateNumber: row.transferCertificateNumber || '',
          remarks: row.remarks || ''
        };

        newStudents.push(newStudent);
        results.successful++;
        
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Validation error'}`);
        results.failed++;
      }
    }

    // Add successful imports to students array
    if (newStudents.length > 0) {
      setStudents(prev => [...prev, ...newStudents]);
    }

    return {
      success: results.successful > 0,
      results,
      errors
    };
  };

  // Export Functions
  const exportStudents = (format: 'csv' | 'excel' = 'csv') => {
    const selectedStudentsData = filteredStudents.filter(s => 
      selectedStudents.length === 0 || selectedStudents.includes(s.id)
    );

    if (selectedStudentsData.length === 0) {
      if ((window as any).toast) {
        (window as any).toast({
          type: 'warning',
          title: 'No Students Selected',
          message: 'Please select students to export',
          duration: 3000
        });
      }
      return;
    }

    const exportData = selectedStudentsData.map(student => {
      const row: any = {};
      
      // Map selected fields to export
      bulkOperations.exportFields.forEach(field => {
        if (field === 'attendance') {
          row[field] = `${student.attendance.percentage}% (${student.attendance.present}/${student.attendance.present + student.attendance.absent})`;
        } else if (field === 'academics') {
          row[field] = `GPA: ${student.academics.gpa}, Rank: ${student.academics.rank}`;
        } else if (field === 'fees') {
          row[field] = `Total: ₹${student.fees.total}, Paid: ₹${student.fees.paid}, Pending: ₹${student.fees.pending}`;
        } else if (field === 'documents') {
          row[field] = Object.entries(student.documents)
            .filter(([_, status]) => status)
            .map(([doc]) => doc)
            .join(', ') || 'None';
        } else {
          row[field] = (student as any)[field] || '';
        }
      });
      
      return row;
    });

    if (format === 'csv') {
      // Export to CSV
      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `students_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'excel') {
      // Export to Excel
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Students');
      XLSX.writeFile(wb, `students_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    }
  };

  // Download template function
  const downloadTemplate = (format: 'csv' | 'excel') => {
    const template = [
      {
        name: 'Student Name',
        email: 'student@school.com',
        class: '10A',
        rollNo: '001',
        phone: '1234567890',
        grade: 'A',
        status: 'active',
        admissionNo: 'ADM2024001',
        dateOfBirth: 'YYYY-MM-DD',
        gender: 'Male/Female',
        address: 'Student Address',
        parentName: 'Parent Name',
        parentPhone: '1234567891',
        parentEmail: 'parent@school.com',
        enrollmentDate: 'YYYY-MM-DD',
        board: 'CBSE',
        section: 'A',
        bloodGroup: 'O+',
        emergencyContact: '9876543212',
        medicalConditions: 'None',
        feesTotal: '50000',
        feesPaid: '25000',
        feesPending: '25000',
        lastPaymentDate: '2024-01-15',
        gpa: '3.5',
        rank: '1',
        totalSubjects: '6',
        passedSubjects: '6',
        failedSubjects: '0',
        disciplineScore: '85',
        incidents: '0',
        achievements: '5',
        attendancePresent: '180',
        attendanceAbsent: '10',
        attendanceLate: '5',
        attendancePercentage: '92.5',
        birthCertificate: 'true',
        transferCertificate: 'true',
        medicalCertificate: 'false',
        aadharCard: 'true',
        passportPhoto: 'true',
        marksheet: 'true',
        casteCertificate: 'false',
        incomeCertificate: 'false',
        nationality: 'Indian',
        religion: 'Hindu',
        category: 'General',
        motherTongue: 'Hindi',
        city: 'Delhi',
        state: 'Delhi',
        pinCode: '110001',
        emergencyRelation: 'Father',
        admissionDate: '2024-01-01',
        previousSchool: 'XYZ School',
        previousClass: '9A',
        transferCertificateNo: 'TC2024001',
        fatherName: 'John Doe Sr',
        fatherOccupation: 'Business',
        fatherPhone: '9876543213',
        fatherEmail: 'john.sr@example.com',
        motherName: 'Jane Doe',
        motherOccupation: 'Teacher',
        motherPhone: '9876543214',
        motherEmail: 'jane.mother@example.com',
        guardianName: '',
        guardianRelation: '',
        guardianPhone: '',
        allergies: 'None',
        medications: 'None',
        doctorName: 'Dr. Smith',
        doctorPhone: '9876543215',
        transport: 'No',
        transportRoute: '',
        hostel: 'No',
        sibling: 'No',
        siblingName: '',
        siblingClass: '',
        aadharNumber: '123456789012',
        stsId: 'STS2024001',
        languageMedium: 'English',
        bankName: 'SBI',
        bankAccountNumber: '123456789012',
        bankIfsc: 'SBIN0001234',
        previousSchoolName: 'XYZ School',
        previousSchoolAddress: '456 School St, Delhi',
        previousSchoolPhone: '9876543216',
        previousSchoolEmail: 'info@xyzschool.com',
        transferCertificateNumber: 'TC2024001',
        remarks: 'Good student'
      }
    ];

    if (format === 'csv') {
      const csv = Papa.unparse(template);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `student_import_template.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'excel') {
      const ws = XLSX.utils.json_to_sheet(template);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      XLSX.writeFile(wb, `student_import_template.xlsx`);
    }
  };

  // Bulk operations
  const performBulkAction = async (action: 'delete' | 'update' | 'export') => {
    setBulkOperations(prev => ({ 
      ...prev, 
      bulkAction: action, 
      bulkActionStatus: 'processing',
      bulkActionProgress: 0
    }));

    const selectedStudentsData = filteredStudents.filter(s => 
      selectedStudents.length === 0 || selectedStudents.includes(s.id)
    );

    try {
      if (action === 'delete') {
        // Delete selected students
        for (let i = 0; i < selectedStudentsData.length; i++) {
          setStudents(prev => prev.filter(s => s.id !== selectedStudentsData[i].id));
          setBulkOperations(prev => ({ ...prev, bulkActionProgress: ((i + 1) / selectedStudentsData.length) * 100 }));
          // Process deletion (in production, implement actual deletion logic)
        // await deleteStudentFromDatabase(selectedStudentsData[i].id);
        }
        setSelectedStudents([]);
      } else if (action === 'update') {
        // Update selected students (example: update status)
        for (let i = 0; i < selectedStudentsData.length; i++) {
          setStudents(prev => prev.map(s => 
            s.id === selectedStudentsData[i].id 
              ? { ...s, status: 'active' as const, lastUpdated: new Date().toISOString() }
              : s
          ));
          setBulkOperations(prev => ({ ...prev, bulkActionProgress: ((i + 1) / selectedStudentsData.length) * 100 }));
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } else if (action === 'export') {
        exportStudents(bulkOperations.exportFormat as 'csv' | 'excel');
        setBulkOperations(prev => ({ ...prev, bulkActionProgress: 100 }));
      }

      setBulkOperations(prev => ({ ...prev, bulkActionStatus: 'success' }));
      
    } catch (error) {
      setBulkOperations(prev => ({ ...prev, bulkActionStatus: 'error' }));
    }
  };


  return { downloadTemplate, exportStudents, handleFileImport, handleSort, performBulkAction, renderMobileGridView, renderMobileListView, renderMobileStudentCard, resetColumns, toggleColumn, moveColumn, reorderColumns, validateAndImportData };
}
