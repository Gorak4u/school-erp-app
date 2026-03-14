// All available permissions in the system
export const ALL_PERMISSIONS = {
  // Dashboard
  VIEW_DASHBOARD: 'view_dashboard',

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
} as const;

export type Permission = (typeof ALL_PERMISSIONS)[keyof typeof ALL_PERMISSIONS];

// Human-readable labels for the UI
export const PERMISSION_LABELS: Record<Permission, string> = {
  view_dashboard: 'View Dashboard',
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
};

// Permission groups for organized display in UI
export const PERMISSION_GROUPS = [
  {
    label: 'Dashboard',
    permissions: ['view_dashboard'] as Permission[],
  },
  {
    label: 'Students',
    permissions: ['view_students', 'create_students', 'edit_students', 'delete_students'] as Permission[],
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
    'view_reports',
    'view_announcements',
  ],
  parent: [
    'view_dashboard',
    'view_students',
    'view_attendance',
    'view_fees',
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
