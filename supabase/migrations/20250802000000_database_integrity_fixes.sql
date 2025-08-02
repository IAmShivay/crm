/*
  # Database Integrity and Relationship Fixes
  
  This migration addresses critical database relationship issues:
  1. Missing foreign key constraints
  2. Orphaned records cleanup
  3. Improved data consistency
  4. Performance optimizations
  5. Enhanced referential integrity
  
  ## Issues Fixed:
  - workspace_members.role_id missing FK constraint
  - workspaces.plan_id missing FK constraint  
  - Missing indexes on foreign key columns
  - Inconsistent cascade behaviors
  - Data integrity validation
*/

-- =====================================================
-- 1. DATA CLEANUP AND VALIDATION
-- =====================================================

-- Clean up orphaned workspace_members without valid roles
DELETE FROM workspace_members 
WHERE role_id IS NOT NULL 
  AND role_id NOT IN (SELECT id FROM roles);

-- Clean up orphaned invitations without valid roles
DELETE FROM invitations 
WHERE role_id NOT IN (SELECT id FROM roles);

-- Clean up orphaned leads without valid workspaces
DELETE FROM leads 
WHERE workspace_id NOT IN (SELECT id FROM workspaces);

-- Clean up orphaned activities without valid workspaces
DELETE FROM activities 
WHERE workspace_id NOT IN (SELECT id FROM workspaces);

-- Clean up orphaned webhook_endpoints without valid workspaces
DELETE FROM webhook_endpoints 
WHERE workspace_id NOT IN (SELECT id FROM workspaces);

-- Clean up orphaned subscriptions without valid workspaces
DELETE FROM subscriptions 
WHERE workspace_id NOT IN (SELECT id FROM workspaces);

-- =====================================================
-- 2. ADD MISSING FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Check if workspace_members.role_id foreign key exists (should be added in previous migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'workspace_members_role_id_fkey'
      AND table_name = 'workspace_members'
  ) THEN
    -- Set default role for members without roles
    UPDATE workspace_members
    SET role_id = (
      SELECT id FROM roles
      WHERE name = 'viewer' AND is_system = true
      LIMIT 1
    )
    WHERE role_id IS NULL;

    -- Add the constraint if it's missing
    ALTER TABLE workspace_members
    ADD CONSTRAINT workspace_members_role_id_fkey
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add workspaces.plan_id foreign key (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'workspaces_plan_id_fkey'
      AND table_name = 'workspaces'
  ) THEN
    -- Ensure all workspaces have valid plan_ids
    UPDATE workspaces 
    SET plan_id = 'free'
    WHERE plan_id IS NULL OR plan_id NOT IN (SELECT id FROM plans);
    
    -- Add the constraint
    ALTER TABLE workspaces 
    ADD CONSTRAINT workspaces_plan_id_fkey 
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =====================================================
-- 3. ADD MISSING INDEXES FOR PERFORMANCE
-- =====================================================

-- Foreign key indexes
CREATE INDEX IF NOT EXISTS idx_workspace_members_role_id ON workspace_members(role_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_user ON workspace_members(workspace_id, user_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_plan_id ON workspaces(plan_id);
CREATE INDEX IF NOT EXISTS idx_roles_workspace_id ON roles(workspace_id);
CREATE INDEX IF NOT EXISTS idx_invitations_role_id ON invitations(role_id);
CREATE INDEX IF NOT EXISTS idx_invitations_workspace_id ON invitations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_workspace_id ON subscriptions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);

-- Query optimization indexes
CREATE INDEX IF NOT EXISTS idx_leads_workspace_status ON leads(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to_status ON leads(assigned_to, status) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activities_workspace_entity ON activities(workspace_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_endpoint_status ON webhook_logs(webhook_endpoint_id, response_status);
CREATE INDEX IF NOT EXISTS idx_analytics_events_workspace_name ON analytics_events(workspace_id, event_name);

-- =====================================================
-- 4. IMPROVE DATA CONSTRAINTS
-- =====================================================

-- Ensure workspace_members always have a role
ALTER TABLE workspace_members 
ALTER COLUMN role_id SET NOT NULL;

-- Add check constraint for workspace member status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'workspace_members_status_check'
  ) THEN
    ALTER TABLE workspace_members 
    ADD CONSTRAINT workspace_members_status_check 
    CHECK (status IN ('pending', 'active', 'inactive', 'suspended'));
  END IF;
END $$;

-- Add check constraint for invitation status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'invitations_status_check'
  ) THEN
    ALTER TABLE invitations 
    ADD CONSTRAINT invitations_status_check 
    CHECK (status IN ('pending', 'accepted', 'expired', 'revoked'));
  END IF;
END $$;

-- =====================================================
-- 5. CREATE COMPREHENSIVE DATA INTEGRITY FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION check_database_integrity()
RETURNS TABLE(
  table_name text,
  issue_type text,
  issue_count bigint,
  description text
) AS $$
BEGIN
  -- Check for orphaned workspace_members
  RETURN QUERY
  SELECT 
    'workspace_members'::text, 
    'orphaned_workspace'::text, 
    COUNT(*),
    'Members referencing non-existent workspaces'::text
  FROM workspace_members wm
  LEFT JOIN workspaces w ON wm.workspace_id = w.id
  WHERE w.id IS NULL;
  
  -- Check for orphaned workspace_members roles
  RETURN QUERY
  SELECT 
    'workspace_members'::text, 
    'orphaned_role'::text, 
    COUNT(*),
    'Members referencing non-existent roles'::text
  FROM workspace_members wm
  LEFT JOIN roles r ON wm.role_id = r.id
  WHERE r.id IS NULL;
  
  -- Check for orphaned leads
  RETURN QUERY
  SELECT 
    'leads'::text, 
    'orphaned_workspace'::text, 
    COUNT(*),
    'Leads referencing non-existent workspaces'::text
  FROM leads l
  LEFT JOIN workspaces w ON l.workspace_id = w.id
  WHERE w.id IS NULL;
  
  -- Check for orphaned invitations
  RETURN QUERY
  SELECT 
    'invitations'::text, 
    'orphaned_role'::text, 
    COUNT(*),
    'Invitations referencing non-existent roles'::text
  FROM invitations i
  LEFT JOIN roles r ON i.role_id = r.id
  WHERE r.id IS NULL;
  
  -- Check for workspaces without valid plans
  RETURN QUERY
  SELECT 
    'workspaces'::text, 
    'invalid_plan'::text, 
    COUNT(*),
    'Workspaces with invalid plan references'::text
  FROM workspaces w
  LEFT JOIN plans p ON w.plan_id = p.id
  WHERE p.id IS NULL;
  
  -- Check for duplicate workspace slugs
  RETURN QUERY
  SELECT 
    'workspaces'::text, 
    'duplicate_slug'::text, 
    COUNT(*) - COUNT(DISTINCT slug),
    'Workspaces with duplicate slugs'::text
  FROM workspaces
  HAVING COUNT(*) > COUNT(DISTINCT slug);
  
END;
$$ language 'plpgsql';

-- =====================================================
-- 6. CREATE MAINTENANCE FUNCTIONS
-- =====================================================

-- Function to fix orphaned records
CREATE OR REPLACE FUNCTION fix_orphaned_records()
RETURNS text AS $$
DECLARE
  fixed_count integer := 0;
BEGIN
  -- Fix workspace_members without roles
  UPDATE workspace_members 
  SET role_id = (
    SELECT id FROM roles 
    WHERE name = 'viewer' AND is_system = true 
    LIMIT 1
  )
  WHERE role_id IS NULL;
  
  GET DIAGNOSTICS fixed_count = ROW_COUNT;
  
  RETURN 'Fixed ' || fixed_count || ' orphaned workspace member records';
END;
$$ language 'plpgsql';

-- Function to validate all foreign key relationships
CREATE OR REPLACE FUNCTION validate_foreign_keys()
RETURNS boolean AS $$
DECLARE
  integrity_issues integer;
BEGIN
  SELECT COUNT(*) INTO integrity_issues
  FROM check_database_integrity()
  WHERE issue_count > 0;
  
  RETURN integrity_issues = 0;
END;
$$ language 'plpgsql';

-- =====================================================
-- 7. FINAL VALIDATION
-- =====================================================

-- Run integrity check and display results
DO $$
DECLARE
  issue_record RECORD;
  total_issues integer := 0;
BEGIN
  RAISE NOTICE 'Running database integrity check...';
  
  FOR issue_record IN 
    SELECT * FROM check_database_integrity() WHERE issue_count > 0
  LOOP
    total_issues := total_issues + issue_record.issue_count;
    RAISE NOTICE 'ISSUE: % - % (% records): %', 
      issue_record.table_name, 
      issue_record.issue_type, 
      issue_record.issue_count,
      issue_record.description;
  END LOOP;
  
  IF total_issues = 0 THEN
    RAISE NOTICE 'Database integrity check passed! No issues found.';
  ELSE
    RAISE NOTICE 'Database integrity check found % total issues.', total_issues;
  END IF;
END $$;
