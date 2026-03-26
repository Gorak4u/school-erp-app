const BASE = '';

// Base API response interface
interface ApiResponse<T = any> {
  data?: T;
  students?: T[]; // For students API compatibility
  teacher?: T; // For teacher API compatibility
  user?: T; // For user API compatibility
  error?: string;
  success?: boolean;
  message?: string;
  total?: number;
  page?: number;
  pageSize?: number;
  createUserAccount?: boolean;
  temporaryPassword?: string;
}

// Common entity interfaces
interface Student {
  id: string;
  name: string;
  email: string;
  rollNumber?: string;
  classId?: string;
  sectionId?: string;
  schoolId: string;
  isActive: boolean;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  schoolId: string;
  isActive: boolean;
  status?: string;
  department?: string;
  designation?: string;
  phone?: string;
  address?: string;
  gender?: string;
  dateOfBirth?: string;
  subject?: string;
  qualification?: string;
  experience?: number | null;
  joiningDate?: string;
  photo?: string;
  salary?: number | null;
  bloodGroup?: string;
  aadharNumber?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankIfsc?: string;
  panNumber?: string;
  emergencyContact?: string;
  emergencyContactRelation?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  remarks?: string;
  isClassTeacher?: boolean;
}

interface FeeStructure {
  id: string;
  name: string;
  amount: number;
  academicYearId: string;
  schoolId: string;
}

interface FeeRecord {
  id: string;
  studentId: string;
  feeStructureId: string;
  amount: number;
  paidAmount: number;
  balance: number;
  status: string;
}

interface Exam {
  id: string;
  title: string;
  classId: string;
  academicYearId: string;
  schoolId: string;
  totalMarks?: number;
  passingMarks?: number;
  examDate?: string;
  duration?: number;
  instructions?: string;
}

interface Alumni {
  id: string;
  name: string;
  email: string;
  graduationYear: number;
  schoolId: string;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include', // Ensure cookies are sent
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    // Enhanced error logging for debugging
    console.error('API Error', {
      status: res.status,
      statusText: res.statusText,
      path,
      responseData: data,
      headers: Object.fromEntries(res.headers.entries())
    });
    
    // Create an error object with extra properties from the API response
    const error = new Error(data.error || `API error ${res.status}`) as Error & {
      code?: string;
      details?: any;
      counts?: any;
      status: number;
    };
    error.code = data.code;
    error.details = data.details;
    error.counts = data.counts;
    error.status = res.status;
    throw error;
  }
  return data as T;
}

// ─── STUDENTS ─────────────────────────────────────────────────────────────────

export const studentsApi = {
  list: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<ApiResponse<Student[]>>(`/api/students${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => request<ApiResponse<Student>>(`/api/students/${id}`),
  create: (data: Partial<Student>) => request<ApiResponse<Student>>('/api/students', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Student>) => request<ApiResponse<Student>>(`/api/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<ApiResponse<void>>(`/api/students/${id}`, { method: 'DELETE' }),
  promote: (data: Record<string, unknown>) => request<ApiResponse<void>>('/api/students/promote', { method: 'POST', body: JSON.stringify(data) }),
  bulkLock: (action: 'lock' | 'unlock' | 'preview', opts: Record<string, unknown> = {}) =>
    request<ApiResponse<void>>('/api/students/bulk-lock', { method: 'POST', body: JSON.stringify({ action, ...opts }) }),
  bulkLockStatus: () => request<ApiResponse<any>>('/api/students/bulk-lock'),
  exitPreview: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<ApiResponse<Student[]>>(`/api/students/exit${qs ? `?${qs}` : ''}`);
  },
  exit: (data: Record<string, unknown>) => request<ApiResponse<void>>('/api/students/exit', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── ALUMNI ───────────────────────────────────────────────────────────────────

export const alumniApi = {
  list: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<ApiResponse<Alumni[]>>(`/api/alumni${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => request<ApiResponse<Alumni>>(`/api/alumni/${id}`),
  update: (id: string, data: Partial<Alumni>) => request<ApiResponse<Alumni>>(`/api/alumni/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getDues: (id: string) => request<ApiResponse<any>>(`/api/alumni/${id}/dues`),
};

// ─── TEACHERS ─────────────────────────────────────────────────────────────────

export const teachersApi = {
  list: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<ApiResponse<Teacher[]>>(`/api/teachers${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => request<ApiResponse<Teacher>>(`/api/teachers/${id}`),
  create: (data: Partial<Teacher>) => request<ApiResponse<Teacher>>('/api/teachers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Teacher>) => request<ApiResponse<Teacher>>(`/api/teachers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<ApiResponse<void>>(`/api/teachers/${id}`, { method: 'DELETE' }),
};

// ─── FEE STRUCTURES ───────────────────────────────────────────────────────────

export const feeStructuresApi = {
  list: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<ApiResponse<FeeStructure[]>>(`/api/fees/structures${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => request<ApiResponse<FeeStructure>>(`/api/fees/structures/${id}`),
  create: (data: Partial<FeeStructure>) => request<ApiResponse<FeeStructure>>('/api/fees/structures', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<FeeStructure>) => request<ApiResponse<FeeStructure>>(`/api/fees/structures/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<ApiResponse<void>>(`/api/fees/structures/${id}`, { method: 'DELETE' }),
  clone: (sourceAcademicYearId: string, targetAcademicYearId: string) =>
    request<ApiResponse<FeeStructure>>('/api/fees/structures', { method: 'POST', body: JSON.stringify({ action: 'clone', sourceAcademicYearId, targetAcademicYearId }) }),
};

// ─── FEE RECORDS ─────────────────────────────────────────────────────────────

export const feeRecordsApi = {
  list: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<ApiResponse<FeeRecord[]>>(`/api/fees/records${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => request<ApiResponse<FeeRecord>>(`/api/fees/records/${id}`),
  create: (data: Partial<FeeRecord>) => request<ApiResponse<FeeRecord>>('/api/fees/records', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<FeeRecord>) => request<ApiResponse<FeeRecord>>(`/api/fees/records/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<ApiResponse<void>>(`/api/fees/records/${id}`, { method: 'DELETE' }),
};

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────

export const paymentsApi = {
  list: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<ApiResponse<any>>(`/api/fees/payments${qs ? `?${qs}` : ''}`);
  },
  process: (data: {
    feeRecordId: string;
    amount: number;
    paymentMethod: string;
    transactionId?: string;
    collectedBy?: string;
    remarks?: string;
  }) => request<ApiResponse<any>>('/api/fees/payments', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── DISCOUNTS ───────────────────────────────────────────────────────────────

export const discountsApi = {
  list: () => request<ApiResponse<any>>('/api/discounts'),
  create: (data: Record<string, unknown>) => request<ApiResponse<any>>('/api/discounts', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── ATTENDANCE ───────────────────────────────────────────────────────────────

export const attendanceApi = {
  list: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<ApiResponse<any>>(`/api/attendance${qs ? `?${qs}` : ''}`);
  },
  save: (data: Record<string, unknown> | Record<string, unknown>[]) =>
    request<ApiResponse<any>>('/api/attendance', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── EXAMS ────────────────────────────────────────────────────────────────────

export const examsApi = {
  list: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<ApiResponse<Exam[]>>(`/api/exams${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => request<ApiResponse<Exam>>(`/api/exams/${id}`),
  create: (data: Partial<Exam>) => request<ApiResponse<Exam>>('/api/exams', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Exam>) => request<ApiResponse<Exam>>(`/api/exams/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<ApiResponse<void>>(`/api/exams/${id}`, { method: 'DELETE' }),
  getResults: (id: string) => request<ApiResponse<any>>(`/api/exams/${id}/results`),
  saveResults: (id: string, results: Record<string, unknown>[]) =>
    request<ApiResponse<any>>(`/api/exams/${id}/results`, { method: 'POST', body: JSON.stringify(results) }),
};

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

export const dashboardApi = {
  stats: () => request<ApiResponse<any>>('/api/dashboard'),
};

// ─── AUTH ───────────────────────────────────────────────────────────────

export const authApi = {
  login: (credentials: { email: string; password: string }) => 
    request<ApiResponse<any>>('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  logout: () => request<ApiResponse<any>>('/api/auth/logout'),
  register: (data: Record<string, unknown>) => 
    request<ApiResponse<any>>('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  forgotPassword: (email: string) => 
    request<ApiResponse<any>>('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (data: { token: string; password: string }) => 
    request<ApiResponse<any>>('/api/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
  changePassword: (data: { currentPassword: string; newPassword: string }) => 
    request<ApiResponse<any>>('/api/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── REFUNDS ─────────────────────────────────────────────────────────────────

export const refundsApi = {
  list: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<ApiResponse<any>>(`/api/refunds${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => request<ApiResponse<any>>(`/api/refunds/${id}`),
  create: (data: Record<string, unknown>) => request<ApiResponse<any>>('/api/refunds', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) => request<ApiResponse<any>>(`/api/refunds/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<ApiResponse<void>>(`/api/refunds/${id}`, { method: 'DELETE' }),
};

// ─── SCHOOL STRUCTURE ────────────────────────────────────────────────────────

export const academicYearsApi = {
  list: () => request<ApiResponse<any>>('/api/school-structure/academic-years'),
  create: (data: Record<string, unknown>) => request<ApiResponse<any>>('/api/school-structure/academic-years', { method: 'POST', body: JSON.stringify(data) }),
  update: (data: Record<string, unknown>) => request<ApiResponse<any>>('/api/school-structure/academic-years', { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string, cascade: boolean = false) => {
    const qs = new URLSearchParams({ id, cascade: cascade.toString() }).toString();
    return request<ApiResponse<void>>(`/api/school-structure/academic-years?${qs}`, { method: 'DELETE' });
  },
};

export const boardsApi = {
  list: () => request<ApiResponse<any>>('/api/school-structure/boards'),
  create: (data: Record<string, unknown>) => request<ApiResponse<any>>('/api/school-structure/boards', { method: 'POST', body: JSON.stringify(data) }),
  update: (data: Record<string, unknown>) => request<ApiResponse<any>>('/api/school-structure/boards', { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string, cascade: boolean = false) => {
    const qs = new URLSearchParams({ id, cascade: cascade.toString() }).toString();
    return request<ApiResponse<void>>(`/api/school-structure/boards?${qs}`, { method: 'DELETE' });
  },
};

export const mediumsApi = {
  list: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<ApiResponse<any>>(`/api/school-structure/mediums${qs ? `?${qs}` : ''}`);
  },
  create: (data: Record<string, unknown>) => request<ApiResponse<any>>('/api/school-structure/mediums', { method: 'POST', body: JSON.stringify(data) }),
  update: (data: Record<string, unknown>) => request<ApiResponse<any>>('/api/school-structure/mediums', { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string, cascade: boolean = false) => {
    const qs = new URLSearchParams({ id, cascade: cascade.toString() }).toString();
    return request<ApiResponse<void>>(`/api/school-structure/mediums?${qs}`, { method: 'DELETE' });
  },
};

export const classesApi = {
  list: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<ApiResponse<any>>(`/api/school-structure/classes${qs ? `?${qs}` : ''}`);
  },
  create: (data: Record<string, unknown>) => request<ApiResponse<any>>('/api/school-structure/classes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) => request<ApiResponse<any>>('/api/school-structure/classes', { method: 'PUT', body: JSON.stringify({ id, ...data }) }),
  delete: (id: string, cascade: boolean = false) => {
    const qs = new URLSearchParams({ id, cascade: cascade.toString() }).toString();
    return request<ApiResponse<void>>(`/api/school-structure/classes?${qs}`, { method: 'DELETE' });
  },
};

export const sectionsApi = {
  list: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<ApiResponse<any>>(`/api/school-structure/sections${qs ? `?${qs}` : ''}`);
  },
  create: (data: Record<string, unknown>) => request<ApiResponse<any>>('/api/school-structure/sections', { method: 'POST', body: JSON.stringify(data) }),
  update: (data: Record<string, unknown>) => request<ApiResponse<any>>('/api/school-structure/sections', { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<ApiResponse<void>>(`/api/school-structure/sections?id=${id}`, { method: 'DELETE' }),
};

export const schoolSettingsApi = {
  getByGroup: (group: string) => request<ApiResponse<any>>(`/api/school-structure/settings?group=${group}`),
  getAll: () => request<ApiResponse<any>>('/api/school-structure/settings'),
  update: (group: string, key: string, value: string) =>
    request<ApiResponse<any>>('/api/school-structure/settings', { method: 'POST', body: JSON.stringify({ group, key, value }) }),
  upsert: (data: { group: string; key: string; value: string }) =>
    request<ApiResponse<any>>('/api/school-structure/settings', { method: 'POST', body: JSON.stringify(data) }),
  upsertBatch: (data: { group: string; settings: Record<string, string> }) =>
    request<ApiResponse<any>>('/api/school-structure/settings', { method: 'PUT', body: JSON.stringify(data) }),
};

export const schoolTimingsApi = {
  list: () => request<ApiResponse<any>>('/api/school-structure/timings'),
  create: (data: Record<string, unknown>) => request<ApiResponse<any>>('/api/school-structure/timings', { method: 'POST', body: JSON.stringify(data) }),
  update: (data: Record<string, unknown>) => request<ApiResponse<any>>('/api/school-structure/timings', { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<ApiResponse<void>>(`/api/school-structure/timings?id=${id}`, { method: 'DELETE' }),
};
