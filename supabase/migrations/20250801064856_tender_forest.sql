/*
  # Recent Activity System

  1. New Tables
    - `activities`
      - `id` (uuid, primary key)
      - `workspace_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `entity_type` (text)
      - `entity_id` (uuid)
      - `action` (text)
      - `description` (text)
      - `metadata` (jsonb)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on activities table
    - Add policies for workspace-based access

  3. Functions
    - Generic activity logging function
    - Activity cleanup function
*/

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('lead', 'user', 'workspace', 'role', 'invitation', 'subscription')),
  entity_id uuid,
  action text NOT NULL,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Activities policies
CREATE POLICY "Users can read activities for their workspaces"
  ON activities
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can create activities for their workspaces"
  ON activities
  FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activities_workspace_id ON activities(workspace_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_entity_type ON activities(entity_type);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities(entity_type, entity_id);

-- Generic function to log activities
CREATE OR REPLACE FUNCTION log_activity(
  p_workspace_id uuid,
  p_entity_type text,
  p_entity_id uuid,
  p_action text,
  p_description text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  activity_id uuid;
BEGIN
  INSERT INTO activities (workspace_id, user_id, entity_type, entity_id, action, description, metadata)
  VALUES (p_workspace_id, auth.uid(), p_entity_type, p_entity_id, p_action, p_description, p_metadata)
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to clean up old activities (keep last 1000 per workspace)
CREATE OR REPLACE FUNCTION cleanup_old_activities()
RETURNS void AS $$
BEGIN
  DELETE FROM activities
  WHERE id IN (
    SELECT id
    FROM (
      SELECT id,
             ROW_NUMBER() OVER (PARTITION BY workspace_id ORDER BY created_at DESC) as rn
      FROM activities
    ) ranked
    WHERE rn > 1000
  );
END;
$$ language 'plpgsql';

-- Update workspace member activities
CREATE OR REPLACE FUNCTION log_workspace_member_activity()
RETURNS TRIGGER AS $$
DECLARE
  workspace_name text;
  user_name text;
  role_name text;
BEGIN
  -- Get workspace name
  SELECT name INTO workspace_name FROM workspaces WHERE id = COALESCE(NEW.workspace_id, OLD.workspace_id);
  
  -- Get user name
  SELECT full_name INTO user_name FROM user_profiles WHERE id = COALESCE(NEW.user_id, OLD.user_id);
  
  -- Get role name
  SELECT name INTO role_name FROM roles WHERE id = COALESCE(NEW.role_id, OLD.role_id);

  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity(
      NEW.workspace_id,
      'user',
      NEW.user_id,
      'joined_workspace',
      COALESCE(user_name, 'User') || ' joined workspace as ' || COALESCE(role_name, 'member'),
      jsonb_build_object('role_id', NEW.role_id, 'status', NEW.status)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Status change
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      PERFORM log_activity(
        NEW.workspace_id,
        'user',
        NEW.user_id,
        'status_changed',
        COALESCE(user_name, 'User') || ' status changed from ' || OLD.status || ' to ' || NEW.status,
        jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
      );
    END IF;
    
    -- Role change
    IF OLD.role_id IS DISTINCT FROM NEW.role_id THEN
      PERFORM log_activity(
        NEW.workspace_id,
        'user',
        NEW.user_id,
        'role_changed',
        COALESCE(user_name, 'User') || ' role changed to ' || COALESCE(role_name, 'member'),
        jsonb_build_object('old_role_id', OLD.role_id, 'new_role_id', NEW.role_id)
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_activity(
      OLD.workspace_id,
      'user',
      OLD.user_id,
      'left_workspace',
      COALESCE(user_name, 'User') || ' left workspace',
      jsonb_build_object('role_id', OLD.role_id)
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create trigger for workspace member activities
CREATE TRIGGER workspace_member_activity_trigger
  AFTER INSERT OR UPDATE OR DELETE ON workspace_members
  FOR EACH ROW
  EXECUTE FUNCTION log_workspace_member_activity();

-- Update invitation activities
CREATE OR REPLACE FUNCTION log_invitation_activity()
RETURNS TRIGGER AS $$
DECLARE
  workspace_name text;
  inviter_name text;
  role_name text;
BEGIN
  -- Get workspace name
  SELECT name INTO workspace_name FROM workspaces WHERE id = COALESCE(NEW.workspace_id, OLD.workspace_id);
  
  -- Get inviter name
  SELECT full_name INTO inviter_name FROM user_profiles WHERE id = COALESCE(NEW.invited_by, OLD.invited_by);
  
  -- Get role name
  SELECT name INTO role_name FROM roles WHERE id = COALESCE(NEW.role_id, OLD.role_id);

  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity(
      NEW.workspace_id,
      'invitation',
      NEW.id,
      'sent',
      COALESCE(inviter_name, 'Someone') || ' invited ' || NEW.email || ' as ' || COALESCE(role_name, 'member'),
      jsonb_build_object('email', NEW.email, 'role_id', NEW.role_id)
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM log_activity(
      NEW.workspace_id,
      'invitation',
      NEW.id,
      NEW.status,
      'Invitation to ' || NEW.email || ' was ' || NEW.status,
      jsonb_build_object('email', NEW.email, 'old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create trigger for invitation activities
CREATE TRIGGER invitation_activity_trigger
  AFTER INSERT OR UPDATE ON invitations
  FOR EACH ROW
  EXECUTE FUNCTION log_invitation_activity();

-- Update role activities
CREATE OR REPLACE FUNCTION log_role_activity()
RETURNS TRIGGER AS $$
DECLARE
  workspace_name text;
  user_name text;
BEGIN
  -- Get workspace name
  SELECT name INTO workspace_name FROM workspaces WHERE id = COALESCE(NEW.workspace_id, OLD.workspace_id);
  
  -- Get user name
  SELECT full_name INTO user_name FROM user_profiles WHERE id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity(
      NEW.workspace_id,
      'role',
      NEW.id,
      'created',
      COALESCE(user_name, 'Someone') || ' created role "' || NEW.name || '"',
      jsonb_build_object('role_name', NEW.name, 'is_system', NEW.is_system)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_activity(
      NEW.workspace_id,
      'role',
      NEW.id,
      'updated',
      COALESCE(user_name, 'Someone') || ' updated role "' || NEW.name || '"',
      jsonb_build_object('role_name', NEW.name)
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_activity(
      OLD.workspace_id,
      'role',
      OLD.id,
      'deleted',
      COALESCE(user_name, 'Someone') || ' deleted role "' || OLD.name || '"',
      jsonb_build_object('role_name', OLD.name)
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create trigger for role activities
CREATE TRIGGER role_activity_trigger
  AFTER INSERT OR UPDATE OR DELETE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION log_role_activity();

-- Update workspace activities
CREATE OR REPLACE FUNCTION log_workspace_activity()
RETURNS TRIGGER AS $$
DECLARE
  user_name text;
BEGIN
  -- Get user name
  SELECT full_name INTO user_name FROM user_profiles WHERE id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity(
      NEW.id,
      'workspace',
      NEW.id,
      'created',
      COALESCE(user_name, 'Someone') || ' created workspace "' || NEW.name || '"',
      jsonb_build_object('workspace_name', NEW.name, 'plan_id', NEW.plan_id)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Name change
    IF OLD.name IS DISTINCT FROM NEW.name THEN
      PERFORM log_activity(
        NEW.id,
        'workspace',
        NEW.id,
        'renamed',
        COALESCE(user_name, 'Someone') || ' renamed workspace from "' || OLD.name || '" to "' || NEW.name || '"',
        jsonb_build_object('old_name', OLD.name, 'new_name', NEW.name)
      );
    END IF;
    
    -- Plan change
    IF OLD.plan_id IS DISTINCT FROM NEW.plan_id THEN
      PERFORM log_activity(
        NEW.id,
        'workspace',
        NEW.id,
        'plan_changed',
        'Workspace plan changed from ' || OLD.plan_id || ' to ' || NEW.plan_id,
        jsonb_build_object('old_plan', OLD.plan_id, 'new_plan', NEW.plan_id)
      );
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create trigger for workspace activities
CREATE TRIGGER workspace_activity_trigger
  AFTER INSERT OR UPDATE ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION log_workspace_activity();