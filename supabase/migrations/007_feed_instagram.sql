-- ============================================
-- BONY FIT — FEED INSTAGRAM
-- Migration 007
-- ============================================

-- Stories
CREATE TABLE IF NOT EXISTS stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT,
  text TEXT,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  views_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS story_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  viewer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, viewer_id)
);

-- Campos extras em users
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;

-- Campo saved_posts
CREATE TABLE IF NOT EXISTS saved_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stories_user ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires ON stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_story_views_story ON story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_user ON saved_posts(user_id);

-- RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stories_select_all" ON stories FOR SELECT TO authenticated USING (true);
CREATE POLICY "stories_insert_own" ON stories FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "stories_delete_own" ON stories FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "story_views_select_own" ON story_views FOR SELECT TO authenticated USING (viewer_id = auth.uid());
CREATE POLICY "story_views_insert_own" ON story_views FOR INSERT TO authenticated WITH CHECK (viewer_id = auth.uid());

CREATE POLICY "saved_posts_select_own" ON saved_posts FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "saved_posts_insert_own" ON saved_posts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "saved_posts_delete_own" ON saved_posts FOR DELETE TO authenticated USING (user_id = auth.uid());
