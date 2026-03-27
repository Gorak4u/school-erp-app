export interface Student {
  id: string;
  name: string;
  admissionNo: string;
  class: string;
  section?: string;
  rollNo?: string;
  photo?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  phone?: string;
  email?: string;
  languageMedium?: string;
  address?: string;
  city?: string;
  state?: string;
  emergencyContact?: string;
  emergencyRelation?: string;
  category?: string;
  fatherName?: string;
  fatherPhone?: string;
  fatherEmail?: string;
  motherName?: string;
  motherPhone?: string;
  motherEmail?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  gpa?: number;
  rank?: string;
  attendance?: {
    present?: number;
    absent?: number;
    late?: number;
    percentage?: number;
  };
  disciplineScore?: number;
  achievements?: number;
  incidents?: number;
  admissionDate?: string;
  enrollmentDate?: string;
  academicYear?: string;
  remarks?: string;
  status?: string;
  needsPromotion?: boolean;
  fees?: {
    total?: number;
    paid?: number;
    pending?: number;
    discount?: number;
    lastPaymentDate?: string;
  };
  transport?: {
    id: string;
    routeId: string;
    pickupStop: string;
    dropStop: string;
    monthlyFee: number;
    isActive: boolean;
    route?: {
      id: string;
      name: string;
      routeNumber: string;
      driverName: string;
      driverPhone: string;
      capacity: number;
      stops: any;
      vehicleId: string;
    };
  };
  transportRoute?: string;
}

export interface RouteDetails {
  id: string;
  routeName: string;
  routeNumber: string;
  driverName: string;
  driverPhone: string;
  capacity: number;
  yearlyFee: number;
  monthlyFee: number;
}

export interface FeeData {
  totalFees?: number;
  totalPaid?: number;
  totalPending?: number;
  totalDiscount?: number;
  totalOverdue?: number;
  finesTotal?: number;
  finesPaid?: number;
  finesPending?: number;
  finesWaived?: number;
  pendingFinesCount?: number;
}

export interface StudentProfileModalProps {
  activeTab: string;
  selectedStudent: Student | null;
  theme: 'dark' | 'light';
  students?: Student[];
  includeArchivedStudents?: boolean;
  canEditStudents?: boolean;
  canPromoteStudents?: boolean;
  isAdmin?: boolean;
  onPromoteSingle?: (studentId: string) => void;
  onMarkExit?: (studentIds: string[]) => void;
  // Callback functions
  printStudentProfile: (student: Student) => void;
  sendStudentSMS: (student: Student) => void;
  setActiveTab: (tab: string) => void;
  setAcademicPerformance: (state: any) => void;
  setAttendanceTracking: (state: any) => void;
  setCommunicationCenter: (state: any) => void;
  setEditingStudent: (student: Student) => void;
  setFeeManagement: (state: any) => void;
  setParentPortal: (state: any) => void;
  setSelectedStudent: (student: Student | null) => void;
}

export interface ModalState {
  showFeeModal: boolean;
  selectedStudent?: Student;
}

export interface ProfileTab {
  id: string;
  label: string;
  icon: string;
}

export interface StudentInfoSection {
  title: string;
  fields: Array<{
    label: string;
    value: string | number | undefined;
    formatter?: (value: any) => string;
  }>;
}

export interface ActionButton {
  label: string;
  icon: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}
