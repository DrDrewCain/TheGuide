-- Migration: Fix SECURITY DEFINER on user_decision_stats view
-- This addresses the remaining security warning after migration 005

-- Drop the existing view
DROP VIEW IF EXISTS public.user_decision_stats CASCADE;

-- Recreate the view with SECURITY INVOKER (not DEFINER)
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

-- Add comment for documentation
COMMENT ON VIEW public.user_decision_stats IS 'User decision statistics view - filtered by current user for security, uses SECURITY INVOKER';