-- CreateTable for DiscountRequest if not exists
CREATE TABLE IF NOT EXISTS "school"."DiscountRequest" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "discountType" TEXT NOT NULL,
    "discountValue" DOUBLE PRECISION NOT NULL,
    "maxCapAmount" DOUBLE PRECISION,
    "scope" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "feeStructureIds" TEXT NOT NULL DEFAULT '[]',
    "studentIds" TEXT NOT NULL DEFAULT '[]',
    "classIds" TEXT NOT NULL DEFAULT '[]',
    "sectionIds" TEXT NOT NULL DEFAULT '[]',
    "academicYear" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "supportingDoc" TEXT,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedBy" TEXT NOT NULL,
    "requestedByName" TEXT NOT NULL,
    "requestedByEmail" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedByName" TEXT,
    "approvedAt" TIMESTAMP(3),
    "appliedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscountRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable for DiscountRequestAuditLog if not exists
CREATE TABLE IF NOT EXISTS "school"."DiscountRequestAuditLog" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "discountRequestId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscountRequestAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable for DiscountApplication if not exists
CREATE TABLE IF NOT EXISTS "school"."DiscountApplication" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "discountRequestId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "feeRecordId" TEXT NOT NULL,
    "originalAmount" DOUBLE PRECISION NOT NULL,
    "discountAmount" DOUBLE PRECISION NOT NULL,
    "finalAmount" DOUBLE PRECISION NOT NULL,
    "appliedBy" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isReversed" BOOLEAN NOT NULL DEFAULT false,
    "reversedBy" TEXT,
    "reversedAt" TIMESTAMP(3),
    "reversalReason" TEXT,

    CONSTRAINT "DiscountApplication_pkey" PRIMARY KEY ("id")
);

-- Add indexes for DiscountRequest (optimized for 10M+ records)
CREATE INDEX IF NOT EXISTS "DiscountRequest_schoolId_status_idx" ON "school"."DiscountRequest"("schoolId", "status");
CREATE INDEX IF NOT EXISTS "DiscountRequest_schoolId_academicYear_idx" ON "school"."DiscountRequest"("schoolId", "academicYear");
CREATE INDEX IF NOT EXISTS "DiscountRequest_schoolId_scope_idx" ON "school"."DiscountRequest"("schoolId", "scope");
CREATE INDEX IF NOT EXISTS "DiscountRequest_schoolId_createdAt_idx" ON "school"."DiscountRequest"("schoolId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "DiscountRequest_analytics_composite_idx" ON "school"."DiscountRequest"("schoolId", "status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "DiscountRequest_schoolId_discountType_idx" ON "school"."DiscountRequest"("schoolId", "discountType");
CREATE INDEX IF NOT EXISTS "DiscountRequest_schoolId_requestedBy_idx" ON "school"."DiscountRequest"("schoolId", "requestedBy");
CREATE INDEX IF NOT EXISTS "DiscountRequest_schoolId_targetType_idx" ON "school"."DiscountRequest"("schoolId", "targetType");
CREATE INDEX IF NOT EXISTS "DiscountRequest_applied_discounts_idx" ON "school"."DiscountRequest"("schoolId", "discountValue") WHERE "status" = 'applied';
CREATE INDEX IF NOT EXISTS "DiscountRequest_schoolId_updatedAt_idx" ON "school"."DiscountRequest"("schoolId", "updatedAt");
CREATE INDEX IF NOT EXISTS "DiscountRequest_schoolId_idx" ON "school"."DiscountRequest"("schoolId");
CREATE INDEX IF NOT EXISTS "DiscountRequest_status_idx" ON "school"."DiscountRequest"("status");
CREATE INDEX IF NOT EXISTS "DiscountRequest_requestedBy_idx" ON "school"."DiscountRequest"("requestedBy");
CREATE INDEX IF NOT EXISTS "DiscountRequest_approvedBy_idx" ON "school"."DiscountRequest"("approvedBy");
CREATE INDEX IF NOT EXISTS "DiscountRequest_createdAt_idx" ON "school"."DiscountRequest"("createdAt");

-- Add indexes for DiscountRequestAuditLog
CREATE INDEX IF NOT EXISTS "DiscountRequestAuditLog_schoolId_idx" ON "school"."DiscountRequestAuditLog"("schoolId");
CREATE INDEX IF NOT EXISTS "DiscountRequestAuditLog_discountRequestId_idx" ON "school"."DiscountRequestAuditLog"("discountRequestId");
CREATE INDEX IF NOT EXISTS "DiscountRequestAuditLog_action_idx" ON "school"."DiscountRequestAuditLog"("action");
CREATE INDEX IF NOT EXISTS "DiscountRequestAuditLog_actorEmail_idx" ON "school"."DiscountRequestAuditLog"("actorEmail");
CREATE INDEX IF NOT EXISTS "DiscountRequestAuditLog_schoolId_createdAt_idx" ON "school"."DiscountRequestAuditLog"("schoolId", "createdAt");

-- Add indexes for DiscountApplication
CREATE INDEX IF NOT EXISTS "DiscountApplication_schoolId_idx" ON "school"."DiscountApplication"("schoolId");
CREATE INDEX IF NOT EXISTS "DiscountApplication_discountRequestId_idx" ON "school"."DiscountApplication"("discountRequestId");
CREATE INDEX IF NOT EXISTS "DiscountApplication_studentId_idx" ON "school"."DiscountApplication"("studentId");
CREATE INDEX IF NOT EXISTS "DiscountApplication_feeRecordId_idx" ON "school"."DiscountApplication"("feeRecordId");
CREATE INDEX IF NOT EXISTS "DiscountApplication_schoolId_isReversed_idx" ON "school"."DiscountApplication"("schoolId", "isReversed");
CREATE INDEX IF NOT EXISTS "DiscountApplication_schoolId_studentId_idx" ON "school"."DiscountApplication"("schoolId", "studentId");
CREATE INDEX IF NOT EXISTS "DiscountApplication_studentId_feeRecordId_idx" ON "school"."DiscountApplication"("studentId", "feeRecordId");

-- Add foreign keys if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'DiscountRequestAuditLog_discountRequestId_fkey'
    ) THEN
        ALTER TABLE "school"."DiscountRequestAuditLog" 
        ADD CONSTRAINT "DiscountRequestAuditLog_discountRequestId_fkey" 
        FOREIGN KEY ("discountRequestId") REFERENCES "school"."DiscountRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'DiscountApplication_discountRequestId_fkey'
    ) THEN
        ALTER TABLE "school"."DiscountApplication" 
        ADD CONSTRAINT "DiscountApplication_discountRequestId_fkey" 
        FOREIGN KEY ("discountRequestId") REFERENCES "school"."DiscountRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
