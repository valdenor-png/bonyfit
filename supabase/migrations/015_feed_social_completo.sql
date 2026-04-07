-- ============================================
-- BONY FIT — FEED SOCIAL COMPLETO
-- Migration 015
-- ============================================

-- 1. Posts mais ricos
ALTER TABLE posts ADD COLUMN IF NOT EXISTS post_type TEXT DEFAULT 'manual';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS mentions UUID[] DEFAULT '{}';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS share_count INT DEFAULT 0;

-- 2. Reactions
CREATE TABLE IF NOT EXISTS post_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL CHECK (reaction IN ('fire', 'strong', 'trophy', 'heart', 'clap')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS reactions_count JSONB DEFAULT '{"fire":0,"strong":0,"trophy":0,"heart":0,"clap":0}';

CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON post_reactions(post_id);
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reactions_select" ON post_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "reactions_insert" ON post_reactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "reactions_delete" ON post_reactions FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 3. Followers (tabela nova se follows existente não tem o formato certo)
ALTER TABLE users ADD COLUMN IF NOT EXISTS followers_count INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS following_count INT DEFAULT 0;

-- Trigger de contadores
CREATE OR REPLACE FUNCTION update_follower_counts() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    UPDATE users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = OLD.following_id;
    UPDATE users SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_follower_counts ON follows;
CREATE TRIGGER trigger_follower_counts
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW EXECUTE FUNCTION update_follower_counts();

-- 4. Stories (melhorar se já existe)
ALTER TABLE stories ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'image';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#F26522';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0;

-- 5. Função sugestões sociais
CREATE OR REPLACE FUNCTION sugestoes_sociais(p_user_id UUID, p_unit_id UUID)
RETURNS TABLE(
  suggested_user_id UUID, name TEXT, avatar_url TEXT, level TEXT,
  horario_comum TEXT, treinos_juntos INT
) AS $$
BEGIN
  RETURN QUERY
  WITH meu_horario AS (
    SELECT EXTRACT(HOUR FROM started_at)::INT as hora
    FROM workout_logs_v2
    WHERE user_id = p_user_id AND started_at > NOW() - INTERVAL '30 days'
    GROUP BY 1 ORDER BY COUNT(*) DESC LIMIT 1
  ),
  mesma_faixa AS (
    SELECT wl.user_id as uid, COUNT(*)::INT as treinos
    FROM workout_logs_v2 wl, meu_horario mh
    WHERE ABS(EXTRACT(HOUR FROM wl.started_at)::INT - mh.hora) <= 1
      AND wl.user_id != p_user_id
      AND wl.unidade_id = p_unit_id
      AND wl.started_at > NOW() - INTERVAL '30 days'
    GROUP BY 1
  )
  SELECT u.id, u.name, u.avatar_url, u.level,
    (SELECT hora || 'h-' || (hora+1) || 'h' FROM meu_horario),
    COALESCE(mf.treinos, 0)
  FROM mesma_faixa mf
  JOIN users u ON u.id = mf.uid
  WHERE u.is_active IS NOT FALSE AND (u.is_private IS NULL OR u.is_private = false)
    AND NOT EXISTS (SELECT 1 FROM follows WHERE follower_id = p_user_id AND following_id = u.id)
  ORDER BY mf.treinos DESC LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
