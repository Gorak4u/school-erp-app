-- Leave Management System Migration
-- This migration adds all tables for the comprehensive leave management system

-- Create LeaveType table
CREATE TABLE IF NOT EXISTS "LeaveType" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "maxDaysPerYear" DECIMAL(65,30),
    "isPaid" BOOLEAN NOT NULL DEFAULT true,
    "requiresDocument" BOOLEAN NOT NULL DEFAULT false,
    "accrualRate" DECIMAL(65,30),
    "canCarryForward" BOOLEAN NOT NULL DEFAULT true,
    "maxCarryForwardDays" DECIMAL(65,30),
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveType_pkey" PRIMARY KEY ("id")
);

-- Create LeaveBalance table
CREATE TABLE IF NOT EXISTS "LeaveBalance" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "totalAllocated" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "used" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "carriedForward" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "lastAccrualDate" TIMESTAMP(3),
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveBalance_pkey" PRIMARY KEY ("id")
);

-- Create LeaveApplication table
CREATE TABLE IF NOT EXISTS "LeaveApplication" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalDays" DECIMAL(65,30) NOT NULL,
    "reason" TEXT,
    "attachmentPath" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approverId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvalComments" TEXT,
    "rejectionReason" TEXT,
    "academicYearId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveApplication_pkey" PRIMARY KEY ("id")
);

-- Create LeaveApprovalHistory table
CREATE TABLE IF NOT EXISTS "LeaveApprovalHistory" (
    "id" TEXT NOT NULL,
    "leaveApplicationId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "comments" TEXT,
    "approverRole" TEXT,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveApprovalHistory_pkey" PRIMARY KEY ("id")
);

-- Create LeaveWorkflow table
CREATE TABLE IF NOT EXISTS "LeaveWorkflow" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "leaveTypeId" TEXT,
    "roleId" TEXT NOT NULL,
    "requiredPermission" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveWorkflow_pkey" PRIMARY KEY ("id")
);

-- Create LeaveSettings table
CREATE TABLE IF NOT EXISTS "LeaveSettings" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "autoApproveDays" INTEGER NOT NULL DEFAULT 1,
    "requireDocumentDays" INTEGER NOT NULL DEFAULT 3,
    "minStaffCoverage" INTEGER,
    "examPeriodRestriction" BOOLEAN NOT NULL DEFAULT true,
    "notificationEmails" TEXT,
    "workingDays" TEXT,
    "halfDayRules" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveSettings_pkey" PRIMARY KEY ("id")
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "LeaveType_schoolId_idx" ON "LeaveType"("schoolId");
CREATE INDEX IF NOT EXISTS "LeaveType_code_idx" ON "LeaveType"("code");
CREATE INDEX IF NOT EXISTS "LeaveBalance_staffId_idx" ON "LeaveBalance"("staffId");
CREATE INDEX IF NOT EXISTS "LeaveBalance_leaveTypeId_idx" ON "LeaveBalance"("leaveTypeId");
CREATE INDEX IF NOT EXISTS "LeaveBalance_academicYearId_idx" ON "LeaveBalance"("academicYearId");
CREATE INDEX IF NOT EXISTS "LeaveApplication_staffId_idx" ON "LeaveApplication"("staffId");
CREATE INDEX IF NOT EXISTS "LeaveApplication_leaveTypeId_idx" ON "LeaveApplication"("leaveTypeId");
CREATE INDEX IF NOT EXISTS "LeaveApplication_status_idx" ON "LeaveApplication"("status");
CREATE INDEX IF NOT EXISTS "LeaveApplication_academicYearId_idx" ON "LeaveApplication"("academicYearId");
CREATE INDEX IF NOT EXISTS "LeaveApprovalHistory_leaveApplicationId_idx" ON "LeaveApprovalHistory"("leaveApplicationId");
CREATE INDEX IF NOT EXISTS "LeaveWorkflow_schoolId_idx" ON "LeaveWorkflow"("schoolId");
CREATE INDEX IF NOT EXISTS "LeaveWorkflow_academicYearId_idx" ON "LeaveWorkflow"("academicYearId");
CREATE INDEX IF NOT EXISTS "LeaveSettings_schoolId_idx" ON "LeaveSettings"("schoolId");

-- Add unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "LeaveType_schoolId_code_key" ON "LeaveType"("schoolId", "code");
CREATE UNIQUE INDEX IF NOT EXISTS "LeaveBalance_staffId_leaveTypeId_academicYearId_key" ON "LeaveBalance"("staffId", "leaveTypeId", "academicYearId");
CREATE UNIQUE INDEX IF NOT EXISTS "LeaveSettings_schoolId_academicYearId_key" ON "LeaveSettings"("schoolId", "academicYearId");
