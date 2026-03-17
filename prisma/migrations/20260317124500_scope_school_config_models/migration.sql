ALTER TABLE "school"."AcademicYear" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;
ALTER TABLE "school"."Board" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;
ALTER TABLE "school"."Medium" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;
ALTER TABLE "school"."Class" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;
ALTER TABLE "school"."Section" ADD COLUMN IF NOT EXISTS "academicYearId" TEXT;
ALTER TABLE "school"."Section" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;
ALTER TABLE "school"."SchoolTiming" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;
ALTER TABLE "school"."Announcement" ADD COLUMN IF NOT EXISTS "schoolId" TEXT;

UPDATE "school"."Section" s
SET "academicYearId" = c."academicYearId"
FROM "school"."Class" c
WHERE s."classId" = c."id"
  AND s."academicYearId" IS NULL;

UPDATE "school"."AcademicYear" ay
SET "schoolId" = src."schoolId"
FROM (
  SELECT "academicYearId" AS id, MIN("schoolId") AS "schoolId"
  FROM "school"."Student"
  WHERE "academicYearId" IS NOT NULL AND "schoolId" IS NOT NULL
  GROUP BY "academicYearId"
) src
WHERE ay."id" = src.id
  AND ay."schoolId" IS NULL;

UPDATE "school"."AcademicYear" ay
SET "schoolId" = src."schoolId"
FROM (
  SELECT "academicYearId" AS id, MIN("schoolId") AS "schoolId"
  FROM "school"."FeeStructure"
  WHERE "academicYearId" IS NOT NULL AND "schoolId" IS NOT NULL
  GROUP BY "academicYearId"
) src
WHERE ay."id" = src.id
  AND ay."schoolId" IS NULL;

UPDATE "school"."AcademicYear" ay
SET "schoolId" = src."schoolId"
FROM (
  SELECT "academicYearId" AS id, MIN("schoolId") AS "schoolId"
  FROM "school"."LeaveSettings"
  WHERE "academicYearId" IS NOT NULL AND "schoolId" IS NOT NULL
  GROUP BY "academicYearId"
) src
WHERE ay."id" = src.id
  AND ay."schoolId" IS NULL;

UPDATE "school"."AcademicYear" ay
SET "schoolId" = src."schoolId"
FROM (
  SELECT "academicYearId" AS id, MIN("schoolId") AS "schoolId"
  FROM "school"."LeaveWorkflow"
  WHERE "academicYearId" IS NOT NULL AND "schoolId" IS NOT NULL
  GROUP BY "academicYearId"
) src
WHERE ay."id" = src.id
  AND ay."schoolId" IS NULL;

UPDATE "school"."AcademicYear" ay
SET "schoolId" = src."schoolId"
FROM (
  SELECT "academicYearId" AS id, MIN("schoolId") AS "schoolId"
  FROM "school"."LeaveApplication"
  WHERE "academicYearId" IS NOT NULL AND "schoolId" IS NOT NULL
  GROUP BY "academicYearId"
) src
WHERE ay."id" = src.id
  AND ay."schoolId" IS NULL;

UPDATE "school"."AcademicYear" ay
SET "schoolId" = src."schoolId"
FROM (
  SELECT "academicYearId" AS id, MIN("schoolId") AS "schoolId"
  FROM "school"."LeaveBalance"
  WHERE "academicYearId" IS NOT NULL AND "schoolId" IS NOT NULL
  GROUP BY "academicYearId"
) src
WHERE ay."id" = src.id
  AND ay."schoolId" IS NULL;

UPDATE "school"."AcademicYear" ay
SET "schoolId" = src."schoolId"
FROM (
  SELECT "academicYearId" AS id, MIN("schoolId") AS "schoolId"
  FROM "school"."TransportRoute"
  WHERE "academicYearId" IS NOT NULL AND "schoolId" IS NOT NULL
  GROUP BY "academicYearId"
) src
WHERE ay."id" = src.id
  AND ay."schoolId" IS NULL;

UPDATE "school"."Medium" m
SET "schoolId" = ay."schoolId"
FROM "school"."AcademicYear" ay
WHERE m."academicYearId" = ay."id"
  AND m."schoolId" IS NULL;

UPDATE "school"."Class" c
SET "schoolId" = COALESCE(m."schoolId", ay."schoolId")
FROM "school"."Medium" m
LEFT JOIN "school"."AcademicYear" ay ON ay."id" = m."academicYearId"
WHERE c."mediumId" = m."id"
  AND c."schoolId" IS NULL;

UPDATE "school"."Section" s
SET "schoolId" = COALESCE(c."schoolId", ay."schoolId")
FROM "school"."Class" c
LEFT JOIN "school"."AcademicYear" ay ON ay."id" = c."academicYearId"
WHERE s."classId" = c."id"
  AND s."schoolId" IS NULL;

UPDATE "school"."Board" b
SET "schoolId" = src."schoolId"
FROM (
  SELECT "boardId" AS id, MIN("schoolId") AS "schoolId"
  FROM "school"."FeeStructure"
  WHERE "boardId" IS NOT NULL AND "schoolId" IS NOT NULL
  GROUP BY "boardId"
) src
WHERE b."id" = src.id
  AND b."schoolId" IS NULL;

UPDATE "school"."AcademicYear"
SET "schoolId" = (SELECT id FROM "saas"."School" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "schoolId" IS NULL
  AND (SELECT COUNT(*) FROM "saas"."School") = 1;

UPDATE "school"."Board"
SET "schoolId" = (SELECT id FROM "saas"."School" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "schoolId" IS NULL
  AND (SELECT COUNT(*) FROM "saas"."School") = 1;

UPDATE "school"."Medium"
SET "schoolId" = (SELECT id FROM "saas"."School" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "schoolId" IS NULL
  AND (SELECT COUNT(*) FROM "saas"."School") = 1;

UPDATE "school"."Class"
SET "schoolId" = (SELECT id FROM "saas"."School" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "schoolId" IS NULL
  AND (SELECT COUNT(*) FROM "saas"."School") = 1;

UPDATE "school"."Section"
SET "schoolId" = (SELECT id FROM "saas"."School" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "schoolId" IS NULL
  AND (SELECT COUNT(*) FROM "saas"."School") = 1;

UPDATE "school"."SchoolTiming"
SET "schoolId" = (SELECT id FROM "saas"."School" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "schoolId" IS NULL
  AND (SELECT COUNT(*) FROM "saas"."School") = 1;

UPDATE "school"."Announcement"
SET "schoolId" = (SELECT id FROM "saas"."School" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "schoolId" IS NULL
  AND (SELECT COUNT(*) FROM "saas"."School") = 1;

INSERT INTO "school"."SchoolTiming" (
  "id", "name", "type", "startTime", "endTime", "dayOfWeek", "sortOrder", "isActive", "schoolId", "createdAt", "updatedAt"
)
SELECT
  'mig_' || substr(md5(random()::text || clock_timestamp()::text || s."id"), 1, 20),
  t."name",
  t."type",
  t."startTime",
  t."endTime",
  t."dayOfWeek",
  t."sortOrder",
  t."isActive",
  s."id",
  t."createdAt",
  t."updatedAt"
FROM "school"."SchoolTiming" t
CROSS JOIN "saas"."School" s
WHERE t."schoolId" IS NULL
  AND (SELECT COUNT(*) FROM "saas"."School") > 1
  AND NOT EXISTS (
    SELECT 1
    FROM "school"."SchoolTiming" existing
    WHERE existing."schoolId" = s."id"
      AND existing."name" = t."name"
      AND existing."type" = t."type"
      AND existing."dayOfWeek" = t."dayOfWeek"
      AND existing."startTime" = t."startTime"
      AND existing."endTime" = t."endTime"
  );

INSERT INTO "school"."Announcement" (
  "id", "title", "content", "type", "targetRoles", "isActive", "publishedAt", "expiresAt", "createdBy", "schoolId", "createdAt", "updatedAt"
)
SELECT
  'mig_' || substr(md5(random()::text || clock_timestamp()::text || s."id"), 1, 20),
  a."title",
  a."content",
  a."type",
  a."targetRoles",
  a."isActive",
  a."publishedAt",
  a."expiresAt",
  a."createdBy",
  s."id",
  a."createdAt",
  a."updatedAt"
FROM "school"."Announcement" a
CROSS JOIN "saas"."School" s
WHERE a."schoolId" IS NULL
  AND (SELECT COUNT(*) FROM "saas"."School") > 1
  AND NOT EXISTS (
    SELECT 1
    FROM "school"."Announcement" existing
    WHERE existing."schoolId" = s."id"
      AND existing."title" = a."title"
      AND existing."content" = a."content"
      AND existing."publishedAt" = a."publishedAt"
  );

DROP INDEX IF EXISTS "school"."AcademicYear_year_key";
DROP INDEX IF EXISTS "school"."Medium_code_key";
DROP INDEX IF EXISTS "school"."Class_code_key";
DROP INDEX IF EXISTS "school"."Section_code_key";
DROP INDEX IF EXISTS "school"."Board_code_key";

CREATE INDEX IF NOT EXISTS "AcademicYear_schoolId_idx" ON "school"."AcademicYear"("schoolId");
CREATE INDEX IF NOT EXISTS "AcademicYear_schoolId_isActive_idx" ON "school"."AcademicYear"("schoolId", "isActive");
CREATE UNIQUE INDEX IF NOT EXISTS "AcademicYear_schoolId_year_key" ON "school"."AcademicYear"("schoolId", "year");

CREATE INDEX IF NOT EXISTS "Medium_schoolId_idx" ON "school"."Medium"("schoolId");
CREATE INDEX IF NOT EXISTS "Medium_schoolId_academicYearId_idx" ON "school"."Medium"("schoolId", "academicYearId");
CREATE UNIQUE INDEX IF NOT EXISTS "Medium_schoolId_academicYearId_code_key" ON "school"."Medium"("schoolId", "academicYearId", "code");

CREATE INDEX IF NOT EXISTS "Class_schoolId_idx" ON "school"."Class"("schoolId");
CREATE INDEX IF NOT EXISTS "Class_schoolId_academicYearId_idx" ON "school"."Class"("schoolId", "academicYearId");
CREATE UNIQUE INDEX IF NOT EXISTS "Class_schoolId_academicYearId_code_key" ON "school"."Class"("schoolId", "academicYearId", "code");

CREATE INDEX IF NOT EXISTS "Section_schoolId_idx" ON "school"."Section"("schoolId");
CREATE INDEX IF NOT EXISTS "Section_academicYearId_idx" ON "school"."Section"("academicYearId");
CREATE INDEX IF NOT EXISTS "Section_schoolId_academicYearId_idx" ON "school"."Section"("schoolId", "academicYearId");
CREATE UNIQUE INDEX IF NOT EXISTS "Section_schoolId_academicYearId_code_key" ON "school"."Section"("schoolId", "academicYearId", "code");

CREATE INDEX IF NOT EXISTS "Board_schoolId_idx" ON "school"."Board"("schoolId");
CREATE UNIQUE INDEX IF NOT EXISTS "Board_schoolId_code_key" ON "school"."Board"("schoolId", "code");

CREATE INDEX IF NOT EXISTS "SchoolTiming_schoolId_idx" ON "school"."SchoolTiming"("schoolId");
CREATE INDEX IF NOT EXISTS "Announcement_schoolId_idx" ON "school"."Announcement"("schoolId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AcademicYear_schoolId_fkey'
  ) THEN
    ALTER TABLE "school"."AcademicYear"
    ADD CONSTRAINT "AcademicYear_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "saas"."School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Board_schoolId_fkey'
  ) THEN
    ALTER TABLE "school"."Board"
    ADD CONSTRAINT "Board_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "saas"."School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Medium_schoolId_fkey'
  ) THEN
    ALTER TABLE "school"."Medium"
    ADD CONSTRAINT "Medium_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "saas"."School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Class_schoolId_fkey'
  ) THEN
    ALTER TABLE "school"."Class"
    ADD CONSTRAINT "Class_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "saas"."School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Section_schoolId_fkey'
  ) THEN
    ALTER TABLE "school"."Section"
    ADD CONSTRAINT "Section_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "saas"."School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Section_academicYearId_fkey'
  ) THEN
    ALTER TABLE "school"."Section"
    ADD CONSTRAINT "Section_academicYearId_fkey"
    FOREIGN KEY ("academicYearId") REFERENCES "school"."AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'SchoolTiming_schoolId_fkey'
  ) THEN
    ALTER TABLE "school"."SchoolTiming"
    ADD CONSTRAINT "SchoolTiming_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "saas"."School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Announcement_schoolId_fkey'
  ) THEN
    ALTER TABLE "school"."Announcement"
    ADD CONSTRAINT "Announcement_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "saas"."School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
