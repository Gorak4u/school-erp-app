-- Migration: Add FineWaiverRequest table for fine waiver approval system
-- Created: April 1, 2026

-- Create FineWaiverRequest table
CREATE TABLE IF NOT EXISTS "school"."FineWaiverRequest" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "schoolId" TEXT NOT NULL,
    "fineId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterEmail" TEXT,
    "reason" TEXT NOT NULL,
    "waiveAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "documents" TEXT,
    "status" TEXT NOT NULL,
    "reviewedBy" TEXT,
    "reviewedByName" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "FineWaiverRequest_schoolId_status_idx" ON "school"."FineWaiverRequest"("schoolId", "status");
CREATE INDEX IF NOT EXISTS "FineWaiverRequest_fineId_idx" ON "school"."FineWaiverRequest"("fineId");
CREATE INDEX IF NOT EXISTS "FineWaiverRequest_status_createdAt_idx" ON "school"."FineWaiverRequest"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "FineWaiverRequest_schoolId_createdAt_idx" ON "school"."FineWaiverRequest"("schoolId", "createdAt");
CREATE INDEX IF NOT EXISTS "FineWaiverRequest_requesterId_status_idx" ON "school"."FineWaiverRequest"("requesterId", "status");

-- Add foreign key constraint to Fine table
ALTER TABLE "school"."FineWaiverRequest" 
ADD CONSTRAINT "FineWaiverRequest_fineId_fkey" 
FOREIGN KEY ("fineId") REFERENCES "school"."Fine"("id") ON DELETE CASCADE;
