-- ============================================
-- Migration 040: Anti-Fraude v3 — 8 melhorias
-- ============================================

-- 1. Blacklist temporário (3 treinos invalidados em 30 dias = ban 7 dias)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gamificacao_bloqueada_ate TIMESTAMPTZ;

-- 2. Device fingerprint tracking
ALTER TABLE public.workout_logs_v2 ADD COLUMN IF NOT EXISTS device_id TEXT;
ALTER TABLE public.checkins ADD COLUMN IF NOT EXISTS device_id TEXT;

-- 3. Points decay (pg_cron — roda diariamente às 04:00)
-- Remove 5% dos pontos se inativo há 14+ dias
-- NOTA: pg_cron deve estar habilitado no Supabase Dashboard
CREATE OR REPLACE FUNCTION decay_pontos_inativos()
RETURNS void AS $$
BEGIN
  -- Encontrar users inativos (sem checkin nos últimos 14 dias)
  -- e que tenham pontos > 0
  UPDATE users u
  SET total_points = GREATEST(0, FLOOR(total_points * 0.95))
  WHERE total_points > 0
  AND NOT EXISTS (
    SELECT 1 FROM checkins c
    WHERE c.user_id = u.id
    AND c.created_at > NOW() - INTERVAL '14 days'
  )
  AND NOT EXISTS (
    SELECT 1 FROM workout_logs_v2 wl
    WHERE wl.user_id = u.id
    AND wl.created_at > NOW() - INTERVAL '14 days'
  );

  -- Registrar no fraud_log pra transparência
  INSERT INTO fraud_log (user_id, tipo, detalhes)
  SELECT id, 'decay_inatividade', jsonb_build_object('pontos_antes', total_points, 'aplicado_em', NOW())
  FROM users
  WHERE total_points > 0
  AND NOT EXISTS (
    SELECT 1 FROM checkins c
    WHERE c.user_id = users.id
    AND c.created_at > NOW() - INTERVAL '14 days'
  )
  AND NOT EXISTS (
    SELECT 1 FROM workout_logs_v2 wl
    WHERE wl.user_id = users.id
    AND wl.created_at > NOW() - INTERVAL '14 days'
  );
END;
$$ LANGUAGE plpgsql;

-- Agendar (descomentar após habilitar pg_cron):
-- SELECT cron.schedule('decay-pontos', '0 4 * * *', $$ SELECT decay_pontos_inativos(); $$);

-- 4. Função para verificar blacklist automático
CREATE OR REPLACE FUNCTION check_auto_blacklist(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  invalidados INTEGER;
BEGIN
  -- Contar treinos invalidados nos últimos 30 dias
  SELECT COUNT(*) INTO invalidados
  FROM workout_logs_v2
  WHERE user_id = p_user_id
  AND invalidado = TRUE
  AND created_at > NOW() - INTERVAL '30 days';

  IF invalidados >= 3 THEN
    UPDATE users
    SET gamificacao_bloqueada_ate = NOW() + INTERVAL '7 days'
    WHERE id = p_user_id;

    INSERT INTO fraud_log (user_id, tipo, detalhes)
    VALUES (p_user_id, 'blacklist_7_dias', jsonb_build_object('invalidados_30d', invalidados));

    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
