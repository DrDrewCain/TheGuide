-- Migration: Fix Supabase Linter Security and Performance Warnings
-- Generated to address security and performance issues identified by Supabase linter

-- 1. Fix exposed auth.users in user_decision_stats view
-- Drop the existing view that exposes auth.users
DROP VIEW IF EXISTS public.user_decision_stats CASCADE;

-- Recreate the view with SECURITY INVOKER (not DEFINER) and without exposing auth.users
CREATE OR REPLACE VIEW public.user_decision_stats
WITH (security_invoker = true) AS
SELECT
  d.user_id,
  COUNT(DISTINCT d.id) AS total_decisions,
  COUNT(DISTINCT CASE WHEN d.status IN ('decided', 'implemented') THEN d.id END) AS completed_decisions,
  COUNT(DISTINCT s.id) AS total_simulations,
  COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.id END) AS successful_simulations,
  AVG(EXTRACT(EPOCH FROM (s.completed_at - s.started_at))/60) AS avg_simulation_time
FROM public.decisions d
LEFT JOIN public.simulations s ON d.id = s.decision_id
WHERE d.user_id = (SELECT auth.uid()) -- Only show data for current user
GROUP BY d.user_id;

-- Grant appropriate permissions
GRANT SELECT ON public.user_decision_stats TO authenticated;

-- 2. Enable RLS on audit_log table
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for audit_log
CREATE POLICY "Users can view own audit logs" ON public.audit_log
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "System can insert audit logs" ON public.audit_log
  FOR INSERT WITH CHECK (true);

-- 3. Optimize RLS policies for user_profiles table
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own onboarding status" ON public.user_profiles;

-- Create optimized policies using (SELECT auth.uid()) pattern
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users can delete own profile" ON public.user_profiles
  FOR DELETE USING ((SELECT auth.uid()) = id);

-- 4. Optimize RLS policies for decisions table
DROP POLICY IF EXISTS "Users can view own decisions" ON public.decisions;
DROP POLICY IF EXISTS "Users can insert own decisions" ON public.decisions;
DROP POLICY IF EXISTS "Users can update own decisions" ON public.decisions;
DROP POLICY IF EXISTS "Users can delete own decisions" ON public.decisions;

CREATE POLICY "Users can view own decisions" ON public.decisions
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own decisions" ON public.decisions
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own decisions" ON public.decisions
  FOR UPDATE USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own decisions" ON public.decisions
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- 5. Optimize and merge policies for decision_options table
DROP POLICY IF EXISTS "Users can view options of own decisions" ON public.decision_options;
DROP POLICY IF EXISTS "Users can manage options of own decisions" ON public.decision_options;

-- Create single policy for viewing
CREATE POLICY "Users can view options of own decisions" ON public.decision_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.decisions
      WHERE decisions.id = decision_options.decision_id
      AND decisions.user_id = (SELECT auth.uid())
    )
  );

-- Create policies for other operations
CREATE POLICY "Users can insert options for own decisions" ON public.decision_options
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.decisions
      WHERE decisions.id = decision_options.decision_id
      AND decisions.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update options of own decisions" ON public.decision_options
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.decisions
      WHERE decisions.id = decision_options.decision_id
      AND decisions.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete options of own decisions" ON public.decision_options
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.decisions
      WHERE decisions.id = decision_options.decision_id
      AND decisions.user_id = (SELECT auth.uid())
    )
  );

-- 6. Optimize RLS policies for simulations table
DROP POLICY IF EXISTS "Users can view simulations of own decisions" ON public.simulations;
DROP POLICY IF EXISTS "Users can create simulations for own decisions" ON public.simulations;
DROP POLICY IF EXISTS "Users can update own simulations" ON public.simulations;

CREATE POLICY "Users can view simulations of own decisions" ON public.simulations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.decisions
      WHERE decisions.id = simulations.decision_id
      AND decisions.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can create simulations for own decisions" ON public.simulations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.decisions
      WHERE decisions.id = simulations.decision_id
      AND decisions.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update simulations of own decisions" ON public.simulations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.decisions
      WHERE decisions.id = simulations.decision_id
      AND decisions.user_id = (SELECT auth.uid())
    )
  );

-- 7. Set search_path for all functions
-- Update existing functions to have explicit search_path
ALTER FUNCTION public.update_decision_search_vector() SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_catalog;
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_catalog;
ALTER FUNCTION public.clean_expired_cache() SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_recent_decisions(p_user_id uuid, p_limit integer) SET search_path = public, pg_catalog;
ALTER FUNCTION public.validate_decision_options() SET search_path = public, pg_catalog;
ALTER FUNCTION public.check_decision_limit() SET search_path = public, pg_catalog;
ALTER FUNCTION public.refresh_decision_analytics() SET search_path = public, pg_catalog;
ALTER FUNCTION public.audit_trigger_function() SET search_path = public, pg_catalog;

-- 8. Add RLS policies for market_data_cache if not exists
-- This table should have policies if it's exposed to the API
-- First drop existing policies if any
DROP POLICY IF EXISTS "Authenticated users can view market data" ON public.market_data_cache;
DROP POLICY IF EXISTS "Service role can manage market data" ON public.market_data_cache;

-- Then create new policies
CREATE POLICY "Authenticated users can view market data" ON public.market_data_cache
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage market data" ON public.market_data_cache
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- 9. Add comment for documentation
COMMENT ON VIEW public.user_decision_stats IS 'User decision statistics view - filtered by current user for security';