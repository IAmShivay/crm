/*
  # Roles and Permissions System

  1. New Tables
    - `roles`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `workspace_id` (uuid, foreign key)
      - `is_system` (boolean)
      - `permissions` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `permissions`
      - `id` (uuid, primary key)
      - `name` (text)
      - `resource` (text)
      - `action` (text)
      - `description` (text)

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access
*/

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  resource text NOT NULL,
  action text NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete')),
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  is_system boolean DEFAULT false,
  permissions jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(name, workspace_id)
);

-- Enable RLS
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Permissions policies (readable by all authenticated users)
CREATE POLICY "Authenticated users can read permissions"
  ON permissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Roles policies
CREATE POLICY "Users can read roles in their workspaces"
  ON roles
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR is_system = true
  );

CREATE POLICY "Workspace admins can manage roles"
  ON roles
  FOR ALL
  TO authenticated
  USING (
    workspace_id IN (
      SELECT wm.workspace_id 
      FROM workspace_members wm
      JOIN roles r ON wm.role_id = r.id
      WHERE wm.user_id = auth.uid() 
      AND wm.status = 'active'
      AND r.name IN ('owner', 'admin')
    )
  );

-- Add updated_at trigger for roles
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default permissions
INSERT INTO permissions (name, resource, action, description) VALUES
  ('Create Lead', 'leads', 'create', 'Create new leads'),
  ('Read Lead', 'leads', 'read', 'View leads'),
  ('Update Lead', 'leads', 'update', 'Edit lead information'),
  ('Delete Lead', 'leads', 'delete', 'Delete leads'),
  
  ('Create User', 'users', 'create', 'Invite new users'),
  ('Read User', 'users', 'read', 'View user information'),
  ('Update User', 'users', 'update', 'Edit user details'),
  ('Delete User', 'users', 'delete', 'Remove users'),
  
  ('Create Role', 'roles', 'create', 'Create custom roles'),
  ('Read Role', 'roles', 'read', 'View roles'),
  ('Update Role', 'roles', 'update', 'Edit role permissions'),
  ('Delete Role', 'roles', 'delete', 'Delete custom roles'),
  
  ('Create Workspace', 'workspace', 'create', 'Create workspaces'),
  ('Read Workspace', 'workspace', 'read', 'View workspace details'),
  ('Update Workspace', 'workspace', 'update', 'Edit workspace settings'),
  ('Delete Workspace', 'workspace', 'delete', 'Delete workspace'),
  
  ('Read Analytics', 'analytics', 'read', 'View reports and analytics'),
  ('Update Settings', 'settings', 'update', 'Modify system settings');

-- Insert system roles
INSERT INTO roles (name, description, is_system, permissions) VALUES
  ('owner', 'Workspace owner with full access', true, '["*:*"]'::jsonb),
  ('admin', 'Administrator with most permissions', true, '[
    "leads:create", "leads:read", "leads:update", "leads:delete",
    "users:create", "users:read", "users:update", "users:delete",
    "roles:create", "roles:read", "roles:update", "roles:delete",
    "workspace:read", "workspace:update",
    "analytics:read", "settings:update"
  ]'::jsonb),
  ('manager', 'Team manager with lead and user management', true, '[
    "leads:create", "leads:read", "leads:update", "leads:delete",
    "users:read", "analytics:read"
  ]'::jsonb),
  ('sales', 'Sales representative with lead access', true, '[
    "leads:create", "leads:read", "leads:update",
    "users:read"
  ]'::jsonb),
  ('viewer', 'Read-only access to leads and analytics', true, '[
    "leads:read", "users:read", "analytics:read"
  ]'::jsonb);

-- Now add the role-based policies that were deferred from the first migration

-- Enhanced workspace policies with role-based access
CREATE POLICY "Workspace owners can update workspaces"
  ON workspaces
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT wm.workspace_id
      FROM workspace_members wm
      JOIN roles r ON wm.role_id = r.id
      WHERE wm.user_id = auth.uid()
      AND wm.status = 'active'
      AND r.name = 'owner'
    )
  );

-- Enhanced workspace member policies with role-based access
CREATE POLICY "Workspace owners and admins can manage members"
  ON workspace_members
  FOR ALL
  TO authenticated
  USING (
    workspace_id IN (
      SELECT wm.workspace_id
      FROM workspace_members wm
      JOIN roles r ON wm.role_id = r.id
      WHERE wm.user_id = auth.uid()
      AND wm.status = 'active'
      AND r.name IN ('owner', 'admin')
    )
  );

-- Add foreign key constraint for role_id now that roles table exists
ALTER TABLE workspace_members
ADD CONSTRAINT workspace_members_role_id_fkey
FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;