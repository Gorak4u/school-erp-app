-- Update existing SMTP settings to use your schoolId
UPDATE "school"."SchoolSetting" 
SET "schoolId" = 'cmmrp6v3u000lcd56bw0u5txl' 
WHERE "group" = 'smtp';

-- Verify the update
SELECT * FROM "school"."SchoolSetting" 
WHERE "group" = 'smtp' AND "schoolId" = 'cmmrp6v3u000lcd56bw0u5txl';
