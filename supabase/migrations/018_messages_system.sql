-- ============================================
-- BONY FIT — SISTEMA DE MENSAGENS
-- Migration 018
-- ============================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'dm' CHECK (type IN ('dm', 'group', 'official')),
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_text TEXT,
  last_message_at TIMESTAMPTZ,
  last_message_sender_id UUID REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  is_muted BOOLEAN DEFAULT FALSE,
  is_blocked BOOLEAN DEFAULT FALSE,
  UNIQUE(conversation_id, user_id)
);

-- Usar nova tabela messages_v2 para não conflitar com a existente
CREATE TABLE IF NOT EXISTS messages_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  content TEXT,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'challenge', 'workout_share', 'system')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_messages_v2_conv ON messages_v2(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conv_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last ON conversations(last_message_at DESC);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conv_select" ON conversations FOR SELECT USING (
  id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
);
CREATE POLICY "conv_insert" ON conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "conv_update" ON conversations FOR UPDATE USING (
  id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
);

CREATE POLICY "cp_select" ON conversation_participants FOR SELECT USING (
  conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
);
CREATE POLICY "cp_insert" ON conversation_participants FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "msg_v2_select" ON messages_v2 FOR SELECT USING (
  conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
);
CREATE POLICY "msg_v2_insert" ON messages_v2 FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
);

ALTER PUBLICATION supabase_realtime ADD TABLE messages_v2;
