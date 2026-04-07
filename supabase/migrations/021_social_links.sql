-- ============================================
-- BONY FIT — REDES SOCIAIS NO PERFIL
-- Migration 021
-- ============================================

CREATE TABLE IF NOT EXISTS user_social_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  network TEXT NOT NULL CHECK (network IN (
    'instagram', 'tiktok', 'twitter', 'facebook',
    'youtube', 'twitch', 'spotify', 'threads'
  )),
  url TEXT NOT NULL,
  display_order SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, network)
);

CREATE INDEX IF NOT EXISTS idx_social_links_user ON user_social_links(user_id);

ALTER TABLE user_social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_links_select" ON user_social_links FOR SELECT TO authenticated USING (true);
CREATE POLICY "social_links_insert" ON user_social_links FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "social_links_update" ON user_social_links FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "social_links_delete" ON user_social_links FOR DELETE TO authenticated USING (auth.uid() = user_id);
