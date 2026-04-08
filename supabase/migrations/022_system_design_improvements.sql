-- ============================================
-- Migration 022: System Design Improvements
-- Rate Limiting, Full-Text Search, Check-in TTL, RPC Functions
-- ============================================

-- ── RATE LIMITING ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rate_limit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_user_action_time
  ON rate_limit_log(user_id, action, created_at DESC);

CREATE TABLE IF NOT EXISTS fraud_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  action TEXT NOT NULL,
  attempt_count INT,
  blocked BOOLEAN DEFAULT true,
  reviewed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE rate_limit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_rate_limit" ON rate_limit_log
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_fraud" ON fraud_alerts
  FOR ALL USING (auth.role() = 'service_role');

-- ── FULL-TEXT SEARCH: EXERCISES ──────────────────────────────

ALTER TABLE exercises ADD COLUMN IF NOT EXISTS search_vector tsvector;

UPDATE exercises SET search_vector =
  setweight(to_tsvector('portuguese', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('portuguese', coalesce(muscle_group, '')), 'B') ||
  setweight(to_tsvector('portuguese', coalesce(equipment, '')), 'C');

CREATE INDEX IF NOT EXISTS idx_exercises_search ON exercises USING GIN(search_vector);

CREATE OR REPLACE FUNCTION exercises_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(NEW.muscle_group, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(NEW.equipment, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_exercises_search ON exercises;
CREATE TRIGGER trg_exercises_search
  BEFORE INSERT OR UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION exercises_search_update();

-- ── FULL-TEXT SEARCH: USERS (for social/feed) ───────────────

ALTER TABLE users ADD COLUMN IF NOT EXISTS search_vector tsvector;

UPDATE users SET search_vector =
  setweight(to_tsvector('portuguese', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('portuguese', coalesce(username, '')), 'A');

CREATE INDEX IF NOT EXISTS idx_users_search ON users USING GIN(search_vector);

CREATE OR REPLACE FUNCTION users_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(NEW.username, '')), 'A');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_search ON users;
CREATE TRIGGER trg_users_search
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION users_search_update();

-- ── SEARCH RPC ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION search_exercises(query_text TEXT, result_limit INT DEFAULT 20)
RETURNS TABLE(id UUID, name TEXT, muscle_group TEXT, equipment TEXT, rank REAL)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id, e.name, e.muscle_group, e.equipment,
    ts_rank(e.search_vector, plainto_tsquery('portuguese', query_text)) AS rank
  FROM exercises e
  WHERE e.search_vector @@ plainto_tsquery('portuguese', query_text)
  ORDER BY rank DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ── ACTIVE CHECK-INS WITH TTL ───────────────────────────────

CREATE TABLE IF NOT EXISTS active_checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  unit_id UUID NOT NULL,
  checked_in_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + interval '120 minutes',
  checked_out_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'invalid')),
  points_awarded BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_active_checkins_status ON active_checkins(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_active_checkins_user ON active_checkins(user_id, checked_in_at DESC);

ALTER TABLE active_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_checkins" ON active_checkins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_checkins" ON active_checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── CHECKOUT WITH POINTS ────────────────────────────────────

CREATE OR REPLACE FUNCTION checkout_and_award_points(
  p_checkin_id UUID,
  p_min_stay_minutes INT DEFAULT 30
) RETURNS JSONB AS $$
DECLARE
  v_checkin RECORD;
  v_stay_minutes INT;
  v_points INT;
BEGIN
  SELECT * INTO v_checkin FROM active_checkins
    WHERE id = p_checkin_id AND user_id = auth.uid() AND status = 'active';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'check-in não encontrado');
  END IF;

  v_stay_minutes := EXTRACT(EPOCH FROM (now() - v_checkin.checked_in_at)) / 60;

  IF v_stay_minutes < p_min_stay_minutes THEN
    UPDATE active_checkins SET status = 'invalid', checked_out_at = now()
      WHERE id = p_checkin_id;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'tempo mínimo não atingido',
      'stayed_minutes', v_stay_minutes,
      'required_minutes', p_min_stay_minutes
    );
  END IF;

  v_points := 100;

  UPDATE active_checkins
    SET status = 'completed', checked_out_at = now(), points_awarded = true
    WHERE id = p_checkin_id;

  UPDATE users SET total_points = COALESCE(total_points, 0) + v_points
    WHERE id = auth.uid();

  RETURN jsonb_build_object(
    'success', true,
    'stayed_minutes', v_stay_minutes,
    'points_awarded', v_points
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── ADD USER POINTS RPC ─────────────────────────────────────

CREATE OR REPLACE FUNCTION add_user_points(p_user_id UUID, p_points INT)
RETURNS VOID AS $$
BEGIN
  UPDATE users
    SET total_points = COALESCE(total_points, 0) + p_points,
        updated_at = now()
    WHERE id = p_user_id;

  -- Update level based on points
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
