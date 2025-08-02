/*
  # Plans and Subscriptions with Dodo Payments

  1. New Tables
    - `plans`
      - `id` (text, primary key)
      - `name` (text)
      - `description` (text)
      - `price` (numeric)
      - `interval` (text)
      - `features` (jsonb)
      - `limits` (jsonb)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `subscriptions`
      - `id` (uuid, primary key)
      - `workspace_id` (uuid, foreign key)
      - `plan_id` (text, foreign key)
      - `dodo_subscription_id` (text)
      - `status` (text)
      - `current_period_start` (timestamp)
      - `current_period_end` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for subscription access
*/

-- Create plans table
CREATE TABLE IF NOT EXISTS plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  interval text NOT NULL CHECK (interval IN ('month', 'year')) DEFAULT 'month',
  features jsonb DEFAULT '[]'::jsonb,
  limits jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan_id text REFERENCES plans(id) NOT NULL,
  dodo_subscription_id text UNIQUE,
  dodo_customer_id text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Plans policies (readable by all authenticated users)
CREATE POLICY "Authenticated users can read active plans"
  ON plans
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Subscriptions policies
CREATE POLICY "Users can read subscriptions for their workspaces"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Workspace owners can manage subscriptions"
  ON subscriptions
  FOR ALL
  TO authenticated
  USING (
    workspace_id IN (
      SELECT wm.workspace_id 
      FROM workspace_members wm
      JOIN roles r ON wm.role_id = r.id
      WHERE wm.user_id = auth.uid() 
      AND wm.status = 'active'
      AND r.name = 'owner'
    )
  );

-- Add updated_at triggers
CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default plans
INSERT INTO plans (id, name, description, price, interval, features, limits, sort_order) VALUES
  ('free', 'Free', 'Perfect for getting started', 0, 'month', 
   '["Up to 100 leads", "Basic lead management", "Email support"]'::jsonb,
   '{"leads": 100, "users": 2, "workspaces": 1}'::jsonb, 1),
   
  ('starter', 'Starter', 'Great for small teams', 29, 'month',
   '["Up to 1,000 leads", "Advanced lead management", "Role management", "Email support", "Basic analytics"]'::jsonb,
   '{"leads": 1000, "users": 5, "workspaces": 1}'::jsonb, 2),
   
  ('professional', 'Professional', 'Perfect for growing businesses', 79, 'month',
   '["Up to 10,000 leads", "Advanced analytics", "Custom roles", "API access", "Priority support", "Webhooks"]'::jsonb,
   '{"leads": 10000, "users": 25, "workspaces": 3}'::jsonb, 3),
   
  ('enterprise', 'Enterprise', 'For large organizations', 199, 'month',
   '["Unlimited leads", "Advanced integrations", "Custom branding", "Dedicated support", "SLA guarantee"]'::jsonb,
   '{"leads": -1, "users": -1, "workspaces": -1}'::jsonb, 4);

-- Function to update workspace subscription status
CREATE OR REPLACE FUNCTION update_workspace_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Update workspace with subscription info
  UPDATE workspaces 
  SET 
    plan_id = NEW.plan_id,
    subscription_status = NEW.status,
    dodo_subscription_id = NEW.dodo_subscription_id,
    updated_at = now()
  WHERE id = NEW.workspace_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to sync workspace subscription
CREATE TRIGGER sync_workspace_subscription
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_workspace_subscription();