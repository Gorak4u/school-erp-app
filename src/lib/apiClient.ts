const BASE = '';

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
    console.error(`API Error: ${res.status} ${res.statusText}`, {
      path,
      status: res.status,
      statusText: res.statusText,
      data,
      headers: Object.fromEntries(res.headers.entries())
    });
    throw new Error(data.error || `API error ${res.status}`);
  }
  return data as T;
}

// ─── STUDENTS ─────────────────────────────────────────────────────────────────

export const studentsApi = {
  list: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<any>(`/api/students${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => request<any>(`/api/students/${id}`),
  create: (data: any) => request<any>('/api/students', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/api/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<any>(`/api/students/${id}`, { method: 'DELETE' }),
};

// ─── TEACHERS ─────────────────────────────────────────────────────────────────

export const teachersApi = {
  list: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<any>(`/api/teachers${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => request<any>(`/api/teachers/${id}`),
  create: (data: any) => request<any>('/api/teachers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/api/teachers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<any>(`/api/teachers/${id}`, { method: 'DELETE' }),
};

// ─── FEE STRUCTURES ───────────────────────────────────────────────────────────

export const feeStructuresApi = {
  list: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<any>(`/api/fees/structures${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => request<any>(`/api/fees/structures/${id}`),
  create: (data: any) => request<any>('/api/fees/structures', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/api/fees/structures/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<any>(`/api/fees/structures/${id}`, { method: 'DELETE' }),
  clone: (sourceAcademicYearId: string, targetAcademicYearId: string) =>
    request<any>('/api/fees/structures', { method: 'POST', body: JSON.stringify({ action: 'clone', sourceAcademicYearId, targetAcademicYearId }) }),
};

// ─── FEE RECORDS ─────────────────────────────────────────────────────────────

export const feeRecordsApi = {
  list: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<any>(`/api/fees/records${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => request<any>(`/api/fees/records/${id}`),
  create: (data: any) => request<any>('/api/fees/records', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/api/fees/records/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<any>(`/api/fees/records/${id}`, { method: 'DELETE' }),
};

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────

export const paymentsApi = {
  list: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<any>(`/api/fees/payments${qs ? `?${qs}` : ''}`);
  },
  process: (data: {
    feeRecordId: string;
    amount: number;
    paymentMethod: string;
    transactionId?: string;
    collectedBy?: string;
    remarks?: string;
  }) => request<any>('/api/fees/payments', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── DISCOUNTS ───────────────────────────────────────────────────────────────

export const discountsApi = {
  list: () => request<any>('/api/discounts'),
  create: (data: any) => request<any>('/api/discounts', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── ATTENDANCE ───────────────────────────────────────────────────────────────

export const attendanceApi = {
  list: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<any>(`/api/attendance${qs ? `?${qs}` : ''}`);
  },
  save: (data: any | any[]) =>
    request<any>('/api/attendance', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── EXAMS ────────────────────────────────────────────────────────────────────

export const examsApi = {
  list: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<any>(`/api/exams${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => request<any>(`/api/exams/${id}`),
  create: (data: any) => request<any>('/api/exams', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/api/exams/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<any>(`/api/exams/${id}`, { method: 'DELETE' }),
  getResults: (id: string) => request<any>(`/api/exams/${id}/results`),
  saveResults: (id: string, results: any[]) =>
    request<any>(`/api/exams/${id}/results`, { method: 'POST', body: JSON.stringify(results) }),
};

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

export const dashboardApi = {
  stats: () => request<any>('/api/dashboard'),
};

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: { firstName: string; lastName: string; email: string; password: string; role: string }) =>
    request<any>('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── SCHOOL STRUCTURE ────────────────────────────────────────────────────────

export const academicYearsApi = {
  list: () => request<any>('/api/school-structure/academic-years'),
  create: (data: any) => request<any>('/api/school-structure/academic-years', { method: 'POST', body: JSON.stringify(data) }),
  update: (data: any) => request<any>('/api/school-structure/academic-years', { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<any>(`/api/school-structure/academic-years?id=${id}`, { method: 'DELETE' }),
};

export const boardsApi = {
  list: () => request<any>('/api/school-structure/boards'),
  create: (data: any) => request<any>('/api/school-structure/boards', { method: 'POST', body: JSON.stringify(data) }),
  update: (data: any) => request<any>('/api/school-structure/boards', { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<any>(`/api/school-structure/boards?id=${id}`, { method: 'DELETE' }),
};

export const mediumsApi = {
  list: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<any>(`/api/school-structure/mediums${qs ? `?${qs}` : ''}`);
  },
  create: (data: any) => request<any>('/api/school-structure/mediums', { method: 'POST', body: JSON.stringify(data) }),
  update: (data: any) => request<any>('/api/school-structure/mediums', { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<any>(`/api/school-structure/mediums?id=${id}`, { method: 'DELETE' }),
};

export const classesApi = {
  list: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<any>(`/api/school-structure/classes${qs ? `?${qs}` : ''}`);
  },
  create: (data: any) => request<any>('/api/school-structure/classes', { method: 'POST', body: JSON.stringify(data) }),
  update: (data: any) => request<any>('/api/school-structure/classes', { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<any>(`/api/school-structure/classes?id=${id}`, { method: 'DELETE' }),
};

export const sectionsApi = {
  list: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<any>(`/api/school-structure/sections${qs ? `?${qs}` : ''}`);
  },
  create: (data: any) => request<any>('/api/school-structure/sections', { method: 'POST', body: JSON.stringify(data) }),
  update: (data: any) => request<any>('/api/school-structure/sections', { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<any>(`/api/school-structure/sections?id=${id}`, { method: 'DELETE' }),
};

export const schoolSettingsApi = {
  getByGroup: (group: string) => request<any>(`/api/school-structure/settings?group=${group}`),
  getAll: () => request<any>('/api/school-structure/settings'),
  upsert: (data: { group: string; key: string; value: string }) =>
    request<any>('/api/school-structure/settings', { method: 'POST', body: JSON.stringify(data) }),
  upsertBatch: (data: { group: string; settings: Record<string, string> }) =>
    request<any>('/api/school-structure/settings', { method: 'PUT', body: JSON.stringify(data) }),
};

export const schoolTimingsApi = {
  list: () => request<any>('/api/school-structure/timings'),
  create: (data: any) => request<any>('/api/school-structure/timings', { method: 'POST', body: JSON.stringify(data) }),
  update: (data: any) => request<any>('/api/school-structure/timings', { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<any>(`/api/school-structure/timings?id=${id}`, { method: 'DELETE' }),
};
