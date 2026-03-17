'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DropdownOption {
  value: string;
  label: string;
  [key: string]: any;
}

export interface AcademicYearData {
  id: string;
  year: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface BoardData {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface MediumData {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  academicYearId: string;
}

export interface ClassData {
  id: string;
  code: string;
  name: string;
  level: string;
  mediumId: string;
  academicYearId: string;
  isActive: boolean;
  medium?: MediumData;
  sections?: SectionData[];
}

export interface SectionData {
  id: string;
  code: string;
  name: string;
  classId: string;
  capacity: number;
  roomNumber?: string;
  isActive: boolean;
  class?: ClassData;
}

export interface TimingData {
  id: string;
  name: string;
  type: string;
  startTime: string;
  endTime: string;
  dayOfWeek: string;
  sortOrder: number;
  isActive: boolean;
}

export interface SchoolConfigDropdowns {
  academicYears: DropdownOption[];
  boards: DropdownOption[];
  mediums: DropdownOption[];
  classes: (DropdownOption & { mediumId: string; mediumName: string; level: string; code: string; academicYearId: string; sectionCount: number })[];
  sections: (DropdownOption & { classId: string; className: string; mediumName: string; capacity: number; roomNumber?: string; name: string; code: string })[];
  classNames: string[];
  classCodes: string[];
}

export interface SchoolConfigContextType {
  // Raw data from DB
  academicYears: AcademicYearData[];
  activeAcademicYear: AcademicYearData | null;
  boards: BoardData[];
  mediums: MediumData[];
  classes: ClassData[];
  sections: SectionData[];
  timings: TimingData[];
  settings: Record<string, Record<string, string>>;

  // Pre-built dropdown options
  dropdowns: SchoolConfigDropdowns;

  // Helpers
  loading: boolean;
  loaded: boolean;
  error: string | null;
  refresh: () => Promise<void>;

  // Convenience getters
  getSetting: (group: string, key: string, fallback?: string) => string;
  getClassesByMedium: (mediumId: string) => ClassData[];
  getSectionsByClass: (classId: string) => SectionData[];
  getClassDropdownByMedium: (mediumId: string) => DropdownOption[];
  getSectionDropdownByClass: (classId: string) => DropdownOption[];
  getMediumById: (id: string) => MediumData | undefined;
  getClassById: (id: string) => ClassData | undefined;
  getBoardById: (id: string) => BoardData | undefined;
}

const emptyDropdowns: SchoolConfigDropdowns = {
  academicYears: [],
  boards: [],
  mediums: [],
  classes: [],
  sections: [],
  classNames: [],
  classCodes: [],
};

const SchoolConfigContext = createContext<SchoolConfigContextType | undefined>(undefined);

interface SchoolConfigProviderProps {
  children: ReactNode;
}

export function SchoolConfigProvider({ children }: SchoolConfigProviderProps) {
  const [academicYears, setAcademicYears] = useState<AcademicYearData[]>([]);
  const [activeAcademicYear, setActiveAcademicYear] = useState<AcademicYearData | null>(null);
  const [boards, setBoards] = useState<BoardData[]>([]);
  const [mediums, setMediums] = useState<MediumData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [sections, setSections] = useState<SectionData[]>([]);
  const [timings, setTimings] = useState<TimingData[]>([]);
  const [settings, setSettings] = useState<Record<string, Record<string, string>>>({});
  const [dropdowns, setDropdowns] = useState<SchoolConfigDropdowns>(emptyDropdowns);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { status } = useSession();

  const refresh = useCallback(async () => {
    // Only fetch if authenticated
    if (status !== 'authenticated') {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/school-config');
      // 401 = unauthenticated (public page like /login) — skip silently
      if (res.status === 401) { setLoading(false); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      setAcademicYears(data.academicYears || []);
      setActiveAcademicYear(data.activeAcademicYear || null);
      setBoards(data.boards || []);
      setMediums(data.mediums || []);
      setClasses(data.classes || []);
      setSections(data.sections || []);
      setTimings(data.timings || []);
      setSettings(data.settings || {});
      setDropdowns(data.dropdowns || emptyDropdowns);
      setLoaded(true);
    } catch (e: any) {
      console.error('SchoolConfig load error:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { refresh(); }, [refresh]);

  // ─── Convenience getters ──────────────────────────────────────────────────
  const getSetting = useCallback(
    (group: string, key: string, fallback = '') => settings[group]?.[key] ?? fallback,
    [settings]
  );

  const getClassesByMedium = useCallback(
    (mediumId: string) => classes.filter(c => c.mediumId === mediumId),
    [classes]
  );

  const getSectionsByClass = useCallback(
    (classId: string) => sections.filter(s => s.classId === classId),
    [sections]
  );

  const getClassDropdownByMedium = useCallback(
    (mediumId: string): DropdownOption[] =>
      classes
        .filter(c => c.mediumId === mediumId)
        .map(c => ({ value: c.id, label: c.name })),
    [classes]
  );

  const getSectionDropdownByClass = useCallback(
    (classId: string): DropdownOption[] =>
      sections
        .filter(s => s.classId === classId)
        .map(s => ({ value: s.id, label: s.name })),
    [sections]
  );

  const getMediumById = useCallback(
    (id: string) => mediums.find(m => m.id === id),
    [mediums]
  );

  const getClassById = useCallback(
    (id: string) => classes.find(c => c.id === id),
    [classes]
  );

  const getBoardById = useCallback(
    (id: string) => boards.find(b => b.id === id),
    [boards]
  );

  return (
    <SchoolConfigContext.Provider value={{
      academicYears, activeAcademicYear, boards, mediums, classes, sections, timings, settings,
      dropdowns, loading, loaded, error, refresh,
      getSetting, getClassesByMedium, getSectionsByClass, getClassDropdownByMedium,
      getSectionDropdownByClass, getMediumById, getClassById, getBoardById,
    }}>
      {children}
    </SchoolConfigContext.Provider>
  );
}

// ─── Main hook ──────────────────────────────────────────────────────────────

export function useSchoolConfig() {
  const context = useContext(SchoolConfigContext);
  if (!context) throw new Error('useSchoolConfig must be used within SchoolConfigProvider');
  return context;
}

// ─── Convenience hooks ──────────────────────────────────────────────────────

export function useAcademicYears() {
  const { academicYears, activeAcademicYear, dropdowns } = useSchoolConfig();
  return { academicYears, activeAcademicYear, options: dropdowns.academicYears };
}

export function useBoards() {
  const { boards, dropdowns, getBoardById } = useSchoolConfig();
  return { boards, options: dropdowns.boards, getBoardById };
}

export function useMediums() {
  const { mediums, dropdowns, getMediumById } = useSchoolConfig();
  return { mediums, options: dropdowns.mediums, getMediumById };
}

export function useClasses(mediumId?: string) {
  const { classes, dropdowns, getClassesByMedium, getClassDropdownByMedium, getClassById } = useSchoolConfig();
  if (mediumId) {
    return {
      classes: getClassesByMedium(mediumId),
      options: getClassDropdownByMedium(mediumId),
      allClasses: classes,
      allOptions: dropdowns.classes,
      getClassById,
    };
  }
  return { classes, options: dropdowns.classes, allClasses: classes, allOptions: dropdowns.classes, getClassById };
}

export function useSections(classId?: string) {
  const { sections, dropdowns, getSectionsByClass, getSectionDropdownByClass } = useSchoolConfig();
  if (classId) {
    return {
      sections: getSectionsByClass(classId),
      options: getSectionDropdownByClass(classId),
      allSections: sections,
      allOptions: dropdowns.sections,
    };
  }
  return { sections, options: dropdowns.sections, allSections: sections, allOptions: dropdowns.sections };
}

export function useSchoolDetails() {
  const { getSetting } = useSchoolConfig();
  return {
    name: getSetting('school_details', 'name'),
    address: getSetting('school_details', 'address'),
    city: getSetting('school_details', 'city'),
    state: getSetting('school_details', 'state'),
    pincode: getSetting('school_details', 'pincode'),
    phone: getSetting('school_details', 'phone'),
    email: getSetting('school_details', 'email'),
    website: getSetting('school_details', 'website'),
    principal: getSetting('school_details', 'principal'),
    affiliation_no: getSetting('school_details', 'affiliation_no'),
    established: getSetting('school_details', 'established'),
    logo_url: getSetting('school_details', 'logo_url'),
  };
}

export function useFeeConfig() {
  const { getSetting } = useSchoolConfig();
  return {
    lateFeePerDay: parseFloat(getSetting('fee_config', 'late_fee_per_day', '0')),
    gracePeriodDays: parseInt(getSetting('fee_config', 'grace_period_days', '7')),
    autoAssignOnAdmission: getSetting('fee_config', 'auto_assign_on_admission', 'true') === 'true',
    receiptPrefix: getSetting('fee_config', 'receipt_prefix', 'REC'),
    academicYear: getSetting('fee_config', 'academic_year', '2024-25'),
  };
}

export function useAppConfig() {
  const { getSetting } = useSchoolConfig();
  return {
    attendanceAutoAbsent: getSetting('app_config', 'attendance_auto_absent', 'true') === 'true',
    smsNotifications: getSetting('app_config', 'sms_notifications', 'false') === 'true',
    emailNotifications: getSetting('app_config', 'email_notifications', 'true') === 'true',
    pushNotifications: getSetting('app_config', 'push_notifications', 'false') === 'true',
    defaultLanguage: getSetting('app_config', 'default_language', 'en'),
    dateFormat: getSetting('app_config', 'date_format', 'DD/MM/YYYY'),
    currency: getSetting('app_config', 'currency', 'INR'),
    currencySymbol: getSetting('app_config', 'currency_symbol', '₹'),
    paginationSize: parseInt(getSetting('app_config', 'pagination_size', '25')),
    sessionTimeoutMins: parseInt(getSetting('app_config', 'session_timeout_mins', '60')),
  };
}

export function useSchoolTimings() {
  const { timings } = useSchoolConfig();
  return {
    timings,
    periods: timings.filter(t => t.type === 'period'),
    breaks: timings.filter(t => t.type === 'break'),
    assemblies: timings.filter(t => t.type === 'assembly'),
  };
}

export function useAccessRights() {
  const { getSetting } = useSchoolConfig();
  return {
    adminModules: getSetting('access_rights', 'admin_modules', 'all').split(',').map(s => s.trim()),
    teacherModules: getSetting('access_rights', 'teacher_modules', '').split(',').map(s => s.trim()),
    studentModules: getSetting('access_rights', 'student_modules', '').split(',').map(s => s.trim()),
    parentModules: getSetting('access_rights', 'parent_modules', '').split(',').map(s => s.trim()),
    allowTeacherFeeCollection: getSetting('access_rights', 'allow_teacher_fee_collection', 'false') === 'true',
    allowStudentSelfRegistration: getSetting('access_rights', 'allow_student_self_registration', 'false') === 'true',
  };
}
