-- Reset script to clean up partial migration
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS simulations CASCADE;
DROP TABLE IF EXISTS decision_options CASCADE;
DROP TABLE IF EXISTS decisions CASCADE;
DROP TABLE IF EXISTS market_data_cache CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

DROP MATERIALIZED VIEW IF EXISTS decision_analytics CASCADE;

DROP TYPE IF EXISTS decision_type CASCADE;
DROP TYPE IF EXISTS decision_status CASCADE;
DROP TYPE IF EXISTS simulation_status CASCADE;
DROP TYPE IF EXISTS marital_status CASCADE;

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS validate_decision_options() CASCADE;
DROP FUNCTION IF EXISTS check_decision_limit() CASCADE;
DROP FUNCTION IF EXISTS refresh_decision_analytics() CASCADE;
DROP FUNCTION IF EXISTS audit_trigger_function() CASCADE;
DROP FUNCTION IF EXISTS enhance_simulation() CASCADE;
DROP FUNCTION IF EXISTS search_decisions() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;