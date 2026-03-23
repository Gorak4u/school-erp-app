ALTER TABLE "school"."Assignment"
ADD COLUMN IF NOT EXISTS "publishAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "dueAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "closeAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "audienceType" TEXT,
ADD COLUMN IF NOT EXISTS "gradingMode" TEXT,
ADD COLUMN IF NOT EXISTS "latePolicy" TEXT,
ADD COLUMN IF NOT EXISTS "visibilityScope" TEXT,
ADD COLUMN IF NOT EXISTS "publishedBy" TEXT,
ADD COLUMN IF NOT EXISTS "isScheduled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "templateId" TEXT;

ALTER TABLE "school"."AssignmentSubmission"
ADD COLUMN IF NOT EXISTS "schoolId" TEXT,
ADD COLUMN IF NOT EXISTS "submittedAtTs" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "attemptNo" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS "submissionType" TEXT,
ADD COLUMN IF NOT EXISTS "storagePath" TEXT,
ADD COLUMN IF NOT EXISTS "isLate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "plagiarismScore" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "gradedBy" TEXT,
ADD COLUMN IF NOT EXISTS "gradedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "score" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "feedbackJson" TEXT;

ALTER TABLE "school"."AttendanceRecord"
ADD COLUMN IF NOT EXISTS "schoolId" TEXT,
ADD COLUMN IF NOT EXISTS "attendanceDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "domain" TEXT,
ADD COLUMN IF NOT EXISTS "source" TEXT,
ADD COLUMN IF NOT EXISTS "derivedFromLeave" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "firstInAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "lastOutAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "workMinutes" INTEGER,
ADD COLUMN IF NOT EXISTS "attendanceSessionKey" TEXT,
ADD COLUMN IF NOT EXISTS "regularizationStatus" TEXT;

ALTER TABLE "school"."Notification"
ADD COLUMN IF NOT EXISTS "channel" TEXT,
ADD COLUMN IF NOT EXISTS "entityType" TEXT,
ADD COLUMN IF NOT EXISTS "entityId" TEXT,
ADD COLUMN IF NOT EXISTS "deliveryStatus" TEXT,
ADD COLUMN IF NOT EXISTS "templateKey" TEXT,
ADD COLUMN IF NOT EXISTS "dedupeKey" TEXT,
ADD COLUMN IF NOT EXISTS "scheduledAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "failedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "school"."AssignmentRecipient" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT,
  "assignmentId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "recipientStatus" TEXT NOT NULL DEFAULT 'assigned',
  "dueAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "lastNotifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssignmentRecipient_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "school"."AssignmentActivity" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT,
  "assignmentId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "actorTeacherId" TEXT,
  "activityType" TEXT NOT NULL,
  "metadata" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssignmentActivity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "school"."StaffAttendanceDailySummary" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT,
  "teacherId" TEXT NOT NULL,
  "attendanceDate" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'awaiting_activity',
  "derivedFromLeave" BOOLEAN NOT NULL DEFAULT false,
  "source" TEXT NOT NULL DEFAULT 'system',
  "firstInAt" TIMESTAMP(3),
  "lastOutAt" TIMESTAMP(3),
  "workMinutes" INTEGER,
  "leaveApplicationId" TEXT,
  "metadata" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StaffAttendanceDailySummary_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "school"."CommunicationOutbox" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT,
  "channel" TEXT NOT NULL,
  "templateKey" TEXT,
  "recipientUserId" TEXT,
  "recipientAddress" TEXT,
  "payloadJson" TEXT NOT NULL,
  "dedupeKey" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommunicationOutbox_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AssignmentRecipient_assignmentId_fkey'
  ) THEN
    ALTER TABLE "school"."AssignmentRecipient"
    ADD CONSTRAINT "AssignmentRecipient_assignmentId_fkey"
    FOREIGN KEY ("assignmentId") REFERENCES "school"."Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AssignmentRecipient_studentId_fkey'
  ) THEN
    ALTER TABLE "school"."AssignmentRecipient"
    ADD CONSTRAINT "AssignmentRecipient_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "school"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AssignmentActivity_assignmentId_fkey'
  ) THEN
    ALTER TABLE "school"."AssignmentActivity"
    ADD CONSTRAINT "AssignmentActivity_assignmentId_fkey"
    FOREIGN KEY ("assignmentId") REFERENCES "school"."Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

UPDATE "school"."Assignment"
SET "dueAt" = (NULLIF("dueDate", '')::date)::timestamp,
    "audienceType" = COALESCE("audienceType", CASE WHEN "sectionId" IS NULL THEN 'class' ELSE 'section' END),
    "gradingMode" = COALESCE("gradingMode", 'points'),
    "latePolicy" = COALESCE("latePolicy", 'allow_with_flag'),
    "visibilityScope" = COALESCE("visibilityScope", 'students_and_staff'),
    "publishedBy" = COALESCE("publishedBy", "teacherId")
WHERE "dueAt" IS NULL OR "audienceType" IS NULL OR "gradingMode" IS NULL OR "latePolicy" IS NULL OR "visibilityScope" IS NULL OR "publishedBy" IS NULL;

UPDATE "school"."AssignmentSubmission" s
SET "schoolId" = a."schoolId",
    "submittedAtTs" = CASE WHEN s."submittedAt" IS NOT NULL AND s."submittedAt" <> '' THEN (s."submittedAt"::date)::timestamp ELSE NULL END,
    "score" = COALESCE(s."score", s."marks")
FROM "school"."Assignment" a
WHERE s."assignmentId" = a."id"
  AND (s."schoolId" IS NULL OR s."submittedAtTs" IS NULL OR s."score" IS NULL);

UPDATE "school"."AttendanceRecord" ar
SET "schoolId" = s."schoolId",
    "attendanceDate" = CASE WHEN ar."date" IS NOT NULL AND ar."date" <> '' THEN (ar."date"::date)::timestamp ELSE NULL END,
    "domain" = COALESCE(ar."domain", 'student'),
    "source" = COALESCE(ar."source", 'manual'),
    "attendanceSessionKey" = COALESCE(ar."attendanceSessionKey", CONCAT(COALESCE(s."schoolId", 'school'), ':', COALESCE(ar."class", 'class'), ':', COALESCE(ar."section", 'section'), ':', COALESCE(ar."date", 'date'), ':', COALESCE(ar."subject", 'general')))
FROM "school"."Student" s
WHERE ar."studentId" = s."id"
  AND (ar."schoolId" IS NULL OR ar."attendanceDate" IS NULL OR ar."domain" IS NULL OR ar."source" IS NULL OR ar."attendanceSessionKey" IS NULL);

INSERT INTO "school"."AssignmentRecipient" (
  "id", "schoolId", "assignmentId", "studentId", "recipientStatus", "dueAt", "publishedAt", "createdAt", "updatedAt"
)
SELECT
  'asgrec_' || substr(md5(random()::text || clock_timestamp()::text || a."id" || st."id"), 1, 20),
  a."schoolId",
  a."id",
  st."id",
  'assigned',
  a."dueAt",
  COALESCE(a."publishAt", a."createdAt"),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "school"."Assignment" a
JOIN "school"."Student" st
  ON st."schoolId" = a."schoolId"
 AND st."status" = 'active'
 AND (st."class" = a."classId")
 AND (a."sectionId" IS NULL OR st."section" = a."sectionId")
WHERE NOT EXISTS (
  SELECT 1
  FROM "school"."AssignmentRecipient" existing
  WHERE existing."assignmentId" = a."id"
    AND existing."studentId" = st."id"
);

CREATE UNIQUE INDEX IF NOT EXISTS "AssignmentRecipient_assignmentId_studentId_key" ON "school"."AssignmentRecipient"("assignmentId", "studentId");
CREATE INDEX IF NOT EXISTS "AssignmentRecipient_assignmentId_idx" ON "school"."AssignmentRecipient"("assignmentId");
CREATE INDEX IF NOT EXISTS "AssignmentRecipient_studentId_idx" ON "school"."AssignmentRecipient"("studentId");
CREATE INDEX IF NOT EXISTS "AssignmentRecipient_schoolId_studentId_dueAt_idx" ON "school"."AssignmentRecipient"("schoolId", "studentId", "dueAt" DESC);
CREATE INDEX IF NOT EXISTS "AssignmentRecipient_schoolId_recipientStatus_dueAt_idx" ON "school"."AssignmentRecipient"("schoolId", "recipientStatus", "dueAt" DESC);

CREATE INDEX IF NOT EXISTS "Assignment_schoolId_status_dueAt_idx" ON "school"."Assignment"("schoolId", "status", "dueAt" DESC);
CREATE INDEX IF NOT EXISTS "Assignment_schoolId_teacherId_createdAt_idx" ON "school"."Assignment"("schoolId", "teacherId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Assignment_schoolId_classId_sectionId_dueAt_idx" ON "school"."Assignment"("schoolId", "classId", "sectionId", "dueAt" DESC);

CREATE INDEX IF NOT EXISTS "AssignmentSubmission_schoolId_assignmentId_submittedAtTs_idx" ON "school"."AssignmentSubmission"("schoolId", "assignmentId", "submittedAtTs" DESC);
CREATE INDEX IF NOT EXISTS "AssignmentSubmission_schoolId_studentId_submittedAtTs_idx" ON "school"."AssignmentSubmission"("schoolId", "studentId", "submittedAtTs" DESC);
CREATE INDEX IF NOT EXISTS "AssignmentSubmission_schoolId_status_submittedAtTs_idx" ON "school"."AssignmentSubmission"("schoolId", "status", "submittedAtTs" DESC);

CREATE INDEX IF NOT EXISTS "AssignmentActivity_assignmentId_occurredAt_idx" ON "school"."AssignmentActivity"("assignmentId", "occurredAt" DESC);
CREATE INDEX IF NOT EXISTS "AssignmentActivity_schoolId_activityType_occurredAt_idx" ON "school"."AssignmentActivity"("schoolId", "activityType", "occurredAt" DESC);

CREATE INDEX IF NOT EXISTS "AttendanceRecord_schoolId_idx" ON "school"."AttendanceRecord"("schoolId");
CREATE INDEX IF NOT EXISTS "AttendanceRecord_attendanceDate_idx" ON "school"."AttendanceRecord"("attendanceDate");
CREATE INDEX IF NOT EXISTS "AttendanceRecord_schoolId_attendanceDate_idx" ON "school"."AttendanceRecord"("schoolId", "attendanceDate");
CREATE INDEX IF NOT EXISTS "AttendanceRecord_schoolId_studentId_attendanceDate_idx" ON "school"."AttendanceRecord"("schoolId", "studentId", "attendanceDate" DESC);
CREATE INDEX IF NOT EXISTS "AttendanceRecord_schoolId_class_attendanceDate_idx" ON "school"."AttendanceRecord"("schoolId", "class", "attendanceDate" DESC);

CREATE UNIQUE INDEX IF NOT EXISTS "StaffAttendanceDailySummary_teacherId_attendanceDate_key" ON "school"."StaffAttendanceDailySummary"("teacherId", "attendanceDate");
CREATE INDEX IF NOT EXISTS "StaffAttendanceDailySummary_schoolId_attendanceDate_idx" ON "school"."StaffAttendanceDailySummary"("schoolId", "attendanceDate");
CREATE INDEX IF NOT EXISTS "StaffAttendanceDailySummary_schoolId_teacherId_attendanceDate_idx" ON "school"."StaffAttendanceDailySummary"("schoolId", "teacherId", "attendanceDate" DESC);
CREATE INDEX IF NOT EXISTS "StaffAttendanceDailySummary_schoolId_status_attendanceDate_idx" ON "school"."StaffAttendanceDailySummary"("schoolId", "status", "attendanceDate" DESC);

CREATE INDEX IF NOT EXISTS "Notification_schoolId_channel_deliveryStatus_idx" ON "school"."Notification"("schoolId", "channel", "deliveryStatus");
CREATE INDEX IF NOT EXISTS "Notification_dedupeKey_idx" ON "school"."Notification"("dedupeKey");

CREATE UNIQUE INDEX IF NOT EXISTS "CommunicationOutbox_channel_dedupeKey_key" ON "school"."CommunicationOutbox"("channel", "dedupeKey");
CREATE INDEX IF NOT EXISTS "CommunicationOutbox_status_nextAttemptAt_idx" ON "school"."CommunicationOutbox"("status", "nextAttemptAt");
CREATE INDEX IF NOT EXISTS "CommunicationOutbox_schoolId_status_nextAttemptAt_idx" ON "school"."CommunicationOutbox"("schoolId", "status", "nextAttemptAt");
