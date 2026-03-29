-- Create CommunicationTemplate table
CREATE TABLE IF NOT EXISTS "school"."CommunicationTemplate" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT,
    "htmlBody" TEXT,
    "textBody" TEXT,
    "smsBody" TEXT,
    "designSystem" TEXT,
    "primaryColor" TEXT,
    "accentColor" TEXT,
    "variablesSchema" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationTemplate_pkey" PRIMARY KEY ("id")
);

-- Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS "CommunicationTemplate_schoolId_key_key" ON "school"."CommunicationTemplate"("schoolId", "key");

-- Create other indexes
CREATE INDEX IF NOT EXISTS "CommunicationTemplate_schoolId_category_type_idx" ON "school"."CommunicationTemplate"("schoolId", "category", "type");
CREATE INDEX IF NOT EXISTS "CommunicationTemplate_isDefault_isActive_idx" ON "school"."CommunicationTemplate"("isDefault", "isActive");
