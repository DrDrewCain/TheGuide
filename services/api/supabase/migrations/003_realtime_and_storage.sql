-- Enable Realtime for specific tables
-- This allows real-time updates via WebSocket

-- Enable realtime for simulations (to track progress)
ALTER PUBLICATION supabase_realtime ADD TABLE simulations;

-- Enable realtime for decisions (for collaborative features later)
ALTER PUBLICATION supabase_realtime ADD TABLE decisions;

-- Create storage bucket for decision attachments (future feature)
-- Note: This needs to be done via Supabase dashboard or API
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('decision-attachments', 'decision-attachments', false);

-- Create a function to validate decision options
CREATE OR REPLACE FUNCTION validate_decision_options()
RETURNS TRIGGER AS $$
DECLARE
  option_count INTEGER;
BEGIN
  -- Count existing options for this decision
  SELECT COUNT(*) INTO option_count
  FROM decision_options
  WHERE decision_id = NEW.decision_id;

  -- Ensure at least 2 options, max 10
  IF TG_OP = 'INSERT' AND option_count >= 10 THEN
    RAISE EXCEPTION 'Maximum 10 options allowed per decision';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_decision_options_trigger
  BEFORE INSERT ON decision_options
  FOR EACH ROW
  EXECUTE FUNCTION validate_decision_options();

-- Create function to check if user can create more decisions (free tier limit)
CREATE OR REPLACE FUNCTION check_decision_limit()
RETURNS TRIGGER AS $$
DECLARE
  decision_count INTEGER;
  user_tier TEXT;
BEGIN
  -- Get user's subscription tier (default to 'free')
  -- This would integrate with your billing system
  user_tier := COALESCE(
    (SELECT preferences->>'tier' FROM user_profiles WHERE id = NEW.user_id),
    'free'
  );

  -- Count user's decisions this month
  SELECT COUNT(*) INTO decision_count
  FROM decisions
  WHERE user_id = NEW.user_id
  AND created_at >= date_trunc('month', CURRENT_DATE);

  -- Check limits based on tier
  IF user_tier = 'free' AND decision_count >= 5 THEN
    RAISE EXCEPTION 'Free tier limit reached (5 decisions per month)';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_decision_limit_trigger
  BEFORE INSERT ON decisions
  FOR EACH ROW
  EXECUTE FUNCTION check_decision_limit();

-- Create a materialized view for dashboard analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS decision_analytics AS
SELECT
  d.user_id,
  d.type,
  DATE_TRUNC('month', d.created_at) as month,
  COUNT(DISTINCT d.id) as decision_count,
  COUNT(DISTINCT s.id) as simulation_count,
  AVG(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END) as completion_rate
FROM decisions d
LEFT JOIN simulations s ON d.id = s.decision_id
GROUP BY d.user_id, d.type, DATE_TRUNC('month', d.created_at);

-- Index for the materialized view
CREATE INDEX idx_decision_analytics_user_month ON decision_analytics(user_id, month DESC);

-- Function to refresh analytics (call periodically)
CREATE OR REPLACE FUNCTION refresh_decision_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY decision_analytics;
END;
$$ LANGUAGE plpgsql;

-- Add audit fields for compliance
ALTER TABLE decisions
ADD COLUMN ip_address INET,
ADD COLUMN user_agent TEXT;

ALTER TABLE simulations
ADD COLUMN cost_estimate DECIMAL(10,4) DEFAULT 0.00;

-- Create an audit log table
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for audit queries
CREATE INDEX idx_audit_log_user_created ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (user_id, action, table_name, record_id, new_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (user_id, action, table_name, record_id, old_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_decisions AFTER INSERT OR UPDATE OR DELETE ON decisions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_simulations AFTER INSERT OR UPDATE OR DELETE ON simulations
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();