/*
  # User Profiles and Invitation System

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `avatar_url` (text)
      - `timezone` (text)
      - `preferences` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `invitations`
      - `id` (uuid, primary key)
      - `workspace_id` (uuid, foreign key)
      - `email` (text)
      - `role_id` (uuid, foreign key)
      - `invited_by` (uuid, foreign key)
      - `token` (text, unique)
      - `status` (text)
      - `expires_at` (timestamp)
      - `accepted_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for profile and invitation access
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  timezone text DEFAULT 'UTC',
  preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  role_id uuid REFERENCES roles(id) NOT NULL,
  invited_by uuid REFERENCES auth.users(id) NOT NULL,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, email)
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can read all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Invitations policies
CREATE POLICY "Users can read invitations for their workspaces"
  ON invitations
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Workspace admins can manage invitations"
  ON invitations
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

-- Add updated_at trigger for user_profiles
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user profile
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic profile creation
CREATE TRIGGER create_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Function to handle invitation acceptance
CREATE OR REPLACE FUNCTION accept_invitation(invitation_token text)
RETURNS jsonb AS $$
DECLARE
  invitation_record invitations;
  workspace_record workspaces;
  result jsonb;
BEGIN
  -- Get invitation
  SELECT * INTO invitation_record
  FROM invitations
  WHERE token = invitation_token
    AND status = 'pending'
    AND expires_at > now();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  -- Get workspace
  SELECT * INTO workspace_record
  FROM workspaces
  WHERE id = invitation_record.workspace_id;

  -- Check if user email matches invitation
  IF (SELECT email FROM auth.users WHERE id = auth.uid()) != invitation_record.email THEN
    RETURN jsonb_build_object('success', false, 'error', 'Email mismatch');
  END IF;

  -- Add user to workspace
  INSERT INTO workspace_members (workspace_id, user_id, role_id, status, invited_by, joined_at)
  VALUES (
    invitation_record.workspace_id,
    auth.uid(),
    invitation_record.role_id,
    'active',
    invitation_record.invited_by,
    now()
  )
  ON CONFLICT (workspace_id, user_id) 
  DO UPDATE SET
    role_id = invitation_record.role_id,
    status = 'active',
    joined_at = now();

  -- Mark invitation as accepted
  UPDATE invitations
  SET status = 'accepted', accepted_at = now()
  WHERE id = invitation_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'workspace_id', workspace_record.id,
    'workspace_name', workspace_record.name
  );
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_workspace_id ON invitations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);