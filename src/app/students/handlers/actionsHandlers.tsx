// @ts-nocheck
import { Student } from '../types';

export function createActionsHandlers(ctx: any) {
  // Destructure all needed state from context
  const { bulkOperationData, bulkOperationType, filteredStudents, filterName, savedFilters, selectedStudents, setAdvancedFilters, setBulkOperationProgress, setFilterName, setSavedFilters, setSelectedStudents, setShowAdvancedFilters, setShowBulkOperationModal, setShowSaveFilterModal, students } = ctx;

  // Quick Action Functions (Legacy - replaced by bulk operations)
  const exportStudentsLegacy = () => {
    const csvContent = [
      ['ID', 'Name', 'Class', 'Roll No', 'Phone', 'Parents', 'Address', 'Status', 'Language Medium'],
      ...filteredStudents.map(student => [
        student.id,
        student.name,
        student.class,
        student.rollNo,
        student.phone,
        `${student.fatherName} / ${student.motherName}`,
        `${student.city}, ${student.state}`,
        student.status,
        student.languageMedium
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const printStudents = () => {
    const selectedStudentsData = filteredStudents.filter(s => 
      selectedStudents.length === 0 || selectedStudents.includes(s.id)
    );
    
    const printContent = `
      <html>
        <head>
          <title>Student List</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 30px; }
            .date { text-align: right; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Student Management System</h1>
            <h2>Student List Report</h2>
          </div>
          <div class="date">Generated on: ${new Date().toLocaleDateString()}</div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Admission No</th>
                <th>Name</th>
                <th>Class</th>
                <th>Roll No</th>
                <th>Phone</th>
                <th>Parents</th>
                <th>Address</th>
                <th>Status</th>
                <th>Language</th>
              </tr>
            </thead>
            <tbody>
              ${selectedStudentsData.map(student => `
                <tr>
                  <td>${student.id}</td>
                  <td>ADM${String(student.id).padStart(4, '0')}</td>
                  <td>${student.name}</td>
                  <td>${student.class}</td>
                  <td>${student.rollNo}</td>
                  <td>${student.phone}</td>
                  <td>${student.fatherName} / ${student.motherName}</td>
                  <td>${student.city}, ${student.state}</td>
                  <td>${student.status}</td>
                  <td>${student.languageMedium}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div style="margin-top: 30px; text-align: center;">
            <p>Total Students: ${selectedStudentsData.length}</p>
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const sendBulkSMS = () => {
    const selectedStudentsData = filteredStudents.filter(s => 
      selectedStudents.length === 0 || selectedStudents.includes(s.id)
    );
    
    const phoneNumbers = selectedStudentsData.map(s => s.phone).filter(Boolean);
    if (phoneNumbers.length === 0) {
      alert('No phone numbers available for selected students');
      return;
    }

    const message = `Dear Parents, This is a message from School Management System regarding your ward's progress. Please contact school office for more details.`;
    const smsUrl = `sms:${phoneNumbers.join(',')}?body=${encodeURIComponent(message)}`;
    window.open(smsUrl);
  };

  // Single student functions for profile page
  const sendStudentSMS = (student: Student) => {
    if (!student.phone) {
      alert('No phone number available for this student');
      return;
    }

    const message = `Dear Parent, This is a message from School Management System regarding ${student.name}'s progress. Please contact school office for more details.`;
    const smsUrl = `sms:${student.phone}?body=${encodeURIComponent(message)}`;
    window.open(smsUrl);
  };

  const printStudentProfile = (student: Student) => {
    const printContent = `
      <html>
        <head>
          <title>Student Profile</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; }
            .profile-header { text-align: center; margin-bottom: 30px; }
            .profile-info { margin-bottom: 20px; }
            .section { margin-bottom: 25px; }
            .section h3 { color: #333; border-bottom: 2px solid #333; padding-bottom: 5px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
            .info-item { margin-bottom: 8px; }
            .label { font-weight: bold; color: #555; }
            .date { text-align: right; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="profile-header">
            <h1>Student Management System</h1>
            <h2>Student Profile Report</h2>
            <div class="date">Generated on: ${new Date().toLocaleDateString()}</div>
          </div>
          
          <div class="section">
            <h3>Basic Information</h3>
            <div class="info-grid">
              <div class="info-item"><span class="label">Name:</span> ${student.name}</div>
              <div class="info-item"><span class="label">Admission No:</span> ADM${String(student.id).padStart(4, '0')}</div>
              <div class="info-item"><span class="label">Class:</span> ${student.class}</div>
              <div class="info-item"><span class="label">Roll No:</span> ${student.rollNo}</div>
              <div class="info-item"><span class="label">Date of Birth:</span> ${student.dateOfBirth}</div>
              <div class="info-item"><span class="label">Gender:</span> ${student.gender}</div>
              <div class="info-item"><span class="label">Blood Group:</span> ${student.bloodGroup}</div>
              <div class="info-item"><span class="label">Phone:</span> ${student.phone}</div>
              <div class="info-item"><span class="label">Email:</span> ${student.email}</div>
              <div class="info-item"><span class="label">Language Medium:</span> ${student.languageMedium}</div>
            </div>
          </div>
          
          <div class="section">
            <h3>Parents Information</h3>
            <div class="info-grid">
              <div class="info-item"><span class="label">Father Name:</span> ${student.fatherName}</div>
              <div class="info-item"><span class="label">Father Phone:</span> ${student.fatherPhone}</div>
              <div class="info-item"><span class="label">Father Occupation:</span> ${student.fatherOccupation}</div>
              <div class="info-item"><span class="label">Mother Name:</span> ${student.motherName}</div>
              <div class="info-item"><span class="label">Mother Phone:</span> ${student.motherPhone}</div>
              <div class="info-item"><span class="label">Mother Occupation:</span> ${student.motherOccupation}</div>
            </div>
          </div>
          
          <div class="section">
            <h3>Address Information</h3>
            <div class="info-grid">
              <div class="info-item"><span class="label">Address:</span> ${student.address}</div>
              <div class="info-item"><span class="label">City:</span> ${student.city}</div>
              <div class="info-item"><span class="label">State:</span> ${student.state}</div>
              <div class="info-item"><span class="label">Pin Code:</span> ${student.pinCode}</div>
            </div>
          </div>
          
          <div class="section">
            <h3>Academic Information</h3>
            <div class="info-grid">
              <div class="info-item"><span class="label">GPA:</span> ${student.academics.gpa}</div>
              <div class="info-item"><span class="label">Class Rank:</span> ${student.academics.rank}</div>
              <div class="info-item"><span class="label">Total Subjects:</span> ${student.academics.totalSubjects}</div>
              <div class="info-item"><span class="label">Passed Subjects:</span> ${student.academics.passedSubjects}</div>
            </div>
          </div>
          
          <div class="section">
            <h3>Attendance Information</h3>
            <div class="info-grid">
              <div class="info-item"><span class="label">Present Days:</span> ${student.attendance.present}</div>
              <div class="info-item"><span class="label">Absent Days:</span> ${student.attendance.absent}</div>
              <div class="info-item"><span class="label">Late Days:</span> ${student.attendance.late}</div>
              <div class="info-item"><span class="label">Attendance %:</span> ${student.attendance.percentage}%</div>
            </div>
          </div>
          
          <div class="section">
            <h3>Fee Information</h3>
            <div class="info-grid">
              <div class="info-item"><span class="label">Total Fees:</span> ₹${student.fees.total}</div>
              <div class="info-item"><span class="label">Paid Amount:</span> ₹${student.fees.paid}</div>
              <div class="info-item"><span class="label">Pending Amount:</span> ₹${student.fees.pending}</div>
              <div class="info-item"><span class="label">Last Payment:</span> ${student.fees.lastPaymentDate}</div>
            </div>
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Bulk selection functions
  const toggleStudentSelection = (studentId: number) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleAllStudentsSelection = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };

  // Advanced Filter Functions
  const clearAdvancedFilters = () => {
    setAdvancedFilters({
      name: '',
      admissionNo: '',
      parentName: '',
      phone: '',
      email: '',
      bloodGroup: 'all',
      attendanceMin: '',
      attendanceMax: '',
      feeStatus: 'all',
      dateOfBirth: '',
      admissionDateFrom: '',
      admissionDateTo: '',
      city: '',
      state: '',
      category: 'all'
    });
  };

  const saveCurrentFilter = () => {
    if (!filterName.trim()) {
      alert('Please enter a filter name');
      return;
    }
    
    const newFilter = {
      id: Date.now().toString(),
      name: filterName,
      filters: { ...advancedFilters },
      createdAt: new Date().toISOString()
    };
    
    setSavedFilters(prev => [...prev, newFilter]);
    setFilterName('');
    setShowSaveFilterModal(false);
  };

  const applySavedFilter = (filter: typeof savedFilters[0]) => {
    setAdvancedFilters(filter.filters);
    setShowAdvancedFilters(true);
  };

  const deleteSavedFilter = (filterId: string) => {
    setSavedFilters(prev => prev.filter(f => f.id !== filterId));
  };

  // Enhanced Bulk Operations Functions
  const executeBulkOperation = async () => {
    setBulkOperationProgress(prev => ({ ...prev, status: 'processing', current: 0, errors: [] }));
    
    const selectedStudentsData = students.filter(s => selectedStudents.includes(s.id));
    setBulkOperationProgress(prev => ({ ...prev, total: selectedStudentsData.length }));
    
    try {
      for (let i = 0; i < selectedStudentsData.length; i++) {
        const student = selectedStudentsData[i];
        
        switch (bulkOperationType) {
          case 'promote':
            // Promote to next class
            const currentClass = student.class;
            const classMatch = currentClass.match(/(\d+)([A-Z])/);
            if (classMatch) {
              const [, grade, section] = classMatch;
              const nextGrade = parseInt(grade) + 1;
              if (nextGrade <= 12) {
                // Update student class (this would be an API call in real app)
                console.log(`Promoting ${student.name} to ${nextGrade}${section}`);
              }
            }
            break;
            
          case 'update_status':
            if (bulkOperationData.targetStatus) {
              // Update student status
              console.log(`Updating ${student.name} status to ${bulkOperationData.targetStatus}`);
            }
            break;
            
          case 'assign_fees':
            if (bulkOperationData.feeAmount) {
              // Assign fees to students
              console.log(`Assigning ₹${bulkOperationData.feeAmount} fees to ${student.name}`);
            }
            break;
            
          case 'send_message':
            if (bulkOperationData.message) {
              // Send message to parents
              console.log(`Sending message to ${student.name}'s parents: ${bulkOperationData.message}`);
            }
            break;
            
          case 'delete':
            // Delete students (with confirmation)
            console.log(`Deleting ${student.name}`);
            break;
            
          case 'export':
            // Export selected students data
            await exportStudentData([student]);
            break;
        }
        
        setBulkOperationProgress(prev => ({ ...prev, current: i + 1 }));
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      setBulkOperationProgress(prev => ({ ...prev, status: 'completed' }));
      setTimeout(() => {
        setShowBulkOperationModal(false);
        setBulkOperationProgress({ current: 0, total: 0, status: 'idle', errors: [] });
      }, 2000);
      
    } catch (error) {
      setBulkOperationProgress(prev => ({ 
        ...prev, 
        status: 'error', 
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'] 
      }));
    }
  };

  // Export Functions
  const exportStudentData = async (studentsToExport: Student[]) => {
    const csvContent = [
      [
        'ID', 'Admission No', 'Name', 'Roll No', 'Class', 'Section', 'Gender', 'Date of Birth',
        'Father Name', 'Mother Name', 'Parent Phone', 'Email', 'Address', 'City', 'State',
        'Pin Code', 'Blood Group', 'Category', 'Language Medium', 'Admission Date',
        'Status', 'Attendance %', 'GPA', 'Total Fees', 'Paid Fees', 'Pending Fees'
      ],
      ...studentsToExport.map(student => [
        student.id,
        student.admissionNo,
        student.name,
        student.rollNo,
        student.class,
        student.section,
        student.gender,
        student.dateOfBirth,
        student.fatherName,
        student.motherName,
        student.phone,
        student.email,
        student.address,
        student.city,
        student.state,
        student.pinCode,
        student.bloodGroup,
        student.category,
        student.languageMedium,
        student.admissionDate,
        student.status,
        student.attendance.percentage,
        student.academics.gpa,
        student.fees.total,
        student.fees.paid,
        student.fees.pending
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportAllFilteredStudents = () => {
    exportStudentData(filteredStudents);
  };

  const exportSelectedStudents = () => {
    const selectedStudentsData = students.filter(s => selectedStudents.includes(s.id));
    exportStudentData(selectedStudentsData);
  };


  return { exportStudentsLegacy, printStudents, sendBulkSMS, sendStudentSMS, printStudentProfile, toggleStudentSelection, toggleAllStudentsSelection, clearAdvancedFilters, saveCurrentFilter, applySavedFilter, deleteSavedFilter, executeBulkOperation, exportStudentData, exportAllFilteredStudents, exportSelectedStudents };
}
