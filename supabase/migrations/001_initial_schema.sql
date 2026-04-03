-- ============================================
-- BONY FIT APP — DATABASE SCHEMA
-- Supabase PostgreSQL
-- ============================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. UNIDADES
-- ============================================
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT DEFAULT 'Castanhal',
  state TEXT DEFAULT 'PA',
  capacity INTEGER NOT NULL DEFAULT 80,
  current_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. PLANOS
-- ============================================
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('mensal', 'trimestral', 'anual')),
  multi_unit BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  features JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. USUÁRIOS (alunos)
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cpf TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  facial_url TEXT,
  facial_registered BOOLEAN DEFAULT false,
  unit_id UUID REFERENCES units(id),
  plan_id UUID REFERENCES plans(id),

  -- Gamificação
  total_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_workout_date DATE,
  level TEXT DEFAULT 'bronze' CHECK (level IN ('bronze', 'prata', 'ouro', 'platina', 'diamante', 'master')),
  total_workouts INTEGER DEFAULT 0,

  -- Perfil social
  bio TEXT,
  is_private BOOLEAN DEFAULT false,

  -- Status
  is_active BOOLEAN DEFAULT true,
  contract_accepted BOOLEAN DEFAULT false,
  contract_accepted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. EXERCÍCIOS (biblioteca)
-- ============================================
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  equipment TEXT,
  video_url TEXT,
  animation_3d_url TEXT,
  tips TEXT,
  min_time_seconds INTEGER DEFAULT 180,
  alternatives UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. TEMPLATES DE TREINO
-- ============================================
CREATE TABLE workout_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  objective TEXT CHECK (objective IN ('hipertrofia', 'emagrecimento', 'resistencia', 'funcional', 'personalizado')),
  created_by UUID REFERENCES users(id),
  is_preset BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workout_template_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES workout_templates(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  order_index INTEGER NOT NULL,
  sets INTEGER DEFAULT 3,
  reps INTEGER DEFAULT 12,
  weight_kg DECIMAL(5,1),
  rest_seconds INTEGER DEFAULT 60,
  notes TEXT
);

-- ============================================
-- 6. SESSÕES DE TREINO (anti-fraude)
-- ============================================
CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id),
  template_id UUID REFERENCES workout_templates(id),

  -- Anti-fraude camadas 1 e 4
  catraca_validated BOOLEAN DEFAULT false,
  catraca_entry_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,

  -- Anti-fraude camada 3
  min_expected_duration INTEGER,
  actual_duration INTEGER,
  flagged BOOLEAN DEFAULT false,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'ended_early', 'expired')),

  -- Pontuação
  total_points INTEGER DEFAULT 0,
  checkin_points INTEGER DEFAULT 100,
  exercise_points INTEGER DEFAULT 0,
  set_points INTEGER DEFAULT 0,
  bonus_points INTEGER DEFAULT 0,
  streak_multiplier DECIMAL(3,1) DEFAULT 1.0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. LOGS DE EXERCÍCIO (pontos por série)
-- ============================================
CREATE TABLE workout_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),

  set_number INTEGER NOT NULL,
  reps_done INTEGER,
  weight_used DECIMAL(5,1),

  -- Anti-fraude camada 2
  rest_timer_completed BOOLEAN DEFAULT false,
  rest_duration_seconds INTEGER,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
  points_earned INTEGER DEFAULT 0,

  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. EVENTOS DE CATRACA
-- ============================================
CREATE TABLE catraca_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  unit_id UUID REFERENCES units(id),
  direction TEXT CHECK (direction IN ('entry', 'exit')),
  method TEXT DEFAULT 'facial' CHECK (method IN ('facial', 'biometric', 'card', 'manual')),
  device_ip TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. FEED SOCIAL
-- ============================================
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id),
  text TEXT,
  image_url TEXT,
  hashtags TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  workout_session_id UUID REFERENCES workout_sessions(id),
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. MENSAGENS DIRETAS
-- ============================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 11. SEGURANÇA SOCIAL
-- ============================================
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES users(id),
  reported_user_id UUID REFERENCES users(id),
  reported_post_id UUID REFERENCES posts(id),
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'assedio', 'conteudo_impróprio', 'fake', 'outro')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 12. SEGUIDORES
-- ============================================
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- ============================================
-- 13. GRUPOS E DESAFIOS
-- ============================================
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('musculacao', 'corrida', 'funcional', 'crossfit', 'yoga', 'danca', 'geral')),
  image_url TEXT,
  created_by UUID REFERENCES users(id),
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('frequencia', 'pontos', 'streak', 'exercicio')),
  target_value INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_by UUID REFERENCES users(id),
  unit_id UUID REFERENCES units(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE challenge_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  current_value INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

-- ============================================
-- 14. PERSONAL TRAINERS
-- ============================================
CREATE TABLE trainers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  unit_id UUID REFERENCES units(id),
  avatar_url TEXT,
  bio TEXT,
  rating DECIMAL(2,1) DEFAULT 5.0,
  rating_count INTEGER DEFAULT 0,
  total_clients INTEGER DEFAULT 0,
  schedule TEXT,
  on_floor BOOLEAN DEFAULT false,
  on_floor_since TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE trainer_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID REFERENCES trainers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trainer_id, user_id)
);

-- ============================================
-- 15. AULAS COLETIVAS
-- ============================================
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID REFERENCES units(id),
  trainer_id UUID REFERENCES trainers(id),
  name TEXT NOT NULL,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INTEGER NOT NULL,
  enrolled_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE class_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'attended', 'no_show', 'cancelled')),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, user_id)
);

-- ============================================
-- 16. PAGAMENTOS
-- ============================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id),
  amount DECIMAL(10,2) NOT NULL,
  method TEXT CHECK (method IN ('pix', 'credit_card', 'boleto')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'refunded', 'overdue')),
  asaas_payment_id TEXT,
  asaas_subscription_id TEXT,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 17. CONQUISTAS / BADGES
-- ============================================
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  category TEXT CHECK (category IN ('streak', 'treino', 'social', 'ranking', 'especial')),
  requirement_type TEXT,
  requirement_value INTEGER,
  points_reward INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- ============================================
-- 18. AVALIAÇÃO FÍSICA
-- ============================================
CREATE TABLE physical_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assessor_id UUID REFERENCES trainers(id),

  weight_kg DECIMAL(5,1),
  height_cm DECIMAL(5,1),
  body_fat_pct DECIMAL(4,1),
  muscle_mass_pct DECIMAL(4,1),
  bmi DECIMAL(4,1),

  chest_cm DECIMAL(5,1),
  waist_cm DECIMAL(5,1),
  hip_cm DECIMAL(5,1),
  arm_left_cm DECIMAL(5,1),
  arm_right_cm DECIMAL(5,1),
  thigh_left_cm DECIMAL(5,1),
  thigh_right_cm DECIMAL(5,1),

  photo_front_url TEXT,
  photo_side_url TEXT,
  photo_back_url TEXT,

  notes TEXT,
  assessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 19. ACOMPANHAMENTO DE PESO
-- ============================================
CREATE TABLE weight_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  weight_kg DECIMAL(5,1) NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 20. ANAMNESE
-- ============================================
CREATE TABLE anamnesis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  objective TEXT CHECK (objective IN ('hipertrofia', 'emagrecimento', 'saude', 'resistencia', 'reabilitacao')),
  experience_level TEXT CHECK (experience_level IN ('iniciante', 'intermediario', 'avancado')),
  frequency_per_week INTEGER,

  has_injuries BOOLEAN DEFAULT false,
  injuries_description TEXT,
  has_medical_conditions BOOLEAN DEFAULT false,
  medical_conditions TEXT,
  medications TEXT,

  smoker BOOLEAN DEFAULT false,
  alcohol TEXT CHECK (alcohol IN ('nunca', 'raramente', 'socialmente', 'frequentemente')),
  sleep_hours INTEGER,
  stress_level TEXT CHECK (stress_level IN ('baixo', 'moderado', 'alto')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 21. NUTRIÇÃO
-- ============================================
CREATE TABLE nutrition_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  daily_calories INTEGER,
  protein_g INTEGER,
  carbs_g INTEGER,
  fat_g INTEGER,
  notes TEXT,
  created_by TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE calorie_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  meal_name TEXT NOT NULL,
  calories INTEGER,
  protein_g DECIMAL(5,1),
  carbs_g DECIMAL(5,1),
  fat_g DECIMAL(5,1),
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 22. RECOMPENSAS
-- ============================================
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL,
  image_url TEXT,
  partner_name TEXT,
  is_active BOOLEAN DEFAULT true,
  stock INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reward_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reward_id UUID REFERENCES rewards(id),
  points_spent INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'redeemed', 'expired')),
  code TEXT,
  redeemed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 23. AGENDAMENTOS
-- ============================================
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  trainer_id UUID REFERENCES trainers(id),
  unit_id UUID REFERENCES units(id),
  type TEXT CHECK (type IN ('personal', 'avaliacao', 'aula')),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 24. NOTIFICAÇÕES
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT CHECK (type IN ('treino', 'social', 'pagamento', 'conquista', 'sistema', 'lembrete')),
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_users_unit ON users(unit_id);
CREATE INDEX idx_users_level ON users(level);
CREATE INDEX idx_users_points ON users(total_points DESC);
CREATE INDEX idx_workout_sessions_user ON workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_date ON workout_sessions(created_at DESC);
CREATE INDEX idx_workout_logs_session ON workout_logs(session_id);
CREATE INDEX idx_posts_user ON posts(user_id);
CREATE INDEX idx_posts_unit ON posts(unit_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_messages_receiver ON messages(receiver_id, is_read);
CREATE INDEX idx_catraca_events_user ON catraca_events(user_id, timestamp DESC);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_weight_logs_user ON weight_logs(user_id, logged_at DESC);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Atualizar nível baseado nos pontos
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
BEGIN
  NEW.level := CASE
    WHEN NEW.total_points >= 50000 THEN 'master'
    WHEN NEW.total_points >= 30000 THEN 'diamante'
    WHEN NEW.total_points >= 15000 THEN 'platina'
    WHEN NEW.total_points >= 8000 THEN 'ouro'
    WHEN NEW.total_points >= 3000 THEN 'prata'
    ELSE 'bronze'
  END;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_level
  BEFORE UPDATE OF total_points ON users
  FOR EACH ROW EXECUTE FUNCTION update_user_level();

-- Atualizar streak
CREATE OR REPLACE FUNCTION update_streak()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_workout_date = CURRENT_DATE THEN
    RETURN NEW;
  END IF;

  IF OLD.last_workout_date = CURRENT_DATE - INTERVAL '1 day' THEN
    NEW.current_streak := OLD.current_streak + 1;
  ELSE
    NEW.current_streak := 1;
  END IF;

  IF NEW.current_streak > OLD.longest_streak THEN
    NEW.longest_streak := NEW.current_streak;
  END IF;

  NEW.last_workout_date := CURRENT_DATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_streak
  BEFORE UPDATE OF last_workout_date ON users
  FOR EACH ROW EXECUTE FUNCTION update_streak();

-- Incrementar contador de lotação
CREATE OR REPLACE FUNCTION update_unit_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.direction = 'entry' THEN
    UPDATE units SET current_count = current_count + 1 WHERE id = NEW.unit_id;
  ELSIF NEW.direction = 'exit' THEN
    UPDATE units SET current_count = GREATEST(current_count - 1, 0) WHERE id = NEW.unit_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_unit_count
  AFTER INSERT ON catraca_events
  FOR EACH ROW EXECUTE FUNCTION update_unit_count();

-- Incrementar likes
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_likes_count
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION update_likes_count();

-- Incrementar comments count
CREATE OR REPLACE FUNCTION update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_comments_count
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_comments_count();

-- Incrementar group member count
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE groups SET member_count = GREATEST(member_count - 1, 0) WHERE id = OLD.group_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_group_member_count
  AFTER INSERT OR DELETE ON group_members
  FOR EACH ROW EXECUTE FUNCTION update_group_member_count();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users: ver todos, editar só o próprio
CREATE POLICY "users_select" ON users FOR SELECT USING (true);
CREATE POLICY "users_update" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Posts: ver todos (exceto bloqueados), criar/editar próprios
CREATE POLICY "posts_select" ON posts FOR SELECT USING (
  is_visible = true AND user_id NOT IN (
    SELECT blocked_id FROM blocks WHERE blocker_id = auth.uid()
  )
);
CREATE POLICY "posts_insert" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_update" ON posts FOR UPDATE USING (auth.uid() = user_id);

-- Messages: ver só as próprias
CREATE POLICY "messages_select" ON messages FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Workout sessions: só as próprias
CREATE POLICY "sessions_select" ON workout_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sessions_insert" ON workout_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sessions_update" ON workout_sessions FOR UPDATE USING (auth.uid() = user_id);

-- Workout logs: só das próprias sessões
CREATE POLICY "logs_select" ON workout_logs FOR SELECT USING (
  session_id IN (SELECT id FROM workout_sessions WHERE user_id = auth.uid())
);
CREATE POLICY "logs_insert" ON workout_logs FOR INSERT WITH CHECK (
  session_id IN (SELECT id FROM workout_sessions WHERE user_id = auth.uid())
);

-- Payments: só as próprias
CREATE POLICY "payments_select" ON payments FOR SELECT USING (auth.uid() = user_id);

-- Notifications: só as próprias
CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- REALTIME (habilitar pra lotação)
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE units;
ALTER PUBLICATION supabase_realtime ADD TABLE trainers;
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================
-- SEED DATA (dados iniciais)
-- ============================================

-- Unidades
INSERT INTO units (name, address, capacity) VALUES
('Bony Fit — Centro', 'Av. Barão do Rio Branco, 1200', 80),
('Bony Fit — Jaderlândia', 'Tv. São Raimundo, 450', 60),
('Bony Fit — Nova Olinda', 'Rod. BR-316, Km 5', 70),
('Bony Fit — Apeú', 'Av. Principal, 800', 40),
('Bony Fit — Icuí', 'R. dos Esportes, 220', 50);

-- Planos
INSERT INTO plans (name, price, period, multi_unit, features) VALUES
('Mensal', 89.90, 'mensal', false, '["1 unidade", "Treinos ilimitados", "App completo"]'),
('Trimestral', 69.90, 'trimestral', false, '["1 unidade", "Treinos ilimitados", "App completo", "Desconto 22%"]'),
('Anual', 49.90, 'anual', true, '["Todas unidades", "Treinos ilimitados", "App completo", "Desconto 44%"]');

-- Exercícios
INSERT INTO exercises (name, muscle_group, equipment, tips, min_time_seconds) VALUES
('Supino reto', 'Peitoral', 'Barra', 'Escápulas retraídas. Barra até o peito.', 360),
('Supino inclinado', 'Peitoral', 'Halteres', 'Banco 30-45°. Cotovelos a 45°.', 300),
('Crucifixo', 'Peitoral', 'Halteres', 'Abertura controlada. Cotovelos flexionados.', 280),
('Tríceps testa', 'Tríceps', 'Barra W', 'Cotovelos fixos pro teto. Extensão completa.', 280),
('Tríceps corda', 'Tríceps', 'Polia', 'Abra a corda no final. Cotovelos grudados.', 260),
('Elevação lateral', 'Ombro', 'Halteres', 'Até a altura dos ombros. Não balance.', 240),
('Rosca direta', 'Bíceps', 'Barra', 'Cotovelos fixos. Contração no topo.', 280),
('Rosca alternada', 'Bíceps', 'Halteres', 'Supinação no topo. Controle na descida.', 280),
('Agachamento', 'Pernas', 'Barra', 'Joelhos alinhados. Desça até 90°.', 420),
('Leg press', 'Pernas', 'Máquina', 'Pés na largura dos ombros. Não trave joelhos.', 360),
('Stiff', 'Posterior', 'Barra', 'Costas retas. Sinta o alongamento.', 300),
('Panturrilha', 'Panturrilha', 'Máquina', 'Amplitude total. Pausa no topo.', 200),
('Puxada frontal', 'Costas', 'Polia', 'Peito pra frente. Cotovelos pra baixo.', 300),
('Remada curvada', 'Costas', 'Barra', 'Tronco a 45°. Puxe até o abdômen.', 360),
('Desenvolvimento', 'Ombro', 'Halteres', 'Sem impulso. Extensão completa.', 300),
('Abdominal', 'Abdômen', 'Corpo', 'Contraia o core. Não puxe o pescoço.', 200);

-- Badges
INSERT INTO badges (name, description, category, requirement_type, requirement_value, points_reward) VALUES
('Streak 7', '7 dias seguidos treinando', 'streak', 'streak', 7, 100),
('Streak 30', '30 dias seguidos treinando', 'streak', 'streak', 30, 500),
('100 Treinos', 'Completou 100 treinos', 'treino', 'total_workouts', 100, 300),
('Top 10', 'Ficou entre os 10 primeiros do ranking', 'ranking', 'ranking_position', 10, 200),
('Madrugador', 'Treinou antes das 7h', 'especial', 'early_bird', 1, 50),
('Consistência', 'Treinou todas as semanas por 3 meses', 'treino', 'weekly_consistency', 12, 400),
('Social Star', 'Recebeu 100 curtidas nos posts', 'social', 'total_likes', 100, 150),
('Primeiro Treino', 'Completou o primeiro treino', 'especial', 'total_workouts', 1, 500);

-- Personal Trainers
INSERT INTO trainers (name, specialty, schedule, rating) VALUES
('Rafael Costa', 'Musculação', '06h-12h', 4.9),
('Ana Beatriz', 'Funcional / Dança', '14h-20h', 4.8),
('Lucas Mendes', 'Crossfit / HIIT', '07h-13h', 4.7),
('Camila Souza', 'Pilates / Alongamento', '08h-14h', 4.9),
('Thiago Lima', 'Musculação', '15h-21h', 4.6),
('Juliana Reis', 'Yoga / Alongamento', '06h-11h', 4.8);

-- Recompensas
INSERT INTO rewards (name, description, points_cost, partner_name, stock) VALUES
('10% desconto mensalidade', 'Desconto na próxima mensalidade', 5000, 'Bony Fit', 999),
('Camiseta Bony Fit', 'Camiseta exclusiva da Bony Fit', 8000, 'Bony Fit', 50),
('1 sessão com Personal', 'Sessão individual com personal trainer', 10000, 'Bony Fit', 20),
('15% desconto suplementos', 'Desconto em loja parceira de suplementos', 3000, 'Nutri Store', 100),
('Squeeze Bony Fit', 'Squeeze exclusivo da Bony Fit', 6000, 'Bony Fit', 30);
