/*
  # Leads Management System

  1. New Tables
    - `leads`
      - `id` (uuid, primary key)
      - `workspace_id` (uuid, foreign key)
      - `name` (text)
      - `email` (text)
      - `phone` (text)
      - `company` (text)
      - `status` (text)
      - `source` (text)
      - `value` (numeric)
      - `assigned_to` (uuid, foreign key)
      - `tags` (text array)
      - `notes` (text)
      - `created_by` (uuid, foreign key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `lead_activities`
      - `id` (uuid, primary key)
      - `lead_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `activity_type` (text)
      - `description` (text)
      - `metadata` (jsonb)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for workspace-based access
*/

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  company text,
  status text DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
  source text DEFAULT 'manual',
  value numeric(10,2) DEFAULT 0,
  assigned_to uuid REFERENCES auth.users(id),
  tags text[] DEFAULT '{}',
  notes text,
  custom_fields jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create lead_activities table
CREATE TABLE IF NOT EXISTS lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('created', 'updated', 'status_changed', 'assigned', 'note_added', 'email_sent', 'call_made', 'meeting_scheduled')),
  description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;

-- Leads policies
CREATE POLICY "Users can read leads in their workspaces"
  ON leads
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can create leads in their workspaces"
  ON leads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IN (
      SELECT wm.workspace_id 
      FROM workspace_members wm
      JOIN roles r ON wm.role_id = r.id
      WHERE wm.user_id = auth.uid() 
      AND wm.status = 'active'
      AND (
        r.permissions ? 'leads:create' 
        OR r.permissions ? '*:*'
      )
    )
  );

CREATE POLICY "Users can update leads in their workspaces"
  ON leads
  FOR UPDATE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT wm.workspace_id 
      FROM workspace_members wm
      JOIN roles r ON wm.role_id = r.id
      WHERE wm.user_id = auth.uid() 
      AND wm.status = 'active'
      AND (
        r.permissions ? 'leads:update' 
        OR r.permissions ? '*:*'
      )
    )
  );

CREATE POLICY "Users can delete leads in their workspaces"
  ON leads
  FOR DELETE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT wm.workspace_id 
      FROM workspace_members wm
      JOIN roles r ON wm.role_id = r.id
      WHERE wm.user_id = auth.uid() 
      AND wm.status = 'active'
      AND (
        r.permissions ? 'leads:delete' 
        OR r.permissions ? '*:*'
      )
    )
  );

-- Lead activities policies
CREATE POLICY "Users can read activities for leads in their workspaces"
  ON lead_activities
  FOR SELECT
  TO authenticated
  USING (
    lead_id IN (
      SELECT l.id 
      FROM leads l
      JOIN workspace_members wm ON l.workspace_id = wm.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.status = 'active'
    )
  );

CREATE POLICY "Users can create activities for leads in their workspaces"
  ON lead_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (
    lead_id IN (
      SELECT l.id 
      FROM leads l
      JOIN workspace_members wm ON l.workspace_id = wm.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.status = 'active'
    )
  );

-- Add updated_at trigger for leads
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_workspace_id ON leads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created_at ON lead_activities(created_at);

-- Function to automatically create activity when lead is updated
CREATE OR REPLACE FUNCTION create_lead_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Create activity for status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO lead_activities (lead_id, user_id, activity_type, description, metadata)
    VALUES (
      NEW.id,
      auth.uid(),
      'status_changed',
      'Status changed from ' || COALESCE(OLD.status, 'none') || ' to ' || NEW.status,
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;

  -- Create activity for assignment changes
  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    INSERT INTO lead_activities (lead_id, user_id, activity_type, description, metadata)
    VALUES (
      NEW.id,
      auth.uid(),
      'assigned',
      CASE 
        WHEN NEW.assigned_to IS NULL THEN 'Lead unassigned'
        ELSE 'Lead assigned to user'
      END,
      jsonb_build_object('old_assigned_to', OLD.assigned_to, 'new_assigned_to', NEW.assigned_to)
    );
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for lead activities
CREATE TRIGGER lead_activity_trigger
  AFTER UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION create_lead_activity();

-- Function to create initial activity when lead is created
CREATE OR REPLACE FUNCTION create_initial_lead_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO lead_activities (lead_id, user_id, activity_type, description, metadata)
  VALUES (
    NEW.id,
    COALESCE(NEW.created_by, auth.uid()),
    'created',
    'Lead created',
    jsonb_build_object('source', NEW.source)
  );
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for initial lead activity
CREATE TRIGGER initial_lead_activity_trigger
  AFTER INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_lead_activity();