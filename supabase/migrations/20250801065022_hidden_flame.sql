/*
  # Final Constraints and Performance Optimizations

  1. Additional Constraints
    - Email format validation
    - Phone format validation
    - URL format validation
    - Business logic constraints

  2. Performance Indexes
    - Composite indexes for common queries
    - Partial indexes for filtered queries
    - Text search indexes

  3. Final Triggers and Functions
    - Data validation functions
    - Performance monitoring
*/

-- Add email validation constraint
ALTER TABLE leads 
ADD CONSTRAINT valid_email 
CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE invitations 
ADD CONSTRAINT valid_invitation_email 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add phone validation constraint (basic international format)
ALTER TABLE leads 
ADD CONSTRAINT valid_phone 
CHECK (phone IS NULL OR phone ~* '^\+?[1-9]\d{1,14}$');

-- Add URL validation for webhook endpoints
ALTER TABLE webhook_endpoints 
ADD CONSTRAINT valid_webhook_url 
CHECK (url ~* '^https?://[^\s/$.?#].[^\s]*$');

-- Add workspace slug validation (alphanumeric and hyphens only)
ALTER TABLE workspaces 
ADD CONSTRAINT valid_slug 
CHECK (slug ~* '^[a-z0-9-]+$' AND length(slug) >= 3 AND length(slug) <= 50);

-- Add role name validation
ALTER TABLE roles 
ADD CONSTRAINT valid_role_name 
CHECK (length(name) >= 2 AND length(name) <= 50);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_leads_workspace_status ON leads(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_workspace_assigned ON leads(workspace_id, assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_workspace_created ON leads(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email_workspace ON leads(email, workspace_id) WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workspace_members_user_status ON workspace_members(user_id, status);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_role ON workspace_members(workspace_id, role_id);

CREATE INDEX IF NOT EXISTS idx_activities_workspace_created ON activities(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_entity_created ON activities(entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_created ON lead_activities(lead_id, created_at DESC);

-- Partial indexes for active records
CREATE INDEX IF NOT EXISTS idx_active_workspace_members ON workspace_members(workspace_id, user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_active_webhook_endpoints ON webhook_endpoints(workspace_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_pending_invitations ON invitations(workspace_id, email) WHERE status = 'pending';

-- Text search indexes for leads
CREATE INDEX IF NOT EXISTS idx_leads_name_search ON leads USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_leads_company_search ON leads USING gin(to_tsvector('english', company)) WHERE company IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_notes_search ON leads USING gin(to_tsvector('english', notes)) WHERE notes IS NOT NULL;

-- Function to validate workspace limits based on plan
CREATE OR REPLACE FUNCTION check_workspace_limits()
RETURNS TRIGGER AS $$
DECLARE
  plan_limits jsonb;
  current_count integer;
  limit_value integer;
BEGIN
  -- Get plan limits
  SELECT limits INTO plan_limits
  FROM plans p
  JOIN workspaces w ON p.id = w.plan_id
  WHERE w.id = NEW.workspace_id;

  IF plan_limits IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check lead limits
  IF TG_TABLE_NAME = 'leads' THEN
    limit_value := (plan_limits->>'leads')::integer;
    IF limit_value > 0 THEN
      SELECT COUNT(*) INTO current_count
      FROM leads
      WHERE workspace_id = NEW.workspace_id;
      
      IF current_count >= limit_value THEN
        RAISE EXCEPTION 'Lead limit exceeded for current plan. Upgrade to add more leads.';
      END IF;
    END IF;
  END IF;

  -- Check user limits
  IF TG_TABLE_NAME = 'workspace_members' THEN
    limit_value := (plan_limits->>'users')::integer;
    IF limit_value > 0 THEN
      SELECT COUNT(*) INTO current_count
      FROM workspace_members
      WHERE workspace_id = NEW.workspace_id AND status = 'active';
      
      IF current_count >= limit_value THEN
        RAISE EXCEPTION 'User limit exceeded for current plan. Upgrade to add more users.';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for limit checking
CREATE TRIGGER check_lead_limits
  BEFORE INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION check_workspace_limits();

CREATE TRIGGER check_user_limits
  BEFORE INSERT ON workspace_members
  FOR EACH ROW
  EXECUTE FUNCTION check_workspace_limits();

-- Function to clean up expired invitations
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
  UPDATE invitations
  SET status = 'expired'
  WHERE status = 'pending' 
    AND expires_at < now();
END;
$$ language 'plpgsql';

-- Function to get workspace statistics
CREATE OR REPLACE FUNCTION get_workspace_stats(p_workspace_id uuid)
RETURNS jsonb AS $$
DECLARE
  stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_leads', COUNT(DISTINCT l.id),
    'active_leads', COUNT(DISTINCT l.id) FILTER (WHERE l.status NOT IN ('closed_won', 'closed_lost')),
    'won_leads', COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'closed_won'),
    'total_revenue', COALESCE(SUM(l.value) FILTER (WHERE l.status = 'closed_won'), 0),
    'avg_deal_size', COALESCE(AVG(l.value) FILTER (WHERE l.status = 'closed_won'), 0),
    'conversion_rate', ROUND(
      COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'closed_won')::numeric / 
      NULLIF(COUNT(DISTINCT l.id) FILTER (WHERE l.status IN ('closed_won', 'closed_lost')), 0) * 100, 
      2
    ),
    'total_users', COUNT(DISTINCT wm.user_id) FILTER (WHERE wm.status = 'active'),
    'leads_this_month', COUNT(DISTINCT l.id) FILTER (WHERE l.created_at >= date_trunc('month', CURRENT_DATE)),
    'revenue_this_month', COALESCE(
      SUM(l.value) FILTER (WHERE l.status = 'closed_won' AND l.updated_at >= date_trunc('month', CURRENT_DATE)), 
      0
    )
  ) INTO stats
  FROM workspaces w
  LEFT JOIN leads l ON w.id = l.workspace_id
  LEFT JOIN workspace_members wm ON w.id = wm.workspace_id
  WHERE w.id = p_workspace_id
  GROUP BY w.id;

  RETURN COALESCE(stats, '{}'::jsonb);
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to search leads with full-text search
CREATE OR REPLACE FUNCTION search_leads(
  p_workspace_id uuid,
  p_query text,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  name text,
  email text,
  company text,
  status text,
  value numeric,
  created_at timestamptz,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.name,
    l.email,
    l.company,
    l.status,
    l.value,
    l.created_at,
    ts_rank(
      to_tsvector('english', COALESCE(l.name, '') || ' ' || COALESCE(l.email, '') || ' ' || COALESCE(l.company, '')),
      plainto_tsquery('english', p_query)
    ) as rank
  FROM leads l
  WHERE l.workspace_id = p_workspace_id
    AND (
      to_tsvector('english', COALESCE(l.name, '') || ' ' || COALESCE(l.email, '') || ' ' || COALESCE(l.company, ''))
      @@ plainto_tsquery('english', p_query)
    )
  ORDER BY rank DESC, l.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create a function to initialize a new workspace with default settings
CREATE OR REPLACE FUNCTION initialize_workspace(
  p_workspace_name text,
  p_workspace_slug text,
  p_owner_id uuid DEFAULT auth.uid()
)
RETURNS uuid AS $$
DECLARE
  workspace_id uuid;
  owner_role_id uuid;
BEGIN
  -- Create workspace
  INSERT INTO workspaces (name, slug, plan_id)
  VALUES (p_workspace_name, p_workspace_slug, 'free')
  RETURNING id INTO workspace_id;

  -- Get owner role
  SELECT id INTO owner_role_id
  FROM roles
  WHERE name = 'owner' AND is_system = true;

  -- Add owner to workspace
  INSERT INTO workspace_members (workspace_id, user_id, role_id, status, joined_at)
  VALUES (workspace_id, p_owner_id, owner_role_id, 'active', now());

  -- Create default subscription
  INSERT INTO subscriptions (workspace_id, plan_id, status)
  VALUES (workspace_id, 'free', 'active');

  RETURN workspace_id;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Fix missing foreign key constraints and database integrity issues

-- 1. Add missing foreign key constraint for workspace_members.role_id
DO $$
BEGIN
  -- First, ensure all workspace_members have valid role_ids
  UPDATE workspace_members
  SET role_id = (SELECT id FROM roles WHERE name = 'viewer' AND is_system = true LIMIT 1)
  WHERE role_id IS NULL OR role_id NOT IN (SELECT id FROM roles);

  -- Add the foreign key constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'workspace_members_role_id_fkey'
      AND table_name = 'workspace_members'
  ) THEN
    ALTER TABLE workspace_members
    ADD CONSTRAINT workspace_members_role_id_fkey
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Add missing foreign key constraint for workspaces.plan_id
DO $$
BEGIN
  -- Ensure all workspaces have valid plan_ids
  UPDATE workspaces
  SET plan_id = 'free'
  WHERE plan_id IS NULL OR plan_id NOT IN (SELECT id FROM plans);

  -- Add the foreign key constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'workspaces_plan_id_fkey'
      AND table_name = 'workspaces'
  ) THEN
    ALTER TABLE workspaces
    ADD CONSTRAINT workspaces_plan_id_fkey
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Add missing indexes for foreign key columns
CREATE INDEX IF NOT EXISTS idx_workspace_members_role_id ON workspace_members(role_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_plan_id ON workspaces(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_invitations_role_id ON invitations(role_id);

-- 4. Add missing unique constraints
DO $$
BEGIN
  -- Ensure workspace slug uniqueness is properly enforced
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'workspaces_slug_key'
      AND table_name = 'workspaces'
  ) THEN
    -- First remove any duplicate slugs
    UPDATE workspaces
    SET slug = slug || '-' || EXTRACT(EPOCH FROM created_at)::text
    WHERE id NOT IN (
      SELECT DISTINCT ON (slug) id
      FROM workspaces
      ORDER BY slug, created_at
    );

    ALTER TABLE workspaces ADD CONSTRAINT workspaces_slug_key UNIQUE (slug);
  END IF;
END $$;

-- Final data integrity check function
CREATE OR REPLACE FUNCTION check_data_integrity()
RETURNS TABLE(
  table_name text,
  issue_type text,
  issue_count bigint
) AS $$
BEGIN
  -- Check for orphaned records
  RETURN QUERY
  SELECT 'workspace_members'::text, 'orphaned_role'::text, COUNT(*)
  FROM workspace_members wm
  LEFT JOIN roles r ON wm.role_id = r.id
  WHERE r.id IS NULL AND wm.role_id IS NOT NULL;

  RETURN QUERY
  SELECT 'leads'::text, 'orphaned_workspace'::text, COUNT(*)
  FROM leads l
  LEFT JOIN workspaces w ON l.workspace_id = w.id
  WHERE w.id IS NULL;

  RETURN QUERY
  SELECT 'invitations'::text, 'expired_pending'::text, COUNT(*)
  FROM invitations
  WHERE status = 'pending' AND expires_at < now();
END;
$$ language 'plpgsql' SECURITY DEFINER;