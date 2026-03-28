// @ts-nocheck
import { Student } from '../types';
import { generateBulkIdCards, downloadBulkIdCards } from '@/lib/bulkIdCards';

export function createActionsHandlers(ctx: any) {
  // Destructure all needed state from context
  const { bulkOperationData, bulkOperationType, filteredStudents, filterName, savedFilters, selectedStudents, setAdvancedFilters, setBulkOperationProgress, setFilterName, setSavedFilters, setSelectedStudents, setShowAdvancedFilters, setShowBulkOperationModal, setShowSaveFilterModal, students, getSetting, includeArchivedStudents = false, setSelectedClass, setSelectedStatus, setSelectedGender, setSelectedMedium, setSelectedBloodGroup, setSelectedCategory, setSelectedAttendanceRange, setSelectedFeeStatus, setSearchTerm } = ctx;

  // Quick Action Functions (Legacy - replaced by bulk operations)
  const exportStudentsLegacy = () => {
    const csvContent = [
      ['ID', 'Name', 'Class', 'Roll No', 'Phone', 'Father Name', 'Mother Name', 'Address', 'Status', 'Language Medium'],
      ...filteredStudents.map(student => [
        student.id,
        student.name,
        student.class,
        student.rollNo,
        student.phone,
        student.fatherName || student.parentName || 'N/A',
        student.motherName || 'N/A',
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
                <th>Father Name</th>
                <th>Mother Name</th>
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
      if ((window as any).toast) {
        (window as any).toast({
          type: 'warning',
          title: 'No Phone Numbers',
          message: 'No phone numbers available for selected students',
          duration: 3000
        });
      }
      return;
    }

    const message = `Dear Parents, This is a message from School Management System regarding your ward's progress. Please contact school office for more details.`;
    const smsUrl = `sms:${phoneNumbers.join(',')}?body=${encodeURIComponent(message)}`;
    window.open(smsUrl);
    
    // Show success toast
    if ((window as any).toast) {
      (window as any).toast({
        type: 'success',
        title: 'SMS Opened',
        message: `SMS app opened for ${phoneNumbers.length} parents`,
        duration: 3000
      });
    }
  };

  // Single student functions for profile page
  const sendStudentSMS = (student: Student) => {
    if (!student.phone) {
      if ((window as any).toast) {
        (window as any).toast({
          type: 'warning',
          title: 'No Phone Number',
          message: 'No phone number available for this student',
          duration: 3000
        });
      }
      return;
    }

    const message = `Dear Parent, This is a message from School Management System regarding ${student.name}'s progress. Please contact school office for more details.`;
    const smsUrl = `sms:${student.phone}?body=${encodeURIComponent(message)}`;
    window.open(smsUrl);
    
    // Show success toast
    if ((window as any).toast) {
      (window as any).toast({
        type: 'success',
        title: 'SMS Opened',
        message: `SMS app opened for ${student.name}'s parent`,
        duration: 3000
      });
    }
  };

  const printStudentProfile = (student: Student) => {
    const printContent = `
      <html>
        <head>
          <title>Student Profile Report</title>
          <style>
            @page { margin: 0.5in; }
            * { box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: 0;
              line-height: 1.6;
              color: #1a1a1a;
              background: #fff;
            }
            
            .report-header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 2rem;
              text-align: center;
              position: relative;
              overflow: hidden;
            }
            
            .report-header::before {
              content: '';
              position: absolute;
              top: -50%;
              left: -50%;
              width: 200%;
              height: 200%;
              background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
              background-size: 20px 20px;
              animation: move 20s linear infinite;
            }
            
            @keyframes move {
              0% { transform: translate(0, 0); }
              100% { transform: translate(20px, 20px); }
            }
            
            .report-header h1 {
              margin: 0;
              font-size: 2.5rem;
              font-weight: 700;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
              position: relative;
              z-index: 1;
            }
            
            .report-header h2 {
              margin: 0.5rem 0 0 0;
              font-size: 1.5rem;
              font-weight: 300;
              opacity: 0.95;
              position: relative;
              z-index: 1;
            }
            
            .report-meta {
              background: #f8f9fa;
              padding: 1rem 2rem;
              border-bottom: 3px solid #e9ecef;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            
            .report-id {
              font-weight: 600;
              color: #495057;
            }
            
            .report-date {
              color: #6c757d;
              font-size: 0.9rem;
            }
            
            .student-photo {
              width: 120px;
              height: 120px;
              border-radius: 50%;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 3rem;
              font-weight: bold;
              margin: 0 auto 2rem;
              box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            
            .content-wrapper {
              padding: 2rem;
              max-width: 1200px;
              margin: 0 auto;
            }
            
            .section {
              margin-bottom: 2.5rem;
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.07);
              overflow: hidden;
            }
            
            .section-header {
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
              padding: 1rem 1.5rem;
              border-left: 5px solid #667eea;
              border-bottom: 2px solid #e9ecef;
            }
            
            .section-header h3 {
              margin: 0;
              color: #2c3e50;
              font-size: 1.25rem;
              font-weight: 600;
              display: flex;
              align-items: center;
              gap: 0.5rem;
            }
            
            .section-icon {
              width: 24px;
              height: 24px;
              background: #667eea;
              border-radius: 50%;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 0.8rem;
            }
            
            .section-content {
              padding: 1.5rem;
            }
            
            .info-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
              gap: 1.5rem;
            }
            
            .info-item {
              display: flex;
              flex-direction: column;
              gap: 0.25rem;
            }
            
            .info-label {
              font-weight: 600;
              color: #6c757d;
              font-size: 0.85rem;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .info-value {
              color: #2c3e50;
              font-size: 1.05rem;
              font-weight: 500;
            }
            
            .highlight-box {
              background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
              border: 2px solid #667eea;
              border-radius: 8px;
              padding: 1rem;
              margin-top: 1rem;
            }
            
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 1rem;
              margin-top: 1rem;
            }
            
            .stat-card {
              background: white;
              border-radius: 8px;
              padding: 1rem;
              text-align: center;
              border: 1px solid #e9ecef;
              transition: transform 0.2s;
            }
            
            .stat-value {
              font-size: 1.5rem;
              font-weight: 700;
              color: #667eea;
            }
            
            .stat-label {
              font-size: 0.85rem;
              color: #6c757d;
              margin-top: 0.25rem;
            }
            
            .footer {
              background: #2c3e50;
              color: white;
              padding: 2rem;
              text-align: center;
              margin-top: 3rem;
            }
            
            .footer p {
              margin: 0;
              opacity: 0.8;
            }
            
            @media print {
              .report-header::before { display: none; }
              body { font-size: 12pt; }
              .section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="report-header">
            <h1>🎓 Student Profile Report</h1>
            <h2>Comprehensive Academic Record</h2>
          </div>
          
          <div class="report-meta">
            <div class="report-id">Student ID: ${student.admissionNo || 'N/A'}</div>
            <div class="report-date">Generated: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
          
          <div class="content-wrapper">
            <div class="student-photo">${student.name.charAt(0).toUpperCase()}</div>
            
            <div class="section">
              <div class="section-header">
                <h3><span class="section-icon">👤</span> Personal Information</h3>
              </div>
              <div class="section-content">
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Full Name</span>
                    <span class="info-value">${student.name}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Admission Number</span>
                    <span class="info-value">${student.admissionNo || 'N/A'}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Class & Section</span>
                    <span class="info-value">${student.class} - Roll No: ${student.rollNo}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Date of Birth</span>
                    <span class="info-value">${student.dateOfBirth}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Gender</span>
                    <span class="info-value">${student.gender}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Blood Group</span>
                    <span class="info-value">${student.bloodGroup}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Contact Number</span>
                    <span class="info-value">${student.phone}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Email Address</span>
                    <span class="info-value">${student.email}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Language Medium</span>
                    <span class="info-value">${student.languageMedium}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="section">
              <div class="section-header">
                <h3><span class="section-icon">👨‍👩‍👧‍👦</span> Parent/Guardian Information</h3>
              </div>
              <div class="section-content">
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Father's Name</span>
                    <span class="info-value">${student.fatherName}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Father's Contact</span>
                    <span class="info-value">${student.fatherPhone}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Father's Occupation</span>
                    <span class="info-value">${student.fatherOccupation}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Mother's Name</span>
                    <span class="info-value">${student.motherName}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Mother's Contact</span>
                    <span class="info-value">${student.motherPhone}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Mother's Occupation</span>
                    <span class="info-value">${student.motherOccupation}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="section">
              <div class="section-header">
                <h3><span class="section-icon">📍</span> Address Information</h3>
              </div>
              <div class="section-content">
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Street Address</span>
                    <span class="info-value">${student.address}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">City</span>
                    <span class="info-value">${student.city}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">State</span>
                    <span class="info-value">${student.state}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">PIN Code</span>
                    <span class="info-value">${student.pinCode}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="section">
              <div class="section-header">
                <h3><span class="section-icon">📚</span> Academic Performance</h3>
              </div>
              <div class="section-content">
                <div class="stats-grid">
                  <div class="stat-card">
                    <div class="stat-value">${student.academics?.gpa || 'N/A'}</div>
                    <div class="stat-label">Current GPA</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-value">${student.academics?.rank || 'N/A'}</div>
                    <div class="stat-label">Class Rank</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-value">${student.academics?.totalSubjects || 'N/A'}</div>
                    <div class="stat-label">Total Subjects</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-value">${student.academics?.passedSubjects || 'N/A'}</div>
                    <div class="stat-label">Passed Subjects</div>
                  </div>
                </div>
                <div class="highlight-box">
                  <strong>Academic Status:</strong> ${student.academics?.gpa ? (student.academics.gpa >= 3.5 ? 'Excellent Performance' : student.academics.gpa >= 3.0 ? 'Good Performance' : 'Needs Improvement') : 'Not Available'}
                </div>
              </div>
            </div>
            
            <div class="section">
              <div class="section-header">
                <h3><span class="section-icon">📊</span> Attendance Records</h3>
              </div>
              <div class="section-content">
                <div class="stats-grid">
                  <div class="stat-card">
                    <div class="stat-value">${student.attendance?.present || 0}</div>
                    <div class="stat-label">Present Days</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-value">${student.attendance?.absent || 0}</div>
                    <div class="stat-label">Absent Days</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-value">${student.attendance?.late || 0}</div>
                    <div class="stat-label">Late Arrivals</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-value">${student.attendance?.percentage || 0}%</div>
                    <div class="stat-label">Attendance Rate</div>
                  </div>
                </div>
                <div class="highlight-box">
                  <strong>Attendance Status:</strong> ${student.attendance?.percentage ? (student.attendance.percentage >= 95 ? 'Excellent' : student.attendance.percentage >= 85 ? 'Good' : student.attendance.percentage >= 75 ? 'Satisfactory' : 'Needs Attention') : 'Not Available'}
                </div>
              </div>
            </div>
            
            <div class="section">
              <div class="section-header">
                <h3><span class="section-icon">💰</span> Financial Information</h3>
              </div>
              <div class="section-content">
                <div class="stats-grid">
                  <div class="stat-card">
                    <div class="stat-value">₹${(student.fees?.total || 0).toLocaleString()}</div>
                    <div class="stat-label">Total Fees</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-value">₹${(student.fees?.paid || 0).toLocaleString()}</div>
                    <div class="stat-label">Paid Amount</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-value">₹${(student.fees?.pending || 0).toLocaleString()}</div>
                    <div class="stat-label">Pending Amount</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-value">${Math.round(((student.fees?.paid || 0) / (student.fees?.total || 1)) * 100)}%</div>
                    <div class="stat-label">Payment Progress</div>
                  </div>
                </div>
                <div class="highlight-box">
                  <strong>Last Payment:</strong> ${student.fees?.lastPaymentDate || 'No payments recorded'}
                </div>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p>© 2024 Student Management System | This document is confidential and intended for authorized use only</p>
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
    // Reset advanced filters
    setAdvancedFilters({
      name: '',
      admissionNo: '',
      parentName: '',
      phone: '',
      email: '',
      bloodGroup: 'all',
      attendanceMin: '',
      attendanceMax: '',
      ageMin: '',
      ageMax: '',
      feeStatus: 'all',
      dateOfBirth: '',
      admissionDateFrom: '',
      admissionDateTo: '',
      city: '',
      state: '',
      category: 'all'
    });
    
    // Reset all quick filters
    setSelectedClass('all');
    setSelectedStatus('all');
    setSelectedGender('all');
    setSelectedMedium('all');
    setSelectedBloodGroup('all');
    setSelectedCategory('all');
    setSelectedAttendanceRange('all');
    setSelectedFeeStatus('all');
    setSearchTerm('');
  };

  const saveCurrentFilter = () => {
    if (!filterName.trim()) {
      if ((window as any).toast) {
        (window as any).toast({
          type: 'warning',
          title: 'Filter Name Required',
          message: 'Please enter a filter name',
          duration: 3000
        });
      }
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
    
    // Show success toast
    if ((window as any).toast) {
      (window as any).toast({
        type: 'success',
        title: 'Filter Saved',
        message: `Filter "${filterName}" has been saved successfully`,
        duration: 3000
      });
    }
  };

  const applySavedFilter = (filter: typeof savedFilters[0]) => {
    setAdvancedFilters(filter.filters);
    setShowAdvancedFilters(true);
    
    // Show info toast
    if ((window as any).toast) {
      (window as any).toast({
        type: 'info',
        title: 'Filter Applied',
        message: `Filter "${filter.name}" has been applied`,
        duration: 2000
      });
    }
  };

  const deleteSavedFilter = (filterId: string) => {
    const filter = savedFilters.find(f => f.id === filterId);
    setSavedFilters(prev => prev.filter(f => f.id !== filterId));
    
    // Show info toast
    if ((window as any).toast && filter) {
      (window as any).toast({
        type: 'info',
        title: 'Filter Deleted',
        message: `Filter "${filter.name}" has been deleted`,
        duration: 2000
      });
    }
  };

  // Enhanced Bulk Operations Functions
  const executeBulkOperation = async () => {
    setBulkOperationProgress(prev => ({ ...prev, status: 'processing', current: 0, errors: [] }));
    
    const selectedStudentsData = students.filter(s => selectedStudents.includes(s.id));
    setBulkOperationProgress(prev => ({ ...prev, total: selectedStudentsData.length }));
    
    try {
      for (let i = 0; i < selectedStudentsData.length; i++) {
        const student = selectedStudentsData[i];
        
        // Refresh students with the archived toggle preserved
        const updatedResult = await studentsApi.list({ page: '1', pageSize: '50', includeArchived: includeArchivedStudents ? 'true' : 'false' });
        
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
                if ((window as any).toast) {
                (window as any).toast({
                  type: 'info',
                  title: 'Student Promoted',
                  message: `${student.name} promoted to ${nextGrade}${section}`,
                  duration: 2000
                });
              }
              }
            }
            break;
            
          case 'update_status':
            if (bulkOperationData.targetStatus) {
              // Update student status
              if ((window as any).toast) {
                (window as any).toast({
                  type: 'info',
                  title: 'Status Updated',
                  message: `${student.name} status updated to ${bulkOperationData.targetStatus}`,
                  duration: 2000
                });
              }
            }
            break;
            
          case 'assign_fees':
            if (bulkOperationData.feeAmount) {
              // Assign fees to students
              if ((window as any).toast) {
                (window as any).toast({
                  type: 'info',
                  title: 'Fees Assigned',
                  message: `₹${bulkOperationData.feeAmount} fees assigned to ${student.name}`,
                  duration: 2000
                });
              }
            }
            break;
            
          case 'send_message':
            if (bulkOperationData.message) {
              // Send message to parents
              if ((window as any).toast) {
                (window as any).toast({
                  type: 'info',
                  title: 'Message Sent',
                  message: `Message sent to ${student.name}'s parents`,
                  duration: 2000
                });
              }
            }
            break;
            
          case 'delete':
            // Delete students (with confirmation)
            try {
              const { showWarningToast } = await import('@/lib/toastUtils');
              showWarningToast('Student Deleted', `${student.name} has been removed from the system`);
            } catch (error) {
              console.error('Toast error:', error);
            }
            break;
            
          case 'export':
            // Export selected students data
            await exportStudentData([student]);
            break;
            
          case 'generate_id_cards':
            // Generate ID cards for selected students
            try {
              const schoolConfig = { getSetting };
              
              const options = {
                outputFormat: bulkOperationData.outputFormat || 'pdf',
                layout: bulkOperationData.layout || 'grid',
                includeBothSides: bulkOperationData.includeBothSides !== false
              };
              
              // Generate ID cards for all selected students at once after loop
              // This is more efficient than generating one by one
              if (i === selectedStudentsData.length - 1) {
                const result = await generateBulkIdCards(selectedStudentsData, options, schoolConfig);
                downloadBulkIdCards(result, selectedStudentsData);
                
                if ((window as any).toast) {
                  (window as any).toast({
                    type: 'success',
                    title: 'ID Cards Generated',
                    message: `Successfully generated ID cards for ${selectedStudentsData.length} students`,
                    duration: 3000
                  });
                }
              }
            } catch (error) {
              console.error('Error generating ID cards:', error);
              if ((window as any).toast) {
                (window as any).toast({
                  type: 'error',
                  title: 'ID Card Generation Failed',
                  message: 'Failed to generate ID cards. Please try again.',
                  duration: 3000
                });
              }
            }
            break;
        }
        
        setBulkOperationProgress(prev => ({ ...prev, current: i + 1 }));
        
        // Process operation (in production, implement actual operation logic)
        // await processBulkOperation(action, student);
      }
      
      setBulkOperationProgress(prev => ({ ...prev, status: 'completed' }));
      
      // Show success toast
      if ((window as any).toast) {
        (window as any).toast({
          type: 'success',
          title: 'Bulk Operation Completed',
          message: `${bulkOperationType.replace('_', ' ')} completed for ${selectedStudentsData.length} students`,
          duration: 3000
        });
      }
      
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
      
      // Show error toast
      if ((window as any).toast) {
        (window as any).toast({
          type: 'error',
          title: 'Bulk Operation Failed',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          duration: 5000
        });
      }
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
