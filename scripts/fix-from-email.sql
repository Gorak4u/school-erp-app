-- Update the from_email to use the authenticated Gmail user
UPDATE "school"."SchoolSetting" 
SET "value" = 'gondagorakh@gmail.com' 
WHERE "schoolId" = 'cmmrp6v3u000lcd56bw0u5txl' 
AND "group" = 'smtp' 
AND "key" = 'from_email';
