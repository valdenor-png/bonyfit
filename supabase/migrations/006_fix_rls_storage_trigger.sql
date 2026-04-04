-- ============================================
-- BONY FIT — FASE 0: BLINDAR SEGURANÇA
-- Migration 006 — RLS + Storage + Trigger
-- ============================================

-- ═══════════════════════════════════════
-- ETAPA 1: HABILITAR RLS NAS 25 TABELAS
-- ═══════════════════════════════════════

ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE catraca_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE physical_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE anamnesis ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE calorie_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE loja_pedidos ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════
-- POLICIES — DADOS PÚBLICOS (leitura)
-- ═══════════════════════════════════════

CREATE POLICY "units_select_all" ON units FOR SELECT TO authenticated USING (true);
CREATE POLICY "plans_select_all" ON plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "exercises_select_all" ON exercises FOR SELECT TO authenticated USING (true);
CREATE POLICY "workout_templates_select_all" ON workout_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "workout_template_exercises_select_all" ON workout_template_exercises FOR SELECT TO authenticated USING (true);
CREATE POLICY "badges_select_all" ON badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "rewards_select_all" ON rewards FOR SELECT TO authenticated USING (true);
CREATE POLICY "classes_select_all" ON classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "challenges_select_all" ON challenges FOR SELECT TO authenticated USING (true);
CREATE POLICY "trainers_select_all" ON trainers FOR SELECT TO authenticated USING (true);
CREATE POLICY "groups_select_all" ON groups FOR SELECT TO authenticated USING (true);

-- ═══════════════════════════════════════
-- POLICIES — CATRACA
-- ═══════════════════════════════════════

CREATE POLICY "catraca_select_own" ON catraca_events FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "catraca_insert" ON catraca_events FOR INSERT TO authenticated
  WITH CHECK (true);

-- ═══════════════════════════════════════
-- POLICIES — SOCIAL (likes, comments, follows, blocks, reports)
-- ═══════════════════════════════════════

CREATE POLICY "post_likes_select_all" ON post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "post_likes_insert_own" ON post_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "post_likes_delete_own" ON post_likes FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "post_comments_select_all" ON post_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "post_comments_insert_own" ON post_comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "post_comments_delete_own" ON post_comments FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "blocks_select_own" ON blocks FOR SELECT TO authenticated USING (blocker_id = auth.uid());
CREATE POLICY "blocks_insert_own" ON blocks FOR INSERT TO authenticated WITH CHECK (blocker_id = auth.uid());
CREATE POLICY "blocks_delete_own" ON blocks FOR DELETE TO authenticated USING (blocker_id = auth.uid());

CREATE POLICY "reports_insert_own" ON reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "reports_select_own" ON reports FOR SELECT TO authenticated USING (reporter_id = auth.uid());

CREATE POLICY "follows_select_all" ON follows FOR SELECT TO authenticated USING (true);
CREATE POLICY "follows_insert_own" ON follows FOR INSERT TO authenticated WITH CHECK (follower_id = auth.uid());
CREATE POLICY "follows_delete_own" ON follows FOR DELETE TO authenticated USING (follower_id = auth.uid());

-- ═══════════════════════════════════════
-- POLICIES — GRUPOS E DESAFIOS
-- ═══════════════════════════════════════

CREATE POLICY "group_members_select_all" ON group_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "group_members_insert_own" ON group_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "group_members_delete_own" ON group_members FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "challenge_participants_select_all" ON challenge_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "challenge_participants_insert_own" ON challenge_participants FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════
-- POLICIES — TRAINERS E AULAS
-- ═══════════════════════════════════════

CREATE POLICY "trainer_ratings_select_all" ON trainer_ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "trainer_ratings_insert_own" ON trainer_ratings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "class_enrollments_select_own" ON class_enrollments FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "class_enrollments_insert_own" ON class_enrollments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "class_enrollments_delete_own" ON class_enrollments FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ═══════════════════════════════════════
-- POLICIES — BADGES E CONQUISTAS
-- ═══════════════════════════════════════

CREATE POLICY "user_badges_select_all" ON user_badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_badges_insert_own" ON user_badges FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════
-- POLICIES — SAÚDE E CORPO
-- ═══════════════════════════════════════

CREATE POLICY "physical_assessments_select_own" ON physical_assessments FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "physical_assessments_insert" ON physical_assessments FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "weight_logs_select_own" ON weight_logs FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "weight_logs_insert_own" ON weight_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "weight_logs_update_own" ON weight_logs FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "anamnesis_select_own" ON anamnesis FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "anamnesis_insert_own" ON anamnesis FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "nutrition_plans_select_own" ON nutrition_plans FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "nutrition_plans_insert" ON nutrition_plans FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "calorie_logs_select_own" ON calorie_logs FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "calorie_logs_insert_own" ON calorie_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════
-- POLICIES — RECOMPENSAS E PEDIDOS
-- ═══════════════════════════════════════

CREATE POLICY "reward_redemptions_select_own" ON reward_redemptions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "reward_redemptions_insert_own" ON reward_redemptions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "appointments_select_own" ON appointments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR trainer_id = auth.uid());
CREATE POLICY "appointments_insert_own" ON appointments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "loja_pedidos_select_own" ON loja_pedidos FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "loja_pedidos_insert_own" ON loja_pedidos FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════
-- ETAPA 2: STORAGE POLICIES
-- ═══════════════════════════════════════

CREATE POLICY "avatars_select_public" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_insert_auth" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "avatars_update_auth" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "posts_select_public" ON storage.objects FOR SELECT USING (bucket_id = 'posts');
CREATE POLICY "posts_insert_auth" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'posts' AND auth.role() = 'authenticated');

CREATE POLICY "exercises_select_public" ON storage.objects FOR SELECT USING (bucket_id = 'exercises');
CREATE POLICY "exercises_insert_admin" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'exercises' AND auth.role() = 'authenticated');

CREATE POLICY "facials_select_own" ON storage.objects FOR SELECT USING (bucket_id = 'facials' AND auth.role() = 'authenticated');
CREATE POLICY "facials_insert_auth" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'facials' AND auth.role() = 'authenticated');

CREATE POLICY "assessments_select_own" ON storage.objects FOR SELECT USING (bucket_id = 'assessments' AND auth.role() = 'authenticated');
CREATE POLICY "assessments_insert_auth" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'assessments' AND auth.role() = 'authenticated');

-- ═══════════════════════════════════════
-- ETAPA 3: TRIGGER AUTO-PROFILE
-- ═══════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  aluno_cargo_id UUID;
  novo_codigo TEXT;
BEGIN
  SELECT id INTO aluno_cargo_id FROM cargos WHERE slug = 'aluno' LIMIT 1;
  novo_codigo := 'BONY-' || UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 6));

  INSERT INTO public.users (
    id, name, email, cpf, cargo_id, cargo_slug, nivel,
    total_points, current_streak, total_workouts,
    codigo_indicacao, onboarding_completo, created_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Novo Aluno'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'cpf', ''),
    aluno_cargo_id,
    'aluno',
    'bronze',
    0, 0, 0,
    novo_codigo,
    false,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════
-- ETAPA 4: BUCKETS EXTRAS
-- ═══════════════════════════════════════

INSERT INTO storage.buckets (id, name, public)
SELECT 'contratos', 'contratos', false
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'contratos');

INSERT INTO storage.buckets (id, name, public)
SELECT 'loja-produtos', 'loja-produtos', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'loja-produtos');

CREATE POLICY "contratos_select_own" ON storage.objects FOR SELECT
  USING (bucket_id = 'contratos' AND auth.role() = 'authenticated');
CREATE POLICY "contratos_insert_auth" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'contratos' AND auth.role() = 'authenticated');

CREATE POLICY "loja_produtos_select_public" ON storage.objects FOR SELECT
  USING (bucket_id = 'loja-produtos');
CREATE POLICY "loja_produtos_insert_admin" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'loja-produtos' AND auth.role() = 'authenticated');
