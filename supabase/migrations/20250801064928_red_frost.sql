/*
  # Webhook Endpoints and Lead Sources

  1. New Tables
    - `webhook_endpoints`
      - `id` (uuid, primary key)
      - `workspace_id` (uuid, foreign key)
      - `name` (text)
      - `url` (text, unique)
      - `secret` (text)
      - `is_active` (boolean)
      - `events` (text array)
      - `created_by` (uuid, foreign key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `webhook_logs`
      - `id` (uuid, primary key)
      - `webhook_endpoint_id` (uuid, foreign key)
      - `request_id` (text)
      - `event_type` (text)
      - `payload` (jsonb)
      - `response_status` (integer)
      - `response_body` (text)
      - `processed_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for webhook access

  3. Functions
    - Webhook processing function
    - Lead creation from webhook
*/

-- Create webhook_endpoints table
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  url text UNIQUE NOT NULL DEFAULT ('https://your-domain.com/api/webhooks/' || gen_random_uuid()),
  secret text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active boolean DEFAULT true,
  events text[] DEFAULT '{"lead.created", "lead.updated"}',
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create webhook_logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_endpoint_id uuid REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  request_id text,
  event_type text,
  payload jsonb DEFAULT '{}'::jsonb,
  response_status integer,
  response_body text,
  error_message text,
  processed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Webhook endpoints policies
CREATE POLICY "Users can read webhook endpoints for their workspaces"
  ON webhook_endpoints
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Workspace admins can manage webhook endpoints"
  ON webhook_endpoints
  FOR ALL
  TO authenticated
  USING (
    workspace_id IN (
      SELECT wm.workspace_id 
      FROM workspace_members wm
      JOIN roles r ON wm.role_id = r.id
      WHERE wm.user_id = auth.uid() 
      AND wm.status = 'active'
      AND (
        r.permissions ? 'workspace:update' 
        OR r.permissions ? '*:*'
      )
    )
  );

-- Webhook logs policies
CREATE POLICY "Users can read webhook logs for their workspaces"
  ON webhook_logs
  FOR SELECT
  TO authenticated
  USING (
    webhook_endpoint_id IN (
      SELECT we.id 
      FROM webhook_endpoints we
      JOIN workspace_members wm ON we.workspace_id = wm.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.status = 'active'
    )
  );

CREATE POLICY "System can insert webhook logs"
  ON webhook_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add updated_at trigger for webhook_endpoints
CREATE TRIGGER update_webhook_endpoints_updated_at
  BEFORE UPDATE ON webhook_endpoints
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_workspace_id ON webhook_endpoints(workspace_id);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_url ON webhook_endpoints(url);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_endpoint_id ON webhook_logs(webhook_endpoint_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);

-- Function to process webhook and create lead
CREATE OR REPLACE FUNCTION process_webhook_lead(
  webhook_url text,
  payload jsonb
)
RETURNS jsonb AS $$
DECLARE
  webhook_record webhook_endpoints;
  workspace_record workspaces;
  lead_id uuid;
  result jsonb;
BEGIN
  -- Get webhook endpoint
  SELECT * INTO webhook_record
  FROM webhook_endpoints
  WHERE url = webhook_url AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Webhook endpoint not found or inactive');
  END IF;

  -- Get workspace
  SELECT * INTO workspace_record
  FROM workspaces
  WHERE id = webhook_record.workspace_id;

  -- Create lead from webhook payload
  INSERT INTO leads (
    workspace_id,
    name,
    email,
    phone,
    company,
    source,
    value,
    status,
    notes,
    custom_fields
  )
  VALUES (
    webhook_record.workspace_id,
    COALESCE(
      payload->>'name',
      CONCAT(payload->>'first_name', ' ', payload->>'last_name'),
      payload->>'full_name',
      'Unknown'
    ),
    payload->>'email',
    payload->>'phone',
    payload->>'company',
    COALESCE(payload->>'source', 'webhook'),
    COALESCE((payload->>'value')::numeric, 0),
    COALESCE(payload->>'status', 'new'),
    payload->>'notes',
    COALESCE(payload->'custom_fields', '{}'::jsonb)
  )
  RETURNING id INTO lead_id;

  -- Log webhook processing
  INSERT INTO webhook_logs (
    webhook_endpoint_id,
    request_id,
    event_type,
    payload,
    response_status,
    response_body
  )
  VALUES (
    webhook_record.id,
    payload->>'request_id',
    'lead.created',
    payload,
    200,
    'Lead created successfully'
  );

  -- Log activity
  PERFORM log_activity(
    webhook_record.workspace_id,
    'lead',
    lead_id,
    'created_via_webhook',
    'Lead created via webhook: ' || webhook_record.name,
    jsonb_build_object('webhook_id', webhook_record.id, 'source', payload->>'source')
  );

  RETURN jsonb_build_object(
    'success', true,
    'lead_id', lead_id,
    'message', 'Lead created successfully'
  );

EXCEPTION WHEN OTHERS THEN
  -- Log error
  INSERT INTO webhook_logs (
    webhook_endpoint_id,
    request_id,
    event_type,
    payload,
    response_status,
    error_message
  )
  VALUES (
    webhook_record.id,
    payload->>'request_id',
    'lead.created',
    payload,
    500,
    SQLERRM
  );

  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to generate webhook URL
CREATE OR REPLACE FUNCTION generate_webhook_url()
RETURNS text AS $$
BEGIN
  RETURN 'https://your-domain.com/api/webhooks/' || encode(gen_random_bytes(16), 'hex');
END;
$$ language 'plpgsql';

-- Update webhook endpoint URL generation
ALTER TABLE webhook_endpoints 
ALTER COLUMN url SET DEFAULT generate_webhook_url();