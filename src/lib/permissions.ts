// All available permissions in the system
export const ALL_PERMISSIONS = {
  // Dashboard
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_ADMIN_DASHBOARD: 'view_admin_dashboard', // Financial KPIs, analytics tabs

  // Students
  VIEW_STUDENTS: 'view_students',
  CREATE_STUDENTS: 'create_students',
  EDIT_STUDENTS: 'edit_students',
  DELETE_STUDENTS: 'delete_students',

  // Teachers
  VIEW_TEACHERS: 'view_teachers',
  CREATE_TEACHERS: 'create_teachers',
  EDIT_TEACHERS: 'edit_teachers',
  DELETE_TEACHERS: 'delete_teachers',

  // Attendance
  VIEW_ATTENDANCE: 'view_attendance',
  MANAGE_ATTENDANCE: 'manage_attendance',

  // Fees
  VIEW_FEES: 'view_fees',
  MANAGE_FEES: 'manage_fees',

  // Exams
  VIEW_EXAMS: 'view_exams',
  MANAGE_EXAMS: 'manage_exams',

  // Reports
  VIEW_REPORTS: 'view_reports',

  // Settings
  VIEW_SETTINGS: 'view_settings',
  MANAGE_SETTINGS: 'manage_settings',

  // User management
  VIEW_USERS: 'view_users',
  MANAGE_USERS: 'manage_users',

  // Announcements
  VIEW_ANNOUNCEMENTS: 'view_announcements',

  // Alumni
  VIEW_ALUMNI: 'view_alumni',

  // Student actions
  PROMOTE_STUDENTS: 'promote_students',

  // Expenses
  VIEW_EXPENSES: 'view_expenses',
  CREATE_EXPENSES: 'create_expenses',
  EDIT_EXPENSES: 'edit_expenses',
  DELETE_EXPENSES: 'delete_expenses',
  APPROVE_EXPENSES: 'approve_expenses',
  PAY_EXPENSES: 'pay_expenses',
  MANAGE_EXPENSE_CATEGORIES: 'manage_expense_categories',
  MANAGE_BUDGETS: 'manage_budgets',
  VIEW_EXPENSE_REPORTS: 'view_expense_reports',

  // Leave Management
  VIEW_LEAVE_BALANCE: 'view_leave_balance',
  APPLY_LEAVE: 'apply_leave',
  VIEW_OWN_LEAVE_HISTORY: 'view_own_leave_history',
  CANCEL_OWN_LEAVE: 'cancel_own_leave',
  APPROVE_DEPARTMENT_LEAVE: 'approve_department_leave',
  APPROVE_ALL_LEAVE: 'approve_all_leave',
  APPROVE_LONG_LEAVE: 'approve_long_leave',
  VIEW_DEPARTMENT_LEAVE_CALENDAR: 'view_department_leave_calendar',
  MANAGE_LEAVE_SETTINGS: 'manage_leave_settings',
  MANAGE_LEAVE_TYPES: 'manage_leave_types',
  VIEW_ALL_LEAVE_REPORTS: 'view_all_leave_reports',
  OVERRIDE_LEAVE_APPROVAL: 'override_leave_approval',
} as const;

export type Permission = (typeof ALL_PERMISSIONS)[keyof typeof ALL_PERMISSIONS];
export type BaseRole = 'admin' | 'teacher' | 'parent' | 'student';

// Human-readable labels for the UI
export const PERMISSION_LABELS: Record<string, string> = {
  view_dashboard: 'View Dashboard',
  view_admin_dashboard: 'View Admin Dashboard (Financial)',
  view_alumni: 'View Alumni',
  promote_students: 'Promote Students',
  view_students: 'View Students',
  create_students: 'Add Students',
  edit_students: 'Edit Students',
  delete_students: 'Delete Students',
  view_teachers: 'View Teachers',
  create_teachers: 'Add Teachers',
  edit_teachers: 'Edit Teachers',
  delete_teachers: 'Delete Teachers',
  view_attendance: 'View Attendance',
  manage_attendance: 'Manage Attendance',
  view_fees: 'View Fees',
  manage_fees: 'Manage Fees',
  view_exams: 'View Exams',
  manage_exams: 'Manage Exams',
  view_reports: 'View Reports',
  view_settings: 'View Settings',
  manage_settings: 'Manage Settings',
  view_users: 'View Users',
  manage_users: 'Manage Users',
  view_announcements: 'View Announcements',
  view_expenses: 'View Expenses',
  create_expenses: 'Create Expenses',
  edit_expenses: 'Edit Expenses',
  delete_expenses: 'Delete Expenses',
  approve_expenses: 'Approve Expenses',
  pay_expenses: 'Pay Expenses',
  manage_expense_categories: 'Manage Expense Categories',
  manage_budgets: 'Manage Budgets',
  view_expense_reports: 'View Expense Reports',
  view_leave_balance: 'View Leave Balance',
  apply_leave: 'Apply Leave',
  view_own_leave_history: 'View Own Leave History',
  cancel_own_leave: 'Cancel Own Leave',
  approve_department_leave: 'Approve Department Leave',
  approve_all_leave: 'Approve All Leave',
  approve_long_leave: 'Approve Long Leave',
  view_department_leave_calendar: 'View Department Leave Calendar',
  manage_leave_settings: 'Manage Leave Settings',
  manage_leave_types: 'Manage Leave Types',
  view_all_leave_reports: 'View All Leave Reports',
  override_leave_approval: 'Override Leave Approval',
};

// Permission groups for organized display in UI
export const PERMISSION_GROUPS = [
  {
    label: 'Dashboard',
    permissions: ['view_dashboard', 'view_admin_dashboard'] as Permission[],
  },
  {
    label: 'Students',
    permissions: ['view_students', 'create_students', 'edit_students', 'delete_students', 'promote_students'] as Permission[],
  },
  {
    label: 'Alumni',
    permissions: ['view_alumni'] as Permission[],
  },
  {
    label: 'Teachers',
    permissions: ['view_teachers', 'create_teachers', 'edit_teachers', 'delete_teachers'] as Permission[],
  },
  {
    label: 'Attendance',
    permissions: ['view_attendance', 'manage_attendance'] as Permission[],
  },
  {
    label: 'Fees',
    permissions: ['view_fees', 'manage_fees'] as Permission[],
  },
  {
    label: 'Expenses',
    permissions: ['view_expenses', 'create_expenses', 'edit_expenses', 'delete_expenses', 'approve_expenses', 'pay_expenses', 'manage_expense_categories', 'manage_budgets', 'view_expense_reports'] as Permission[],
  },
  {
    label: 'Exams',
    permissions: ['view_exams', 'manage_exams'] as Permission[],
  },
  {
    label: 'Reports',
    permissions: ['view_reports'] as Permission[],
  },
  {
    label: 'Settings & Users',
    permissions: ['view_settings', 'manage_settings', 'view_users', 'manage_users'] as Permission[],
  },
  {
    label: 'Communication',
    permissions: ['view_announcements'] as Permission[],
  },
  {
    label: 'Leave Management',
    permissions: [
      'view_leave_balance', 'apply_leave', 'view_own_leave_history', 'cancel_own_leave',
      'approve_department_leave', 'approve_all_leave', 'approve_long_leave',
      'view_department_leave_calendar', 'manage_leave_settings', 'manage_leave_types',
      'view_all_leave_reports', 'override_leave_approval'
    ] as Permission[],
  },
];

// Default permissions for built-in roles (backward compatibility)
export const DEFAULT_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: Object.values(ALL_PERMISSIONS) as Permission[],
  teacher: [
    'view_dashboard',
    'view_students',
    'view_attendance', 'manage_attendance',
    'view_exams',
    'view_fees',
    'view_expenses',
    'view_reports',
    'view_announcements',
    // Note: NO view_admin_dashboard (financial KPIs hidden)
    // Note: NO view_alumni (alumni page hidden)
    // Note: NO create/edit/delete/promote_students (read-only)
    // Note: NO manage_fees (view-only on fees page)
    // Note: NO create/edit/delete/approve/pay expenses (view-only on expenses page)
  ],
  parent: [
    'view_dashboard',
    'view_students',
    'view_attendance',
    'view_fees',
    'view_expenses',
    'view_reports',
    'view_announcements',
  ],
  student: [
    'view_dashboard',
    'view_attendance',
    'view_exams',
    'view_reports',
    'view_announcements',
  ],
};

export const BASE_ROLE_OPTIONS: Array<{ value: BaseRole; label: string }> = [
  { value: 'admin', label: 'School Admin' },
  { value: 'teacher', label: 'Teacher / Staff' },
  { value: 'parent', label: 'Parent' },
  { value: 'student', label: 'Student' },
];

export const PREDEFINED_ROLE_TEMPLATES: Array<{
  name: string;
  description: string;
  baseRole: BaseRole;
  permissions: Permission[];
  isDefault?: boolean;
}> = [
  {
    name: 'School Admin',
    description: 'Full school-level access across settings, users, academics, fees, reports, and operations.',
    baseRole: 'admin',
    permissions: [...DEFAULT_ROLE_PERMISSIONS.admin],
    isDefault: true,
  },
  {
    name: 'Teacher',
    description: 'Teaching staff access with view-oriented academic permissions and attendance management.',
    baseRole: 'teacher',
    permissions: [...DEFAULT_ROLE_PERMISSIONS.teacher],
    isDefault: true,
  },
  {
    name: 'Accountant',
    description: 'Finance-focused access for fee management, expense processing, and report visibility.',
    baseRole: 'admin',
    permissions: [
      ALL_PERMISSIONS.VIEW_DASHBOARD,
      ALL_PERMISSIONS.VIEW_STUDENTS,
      ALL_PERMISSIONS.VIEW_FEES,
      ALL_PERMISSIONS.MANAGE_FEES,
      ALL_PERMISSIONS.VIEW_REPORTS,
      ALL_PERMISSIONS.VIEW_EXPENSES,
      ALL_PERMISSIONS.CREATE_EXPENSES,
      ALL_PERMISSIONS.EDIT_EXPENSES,
      ALL_PERMISSIONS.APPROVE_EXPENSES,
      ALL_PERMISSIONS.PAY_EXPENSES,
      ALL_PERMISSIONS.MANAGE_EXPENSE_CATEGORIES,
      ALL_PERMISSIONS.MANAGE_BUDGETS,
      ALL_PERMISSIONS.VIEW_EXPENSE_REPORTS,
      ALL_PERMISSIONS.VIEW_ANNOUNCEMENTS,
    ],
  },
  {
    name: 'Receptionist',
    description: 'Front-desk access for admissions support, student records, and basic communication visibility.',
    baseRole: 'teacher',
    permissions: [
      ALL_PERMISSIONS.VIEW_DASHBOARD,
      ALL_PERMISSIONS.VIEW_STUDENTS,
      ALL_PERMISSIONS.CREATE_STUDENTS,
      ALL_PERMISSIONS.EDIT_STUDENTS,
      ALL_PERMISSIONS.VIEW_FEES,
      ALL_PERMISSIONS.VIEW_TEACHERS,
      ALL_PERMISSIONS.VIEW_ANNOUNCEMENTS,
    ],
  },
  {
    name: 'Parent',
    description: 'Parent access to student progress, fees, attendance, and school announcements.',
    baseRole: 'parent',
    permissions: [...DEFAULT_ROLE_PERMISSIONS.parent],
  },
  {
    name: 'Student',
    description: 'Student access to dashboard, attendance, exams, reports, and school announcements.',
    baseRole: 'student',
    permissions: [...DEFAULT_ROLE_PERMISSIONS.student],
  },
];

/**
 * Resolves the effective permissions for a user.
 * If user has a custom role, uses that. Otherwise falls back to built-in role defaults.
 */
export function resolvePermissions(
  builtInRole: string,
  customRolePermissions?: string | null
): Permission[] {
  if (customRolePermissions) {
    try {
      return JSON.parse(customRolePermissions) as Permission[];
    } catch {
      // fall through to default
    }
  }
  return DEFAULT_ROLE_PERMISSIONS[builtInRole] || DEFAULT_ROLE_PERMISSIONS['teacher'];
}

/**
 * Check if a permission list includes a given permission.
 */
export function hasPermission(permissions: Permission[], permission: Permission): boolean {
  return permissions.includes(permission);
}

export function hasPermissionByName(
  permissions: readonly string[] | null | undefined,
  permission: string
): boolean {
  return !!permissions?.includes(permission);
}

export function hasAnyPermissionByName(
  permissions: readonly string[] | null | undefined,
  requiredPermissions: readonly string[]
): boolean {
  return requiredPermissions.some((permission) => hasPermissionByName(permissions, permission));
}

export function isAdminLikeAccess(input: {
  role?: string | null;
  isSuperAdmin?: boolean | null;
  permissions?: readonly string[] | null;
}): boolean {
  return !!input.isSuperAdmin || input.role === 'admin' || hasPermissionByName(input.permissions, ALL_PERMISSIONS.MANAGE_SETTINGS);
}

export function canManageSettingsAccess(input: {
  role?: string | null;
  isSuperAdmin?: boolean | null;
  permissions?: readonly string[] | null;
}): boolean {
  return !!input.isSuperAdmin || input.role === 'admin' || hasPermissionByName(input.permissions, ALL_PERMISSIONS.MANAGE_SETTINGS);
}

export function canManageUsersAccess(input: {
  role?: string | null;
  isSuperAdmin?: boolean | null;
  permissions?: readonly string[] | null;
}): boolean {
  return !!input.isSuperAdmin
    || input.role === 'admin'
    || hasAnyPermissionByName(input.permissions, [ALL_PERMISSIONS.MANAGE_USERS, ALL_PERMISSIONS.MANAGE_SETTINGS]);
}

export function canManageRolesAccess(input: {
  role?: string | null;
  isSuperAdmin?: boolean | null;
  permissions?: readonly string[] | null;
}): boolean {
  return canManageUsersAccess(input);
}

export function canManageSubscriptionAccess(input: {
  role?: string | null;
  isSuperAdmin?: boolean | null;
  permissions?: readonly string[] | null;
}): boolean {
  return !!input.isSuperAdmin
    || input.role === 'admin'
    || hasAnyPermissionByName(input.permissions, [ALL_PERMISSIONS.MANAGE_SETTINGS, ALL_PERMISSIONS.MANAGE_USERS]);
}

export function canPromoteStudentsAccess(input: {
  role?: string | null;
  isSuperAdmin?: boolean | null;
  permissions?: readonly string[] | null;
}): boolean {
  return !!input.isSuperAdmin
    || input.role === 'admin'
    || hasPermissionByName(input.permissions, ALL_PERMISSIONS.PROMOTE_STUDENTS);
}

export function canLockStudentsAccess(input: {
  role?: string | null;
  isSuperAdmin?: boolean | null;
  permissions?: readonly string[] | null;
}): boolean {
  return canPromoteStudentsAccess(input)
    || hasAnyPermissionByName(input.permissions, [ALL_PERMISSIONS.EDIT_STUDENTS, ALL_PERMISSIONS.MANAGE_SETTINGS]);
}

export function canApproveDiscountsAccess(input: {
  role?: string | null;
  isSuperAdmin?: boolean | null;
  permissions?: readonly string[] | null;
}): boolean {
  return !!input.isSuperAdmin
    || input.role === 'admin'
    || hasPermissionByName(input.permissions, ALL_PERMISSIONS.MANAGE_FEES);
}
