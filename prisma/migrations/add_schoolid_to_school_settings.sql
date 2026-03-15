-- Add schoolId column to SchoolSetting table
ALTER TABLE "SchoolSetting" ADD COLUMN "schoolId" TEXT NOT NULL DEFAULT '';

-- Drop old unique constraint
ALTER TABLE "SchoolSetting" DROP CONSTRAINT IF EXISTS "SchoolSetting_group_key_unique";

-- Create new unique constraint with schoolId
ALTER TABLE "SchoolSetting" ADD CONSTRAINT "SchoolSetting_schoolId_group_key_unique" UNIQUE ("schoolId", "group", "key");

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "SchoolSetting_schoolId_idx" ON "SchoolSetting"("schoolId");

-- Note: You'll need to update existing records with appropriate schoolId values
-- This can be done through a data migration script or manually
