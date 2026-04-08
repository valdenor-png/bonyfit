-- ============================================
-- Migration 027: Unificar Thresholds de Nível
-- Problema: 3 fontes com valores diferentes
-- Solução: uma única function com thresholds consistentes
-- ============================================

-- ── ATUALIZAR TRIGGER update_user_level ──────────────────────
-- Thresholds unificados (Title Case):
-- Bronze:   0-1999
-- Prata:    2000-4999
-- Ouro:     5000-9999
-- Platina:  10000-24999
-- Diamante: 25000-49999
-- Master:   50000+

CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
BEGIN
  NEW.level := CASE
    WHEN COALESCE(NEW.total_points, 0) >= 50000 THEN 'Master'
    WHEN COALESCE(NEW.total_points, 0) >= 25000 THEN 'Diamante'
    WHEN COALESCE(NEW.total_points, 0) >= 10000 THEN 'Platina'
    WHEN COALESCE(NEW.total_points, 0) >= 5000 THEN 'Ouro'
    WHEN COALESCE(NEW.total_points, 0) >= 2000 THEN 'Prata'
    ELSE 'Bronze'
  END;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── ATUALIZAR RPC add_user_points (mesmos thresholds) ────────

CREATE OR REPLACE FUNCTION add_user_points(p_user_id UUID, p_points INT)
RETURNS VOID AS $$
BEGIN
  UPDATE users
    SET total_points = COALESCE(total_points, 0) + p_points,
        updated_at = now()
    WHERE id = p_user_id;

  UPDATE users
    SET level = CASE
      WHEN COALESCE(total_points, 0) >= 50000 THEN 'Master'
      WHEN COALESCE(total_points, 0) >= 25000 THEN 'Diamante'
      WHEN COALESCE(total_points, 0) >= 10000 THEN 'Platina'
      WHEN COALESCE(total_points, 0) >= 5000 THEN 'Ouro'
      WHEN COALESCE(total_points, 0) >= 2000 THEN 'Prata'
      ELSE 'Bronze'
    END
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── CORRIGIR NÍVEIS EXISTENTES ───────────────────────────────
-- Recalcular o nível de todos os usuários com base nos pontos atuais

UPDATE users SET level = CASE
  WHEN COALESCE(total_points, 0) >= 50000 THEN 'Master'
  WHEN COALESCE(total_points, 0) >= 25000 THEN 'Diamante'
  WHEN COALESCE(total_points, 0) >= 10000 THEN 'Platina'
  WHEN COALESCE(total_points, 0) >= 5000 THEN 'Ouro'
  WHEN COALESCE(total_points, 0) >= 2000 THEN 'Prata'
  ELSE 'Bronze'
END;
