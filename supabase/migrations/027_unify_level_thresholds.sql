-- ============================================
-- Migration 027: Unificar Thresholds de Nível
-- Problema: 3 fontes com valores diferentes + CHECK constraint minúscula
-- Solução: dropar constraint, unificar com Title Case
-- ============================================

-- ── DROPAR CHECK CONSTRAINT antiga (minúsculas) ──────────────
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_level_check;

-- ── NOVA CHECK CONSTRAINT (Title Case) ───────────────────────
ALTER TABLE users ADD CONSTRAINT users_level_check
  CHECK (level IN ('Bronze', 'Prata', 'Ouro', 'Platina', 'Diamante', 'Master'));

-- ── CORRIGIR DEFAULT ─────────────────────────────────────────
ALTER TABLE users ALTER COLUMN level SET DEFAULT 'Bronze';

-- ── CORRIGIR NÍVEIS EXISTENTES (minúscula → Title Case) ──────
UPDATE users SET level = CASE
  WHEN level = 'master' THEN 'Master'
  WHEN level = 'diamante' THEN 'Diamante'
  WHEN level = 'platina' THEN 'Platina'
  WHEN level = 'ouro' THEN 'Ouro'
  WHEN level = 'prata' THEN 'Prata'
  WHEN level = 'bronze' THEN 'Bronze'
  ELSE 'Bronze'
END
WHERE level NOT IN ('Bronze', 'Prata', 'Ouro', 'Platina', 'Diamante', 'Master');

-- ── RECALCULAR NÍVEL baseado nos pontos atuais ───────────────
UPDATE users SET level = CASE
  WHEN COALESCE(total_points, 0) >= 50000 THEN 'Master'
  WHEN COALESCE(total_points, 0) >= 25000 THEN 'Diamante'
  WHEN COALESCE(total_points, 0) >= 10000 THEN 'Platina'
  WHEN COALESCE(total_points, 0) >= 5000 THEN 'Ouro'
  WHEN COALESCE(total_points, 0) >= 2000 THEN 'Prata'
  ELSE 'Bronze'
END;

-- ── ATUALIZAR TRIGGER ────────────────────────────────────────
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

-- ── ATUALIZAR RPC ────────────────────────────────────────────
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
