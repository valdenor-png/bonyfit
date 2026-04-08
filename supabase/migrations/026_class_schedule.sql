-- ============================================
-- Migration 026: Grade de Aulas Recorrentes
-- Aulas semanais fixas + eventos pontuais do mês
-- ============================================

-- ── GRADE SEMANAL FIXA ───────────────────────────────────────
-- Aulas que se repetem toda semana (ex: Abdominal ter/qui 20h)

CREATE TABLE IF NOT EXISTS class_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  modalidade_id UUID REFERENCES modalidades(id) NOT NULL,
  unidade_id UUID REFERENCES units(id),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  -- 0=domingo, 1=segunda, ..., 6=sábado
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  instructor_name TEXT,
  instructor_id UUID REFERENCES users(id),
  max_participants INTEGER,
  location TEXT, -- ex: "Sala 1", "Área externa"
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
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('dono', 'supervisor'))
  );

-- ── SEED: Grade da Bony Fit ─────────────────────────────────
-- Inserir aulas usando as modalidades existentes

INSERT INTO class_schedule (modalidade_id, day_of_week, start_time, end_time, instructor_name, location)
SELECT m.id, d.dow, d.st, d.et, d.instructor, d.loc
FROM modalidades m
CROSS JOIN (VALUES
  -- Abdominal: ter e qui 20h
  ('abdominal', 2, '20:00'::TIME, '20:45'::TIME, 'Prof. Lucas', 'Sala Principal'),
  ('abdominal', 4, '20:00'::TIME, '20:45'::TIME, 'Prof. Lucas', 'Sala Principal'),
  -- Funcional: seg, qua, sex 07h
  ('funcional', 1, '07:00'::TIME, '07:50'::TIME, 'Prof. Ana', 'Área Externa'),
  ('funcional', 3, '07:00'::TIME, '07:50'::TIME, 'Prof. Ana', 'Área Externa'),
  ('funcional', 5, '07:00'::TIME, '07:50'::TIME, 'Prof. Ana', 'Área Externa'),
  -- Spinning: seg e qua 19h
  ('spinning', 1, '19:00'::TIME, '19:50'::TIME, 'Prof. Carlos', 'Sala Spinning'),
  ('spinning', 3, '19:00'::TIME, '19:50'::TIME, 'Prof. Carlos', 'Sala Spinning'),
  -- Muay Thai: ter e qui 18h
  ('muay_thai', 2, '18:00'::TIME, '19:00'::TIME, 'Prof. Rafael', 'Sala Lutas'),
  ('muay_thai', 4, '18:00'::TIME, '19:00'::TIME, 'Prof. Rafael', 'Sala Lutas'),
  -- Dança: sex 19h
  ('danca', 5, '19:00'::TIME, '20:00'::TIME, 'Prof. Julia', 'Sala Principal'),
  -- Yoga: sáb 09h
  ('yoga', 6, '09:00'::TIME, '10:00'::TIME, 'Prof. Marina', 'Sala 2'),
  -- HIIT: seg e sex 18h
  ('hiit', 1, '18:00'::TIME, '18:45'::TIME, 'Prof. Diego', 'Área Externa'),
  ('hiit', 5, '18:00'::TIME, '18:45'::TIME, 'Prof. Diego', 'Área Externa'),
  -- Alongamento: qua 07h e sáb 10h
  ('alongamento', 3, '07:00'::TIME, '07:30'::TIME, 'Prof. Marina', 'Sala 2'),
  ('alongamento', 6, '10:00'::TIME, '10:30'::TIME, 'Prof. Marina', 'Sala 2')
) AS d(slug, dow, st, et, instructor, loc)
WHERE m.slug = d.slug
ON CONFLICT DO NOTHING;
