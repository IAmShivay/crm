/*
  # Analytics and Reporting System

  1. New Tables
    - `analytics_events`
      - `id` (uuid, primary key)
      - `workspace_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `event_name` (text)
      - `properties` (jsonb)
      - `created_at` (timestamp)

  2. Views
    - `lead_analytics` - Lead conversion and pipeline analytics
    - `user_activity_summary` - User activity summaries
    - `workspace_metrics` - Workspace-level metrics

  3. Functions
    - Analytics calculation functions
    - Reporting functions
*/

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name text NOT NULL,
  properties jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Analytics events policies
CREATE POLICY "Users can read analytics for their workspaces"
  ON analytics_events
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can create analytics events for their workspaces"
  ON analytics_events
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
CREATE INDEX IF NOT EXISTS idx_analytics_events_workspace_id ON analytics_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);

-- Lead analytics view
CREATE OR REPLACE VIEW lead_analytics AS
SELECT 
  l.workspace_id,
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE l.status = 'new') as new_leads,
  COUNT(*) FILTER (WHERE l.status = 'contacted') as contacted_leads,
  COUNT(*) FILTER (WHERE l.status = 'qualified') as qualified_leads,
  COUNT(*) FILTER (WHERE l.status = 'proposal') as proposal_leads,
  COUNT(*) FILTER (WHERE l.status = 'negotiation') as negotiation_leads,
  COUNT(*) FILTER (WHERE l.status = 'closed_won') as won_leads,
  COUNT(*) FILTER (WHERE l.status = 'closed_lost') as lost_leads,
  ROUND(
    COUNT(*) FILTER (WHERE l.status = 'closed_won')::numeric / 
    NULLIF(COUNT(*) FILTER (WHERE l.status IN ('closed_won', 'closed_lost')), 0) * 100, 
    2
  ) as conversion_rate,
  SUM(l.value) FILTER (WHERE l.status = 'closed_won') as total_revenue,
  AVG(l.value) FILTER (WHERE l.status = 'closed_won') as avg_deal_size,
  DATE_TRUNC('month', l.created_at) as month
FROM leads l
GROUP BY l.workspace_id, DATE_TRUNC('month', l.created_at);

-- User activity summary view
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
  wm.workspace_id,
  wm.user_id,
  up.full_name,
  COUNT(DISTINCT l.id) as leads_created,
  COUNT(DISTINCT la.id) as activities_logged,
  COUNT(DISTINCT ae.id) as events_tracked,
  MAX(ae.created_at) as last_activity,
  DATE_TRUNC('week', CURRENT_DATE) as week
FROM workspace_members wm
LEFT JOIN user_profiles up ON wm.user_id = up.id
LEFT JOIN leads l ON l.created_by = wm.user_id AND l.workspace_id = wm.workspace_id
LEFT JOIN lead_activities la ON la.user_id = wm.user_id
LEFT JOIN analytics_events ae ON ae.user_id = wm.user_id AND ae.workspace_id = wm.workspace_id
WHERE wm.status = 'active'
GROUP BY wm.workspace_id, wm.user_id, up.full_name;

-- Workspace metrics view
CREATE OR REPLACE VIEW workspace_metrics AS
SELECT 
  w.id as workspace_id,
  w.name as workspace_name,
  w.plan_id,
  COUNT(DISTINCT wm.user_id) as total_users,
  COUNT(DISTINCT wm.user_id) FILTER (WHERE wm.status = 'active') as active_users,
  COUNT(DISTINCT l.id) as total_leads,
  COUNT(DISTINCT l.id) FILTER (WHERE l.created_at >= CURRENT_DATE - INTERVAL '30 days') as leads_last_30_days,
  COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'closed_won') as won_deals,
  SUM(l.value) FILTER (WHERE l.status = 'closed_won') as total_revenue,
  COUNT(DISTINCT we.id) as webhook_endpoints,
  COUNT(DISTINCT r.id) FILTER (WHERE r.is_system = false) as custom_roles
FROM workspaces w
LEFT JOIN workspace_members wm ON w.id = wm.workspace_id
LEFT JOIN leads l ON w.id = l.workspace_id
LEFT JOIN webhook_endpoints we ON w.id = we.workspace_id
LEFT JOIN roles r ON w.id = r.workspace_id
GROUP BY w.id, w.name, w.plan_id;

-- Function to track analytics event
CREATE OR REPLACE FUNCTION track_event(
  p_event_name text,
  p_properties jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  event_id uuid;
  user_workspace_id uuid;
BEGIN
  -- Get user's current workspace (first active workspace)
  SELECT workspace_id INTO user_workspace_id
  FROM workspace_members
  WHERE user_id = auth.uid() AND status = 'active'
  LIMIT 1;

  IF user_workspace_id IS NULL THEN
    RAISE EXCEPTION 'User not found in any active workspace';
  END IF;

  INSERT INTO analytics_events (workspace_id, user_id, event_name, properties)
  VALUES (user_workspace_id, auth.uid(), p_event_name, p_properties)
  RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to get lead conversion funnel
CREATE OR REPLACE FUNCTION get_lead_funnel(p_workspace_id uuid, p_start_date date DEFAULT CURRENT_DATE - INTERVAL '30 days', p_end_date date DEFAULT CURRENT_DATE)
RETURNS TABLE(
  status text,
  count bigint,
  percentage numeric
) AS $$
DECLARE
  total_leads bigint;
BEGIN
  -- Get total leads for percentage calculation
  SELECT COUNT(*) INTO total_leads
  FROM leads l
  WHERE l.workspace_id = p_workspace_id
    AND l.created_at >= p_start_date
    AND l.created_at <= p_end_date;

  RETURN QUERY
  SELECT 
    l.status,
    COUNT(*) as count,
    ROUND(COUNT(*)::numeric / NULLIF(total_leads, 0) * 100, 2) as percentage
  FROM leads l
  WHERE l.workspace_id = p_workspace_id
    AND l.created_at >= p_start_date
    AND l.created_at <= p_end_date
  GROUP BY l.status
  ORDER BY 
    CASE l.status
      WHEN 'new' THEN 1
      WHEN 'contacted' THEN 2
      WHEN 'qualified' THEN 3
      WHEN 'proposal' THEN 4
      WHEN 'negotiation' THEN 5
      WHEN 'closed_won' THEN 6
      WHEN 'closed_lost' THEN 7
      ELSE 8
    END;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to get revenue trends
CREATE OR REPLACE FUNCTION get_revenue_trends(p_workspace_id uuid, p_months integer DEFAULT 12)
RETURNS TABLE(
  month date,
  revenue numeric,
  deals_won bigint,
  avg_deal_size numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE_TRUNC('month', l.created_at)::date as month,
    COALESCE(SUM(l.value) FILTER (WHERE l.status = 'closed_won'), 0) as revenue,
    COUNT(*) FILTER (WHERE l.status = 'closed_won') as deals_won,
    COALESCE(AVG(l.value) FILTER (WHERE l.status = 'closed_won'), 0) as avg_deal_size
  FROM leads l
  WHERE l.workspace_id = p_workspace_id
    AND l.created_at >= CURRENT_DATE - (p_months || ' months')::interval
  GROUP BY DATE_TRUNC('month', l.created_at)
  ORDER BY month;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to cleanup old analytics events (keep last 6 months)
CREATE OR REPLACE FUNCTION cleanup_old_analytics()
RETURNS void AS $$
BEGIN
  DELETE FROM analytics_events
  WHERE created_at < CURRENT_DATE - INTERVAL '6 months';
END;
$$ language 'plpgsql';