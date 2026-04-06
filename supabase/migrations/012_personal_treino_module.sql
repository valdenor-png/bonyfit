-- ============================================
-- BONY FIT — MÓDULO PERSONAL + TREINO
-- Migration 012
-- ============================================

-- Primeiro acesso
ALTER TABLE users ADD COLUMN IF NOT EXISTS primeiro_acesso BOOLEAN DEFAULT true;

-- Vínculo personal ↔ aluno
CREATE TABLE IF NOT EXISTS personal_alunos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  personal_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  aluno_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'ativo',
  vinculado_em TIMESTAMPTZ DEFAULT now(),
  desvinculado_em TIMESTAMPTZ,
  UNIQUE(personal_id, aluno_id)
);

-- Plano de treino atribuído pelo personal
CREATE TABLE IF NOT EXISTS workout_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  personal_id UUID REFERENCES users(id) NOT NULL,
  nome TEXT NOT NULL,
  objetivo TEXT DEFAULT 'hipertrofia',
  observacoes TEXT,
  data_inicio DATE DEFAULT CURRENT_DATE,
  data_fim DATE,
  status TEXT DEFAULT 'ativo',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Divisões do plano (A, B, C, D, E)
CREATE TABLE IF NOT EXISTS workout_plan_splits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID REFERENCES workout_plans(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  nome TEXT NOT NULL,
  dia_semana INTEGER[],
  ordem INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Exercícios por divisão
CREATE TABLE IF NOT EXISTS workout_plan_split_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  split_id UUID REFERENCES workout_plan_splits(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercises(id) NOT NULL,
  series INTEGER DEFAULT 3,
  repeticoes TEXT DEFAULT '12',
  descanso_seg INTEGER DEFAULT 90,
  carga_kg DECIMAL,
  tecnica TEXT,
  observacoes TEXT,
  ordem INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionar plan_id e split_id no workout_logs_v2
ALTER TABLE workout_logs_v2 ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES workout_plans(id);
ALTER TABLE workout_logs_v2 ADD COLUMN IF NOT EXISTS split_id UUID REFERENCES workout_plan_splits(id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_personal_alunos_personal ON personal_alunos(personal_id);
CREATE INDEX IF NOT EXISTS idx_personal_alunos_aluno ON personal_alunos(aluno_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_aluno ON workout_plans(aluno_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_personal ON workout_plans(personal_id);
CREATE INDEX IF NOT EXISTS idx_plan_splits_plan ON workout_plan_splits(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_split_exercises_split ON workout_plan_split_exercises(split_id);

-- RLS
ALTER TABLE personal_alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plan_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plan_split_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pa_select" ON personal_alunos FOR SELECT USING (
  personal_id = auth.uid() OR aluno_id = auth.uid()
);
CREATE POLICY "pa_insert" ON personal_alunos FOR INSERT WITH CHECK (personal_id = auth.uid());
CREATE POLICY "pa_update" ON personal_alunos FOR UPDATE USING (personal_id = auth.uid());

CREATE POLICY "wp_select" ON workout_plans FOR SELECT USING (
  aluno_id = auth.uid() OR personal_id = auth.uid()
);
CREATE POLICY "wp_insert" ON workout_plans FOR INSERT WITH CHECK (personal_id = auth.uid());
CREATE POLICY "wp_update" ON workout_plans FOR UPDATE USING (personal_id = auth.uid());

CREATE POLICY "wps_select" ON workout_plan_splits FOR SELECT USING (
  plan_id IN (SELECT id FROM workout_plans WHERE aluno_id = auth.uid() OR personal_id = auth.uid())
);
CREATE POLICY "wps_insert" ON workout_plan_splits FOR INSERT WITH CHECK (
  plan_id IN (SELECT id FROM workout_plans WHERE personal_id = auth.uid())
);

CREATE POLICY "wpse_select" ON workout_plan_split_exercises FOR SELECT USING (
  split_id IN (SELECT id FROM workout_plan_splits WHERE plan_id IN (SELECT id FROM workout_plans WHERE aluno_id = auth.uid() OR personal_id = auth.uid()))
);
CREATE POLICY "wpse_insert" ON workout_plan_split_exercises FOR INSERT WITH CHECK (
  split_id IN (SELECT id FROM workout_plan_splits WHERE plan_id IN (SELECT id FROM workout_plans WHERE personal_id = auth.uid()))
);
