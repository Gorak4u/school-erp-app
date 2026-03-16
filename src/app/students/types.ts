export interface Student {
  id: number;
  name: string;
  email: string;
  photo?: string; // Base64 encoded image or URL
  class: string;
  rollNo: string;
  phone: string;
  gpa: number;
  status: 'active' | 'inactive' | 'graduated' | 'transferred' | 'suspended' | 'locked';
  admissionNo: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  enrollmentDate: string;
  board: string;
  section: string;
  bloodGroup: string;
  emergencyContact: string;
  medicalConditions: string;
  fees: {
    total: number;
    paid: number;
    pending: number;
    lastPaymentDate: string;
  };
  academics: {
    gpa: number;
    rank: number;
    totalSubjects: number;
    passedSubjects: number;
    failedSubjects: number;
  };
  behavior: {
    disciplineScore: number;
    incidents: number;
    achievements: number;
  };
  attendance: {
    present: number;
    absent: number;
    late: number;
    percentage: number;
  };
  documents: {
    birthCertificate: boolean;
    transferCertificate: boolean;
    medicalCertificate: boolean;
    aadharCard: boolean;
    passportPhoto: boolean;
    marksheet: boolean;
    casteCertificate: boolean;
    incomeCertificate: boolean;
  };
  // Additional Indian school fields
  nationality: string;
  religion: string;
  category: string;
  motherTongue: string;
  city: string;
  state: string;
  pinCode: string;
  emergencyRelation: string;
  admissionDate: string;
  previousSchool: string;
  previousClass: string;
  transferCertificate: string;
  fatherName: string;
  fatherOccupation: string;
  fatherPhone: string;
  fatherEmail: string;
  motherName: string;
  motherOccupation: string;
  motherPhone: string;
  motherEmail: string;
  
  // Additional Indian-specific fields
  aadharNumber: string;
  stsId: string;
  
  // Language Medium
  languageMedium: string;
  
  // Hidden ID fields for form handling
  _mediumId?: string;
  _classId?: string;
  _sectionId?: string;
  
  // Bank details
  bankName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  
  // Previous school details
  previousSchoolName?: string;
  previousSchoolAddress?: string;
  previousSchoolPhone?: string;
  previousSchoolEmail?: string;
  transferCertificateNo?: string;
  
  // Academic year tracking
  academicYear?: string;         // string label, e.g. '2025-26'
  academicYearId?: string;       // FK id of the AcademicYear record
  needsPromotion?: boolean;      // true when academicYearId != active AY id

  // Remarks
  remarks?: string;
  guardianName: string;
  guardianRelation: string;
  guardianPhone: string;
  allergies: string;
  medications: string;
  doctorName: string;
  doctorPhone: string;
  transport: string;
  transportRoute: string;
  hostel: string;
  sibling: string;
  siblingName: string;
  siblingClass: string;
}
