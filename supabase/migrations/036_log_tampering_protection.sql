-- ============================================
-- Migration 036: Proteção contra manipulação de logs
-- ============================================

-- Impedir UPDATE/DELETE em workout_logs_v2 após 1 hora
CREATE OR REPLACE FUNCTION prevent_log_tampering()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' AND OLD.created_at < NOW() - INTERVAL '1 hour' THEN
    RAISE EXCEPTION 'Logs não podem ser deletados após 1 hora';
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.created_at < NOW() - INTERVAL '1 hour' THEN
    RAISE EXCEPTION 'Logs não podem ser alterados após 1 hora';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_log_tampering ON public.workout_logs_v2;
CREATE TRIGGER trigger_prevent_log_tampering
  BEFORE UPDATE OR DELETE ON public.workout_logs_v2
  FOR EACH ROW
  EXECUTE FUNCTION prevent_log_tampering();

-- audit_log append-only
REVOKE UPDATE, DELETE ON public.audit_log FROM authenticated;
