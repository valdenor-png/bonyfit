-- ============================================
-- Migration 026: Grade de Aulas Recorrentes
-- Aulas semanais fixas + eventos pontuais do mês
-- ============================================

-- ── GRADE SEMANAL FIXA ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS class_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  modalidade_id UUID REFERENCES modalidades(id) NOT NULL,
  unidade_id UUID REFERENCES units(id),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  instructor_name TEXT,
  instructor_id UUID REFERENCES users(id),
  max_participants INTEGER,
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_class_schedule_day ON class_schedule(day_of_week);
CREATE INDEX IF NOT EXISTS idx_class_schedule_unit ON class_schedule(unidade_id);

ALTER TABLE class_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "class_schedule_read" ON class_schedule
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "class_schedule_admin" ON class_schedule
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN cargos c ON c.id = u.cargo_id
      WHERE u.id = auth.uid() AND c.slug IN ('dono', 'supervisor')
    )
  );

-- ── SEED: Grade da Bony Fit ─────────────────────────────────

-- Abdominal: ter e qui 20h
INSERT INTO class_schedule (modalidade_id, day_of_week, start_time, end_time, instructor_name, location)
SELECT id, 2, '20:00', '20:45', 'Prof. Lucas', 'Sala Principal' FROM modalidades WHERE slug = 'abdominal';
INSERT INTO class_schedule (modalidade_id, day_of_week, start_time, end_time, instructor_name, location)
SELECT id, 4, '20:00', '20:45', 'Prof. Lucas', 'Sala Principal' FROM modalidades WHERE slug = 'abdominal';

-- Funcional: seg, qua, sex 07h
INSERT INTO class_schedule (modalidade_id, day_of_week, start_time, end_time, instructor_name, location)
SELECT id, 1, '07:00', '07:50', 'Prof. Ana', 'Área Externa' FROM modalidades WHERE slug = 'funcional';
INSERT INTO class_schedule (modalidade_id, day_of_week, start_time, end_time, instructor_name, location)
SELECT id, 3, '07:00', '07:50', 'Prof. Ana', 'Área Externa' FROM modalidades WHERE slug = 'funcional';
INSERT INTO class_schedule (modalidade_id, day_of_week, start_time, end_time, instructor_name, location)
SELECT id, 5, '07:00', '07:50', 'Prof. Ana', 'Área Externa' FROM modalidades WHERE slug = 'funcional';

-- Spinning: seg e qua 19h
INSERT INTO class_schedule (modalidade_id, day_of_week, start_time, end_time, instructor_name, location)
SELECT id, 1, '19:00', '19:50', 'Prof. Carlos', 'Sala Spinning' FROM modalidades WHERE slug = 'spinning';
INSERT INTO class_schedule (modalidade_id, day_of_week, start_time, end_time, instructor_name, location)
SELECT id, 3, '19:00', '19:50', 'Prof. Carlos', 'Sala Spinning' FROM modalidades WHERE slug = 'spinning';

-- Muay Thai: ter e qui 18h
INSERT INTO class_schedule (modalidade_id, day_of_week, start_time, end_time, instructor_name, location)
SELECT id, 2, '18:00', '19:00', 'Prof. Rafael', 'Sala Lutas' FROM modalidades WHERE slug = 'muay_thai';
INSERT INTO class_schedule (modalidade_id, day_of_week, start_time, end_time, instructor_name, location)
SELECT id, 4, '18:00', '19:00', 'Prof. Rafael', 'Sala Lutas' FROM modalidades WHERE slug = 'muay_thai';

-- Dança: sex 19h
INSERT INTO class_schedule (modalidade_id, day_of_week, start_time, end_time, instructor_name, location)
SELECT id, 5, '19:00', '20:00', 'Prof. Julia', 'Sala Principal' FROM modalidades WHERE slug = 'danca';

-- Yoga: sáb 09h
INSERT INTO class_schedule (modalidade_id, day_of_week, start_time, end_time, instructor_name, location)
SELECT id, 6, '09:00', '10:00', 'Prof. Marina', 'Sala 2' FROM modalidades WHERE slug = 'yoga';

-- HIIT: seg e sex 18h
INSERT INTO class_schedule (modalidade_id, day_of_week, start_time, end_time, instructor_name, location)
SELECT id, 1, '18:00', '18:45', 'Prof. Diego', 'Área Externa' FROM modalidades WHERE slug = 'hiit';
INSERT INTO class_schedule (modalidade_id, day_of_week, start_time, end_time, instructor_name, location)
SELECT id, 5, '18:00', '18:45', 'Prof. Diego', 'Área Externa' FROM modalidades WHERE slug = 'hiit';

-- Alongamento: qua 07h e sáb 10h
INSERT INTO class_schedule (modalidade_id, day_of_week, start_time, end_time, instructor_name, location)
SELECT id, 3, '07:00', '07:30', 'Prof. Marina', 'Sala 2' FROM modalidades WHERE slug = 'alongamento';
INSERT INTO class_schedule (modalidade_id, day_of_week, start_time, end_time, instructor_name, location)
SELECT id, 6, '10:00', '10:30', 'Prof. Marina', 'Sala 2' FROM modalidades WHERE slug = 'alongamento';
