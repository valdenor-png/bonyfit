-- ============================================
-- Migration 038: Detecção de anomalias (pg_cron)
-- ============================================

-- Função que analisa treinos recentes e cria fraud_flags
CREATE OR REPLACE FUNCTION detectar_anomalias()
RETURNS void AS $$
DECLARE
  r RECORD;
BEGIN
  -- Flag: treinos excessivos (mais de 2 em 24h)
  FOR r IN
    SELECT user_id, COUNT(*) AS total
    FROM workout_logs_v2
    WHERE created_at > NOW() - INTERVAL '24 hours'
    GROUP BY user_id
    HAVING COUNT(*) > 2
  LOOP
    INSERT INTO fraud_flags (user_id, flag_type, severidade, detalhes)
    VALUES (r.user_id, 'treinos_excessivos', 'alta', jsonb_build_object('total_24h', r.total))
    ON CONFLICT DO NOTHING;
    UPDATE users SET trust_score = GREATEST(0, trust_score - 15) WHERE id = r.user_id;
  END LOOP;

  -- Flag: treino muito curto com muitas séries (velocidade impossível)
  FOR r IN
    SELECT
      wl.user_id,
      wl.id AS log_id,
      wl.duration_seconds,
      (SELECT count(*) FROM workout_sets ws WHERE ws.workout_log_id = wl.id AND ws.is_completed = true) AS total_series
    FROM workout_logs_v2 wl
    WHERE wl.created_at > NOW() - INTERVAL '2 hours'
    AND wl.duration_seconds IS NOT NULL
  LOOP
    IF r.total_series > 0 AND r.duration_seconds > 0 THEN
      IF (r.duration_seconds::float / r.total_series) < 15 THEN
        INSERT INTO fraud_flags (user_id, flag_type, severidade, detalhes)
        VALUES (r.user_id, 'velocidade_impossivel', 'alta', jsonb_build_object(
          'log_id', r.log_id,
          'media_seg_serie', ROUND((r.duration_seconds::float / r.total_series)::numeric, 1),
          'total_series', r.total_series
        ))
        ON CONFLICT DO NOTHING;
        UPDATE users SET trust_score = GREATEST(0, trust_score - 15) WHERE id = r.user_id;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Agendar a cada 30 minutos (requer extensão pg_cron habilitada no Supabase)
-- SELECT cron.schedule('detectar-anomalias', '*/30 * * * *', $$ SELECT detectar_anomalias(); $$);

-- Recuperação diária de trust_score (+1 por dia limpo)
-- SELECT cron.schedule('recuperar-trust-score', '0 3 * * *', $$
--   UPDATE users u SET trust_score = LEAST(100, trust_score + 1)
--   WHERE trust_score < 100
--   AND EXISTS (SELECT 1 FROM workout_logs_v2 wl WHERE wl.user_id = u.id AND wl.created_at > NOW() - INTERVAL '24 hours')
--   AND NOT EXISTS (SELECT 1 FROM fraud_flags f WHERE f.user_id = u.id AND f.created_at > NOW() - INTERVAL '24 hours');
-- $$);
