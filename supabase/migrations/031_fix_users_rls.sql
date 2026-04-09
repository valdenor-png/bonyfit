-- ============================================
-- Migration 031: Restringir RLS da tabela users
-- ============================================
-- A policy anterior (USING true) permitia qualquer authenticated
-- ler TODOS os dados de TODOS os usuários (email, CPF, phone, etc.)
--
-- Nova policy: SELECT apenas do próprio registro.
-- Acesso a outros usuários é via view public_user_profile
-- (que expõe só campos seguros: name, avatar, level, etc.)

DROP POLICY IF EXISTS "users_select" ON users;

-- Próprio perfil: acesso total
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Service role mantém acesso total (Edge Functions, triggers)
-- (implícito — service_role bypassa RLS)
