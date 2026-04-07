-- ============================================
-- BONY FIT — INTERAÇÕES ESTILO X/TWITTER
-- Migration 017
-- ============================================

-- Visualizações
ALTER TABLE posts ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0;

-- Reposts
CREATE TABLE IF NOT EXISTS post_reposts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quote_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reposts_post ON post_reposts(post_id);
ALTER TABLE post_reposts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reposts_select" ON post_reposts FOR SELECT TO authenticated USING (true);
CREATE POLICY "reposts_insert" ON post_reposts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "reposts_delete" ON post_reposts FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Trigger share_count
CREATE OR REPLACE FUNCTION update_share_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET share_count = share_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET share_count = GREATEST(share_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_share_count ON post_reposts;
CREATE TRIGGER trigger_share_count
  AFTER INSERT OR DELETE ON post_reposts
  FOR EACH ROW EXECUTE FUNCTION update_share_count();

-- Views
CREATE TABLE IF NOT EXISTS post_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_views_post ON post_views(post_id);
ALTER TABLE post_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "views_insert" ON post_views FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "views_select" ON post_views FOR SELECT TO authenticated USING (true);

-- Trigger view_count
CREATE OR REPLACE FUNCTION update_view_count() RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET view_count = view_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_view_count ON post_views;
CREATE TRIGGER trigger_view_count
  AFTER INSERT ON post_views
  FOR EACH ROW EXECUTE FUNCTION update_view_count();

-- Username
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION generate_username(p_name TEXT)
RETURNS TEXT AS $$
DECLARE
  v_base TEXT;
  v_username TEXT;
  v_counter INT := 0;
BEGIN
  v_base := lower(unaccent(p_name));
  v_base := regexp_replace(v_base, '[^a-z0-9]', '.', 'g');
  v_base := regexp_replace(v_base, '\.+', '.', 'g');
  v_base := trim(both '.' from v_base);
  v_username := v_base;
  WHILE EXISTS (SELECT 1 FROM users WHERE username = v_username) LOOP
    v_counter := v_counter + 1;
    v_username := v_base || v_counter;
  END LOOP;
  RETURN v_username;
END;
$$ LANGUAGE plpgsql;

UPDATE users SET username = generate_username(name) WHERE username IS NULL;
