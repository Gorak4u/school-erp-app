// Temporary workaround for leave management models
// Using raw SQL queries until Prisma client generation is fixed

import { schoolPrisma } from './prisma';

export interface LeaveType {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  maxDaysPerYear: number | null;
  isPaid: boolean;
  requiresDocument: boolean;
  accrualRate: number | null;
  canCarryForward: boolean;
  maxCarryForwardDays: number | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaveBalance {
  id: string;
  staffId: string;
  leaveTypeId: string;
  academicYearId: string;
  totalAllocated: number;
  used: number;
  balance: number;
  carriedForward: number;
  lastAccrualDate: Date | null;
  schoolId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaveApplication {
  id: string;
  staffId: string;
  leaveTypeId: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string | null;
  attachmentPath: string | null;
  status: string;
  appliedAt: Date;
  approverId: string | null;
  approvedAt: Date | null;
  approvalComments: string | null;
  rejectionReason: string | null;
  academicYearId: string;
  schoolId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaveSettings {
  id: string;
  schoolId: string;
  academicYearId: string;
  autoApproveDays: number;
  requireDocumentDays: number;
  minStaffCoverage: number | null;
  examPeriodRestriction: boolean;
  notificationEmails: string | null;
  workingDays: string | null;
  halfDayRules: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Raw SQL helpers for leave management
export const leavePrisma = {
  // Leave Types
  async findLeaveTypes(where: any = {}, orderBy: any = {}) {
    const sql = `SELECT * FROM "LeaveType" WHERE 1=1 ORDER BY name ASC`;
    const result = await schoolPrisma.$queryRawUnsafe(sql);
    return result as LeaveType[];
  },

  async createLeaveType(data: Partial<LeaveType>) {
    const fields = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    
    const sql = `INSERT INTO "LeaveType" (${fields}) VALUES (${placeholders}) RETURNING *`;
    const result = await schoolPrisma.$queryRawUnsafe(sql, ...values);
    return (result as LeaveType[])[0];
  },

  // Leave Applications
  async findLeaveApplications(where: any = {}, orderBy: any = {}, include: any = {}) {
    let sql = `SELECT la.*, lt.name as leaveTypeName, lt.code as leaveTypeCode, t.name as staffName, t.email as staffEmail FROM "LeaveApplication" la`;
    sql += ` LEFT JOIN "LeaveType" lt ON la."leaveTypeId" = lt.id`;
    sql += ` LEFT JOIN "Teacher" t ON la."staffId" = t.id`;
    sql += ` WHERE 1=1`;
    sql += ` ORDER BY la."appliedAt" DESC`;
    
    const result = await schoolPrisma.$queryRawUnsafe(sql);
    return result as any[];
  },

  async createLeaveApplication(data: Partial<LeaveApplication>) {
    const fields = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    
    const sql = `INSERT INTO "LeaveApplication" (${fields}) VALUES (${placeholders}) RETURNING *`;
    const result = await schoolPrisma.$queryRawUnsafe(sql, ...values);
    return (result as LeaveApplication[])[0];
  },

  // Leave Balance
  async findLeaveBalance(where: any = {}) {
    let sql = `SELECT lb.*, lt.name as leaveTypeName, lt.code as leaveTypeCode FROM "LeaveBalance" lb`;
    sql += ` LEFT JOIN "LeaveType" lt ON lb."leaveTypeId" = lt.id`;
    sql += ` WHERE 1=1`;
    
    if (where.staffId) sql += ` AND lb."staffId" = '${where.staffId}'`;
    if (where.leaveTypeId) sql += ` AND lb."leaveTypeId" = '${where.leaveTypeId}'`;
    if (where.academicYearId) sql += ` AND lb."academicYearId" = '${where.academicYearId}'`;
    if (where.schoolId) sql += ` AND lb."schoolId" = '${where.schoolId}'`;
    
    const result = await schoolPrisma.$queryRawUnsafe(sql);
    return result as any[];
  },

  // Leave Settings
  async findLeaveSettings(where: any = {}) {
    let sql = `SELECT * FROM "LeaveSettings" WHERE 1=1`;
    
    if (where.schoolId) sql += ` AND "schoolId" = '${where.schoolId}'`;
    if (where.academicYearId) sql += ` AND "academicYearId" = '${where.academicYearId}'`;
    
    const result = await schoolPrisma.$queryRawUnsafe(sql);
    return result as LeaveSettings[];
  },

  async upsertLeaveSettings(data: Partial<LeaveSettings>) {
    const { schoolId, academicYearId, ...updateData } = data;
    
    const sql = `
      INSERT INTO "LeaveSettings" ("schoolId", "academicYearId", ${Object.keys(updateData).join(', ')})
      VALUES ($1, $2, ${Object.keys(updateData).map((_, i) => `$${i + 3}`).join(', ')})
      ON CONFLICT ("schoolId", "academicYearId") 
      DO UPDATE SET ${Object.keys(updateData).map((key, i) => `"${key}" = $${i + 3}`).join(', ')}
      RETURNING *
    `;
    
    const values = [schoolId, academicYearId, ...Object.values(updateData)];
    const result = await schoolPrisma.$queryRawUnsafe(sql, ...values);
    return (result as LeaveSettings[])[0];
  },

  // Helper to execute raw SQL
  async executeRaw(sql: string, ...values: any[]) {
    return await schoolPrisma.$queryRawUnsafe(sql, ...values);
  }
};
