-- ============================================
-- BONY FIT — SISTEMA DE TREINO ESTILO HEVY
-- Migration 008
-- ============================================

-- Limpar exercises antigos e recriar com estrutura melhor
-- (manter a tabela existente, apenas adicionar colunas que faltam)
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS secondary_muscles TEXT[];
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Limpar exercícios antigos (poucos, seed da migration 001)
DELETE FROM exercises;

-- Seed: 80 exercícios de academia
INSERT INTO exercises (name, muscle_group, equipment, secondary_muscles, tips, min_time_seconds, is_custom) VALUES
-- PEITO (10)
('Supino Reto com Barra', 'Peito', 'Barra', ARRAY['Tríceps','Ombro'], 'Escápulas retraídas. Desça até o peito.', 300, false),
('Supino Inclinado com Halter', 'Peito', 'Halter', ARRAY['Ombro','Tríceps'], 'Banco a 30-45°. Cotovelos a 45°.', 300, false),
('Supino Declinado com Barra', 'Peito', 'Barra', ARRAY['Tríceps'], 'Foco no peitoral inferior.', 300, false),
('Crucifixo com Halter', 'Peito', 'Halter', ARRAY['Ombro'], 'Cotovelos levemente flexionados.', 280, false),
('Crossover no Cabo', 'Peito', 'Cabo', ARRAY['Ombro'], 'Cruze as mãos na frente. Controle.', 240, false),
('Peck Deck', 'Peito', 'Máquina', ARRAY['Ombro'], 'Aperte no ponto de contração.', 200, false),
('Flexão de Braços', 'Peito', 'Peso Corporal', ARRAY['Tríceps','Ombro'], 'Corpo reto. Desça até 90°.', 180, false),
('Supino na Máquina', 'Peito', 'Máquina', ARRAY['Tríceps'], 'Bom para iniciantes.', 200, false),
('Pullover com Halter', 'Peito', 'Halter', ARRAY['Costas','Tríceps'], 'Amplitude controlada.', 240, false),
('Supino com Halter Reto', 'Peito', 'Halter', ARRAY['Tríceps','Ombro'], 'Maior amplitude que barra.', 300, false),

-- COSTAS (10)
('Puxada Frontal', 'Costas', 'Cabo', ARRAY['Bíceps'], 'Peito pra frente. Cotovelos pra baixo.', 300, false),
('Remada Curvada com Barra', 'Costas', 'Barra', ARRAY['Bíceps','Lombar'], 'Tronco a 45°. Puxe até o abdômen.', 360, false),
('Remada Unilateral com Halter', 'Costas', 'Halter', ARRAY['Bíceps'], 'Apoie o joelho no banco.', 300, false),
('Puxada Supinada', 'Costas', 'Cabo', ARRAY['Bíceps'], 'Pegada supinada. Foco em bíceps.', 280, false),
('Remada Baixa no Cabo', 'Costas', 'Cabo', ARRAY['Bíceps','Lombar'], 'Costas retas. Puxe até o abdômen.', 300, false),
('Barra Fixa', 'Costas', 'Peso Corporal', ARRAY['Bíceps','Ombro'], 'Completa amplitude.', 240, false),
('Remada Cavalinho', 'Costas', 'Máquina', ARRAY['Bíceps'], 'Foco na contração.', 280, false),
('Pulldown Atrás', 'Costas', 'Cabo', ARRAY['Bíceps'], 'Cuidado com ombros. Controlado.', 280, false),
('Remada na Máquina', 'Costas', 'Máquina', ARRAY['Bíceps'], 'Excelente para isolar.', 240, false),
('Levantamento Terra', 'Costas', 'Barra', ARRAY['Perna','Glúteo','Lombar'], 'Coluna neutra sempre.', 420, false),

-- OMBRO (8)
('Desenvolvimento com Halter', 'Ombro', 'Halter', ARRAY['Tríceps'], 'Sem impulso. Extensão completa.', 300, false),
('Desenvolvimento com Barra', 'Ombro', 'Barra', ARRAY['Tríceps'], 'Frente, não atrás.', 300, false),
('Elevação Lateral', 'Ombro', 'Halter', ARRAY[]::TEXT[], 'Até altura dos ombros. Não balance.', 240, false),
('Elevação Frontal', 'Ombro', 'Halter', ARRAY[]::TEXT[], 'Alternado ou simultâneo.', 240, false),
('Crucifixo Inverso', 'Ombro', 'Halter', ARRAY['Costas'], 'Foco no deltóide posterior.', 240, false),
('Encolhimento com Halter', 'Ombro', 'Halter', ARRAY['Trapézio'], 'Suba os ombros. Segure no topo.', 200, false),
('Desenvolvimento Arnold', 'Ombro', 'Halter', ARRAY['Tríceps'], 'Rotação durante o movimento.', 300, false),
('Elevação Lateral no Cabo', 'Ombro', 'Cabo', ARRAY[]::TEXT[], 'Tensão constante.', 240, false),

-- BÍCEPS (8)
('Rosca Direta com Barra', 'Bíceps', 'Barra', ARRAY[]::TEXT[], 'Cotovelos fixos. Contração no topo.', 280, false),
('Rosca Alternada com Halter', 'Bíceps', 'Halter', ARRAY[]::TEXT[], 'Supinação no topo.', 280, false),
('Rosca Scott', 'Bíceps', 'Barra', ARRAY[]::TEXT[], 'Apoio no banco Scott.', 240, false),
('Rosca Martelo', 'Bíceps', 'Halter', ARRAY['Antebraço'], 'Pegada neutra. Braquial.', 240, false),
('Rosca Concentrada', 'Bíceps', 'Halter', ARRAY[]::TEXT[], 'Cotovelo na coxa. Isolar.', 200, false),
('Rosca no Cabo', 'Bíceps', 'Cabo', ARRAY[]::TEXT[], 'Tensão constante.', 240, false),
('Rosca 21', 'Bíceps', 'Barra', ARRAY[]::TEXT[], '7 baixo + 7 alto + 7 completas.', 200, false),
('Rosca Inversa', 'Bíceps', 'Barra', ARRAY['Antebraço'], 'Pegada pronada. Antebraço.', 200, false),

-- TRÍCEPS (8)
('Tríceps Pulley', 'Tríceps', 'Cabo', ARRAY[]::TEXT[], 'Cotovelos fixos. Extensão completa.', 260, false),
('Tríceps Corda', 'Tríceps', 'Cabo', ARRAY[]::TEXT[], 'Abra a corda no final.', 260, false),
('Tríceps Testa', 'Tríceps', 'Barra', ARRAY[]::TEXT[], 'Cotovelos pro teto. Controle.', 280, false),
('Tríceps Francês', 'Tríceps', 'Halter', ARRAY[]::TEXT[], 'Desça atrás da cabeça.', 280, false),
('Mergulho no Banco', 'Tríceps', 'Peso Corporal', ARRAY['Peito','Ombro'], 'Pés elevados pra mais intensidade.', 240, false),
('Mergulho em Paralelas', 'Tríceps', 'Peso Corporal', ARRAY['Peito','Ombro'], 'Corpo reto pra focar tríceps.', 280, false),
('Kickback com Halter', 'Tríceps', 'Halter', ARRAY[]::TEXT[], 'Braço paralelo ao corpo.', 200, false),
('Extensão Overhead com Halter', 'Tríceps', 'Halter', ARRAY[]::TEXT[], 'Segure um halter com as duas mãos.', 260, false),

-- PERNA (14)
('Agachamento Livre', 'Perna', 'Barra', ARRAY['Glúteo','Lombar'], 'Joelhos alinhados. Desça até 90°.', 420, false),
('Leg Press 45°', 'Perna', 'Máquina', ARRAY['Glúteo'], 'Pés na largura dos ombros.', 360, false),
('Leg Press Horizontal', 'Perna', 'Máquina', ARRAY['Glúteo'], 'Não trave joelhos.', 360, false),
('Hack Squat', 'Perna', 'Máquina', ARRAY['Glúteo'], 'Costas apoiadas.', 360, false),
('Cadeira Extensora', 'Perna', 'Máquina', ARRAY[]::TEXT[], 'Extensão completa. Controle.', 240, false),
('Mesa Flexora', 'Perna', 'Máquina', ARRAY[]::TEXT[], 'Posterior da coxa.', 240, false),
('Stiff', 'Perna', 'Barra', ARRAY['Glúteo','Lombar'], 'Costas retas. Sinta o alongamento.', 300, false),
('Agachamento Búlgaro', 'Perna', 'Halter', ARRAY['Glúteo'], 'Pé traseiro elevado.', 300, false),
('Passada com Halter', 'Perna', 'Halter', ARRAY['Glúteo'], 'Passo largo. Joelho a 90°.', 300, false),
('Leg Curl Deitado', 'Perna', 'Máquina', ARRAY[]::TEXT[], 'Posterior. Controle a descida.', 240, false),
('Adutora', 'Perna', 'Máquina', ARRAY[]::TEXT[], 'Adutores. Controle.', 200, false),
('Abdutora', 'Perna', 'Máquina', ARRAY['Glúteo'], 'Abdutores e glúteo médio.', 200, false),
('Panturrilha em Pé', 'Perna', 'Máquina', ARRAY[]::TEXT[], 'Amplitude total. Pausa no topo.', 200, false),
('Panturrilha Sentado', 'Perna', 'Máquina', ARRAY[]::TEXT[], 'Sóleo. Amplitude total.', 200, false),

-- GLÚTEO (6)
('Hip Thrust', 'Glúteo', 'Barra', ARRAY['Perna'], 'Aperte glúteo no topo.', 300, false),
('Elevação Pélvica', 'Glúteo', 'Peso Corporal', ARRAY['Perna'], 'Versão sem peso do hip thrust.', 200, false),
('Glúteo no Cabo', 'Glúteo', 'Cabo', ARRAY[]::TEXT[], 'Coice. Controle.', 240, false),
('Agachamento Sumô', 'Glúteo', 'Halter', ARRAY['Perna'], 'Pés bem abertos. Ponta pra fora.', 300, false),
('Cadeira Abdutora Focada', 'Glúteo', 'Máquina', ARRAY[]::TEXT[], 'Foco na contração do glúteo.', 200, false),
('Extensão de Quadril', 'Glúteo', 'Máquina', ARRAY['Perna'], 'Máquina ou graviton.', 240, false),

-- ABDÔMEN (8)
('Abdominal Crunch', 'Abdômen', 'Peso Corporal', ARRAY[]::TEXT[], 'Contraia o core. Não puxe pescoço.', 200, false),
('Prancha', 'Abdômen', 'Peso Corporal', ARRAY['Lombar'], 'Corpo reto. Segure.', 180, false),
('Abdominal Infra', 'Abdômen', 'Peso Corporal', ARRAY[]::TEXT[], 'Eleve quadril do chão.', 200, false),
('Abdominal Oblíquo', 'Abdômen', 'Peso Corporal', ARRAY[]::TEXT[], 'Toque cotovelo no joelho oposto.', 200, false),
('Abdominal na Máquina', 'Abdômen', 'Máquina', ARRAY[]::TEXT[], 'Carga controlada.', 200, false),
('Roda Abdominal', 'Abdômen', 'Acessório', ARRAY['Lombar'], 'Estenda o máximo. Controle.', 200, false),
('Prancha Lateral', 'Abdômen', 'Peso Corporal', ARRAY['Oblíquo'], 'Corpo alinhado. Segure.', 180, false),
('Leg Raise Pendurado', 'Abdômen', 'Peso Corporal', ARRAY[]::TEXT[], 'Eleve pernas na barra.', 200, false),

-- CARDIO (8)
('Esteira', 'Cardio', 'Máquina', ARRAY[]::TEXT[], 'Ajustar velocidade e inclinação.', 0, false),
('Bicicleta Ergométrica', 'Cardio', 'Máquina', ARRAY[]::TEXT[], 'Ajustar resistência.', 0, false),
('Elíptico', 'Cardio', 'Máquina', ARRAY[]::TEXT[], 'Braços e pernas simultâneos.', 0, false),
('Transport', 'Cardio', 'Máquina', ARRAY[]::TEXT[], 'Escada rolante.', 0, false),
('Remo Ergométrico', 'Cardio', 'Máquina', ARRAY['Costas','Perna'], 'Puxe com as costas.', 0, false),
('Pular Corda', 'Cardio', 'Acessório', ARRAY['Perna'], 'Saltos baixos. Ritmo constante.', 0, false),
('Burpee', 'Cardio', 'Peso Corporal', ARRAY['Peito','Perna'], 'Full body explosivo.', 0, false),
('Mountain Climber', 'Cardio', 'Peso Corporal', ARRAY['Abdômen'], 'Velocidade controlada.', 0, false);

-- Workout templates (atualizar estrutura se necessário)
ALTER TABLE workout_templates ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE workout_templates ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE workout_templates ADD COLUMN IF NOT EXISTS copied_from UUID;

-- Workout template exercises (atualizar)
ALTER TABLE workout_template_exercises ADD COLUMN IF NOT EXISTS target_reps TEXT DEFAULT '12';
ALTER TABLE workout_template_exercises ADD COLUMN IF NOT EXISTS target_weight DECIMAL;
ALTER TABLE workout_template_exercises ADD COLUMN IF NOT EXISTS notes TEXT;

-- Workout logs (nova tabela para sessões detalhadas)
CREATE TABLE IF NOT EXISTS workout_logs_v2 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES workout_templates(id),
  name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  volume_total DECIMAL DEFAULT 0,
  unidade_id UUID REFERENCES units(id),
  notes TEXT,
  workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Workout sets (séries individuais)
CREATE TABLE IF NOT EXISTS workout_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_log_id UUID REFERENCES workout_logs_v2(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercises(id) NOT NULL,
  set_index INTEGER NOT NULL,
  set_type TEXT DEFAULT 'normal',
  weight_kg DECIMAL,
  reps INTEGER,
  duration_seconds INTEGER,
  rpe DECIMAL,
  is_completed BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Body measurements (se não existir com esse formato)
CREATE TABLE IF NOT EXISTS body_measurements_v2 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  measured_at DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg DECIMAL,
  height_cm DECIMAL,
  chest_cm DECIMAL,
  waist_cm DECIMAL,
  hip_cm DECIMAL,
  left_arm_cm DECIMAL,
  right_arm_cm DECIMAL,
  left_thigh_cm DECIMAL,
  right_thigh_cm DECIMAL,
  left_calf_cm DECIMAL,
  right_calf_cm DECIMAL,
  body_fat_pct DECIMAL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workout_logs_v2_user ON workout_logs_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_v2_date ON workout_logs_v2(workout_date);
CREATE INDEX IF NOT EXISTS idx_workout_sets_log ON workout_sets(workout_log_id);
CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise ON workout_sets(exercise_id);
CREATE INDEX IF NOT EXISTS idx_body_measurements_v2_user ON body_measurements_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_exercises_muscle ON exercises(muscle_group);

-- RLS
ALTER TABLE workout_logs_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_measurements_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wl2_select_own" ON workout_logs_v2 FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "wl2_insert_own" ON workout_logs_v2 FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "wl2_update_own" ON workout_logs_v2 FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "wl2_delete_own" ON workout_logs_v2 FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "ws_select_own" ON workout_sets FOR SELECT USING (
  workout_log_id IN (SELECT id FROM workout_logs_v2 WHERE user_id = auth.uid())
);
CREATE POLICY "ws_insert_own" ON workout_sets FOR INSERT WITH CHECK (
  workout_log_id IN (SELECT id FROM workout_logs_v2 WHERE user_id = auth.uid())
);
CREATE POLICY "ws_update_own" ON workout_sets FOR UPDATE USING (
  workout_log_id IN (SELECT id FROM workout_logs_v2 WHERE user_id = auth.uid())
);
CREATE POLICY "ws_delete_own" ON workout_sets FOR DELETE USING (
  workout_log_id IN (SELECT id FROM workout_logs_v2 WHERE user_id = auth.uid())
);

CREATE POLICY "bm2_select_own" ON body_measurements_v2 FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "bm2_insert_own" ON body_measurements_v2 FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "bm2_update_own" ON body_measurements_v2 FOR UPDATE USING (user_id = auth.uid());
