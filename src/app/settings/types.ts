// Types for Settings Page

export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface Board {
  id: string;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface Medium {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  academicYearId: string;
  classes?: any[];
}

export interface Class {
  id: string;
  name: string;
  code: string;
  level: string;
  isActive: boolean;
  academicYearId: string;
  mediumId: string;
}

export interface Section {
  id: string;
  name: string;
  code: string;
  classId: string;
  academicYearId: string;
  capacity: number;
  roomNumber: string;
  isActive: boolean;
}

export interface Timing {
  id: string;
  name: string;
  type: 'period' | 'break' | 'lunch' | 'assembly';
  startTime: string;
  endTime: string;
  dayOfWeek: string;
  sortOrder: number;
  isActive: boolean;
}

export interface FeeStructure {
  id: string;
  name: string;
  category?: string;
  amount: number;
  frequency?: string;
  dueDate?: number;
  lateFee?: number;
  description?: string;
  applicableCategories?: string;
  isActive: boolean;
  academicYearId: string;
  mediumId?: string;
  classId?: string;
}

export interface ModalData {
  type: string;
  title: string;
  message: string;
}

export interface LockDialogData {
  ay: AcademicYear;
  count: number;
  byAY: AcademicYear[];
  entity?: string;
  id?: string;
  name?: string;
  classCount?: number;
  feeStructureCount?: number;
  sectionCount?: number;
  mediumCount?: number;
  affectedClasses?: any[];
  affectedSections?: number;
  affectedFeeStructures?: number;
  deleting?: boolean;
}
