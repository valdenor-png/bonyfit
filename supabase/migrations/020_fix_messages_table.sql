-- ============================================
-- BONY FIT — FIX MESSAGES TABLE
-- Migration 020
-- ============================================

-- Adicionar conversation_id na tabela messages existente
ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_msg_conv ON messages(conversation_id, created_at DESC);

-- Drop messages_v2 se existir (migrar pra messages)
-- NÃO dropar por segurança, apenas parar de usar
