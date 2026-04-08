-- ============================================
-- Migration 023: Quality Helpers
-- Audit log, API errors, Rate limit RPC, Audit RPC
-- ============================================

-- ── AUDIT LOG ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata JSONB DEFAULT '{}',
  ip TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_audit" ON audit_log
  FOR ALL USING (auth.role() = 'service_role');

-- ── API ERRORS ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS api_errors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_code TEXT,
  stack_trace TEXT,
  request_method TEXT,
  request_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_errors_function ON api_errors(function_name, created_at DESC);

ALTER TABLE api_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_api_errors" ON api_errors
  FOR ALL USING (auth.role() = 'service_role');

-- ── RPC: log_audit ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION log_audit(
  p_user_id UUID,
  p_action TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_ip TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_log (user_id, action, entity_type, entity_id, metadata, ip)
  VALUES (p_user_id, p_action, p_entity_type, p_entity_id, p_metadata, p_ip);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── RPC: log_api_error ───────────────────────────────────────

CREATE OR REPLACE FUNCTION log_api_error(
  p_function_name TEXT,
  p_error_message TEXT,
  p_error_code TEXT DEFAULT NULL,
  p_stack_trace TEXT DEFAULT NULL,
  p_request_method TEXT DEFAULT NULL,
  p_request_path TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO api_errors (function_name, error_message, error_code, stack_trace, request_method, request_path)
  VALUES (p_function_name, p_error_message, p_error_code, p_stack_trace, p_request_method, p_request_path);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── RPC: check_rate_limit ────────────────────────────────────
-- Atomic check + increment. Returns TRUE if allowed, FALSE if blocked.

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_action TEXT,
  p_max_per_minute INT DEFAULT 30
) RETURNS BOOLEAN AS $$
DECLARE
  v_count INT;
  v_window_start TIMESTAMPTZ;
BEGIN
  v_window_start := now() - interval '1 minute';

  -- Count recent actions
  SELECT COUNT(*) INTO v_count
  FROM rate_limit_log
  WHERE user_id = p_user_id
    AND action = p_action
    AND created_at >= v_window_start;

  IF v_count >= p_max_per_minute THEN
    -- Log fraud alert
    INSERT INTO fraud_alerts (user_id, action, attempt_count, blocked)
    VALUES (p_user_id, p_action, v_count, true);
    RETURN FALSE;
  END IF;

  -- Log the action
  INSERT INTO rate_limit_log (user_id, action)
  VALUES (p_user_id, p_action);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── CLEANUP: auto-delete old logs ────────────────────────────
-- Run these via pg_cron if enabled:
-- SELECT cron.schedule('cleanup-audit-log', '0 3 * * 0', $$DELETE FROM audit_log WHERE created_at < now() - interval '90 days'$$);
-- SELECT cron.schedule('cleanup-api-errors', '0 3 * * 0', $$DELETE FROM api_errors WHERE created_at < now() - interval '30 days'$$);
-- SELECT cron.schedule('cleanup-rate-limit', '0 */6 * * *', $$DELETE FROM rate_limit_log WHERE created_at < now() - interval '24 hours'$$);
