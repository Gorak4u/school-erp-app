export interface StudentFormData {
  // Personal Information
  photo: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  placeOfBirth: string;
  nationality: string;
  bloodGroup: string;
  religion: string;
  category: string;
  motherTongue: string;
  stsId: string;
  aadharNumber: string;
  
  // Contact Information
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  
  // Academic Information
  admissionNo: string;
  admissionDate: string;
  classId: string;
  sectionId: string;
  class: string;  // Display name of class
  section: string;  // Display name of section
  rollNumber: string;
  mediumId: string;
  boardId: string;
  languageMedium: string;
  previousSchool: string;
  previousClass: string;
  
  // Parent Information
  fatherName: string;
  fatherPhone: string;
  fatherEmail: string;
  fatherOccupation: string;
  motherName: string;
  motherPhone: string;
  motherEmail: string;
  motherOccupation: string;
  
  // Additional Information
  medicalConditions: string;
  allergies: string;
  emergencyContact: string;
  emergencyPhone: string;
  emergencyRelation: string;
  gpa: number;
  status: string;
  
  // Bank Information
  bankAccountNumber: string;
  bankAccountName: string;
  bankName: string;
  bankIfsc: string;
  
  // Transport & Hostel
  transport: string;
  hostel: string;
  
  // Documents
  documents: {
    birthCertificate: boolean;
    aadharCard: boolean;
    transferCertificate: boolean;
    medicalCertificate: boolean;
    passportPhoto: boolean;
    marksheet: boolean;
    casteCertificate: boolean;
    incomeCertificate: boolean;
  };
  
  // Remarks
  remarks: string;
}

export interface FeeStructure {
  id: string;
  name: string;
  amount: number;
  category: string;
  boardId?: string;
  mediumId?: string;
  classId?: string;
}

export interface TransportRoute {
  id: string;
  name: string;
  pickupStops: string[];
  dropStops: string[];
  monthlyFee: number;
  yearlyFee: number;
}

export interface DiscountData {
  hasDiscount: boolean;
  discountCategory: string;
  discountType: 'percentage' | 'fixed' | 'full_waiver';
  discountValue: number;
  maxCapAmount: string;
  reason: string;
  validFrom: string;
  validTo: string;
}

export interface TransportInfo {
  routeId: string;
  pickupStop: string;
  dropStop: string;
  monthlyFee: number;
  yearlyFee: number;
}

export interface AIInsights {
  confidence: number;
  suggestions: string[];
  warnings: string[];
  recommendations: string[];
  processingTime: number;
}

export interface FormErrors {
  [key: string]: string;
}

export interface StudentFormAIProps {
  student?: any;
  onSubmit: (data: StudentFormData) => void;
  onCancel: () => void;
  theme: string;
  themeConfig: any;
  getCardClass: () => string;
  getInputClass: () => string;
  getBtnClass: (type?: 'primary' | 'secondary' | 'danger' | 'success') => string;
  getTextClass: (type?: 'primary' | 'secondary' | 'muted' | 'accent') => string;
}

export interface TabComponentProps {
  formData: StudentFormData;
  onChange: (field: string, value: any) => void;
  errors: FormErrors;
  theme: string;
  getInputClass: () => string;
  getTextClass: (type?: 'primary' | 'secondary' | 'muted' | 'accent') => string;
  readOnly?: boolean;
}

// Extended props for FeesTab to receive state from parent
export interface FeesTabProps extends TabComponentProps {
  // Fee related
  feeStructures: any[];
  feesLoading: boolean;
  applicableFeeStructures: any[];
  feeCategories: string[];
  feeCalcs: {
    baseTotal: number;
    discountAmount: number;
    finalTotal: number;
    savingsPercent: number;
    selected: any[];
  };
  tuitionAnnual: number;
  tuitionFinalTotal: number;
  
  // Discount related
  discountData: {
    hasDiscount: boolean;
    discountCategory: string;
    discountType: 'percentage' | 'fixed' | 'full_waiver';
    discountValue: number;
    maxCapAmount: string;
    reason: string;
    validFrom: string;
    validTo: string;
  };
  setDiscountData: (data: any) => void;
  selectedDiscountFeeIds: string[];
  setSelectedDiscountFeeIds: (ids: string[]) => void;
  
  // Transport related
  transportRoutes: any[];
  transportInfo: {
    routeId: string;
    pickupStop: string;
    dropStop: string;
    monthlyFee: number;
    yearlyFee: number;
    routeName?: string;
    routeNumber?: string;
  };
  setTransportInfo: (info: any) => void;
  transportDiscount: {
    hasDiscount: boolean;
    discountType: 'percentage' | 'fixed' | 'full_waiver';
    discountValue: number;
    reason: string;
  };
  setTransportDiscount: (discount: any) => void;
  selectedRoute: any;
  transportFeeCalcs: {
    baseAnnual: number;
    discountAmount: number;
    finalAnnual: number;
  };
  
  // Combined total
  combinedAnnual: number;
  
  // Helpers
  fmtCurrency: (amount: number) => string;
  activeAcademicYear: any;
}
