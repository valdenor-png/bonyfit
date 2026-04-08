-- ============================================
-- Migration 027: Unificar Thresholds de Nível
-- ============================================

-- 1. DROPAR constraint antiga
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_level_check;

-- 2. CONVERTER valores existentes (minúscula → Title Case)
UPDATE users SET level = 'Master' WHERE level = 'master';
UPDATE users SET level = 'Diamante' WHERE level = 'diamante';
UPDATE users SET level = 'Platina' WHERE level = 'platina';
UPDATE users SET level = 'Ouro' WHERE level = 'ouro';
UPDATE users SET level = 'Prata' WHERE level = 'prata';
UPDATE users SET level = 'Bronze' WHERE level = 'bronze';
UPDATE users SET level = 'Bronze' WHERE level NOT IN ('Bronze','Prata','Ouro','Platina','Diamante','Master');

-- 3. RECALCULAR nível baseado nos pontos
UPDATE users SET level = CASE
  WHEN COALESCE(total_points, 0) >= 50000 THEN 'Master'
  WHEN COALESCE(total_points, 0) >= 25000 THEN 'Diamante'
  WHEN COALESCE(total_points, 0) >= 10000 THEN 'Platina'
  WHEN COALESCE(total_points, 0) >= 5000 THEN 'Ouro'
  WHEN COALESCE(total_points, 0) >= 2000 THEN 'Prata'
  ELSE 'Bronze'
END;

-- 4. AGORA criar constraint (todos os valores já são Title Case)
ALTER TABLE users ADD CONSTRAINT users_level_check
  CHECK (level IN ('Bronze', 'Prata', 'Ouro', 'Platina', 'Diamante', 'Master'));

-- 5. ATUALIZAR default
ALTER TABLE users ALTER COLUMN level SET DEFAULT 'Bronze';

-- 6. ATUALIZAR trigger
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

-- 7. ATUALIZAR RPC
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
