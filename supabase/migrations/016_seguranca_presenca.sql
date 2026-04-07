-- ============================================
-- BONY FIT — SEGURANÇA PRESENÇA (TREINANDO AGORA)
-- Migration 016
-- ============================================

-- 1. Campo de privacidade de presença
ALTER TABLE users ADD COLUMN IF NOT EXISTS mostrar_presenca BOOLEAN DEFAULT true;

-- 2. Função auxiliar: checar amizade mútua
CREATE OR REPLACE FUNCTION eh_amigo_mutuo(p_user_a UUID, p_user_b UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM follows WHERE follower_id = p_user_a AND following_id = p_user_b
  ) AND EXISTS (
    SELECT 1 FROM follows WHERE follower_id = p_user_b AND following_id = p_user_a
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Função: quem tá treinando agora (SÓ amigos mútuos + privacidade)
CREATE OR REPLACE FUNCTION treinando_agora(p_user_id UUID, p_unit_id UUID)
RETURNS TABLE(
  user_id UUID, name TEXT, avatar_url TEXT, level TEXT,
  started_at TIMESTAMPTZ, split_nome TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (u.id)
    u.id, u.name, u.avatar_url, u.level,
    wl.started_at,
    wps.nome as split_nome
  FROM workout_logs_v2 wl
  JOIN users u ON u.id = wl.user_id
  LEFT JOIN workout_plan_splits wps ON wps.id = wl.split_id
  WHERE wl.finished_at IS NULL
    AND wl.started_at > NOW() - INTERVAL '3 hours'
    AND wl.unidade_id = p_unit_id
    AND u.id != p_user_id
    AND (u.is_active IS NULL OR u.is_active = true)
    AND u.mostrar_presenca = true
    AND EXISTS (SELECT 1 FROM follows WHERE follower_id = p_user_id AND following_id = u.id)
    AND EXISTS (SELECT 1 FROM follows WHERE follower_id = u.id AND following_id = p_user_id)
    AND NOT EXISTS (SELECT 1 FROM blocks WHERE blocker_id = p_user_id AND blocked_id = u.id)
  ORDER BY u.id, wl.started_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
