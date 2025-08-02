/*
  # Initial CRM Schema Setup

  1. New Tables
    - `workspaces`
      - `id` (uuid, primary key)
      - `name` (text)
      - `slug` (text, unique)
      - `plan_id` (text)
      - `subscription_status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `workspace_members`
      - `id` (uuid, primary key)
      - `workspace_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `role_id` (uuid, foreign key)
      - `status` (text)
      - `invited_by` (uuid, foreign key)
      - `invited_at` (timestamp)
      - `joined_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for workspace-based access
*/

-- Create workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  plan_id text DEFAULT 'free',
  subscription_status text DEFAULT 'active',
  dodo_customer_id text,
  dodo_subscription_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create workspace_members table
CREATE TABLE IF NOT EXISTS workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role_id uuid,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  invited_by uuid REFERENCES auth.users(id),
  invited_at timestamptz DEFAULT now(),
  joined_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Enable RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Workspace policies (basic access - role-based policies will be added later)
CREATE POLICY "Users can read workspaces they belong to"
  ON workspaces
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Workspace members policies
CREATE POLICY "Users can read workspace members for their workspaces"
  ON workspace_members
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Basic member management policy (role-based policies will be added later)
CREATE POLICY "Users can manage their own membership"
  ON workspace_members
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspace_members_updated_at
  BEFORE UPDATE ON workspace_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();