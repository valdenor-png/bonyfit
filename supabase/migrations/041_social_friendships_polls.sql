-- ============================================
-- Migration 041: Sistema Social — Amizades, Enquetes, Treinando Agora
-- ============================================

-- 1. Friendships
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id_1 UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_id_2 UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(user_id_1, user_id_2)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user1 ON public.friendships(user_id_1);
CREATE INDEX IF NOT EXISTS idx_friendships_user2 ON public.friendships(user_id_2);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "friendships_select" ON public.friendships
  FOR SELECT TO authenticated
  USING (user_id_1 = auth.uid() OR user_id_2 = auth.uid());

CREATE POLICY "friendships_insert" ON public.friendships
  FOR INSERT TO authenticated
  WITH CHECK (user_id_1 = auth.uid());

CREATE POLICY "friendships_update" ON public.friendships
  FOR UPDATE TO authenticated
  USING (user_id_2 = auth.uid());

CREATE POLICY "friendships_delete" ON public.friendships
  FOR DELETE TO authenticated
  USING (user_id_1 = auth.uid() OR user_id_2 = auth.uid());

-- 2. Polls
CREATE TABLE IF NOT EXISTS public.polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_polls_author ON public.polls(author_id);
CREATE INDEX IF NOT EXISTS idx_polls_expires ON public.polls(expires_at);

ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "polls_select" ON public.polls
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "polls_insert" ON public.polls
  FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "polls_delete" ON public.polls
  FOR DELETE TO authenticated
  USING (author_id = auth.uid());

-- 3. Poll Votes
CREATE TABLE IF NOT EXISTS public.poll_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  chosen_option TEXT NOT NULL CHECK (chosen_option IN ('a', 'b')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON public.poll_votes(poll_id);

ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "poll_votes_select" ON public.poll_votes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "poll_votes_insert" ON public.poll_votes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 4. View: amigos treinando agora
CREATE OR REPLACE VIEW public.friends_training_now AS
SELECT ac.user_id, u.name, u.avatar_url, ac.checked_in_at, u.unit_id
FROM active_checkins ac
JOIN users u ON u.id = ac.user_id
WHERE ac.expires_at > NOW() AND ac.status = 'active';

GRANT SELECT ON public.friends_training_now TO authenticated;
