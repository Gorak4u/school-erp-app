// @ts-nocheck
import { Student } from '../types';
import { CLASSES } from '../data';

export function createSearchHandlers(ctx: any) {
  // Destructure all needed state from context
  const { advancedFilters, advancedSearch, attendanceFilter, editingStudent, selectedClass, selectedGender, selectedLanguage, selectedStatus, setAdvancedSearch, setEditingStudent, setShowAddModal, setStudents, showAdvancedFilters, students } = ctx;

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
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
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
    // Attendance conditions
    if (condition.includes('low attendance') || condition.includes('poor attendance')) {
      return student.attendance.percentage < 75;
    }
    
    if (condition.includes('high attendance') || condition.includes('good attendance') || condition.includes('excellent attendance')) {
      return student.attendance.percentage >= 90;
    }
    
    if (condition.includes('average attendance')) {
      return student.attendance.percentage >= 75 && student.attendance.percentage < 90;
    }
    
    // Fee conditions
    if (condition.includes('fee pending') || condition.includes('fees due') || condition.includes('outstanding')) {
      return student.fees.pending > 0;
    }
    
    if (condition.includes('fee paid') || condition.includes('no pending') || condition.includes('cleared')) {
      return student.fees.pending === 0;
    }
    
    if (condition.includes('overdue')) {
      return student.fees.pending > 0 && new Date(student.fees.lastPaymentDate) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
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
      return student.academics.gpa >= 3.5;
    }
    
    if (condition.includes('low gpa') || condition.includes('needs improvement') || condition.includes('poor performance') || condition.includes('struggling')) {
      return student.academics.gpa < 2.5;
    }
    
    if (condition.includes('average gpa') || condition.includes('moderate') || condition.includes('okay')) {
      return student.academics.gpa >= 2.5 && student.academics.gpa < 3.5;
    }
    
    if (condition.includes('failed subjects') || condition.includes('backlog') || condition.includes('supplementary')) {
      return student.academics.failedSubjects > 0;
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
    const studentName = student.name.toLowerCase();
    const parentName = (student.fatherName + ' ' + student.motherName).toLowerCase();
    
    if (studentName.includes(condition) || 
        parentName.includes(condition) ||
        student.rollNo.includes(condition) ||
        student.email.toLowerCase().includes(condition) ||
        student.phone.includes(condition)) {
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
    if (queryLower.includes('attendance') && student.attendance.percentage >= 90) score += 15;
    
    return score;
  };

  const filteredStudents = students.filter(student => {
    let matchesSearch = true;
    
    if (advancedSearch.enabled && advancedSearch.query) {
      // Use AI-powered advanced search
      matchesSearch = evaluateCondition(student, advancedSearch.query.toLowerCase());
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

  const classes = CLASSES;

  const handleAddStudent = (studentData: Partial<Student>) => {
    // Generate unique admission number starting with current year
    const currentYear = new Date().getFullYear();
    const sequenceNumber = String(students.length + 1).padStart(4, '0');
    const admissionNo = `${currentYear}${sequenceNumber}`;
    
    const newStudent: Student = {
      id: students.length + 1,
      name: studentData.name || '',
      email: studentData.email || '',
      photo: studentData.photo || '',
      class: studentData.class || '9A',
      rollNo: studentData.rollNo || '',
      phone: studentData.phone || '',
      grade: studentData.grade || 'A',
      status: 'active',
      admissionNo: admissionNo,
      dateOfBirth: '2008-01-01',
      gender: 'Male',
      address: '',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      enrollmentDate: new Date().toISOString().split('T')[0],
      board: 'CBSE',
      section: 'A',
      bloodGroup: 'O+',
      emergencyContact: '',
      medicalConditions: 'None',
      fees: {
        total: 50000,
        paid: 0,
        pending: 50000,
        lastPaymentDate: ''
      },
      academics: {
        gpa: 3.0,
        rank: students.length + 1,
        totalSubjects: 6,
        passedSubjects: 6,
        failedSubjects: 0
      },
      behavior: {
        disciplineScore: 80,
        incidents: 0,
        achievements: 0
      },
      attendance: {
        present: 0,
        absent: 0,
        late: 0,
        percentage: 95
      },
      documents: {
        birthCertificate: false,
        transferCertificate: false,
        medicalCertificate: false,
        aadharCard: false,
        passportPhoto: false,
        marksheet: false,
        casteCertificate: false,
        incomeCertificate: false
      },
      nationality: 'Indian',
      religion: '',
      category: '',
      motherTongue: '',
      city: '',
      state: '',
      pinCode: '',
      emergencyRelation: '',
      admissionDate: new Date().toISOString().split('T')[0],
      previousSchool: '',
      previousClass: '',
      transferCertificate: '',
      fatherName: '',
      fatherOccupation: '',
      fatherPhone: '',
      fatherEmail: '',
      motherName: '',
      motherOccupation: '',
      motherPhone: '',
      motherEmail: '',
      guardianName: '',
      guardianRelation: '',
      guardianPhone: '',
      allergies: '',
      medications: '',
      doctorName: '',
      doctorPhone: '',
      transport: 'No',
      transportRoute: '',
      hostel: 'No',
      sibling: 'No',
      siblingName: '',
      siblingClass: '',
      
      // Additional Indian-specific fields
      aadharNumber: studentData.aadharNumber || '',
      stsId: studentData.stsId || '',
      
      // Language Medium
      languageMedium: studentData.languageMedium || 'English',
      
      // Bank details
      bankName: studentData.bankName || '',
      bankAccountNumber: studentData.bankAccountNumber || '',
      bankIfsc: studentData.bankIfsc || '',
      
      // Previous school details
      previousSchoolName: studentData.previousSchoolName || '',
      previousSchoolAddress: studentData.previousSchoolAddress || '',
      previousSchoolPhone: studentData.previousSchoolPhone || '',
      previousSchoolEmail: studentData.previousSchoolEmail || '',
      transferCertificateNumber: studentData.transferCertificateNumber || '',
      
      // Remarks
      remarks: studentData.remarks || ''
    };
    setStudents([...students, newStudent]);
    setShowAddModal(false);
  };

  const handleEditStudent = (studentData: Partial<Student>) => {
    setStudents(students.map(s => s.id === editingStudent?.id ? { ...s, ...studentData } : s));
    setEditingStudent(null);
  };

  const handleDeleteStudent = (id: number) => {
    setStudents(students.filter(s => s.id !== id));
  };


  return { fuzzyMatch, performAdvancedSearch, evaluateCondition, calculateRelevanceScore, filteredStudents, classes, handleAddStudent, handleEditStudent, handleDeleteStudent };
}
