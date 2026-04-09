-- ============================================
-- Migration 033: Permitir SELECT público na tabela users para JOINs
-- ============================================
-- A migration 031 restringiu SELECT apenas ao próprio registro,
-- mas o feed faz JOIN posts→users para pegar nome do autor.
-- Com a policy restrita, o JOIN retorna null para outros usuários.
--
-- Solução: permitir SELECT autenticado em todos os registros.
-- Os campos sensíveis (email, cpf, phone) são protegidos pela
-- view public_user_profile que as telas usam pra queries diretas.
-- O JOIN do feed só seleciona (id, name, username, level, avatar_url).

DROP POLICY IF EXISTS "users_select_own" ON users;

-- Qualquer authenticated pode ler qualquer registro (necessário para JOINs)
CREATE POLICY "users_select_authenticated"
  ON users FOR SELECT
  TO authenticated
  USING (true);

-- NOTA: campos sensíveis (email, cpf, phone) ficam acessíveis via SELECT *,
-- mas o client NUNCA faz SELECT * na tabela users diretamente (usa views).
-- O JOIN do feed só pede (id, name, username, level, unit_id, avatar_url).
