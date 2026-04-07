-- ============================================
-- BONY FIT — FIX MESSAGES RLS + OTIMIZAÇÃO
-- Migration 019
-- ============================================

-- 1. Função SECURITY DEFINER para evitar recursão RLS
CREATE OR REPLACE FUNCTION public.user_conversation_ids(user_uuid UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT conversation_id
  FROM conversation_participants
  WHERE user_id = user_uuid;
$$;

-- 2. Recriar policies sem recursão
DROP POLICY IF EXISTS "conv_select" ON conversations;
DROP POLICY IF EXISTS "conv_insert" ON conversations;
DROP POLICY IF EXISTS "conv_update" ON conversations;
DROP POLICY IF EXISTS "cp_select" ON conversation_participants;
DROP POLICY IF EXISTS "cp_insert" ON conversation_participants;
DROP POLICY IF EXISTS "msg_v2_select" ON messages_v2;
DROP POLICY IF EXISTS "msg_v2_insert" ON messages_v2;

CREATE POLICY "conv_select" ON conversations FOR SELECT USING (
  id IN (SELECT public.user_conversation_ids(auth.uid()))
);
CREATE POLICY "conv_insert" ON conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "conv_update" ON conversations FOR UPDATE USING (
  id IN (SELECT public.user_conversation_ids(auth.uid()))
);

CREATE POLICY "cp_select" ON conversation_participants FOR SELECT USING (
  user_id = auth.uid() OR conversation_id IN (SELECT public.user_conversation_ids(auth.uid()))
);
CREATE POLICY "cp_insert" ON conversation_participants FOR INSERT WITH CHECK (true);

CREATE POLICY "msg_v2_select" ON messages_v2 FOR SELECT USING (
  conversation_id IN (SELECT public.user_conversation_ids(auth.uid()))
);
CREATE POLICY "msg_v2_insert" ON messages_v2 FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  conversation_id IN (SELECT public.user_conversation_ids(auth.uid()))
);

-- 3. Índices extras
CREATE INDEX IF NOT EXISTS idx_cp_user_conv ON conversation_participants(user_id, conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_v2_conv_created ON messages_v2(conversation_id, created_at DESC);

-- 4. Bucket para imagens do chat
INSERT INTO storage.buckets (id, name, public, file_size_limit)
SELECT 'chat-images', 'chat-images', true, 5242880
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'chat-images');

CREATE POLICY "chat_images_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-images');
CREATE POLICY "chat_images_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'chat-images' AND auth.role() = 'authenticated');
