-- Market Data Cache table
CREATE TABLE market_data_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  key TEXT NOT NULL,
  data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(type, key)
);

-- Index for efficient cache expiry cleanup
CREATE INDEX idx_market_data_cache_expires_at ON market_data_cache(expires_at);

-- Add progress tracking to simulations
ALTER TABLE simulations
ADD COLUMN progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
ADD COLUMN metadata JSONB DEFAULT '{}';

-- Add sensitivity analysis results storage
ALTER TABLE simulations
ADD COLUMN sensitivity_analysis JSONB,
ADD COLUMN scenarios JSONB;

-- Create a view for user decision statistics
CREATE OR REPLACE VIEW user_decision_stats AS
SELECT
  u.id as user_id,
  COUNT(DISTINCT d.id) as total_decisions,
  COUNT(DISTINCT CASE WHEN d.status = 'decided' THEN d.id END) as decided_count,
  COUNT(DISTINCT CASE WHEN d.status = 'implemented' THEN d.id END) as implemented_count,
  COUNT(DISTINCT s.id) as total_simulations,
  AVG(EXTRACT(EPOCH FROM (s.completed_at - s.started_at))) as avg_simulation_time_seconds
FROM
  auth.users u
  LEFT JOIN decisions d ON u.id = d.user_id
  LEFT JOIN simulations s ON d.id = s.decision_id AND s.status = 'completed'
GROUP BY u.id;

-- Create function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM market_data_cache
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean cache (requires pg_cron extension)
-- Note: This needs to be set up separately in Supabase dashboard
-- SELECT cron.schedule('clean-market-cache', '0 * * * *', 'SELECT clean_expired_cache();');

-- Add composite indexes for better query performance
CREATE INDEX idx_decisions_user_created ON decisions(user_id, created_at DESC);
CREATE INDEX idx_simulations_status_created ON simulations(status, created_at DESC);

-- Add full text search on decisions
ALTER TABLE decisions ADD COLUMN search_vector tsvector;

CREATE OR REPLACE FUNCTION update_decision_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_decision_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title, description
  ON decisions
  FOR EACH ROW
  EXECUTE FUNCTION update_decision_search_vector();

CREATE INDEX idx_decisions_search ON decisions USING GIN (search_vector);

-- Function to get user's recent decisions
CREATE OR REPLACE FUNCTION get_recent_decisions(user_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  title TEXT,
  type decision_type,
  status decision_status,
  created_at TIMESTAMPTZ,
  option_count BIGINT,
  simulation_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.title,
    d.type,
    d.status,
    d.created_at,
    COUNT(DISTINCT o.id) as option_count,
    COUNT(DISTINCT s.id) as simulation_count
  FROM decisions d
  LEFT JOIN decision_options o ON d.id = o.decision_id
  LEFT JOIN simulations s ON d.id = s.decision_id
  WHERE d.user_id = user_uuid
  GROUP BY d.id, d.title, d.type, d.status, d.created_at
  ORDER BY d.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policy for market data cache (public read, admin write)
ALTER TABLE market_data_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read market data" ON market_data_cache
  FOR SELECT USING (true);

-- Note: Write access should be restricted to service role or specific API endpoints

-- Add helpful comments
COMMENT ON TABLE decisions IS 'Stores user decisions for analysis';
COMMENT ON TABLE simulations IS 'Stores Monte Carlo simulation results';
COMMENT ON TABLE market_data_cache IS 'Caches external API data with expiration';
COMMENT ON COLUMN simulations.sensitivity_analysis IS 'Sobol indices and parameter importance';
COMMENT ON COLUMN simulations.scenarios IS 'Detailed scenario outcomes from Monte Carlo';