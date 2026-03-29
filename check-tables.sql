-- Run this in your Neon SQL console to check if messenger tables exist
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'school' 
AND table_name LIKE 'Messenger%'
ORDER BY table_name;
