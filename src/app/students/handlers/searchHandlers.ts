// @ts-nocheck
import { Student } from '../types';

export function createSearchHandlers(ctx: any) {
  // Destructure all needed state from context
  const { advancedFilters, advancedSearch, attendanceFilter, editingStudent, selectedClass, selectedGender, selectedLanguage, selectedStatus, setAdvancedSearch, setEditingStudent, setShowAddModal, setStudents, showAdvancedFilters, students, searchTerm } = ctx;

  // Fuzzy matching function
  const fuzzyMatch = (text: string, query: string, threshold: number = 0.7): boolean => {
    if (!query) return true;
    if (!text) return false;
    
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    
    // Exact match
    if (textLower.includes(queryLower)) return true;
    
    // Levenshtein distance approximation
    const calculateSimilarity = (str1: string, str2: string): number => {
      const longer = str1.length > str2.length ? str1 : str2;
      const shorter = str1.length > str2.length ? str2 : str1;
      
      if (longer.length === 0) return 1.0;
      
      const editDistance = (s1: string, s2: string): number => {
        const costs = [];
        for (let i = 0; i <= s1.length; i++) {
          let lastValue = i;
          for (let j = 0; j <= s2.length; j++) {
            if (i === 0) {
              costs[j] = j;
            } else {
              if (j > 0) {
                let newValue = costs[j - 1];
                if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                  newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                }
                costs[j - 1] = lastValue;
                lastValue = newValue;
              }
            }
          }
          if (i > 0) costs[s2.length] = lastValue;
        }
        return costs[s2.length];
      };
      
      const distance = editDistance(longer, shorter);
      return (longer.length - distance) / longer.length;
    };
    
    return calculateSimilarity(textLower, queryLower) >= threshold;
  };

  // AI-powered search with recommendations
  const performAdvancedSearch = async (query: string) => {
    setAdvancedSearch(prev => ({ ...prev, isSearching: true, query }));
    
    // AI-powered search (in production, implement actual AI search API)
    // const aiResults = await performAISearch(query);
    
    // Update search analytics
    setAdvancedSearch(prev => ({
      ...prev,
      searchAnalytics: {
        ...prev.searchAnalytics,
        totalSearches: prev.searchAnalytics.totalSearches + 1
      }
    }));
    
    // Add to search history
    if (query && !advancedSearch.searchHistory.includes(query)) {
      setAdvancedSearch(prev => ({
        ...prev,
        searchHistory: [query, ...prev.searchHistory.slice(0, 9)]
      }));
    }
    
    // Enhanced AI-powered search logic
    const queryLower = query.toLowerCase();
    let results: Student[] = [];
    
    // Natural language processing for complex queries
    if (queryLower.includes('and') || queryLower.includes('or')) {
      // Handle compound queries
      const conditions = queryLower.split(/\s+(and|or)\s+/);
      const operators = queryLower.match(/\s+(and|or)\s+/g) || [];
      
      results = students.filter(student => {
        let conditionResults = conditions.map(condition => evaluateCondition(student, condition.trim()));
        
        // Apply operators
        let result = conditionResults[0];
        for (let i = 0; i < operators.length; i++) {
          const operator = operators[i].trim();
          if (operator === 'and') {
            result = result && conditionResults[i + 1];
          } else {
            result = result || conditionResults[i + 1];
          }
        }
        return result;
      });
    } else {
      // Simple queries
      results = students.filter(student => evaluateCondition(student, queryLower));
    }
    
    // Sort by relevance
    results.sort((a, b) => {
      const aScore = calculateRelevanceScore(a, queryLower);
      const bScore = calculateRelevanceScore(b, queryLower);
      return bScore - aScore;
    });
    
    setAdvancedSearch(prev => ({
      ...prev,
      recommendations: results.slice(0, 5),
      isSearching: false,
      searchAnalytics: {
        ...prev.searchAnalytics,
        averageResults: ((prev.searchAnalytics.averageResults * (prev.searchAnalytics.totalSearches - 1)) + results.length) / prev.searchAnalytics.totalSearches
      }
    }));
    
    return results;
  };

  const evaluateCondition = (student: Student, condition: string): boolean => {
    const attendance = student.attendance || {};
    const fees = student.fees || {};
    const academics = student.academics || {};
    const attendancePct = attendance.percentage ?? 0;
    const feesPending = fees.pending ?? 0;
    const gpa = academics.gpa ?? 0;
    const failedSubjects = academics.failedSubjects ?? 0;

    // Attendance conditions
    if (condition.includes('low attendance') || condition.includes('poor attendance')) {
      return attendancePct < 75;
    }
    
    if (condition.includes('high attendance') || condition.includes('good attendance') || condition.includes('excellent attendance')) {
      return attendancePct >= 90;
    }
    
    if (condition.includes('average attendance')) {
      return attendancePct >= 75 && attendancePct < 90;
    }
    
    // Fee conditions
    if (condition.includes('fee pending') || condition.includes('fees due') || condition.includes('outstanding') || condition.includes('defaulter')) {
      return feesPending > 0;
    }
    
    if (condition.includes('fee paid') || condition.includes('no pending') || condition.includes('cleared')) {
      return feesPending === 0;
    }
    
    if (condition.includes('overdue')) {
      return feesPending > 0 && fees.lastPaymentDate && new Date(fees.lastPaymentDate) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }
    
    // Class conditions
    if (condition.includes('class 10') || condition.includes('tenth') || condition.includes('grade 10')) {
      return student.class.includes('10');
    }
    
    if (condition.includes('class 12') || condition.includes('twelfth') || condition.includes('grade 12')) {
      return student.class.includes('12');
    }
    
    if (condition.includes('class 11') || condition.includes('eleventh') || condition.includes('grade 11')) {
      return student.class.includes('11');
    }
    
    if (condition.includes('class 9') || condition.includes('ninth') || condition.includes('grade 9')) {
      return student.class.includes('9');
    }
    
    // Section conditions
    if (condition.includes('section a') || condition.includes('sec a')) {
      return student.class.includes('A');
    }
    
    if (condition.includes('section b') || condition.includes('sec b')) {
      return student.class.includes('B');
    }
    
    // Status conditions
    if (condition.includes('active') || condition.includes('current') || condition.includes('enrolled')) {
      return student.status === 'active';
    }
    
    if (condition.includes('inactive') || condition.includes('not active') || condition.includes('suspended')) {
      return student.status === 'inactive' || student.status === 'suspended';
    }
    
    if (condition.includes('graduated') || condition.includes('passed out') || condition.includes('completed')) {
      return student.status === 'graduated';
    }
    
    if (condition.includes('transferred') || condition.includes('left')) {
      return student.status === 'transferred';
    }
    
    // Performance conditions
    if (condition.includes('high gpa') || condition.includes('top performer') || condition.includes('excellent') || condition.includes('brilliant')) {
      return gpa >= 3.5;
    }
    
    if (condition.includes('low gpa') || condition.includes('needs improvement') || condition.includes('poor performance') || condition.includes('struggling')) {
      return gpa < 2.5;
    }
    
    if (condition.includes('average gpa') || condition.includes('moderate') || condition.includes('okay')) {
      return gpa >= 2.5 && gpa < 3.5;
    }
    
    if (condition.includes('failed subjects') || condition.includes('backlog') || condition.includes('supplementary')) {
      return failedSubjects > 0;
    }
    
    // Gender conditions
    if (condition.includes('male') || condition.includes('boys')) {
      return student.gender === 'Male';
    }
    
    if (condition.includes('female') || condition.includes('girls')) {
      return student.gender === 'Female';
    }
    
    // Language conditions
    if (condition.includes('english medium') || condition.includes('english')) {
      return student.languageMedium === 'English';
    }
    
    if (condition.includes('hindi medium') || condition.includes('hindi')) {
      return student.languageMedium === 'Hindi';
    }
    
    if (condition.includes('regional medium') || condition.includes('regional')) {
      return student.languageMedium === 'Regional';
    }
    
    // Blood group conditions
    if (condition.includes('blood group')) {
      const bloodGroups = ['a+', 'a-', 'b+', 'b-', 'ab+', 'ab-', 'o+', 'o-'];
      for (const bg of bloodGroups) {
        if (condition.includes(bg)) {
          return student.bloodGroup.toUpperCase() === bg.toUpperCase();
        }
      }
    }
    
    // Location conditions
    if (condition.includes('delhi') || condition.includes('new delhi')) {
      return student.city.toLowerCase().includes('delhi') || student.state.toLowerCase().includes('delhi');
    }
    
    if (condition.includes('mumbai') || condition.includes('bombay')) {
      return student.city.toLowerCase().includes('mumbai') || student.city.toLowerCase().includes('bombay');
    }
    
    // Recent admissions
    if (condition.includes('new') || condition.includes('recent') || condition.includes('joined')) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Date(student.admissionDate) > thirtyDaysAgo;
    }
    
    // Name matching (fallback)
    const studentName = (student.name || '').toLowerCase();
    const parentName = ((student.fatherName || '') + ' ' + (student.motherName || '')).toLowerCase();
    
    if (studentName.includes(condition) || 
        parentName.includes(condition) ||
        (student.rollNo || '').includes(condition) ||
        (student.email || '').toLowerCase().includes(condition) ||
        (student.phone || '').includes(condition) ||
        (student.admissionNo || '').toLowerCase().includes(condition)) {
      return true;
    }
    
    return false;
  };

  const calculateRelevanceScore = (student: Student, query: string): number => {
    let score = 0;
    const queryLower = query.toLowerCase();
    
    // Exact name match gets highest score
    if (student.name.toLowerCase() === queryLower) score += 100;
    else if (student.name.toLowerCase().includes(queryLower)) score += 80;
    
    // Partial name match
    const nameWords = student.name.toLowerCase().split(' ');
    if (nameWords.some(word => word.includes(queryLower))) score += 60;
    
    // Roll number match
    if (student.rollNo.includes(queryLower)) score += 70;
    
    // Parent name match
    if (student.fatherName.toLowerCase().includes(queryLower) || 
        student.motherName.toLowerCase().includes(queryLower)) score += 50;
    
    // Class match
    if (student.class.toLowerCase().includes(queryLower)) score += 40;
    
    // Email/phone match
    if (student.email.toLowerCase().includes(queryLower) || 
        student.phone.includes(queryLower)) score += 30;
    
    // Performance-based scoring
    if (queryLower.includes('top') && student.academics.gpa >= 3.5) score += 20;
    if (queryLower.includes('improvement') && student.academics.gpa < 2.5) score += 20;
    if (queryLower.includes('attendance') && (student.attendance?.percentage ?? 0) >= 90) score += 15;
    
    return score;
  };

  const filteredStudents = students.filter(student => {
    let matchesSearch = true;
    
    if (advancedSearch.enabled && advancedSearch.query) {
      // Use AI-powered advanced search
      try {
        matchesSearch = evaluateCondition(student, advancedSearch.query.toLowerCase());
      } catch {
        matchesSearch = (student.name || '').toLowerCase().includes(advancedSearch.query.toLowerCase());
      }
    } else if (searchTerm && !showAdvancedFilters) {
      // Basic client-side text match (server already filtered, this catches stragglers)
      const q = searchTerm.toLowerCase();
      matchesSearch =
        (student.name || '').toLowerCase().includes(q) ||
        (student.rollNo || '').toLowerCase().includes(q) ||
        (student.class || '').toLowerCase().includes(q) ||
        (student.admissionNo || '').toLowerCase().includes(q) ||
        (student.fatherName || '').toLowerCase().includes(q) ||
        (student.motherName || '').toLowerCase().includes(q) ||
        (student.phone || '').includes(q) ||
        (student.email || '').toLowerCase().includes(q);
    }
    
    // Apply advanced filters if enabled
    if (showAdvancedFilters) {
      if (advancedFilters.name && !student.name.toLowerCase().includes(advancedFilters.name.toLowerCase())) {
        matchesSearch = false;
      }
      if (advancedFilters.admissionNo && !student.admissionNo.includes(advancedFilters.admissionNo)) {
        matchesSearch = false;
      }
      if (advancedFilters.parentName && 
          !student.fatherName.toLowerCase().includes(advancedFilters.parentName.toLowerCase()) &&
          !student.motherName.toLowerCase().includes(advancedFilters.parentName.toLowerCase())) {
        matchesSearch = false;
      }
      if (advancedFilters.phone && !student.phone.includes(advancedFilters.phone)) {
        matchesSearch = false;
      }
      if (advancedFilters.email && !student.email.toLowerCase().includes(advancedFilters.email.toLowerCase())) {
        matchesSearch = false;
      }
      if (advancedFilters.bloodGroup !== 'all' && student.bloodGroup !== advancedFilters.bloodGroup) {
        matchesSearch = false;
      }
      if (advancedFilters.attendanceMin && student.attendance.percentage < parseInt(advancedFilters.attendanceMin)) {
        matchesSearch = false;
      }
      if (advancedFilters.attendanceMax && student.attendance.percentage > parseInt(advancedFilters.attendanceMax)) {
        matchesSearch = false;
      }
      if (advancedFilters.feeStatus !== 'all') {
        if (advancedFilters.feeStatus === 'paid' && student.fees.pending > 0) matchesSearch = false;
        if (advancedFilters.feeStatus === 'pending' && student.fees.pending === 0) matchesSearch = false;
        if (advancedFilters.feeStatus === 'overdue' && student.fees.pending === 0) matchesSearch = false;
      }
      if (advancedFilters.dateOfBirth && student.dateOfBirth !== advancedFilters.dateOfBirth) {
        matchesSearch = false;
      }
      if (advancedFilters.admissionDateFrom && new Date(student.admissionDate) < new Date(advancedFilters.admissionDateFrom)) {
        matchesSearch = false;
      }
      if (advancedFilters.admissionDateTo && new Date(student.admissionDate) > new Date(advancedFilters.admissionDateTo)) {
        matchesSearch = false;
      }
      if (advancedFilters.city && !student.city.toLowerCase().includes(advancedFilters.city.toLowerCase())) {
        matchesSearch = false;
      }
      if (advancedFilters.state && !student.state.toLowerCase().includes(advancedFilters.state.toLowerCase())) {
        matchesSearch = false;
      }
      if (advancedFilters.category !== 'all') {
        if (advancedFilters.category === 'sc' && student.category !== 'SC') matchesSearch = false;
        if (advancedFilters.category === 'st' && student.category !== 'ST') matchesSearch = false;
        if (advancedFilters.category === 'obc' && student.category !== 'OBC') matchesSearch = false;
        if (advancedFilters.category === 'general' && student.category !== 'General') matchesSearch = false;
      }
    }
    
    const matchesClass = selectedClass === 'all' || student.class === selectedClass;
    const matchesStatus = selectedStatus === 'all' || student.status === selectedStatus;
    const matchesGender = selectedGender === 'all' || student.gender === selectedGender;
    const matchesLanguage = selectedLanguage === 'all' || student.languageMedium === selectedLanguage;
    
    let matchesAttendance = true;
    if (attendanceFilter === 'low') {
      matchesAttendance = student.attendance.percentage < 75;
    } else if (attendanceFilter === 'average') {
      matchesAttendance = student.attendance.percentage >= 75 && student.attendance.percentage < 90;
    } else if (attendanceFilter === 'high') {
      matchesAttendance = student.attendance.percentage >= 90;
    }
    
    return matchesSearch && matchesClass && matchesStatus && matchesGender && matchesLanguage && matchesAttendance;
  });


  const handleAddStudent = async (studentData: Partial<Student>) => {
    try {
      const { studentsApi } = await import('@/lib/apiClient');
      const { _discountInfo, ...cleanStudentData } = studentData as any;
      const result = await studentsApi.create(cleanStudentData);
      if (result.student) {
        // Create discount request if provided
        let discountCreated = false;
        if (_discountInfo?.hasDiscount) {
          try {
            const academicYear = result.student.academicYear ||
              `${new Date().getFullYear()}-${String(new Date().getFullYear() + 1).slice(2)}`;
            const discountRes = await fetch('/api/fees/discount-requests', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: `Discount for ${result.student.name}`,
                description: _discountInfo.reason,
                discountType: _discountInfo.discountType,
                discountValue: Number(_discountInfo.discountValue) || 0,
                maxCapAmount: _discountInfo.maxCapAmount ? Number(_discountInfo.maxCapAmount) : null,
                scope: 'student',
                targetType: 'individual',
                studentIds: [result.student.id],
                classIds: [],
                sectionIds: [],
                feeStructureIds: _discountInfo.feeStructureIds || [],
                academicYear,
                reason: _discountInfo.reason,
                validFrom: _discountInfo.validFrom,
                validTo: _discountInfo.validTo || null,
              }),
            });
            if (discountRes.ok) discountCreated = true;
            else console.error('Discount request failed:', await discountRes.text());
          } catch (discountErr) {
            console.error('Discount request creation failed:', discountErr);
          }
        }

        // Refresh the student list to get updated data
        const updatedResult = await studentsApi.list({ page: '1', pageSize: '50' });
        if (updatedResult.students) {
          setStudents(updatedResult.students);
        }
        setShowAddModal(false);
        if ((window as any).toast) {
          (window as any).toast({
            type: 'success',
            title: 'Student Added',
            message: discountCreated
              ? `${result.student.name} added (${result.student.admissionNo}). Discount request created & sent for approval.`
              : `${result.student.name} has been added successfully with admission number ${result.student.admissionNo}`,
            duration: 5000
          });
        }
      }
    } catch (err: any) {
      console.error('Failed to add student:', err);
      let errorMessage = 'Something went wrong';
      let isLimitError = false;
      
      // Check for subscription limit errors
      if (err.message.includes('limit reached') || err.message.includes('quota') || err.message.includes('upgrade')) {
        isLimitError = true;
        errorMessage = err.message || 'Student limit reached. Please upgrade your plan to add more students.';
      }
      // Provide more specific error messages
      else if (err.message.includes('Admission number')) {
        errorMessage = 'Admission number conflict. Please try again.';
      } else if (err.message.includes('required')) {
        errorMessage = 'Please fill in all required fields.';
      } else if (err.message.includes('email')) {
        errorMessage = 'Invalid email format.';
      } else if (err.message.includes('phone')) {
        errorMessage = 'Invalid phone number format.';
      }
      
      if ((window as any).toast) {
        (window as any).toast({
          type: isLimitError ? 'warning' : 'error',
          title: isLimitError ? 'Student Limit Reached' : 'Failed to Add Student',
          message: errorMessage,
          duration: isLimitError ? 6000 : 4000,
          ...(isLimitError && {
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
          })
        });
      }
    }
  };

  const handleEditStudent = async (studentData: Partial<Student>) => {
    if (!editingStudent?.id) return;
    try {
      const { studentsApi } = await import('@/lib/apiClient');
      const result = await studentsApi.update(editingStudent.id, studentData);
      if (result.student) {
        setStudents(students.map(s => s.id === editingStudent.id ? result.student : s));
        setEditingStudent(null);
        if ((window as any).toast) {
          (window as any).toast({
            type: 'success',
            title: 'Student Updated',
            message: `${result.student.name} has been updated successfully`,
            duration: 3000
          });
        }
      }
    } catch (err: any) {
      console.error('Failed to update student:', err);
      
      // Handle NEEDS_PROMOTION lock — student is from a previous AY
      if (err.status === 409 || err.message?.includes('NEEDS_PROMOTION') || err.message?.includes('locked')) {
        const ayInfo = err.currentAcademicYear ? ` (AY: ${err.currentAcademicYear})` : '';
        if ((window as any).toast) {
          (window as any).toast({
            type: 'warning',
            title: 'Student Record Locked',
            message: `This student${ayInfo} needs to be promoted to the current academic year before editing. Use the 🎓 Promote button.`,
            duration: 6000
          });
        }
        return;
      }

      let errorMessage = 'Something went wrong';
      if (err.message?.includes('not found')) {
        errorMessage = 'Student not found. Please refresh the page.';
      } else if (err.message?.includes('required')) {
        errorMessage = 'Please fill in all required fields.';
      }
      
      if ((window as any).toast) {
        (window as any).toast({
          type: 'error',
          title: 'Failed to Update Student',
          message: errorMessage,
          duration: 3000
        });
      }
    }
  };

  const handleDeleteStudent = async (id: number) => {
    try {
      const { studentsApi } = await import('@/lib/apiClient');
      await studentsApi.delete(id);
      setStudents(students.filter(s => s.id !== id));
      
      // Use centralized toast utility
      const { showSuccessToast } = await import('@/lib/toastUtils');
      showSuccessToast('Student Deleted', 'Student has been deleted successfully');
    } catch (err: any) {
      console.error('Failed to delete student:', err);
      let errorMessage = 'Something went wrong';
      
      if (err.message.includes('not found')) {
        errorMessage = 'Student not found. Please refresh the page.';
      } else if (err.message.includes('foreign key')) {
        errorMessage = 'Cannot delete student with existing records (fees, attendance, etc.).';
      }
      
      // Use centralized toast utility
      const { showErrorToast } = await import('@/lib/toastUtils');
      showErrorToast('Failed to Delete Student', errorMessage);
    }
  };


  return { fuzzyMatch, performAdvancedSearch, evaluateCondition, calculateRelevanceScore, filteredStudents, handleAddStudent, handleEditStudent, handleDeleteStudent };
}
