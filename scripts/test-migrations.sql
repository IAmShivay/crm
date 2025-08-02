-- Test script to verify database structure after migrations
-- Run this after applying all migrations to check for issues

-- Check if all required tables exist
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check foreign key constraints
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- Check for missing foreign key constraints that should exist
SELECT 'workspace_members.role_id should reference roles.id' as check_description,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'workspace_members_role_id_fkey'
        AND table_name = 'workspace_members'
    ) THEN 'PASS' 
    ELSE 'FAIL' 
  END as status;

SELECT 'workspaces.plan_id should reference plans.id' as check_description,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'workspaces_plan_id_fkey'
        AND table_name = 'workspaces'
    ) THEN 'PASS' 
    ELSE 'FAIL' 
  END as status;

-- Check if system roles exist
SELECT 'System roles should exist' as check_description,
  CASE 
    WHEN (SELECT COUNT(*) FROM roles WHERE is_system = true) >= 5 
    THEN 'PASS' 
    ELSE 'FAIL' 
  END as status;

-- Check if default plans exist
SELECT 'Default plans should exist' as check_description,
  CASE 
    WHEN (SELECT COUNT(*) FROM plans) >= 3 
    THEN 'PASS' 
    ELSE 'FAIL' 
  END as status;

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check for orphaned records
SELECT 'Check for orphaned workspace_members' as check_description,
  CASE 
    WHEN (
      SELECT COUNT(*) FROM workspace_members wm
      LEFT JOIN workspaces w ON wm.workspace_id = w.id
      WHERE w.id IS NULL
    ) = 0 THEN 'PASS'
    ELSE 'FAIL - Found orphaned workspace_members'
  END as status;

SELECT 'Check for workspace_members without roles' as check_description,
  CASE 
    WHEN (
      SELECT COUNT(*) FROM workspace_members wm
      LEFT JOIN roles r ON wm.role_id = r.id
      WHERE r.id IS NULL
    ) = 0 THEN 'PASS'
    ELSE 'FAIL - Found workspace_members without valid roles'
  END as status;

-- Check indexes on foreign key columns
SELECT 
  t.relname as table_name,
  i.relname as index_name,
  a.attname as column_name
FROM pg_class t,
     pg_class i,
     pg_index ix,
     pg_attribute a
WHERE t.oid = ix.indrelid
  AND i.oid = ix.indexrelid
  AND a.attrelid = t.oid
  AND a.attnum = ANY(ix.indkey)
  AND t.relkind = 'r'
  AND t.relname IN ('workspace_members', 'workspaces', 'leads', 'invitations', 'subscriptions')
ORDER BY t.relname, i.relname;

-- Summary report
SELECT 'MIGRATION TEST SUMMARY' as report_section;
SELECT 'Tables created: ' || COUNT(*) as summary 
FROM information_schema.tables 
WHERE table_schema = 'public';

SELECT 'Foreign keys created: ' || COUNT(*) as summary
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
  AND table_schema = 'public';

SELECT 'RLS policies created: ' || COUNT(*) as summary
FROM pg_policies 
WHERE schemaname = 'public';
