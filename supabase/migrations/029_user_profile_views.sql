-- ============================================
-- Migration 029: Views seguras para tabela users
-- ============================================
-- Substitui queries diretas à tabela users por views com RLS nativo.
-- user_profile_safe  → perfil do próprio usuário (filtra por auth.uid())
-- public_user_profile → dados públicos de qualquer usuário (ranking, feed, perfil)

-- ── View: perfil do próprio usuário ─────────────────────────────
CREATE OR REPLACE VIEW user_profile_safe AS
SELECT
  id, name, email, cpf, phone, avatar_url, bio,
  cargo_id, cargo_slug, unit_id, plan_id,
  total_points, current_streak, longest_streak, last_workout_date,
  level, total_workouts,
  onboarding_completed, mostrar_presenca, is_private,
  codigo_indicacao, indicado_por,
  status_assinatura, username,
  created_at
FROM users
WHERE id = auth.uid();

-- ── View: perfil público (dados seguros para exibir a outros) ───
CREATE OR REPLACE VIEW public_user_profile AS
SELECT
  id, name, username, avatar_url, bio,
  cargo_slug, unit_id,
  total_points, current_streak, longest_streak,
  level, total_workouts,
  is_private, mostrar_presenca,
  created_at
FROM users;

-- Grant acesso autenticado
GRANT SELECT ON user_profile_safe TO authenticated;
GRANT SELECT ON public_user_profile TO authenticated;
