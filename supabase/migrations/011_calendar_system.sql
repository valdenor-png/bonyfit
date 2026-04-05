CREATE TABLE IF NOT EXISTS gym_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unidade_id UUID REFERENCES units(id),
  day_of_week INTEGER,
  specific_date DATE,
  opens_at TIME,
  closes_at TIME,
  is_closed BOOLEAN DEFAULT false,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gym_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unidade_id UUID REFERENCES units(id),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT DEFAULT 'class',
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  instructor TEXT,
  max_participants INTEGER,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS holidays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  holiday_date DATE NOT NULL,
  is_national BOOLEAN DEFAULT true,
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed feriados 2026
INSERT INTO holidays (name, holiday_date, is_national, year) VALUES
('Confraternização Universal', '2026-01-01', true, 2026),
('Carnaval', '2026-02-16', true, 2026),
('Carnaval', '2026-02-17', true, 2026),
('Sexta-feira Santa', '2026-04-03', true, 2026),
('Tiradentes', '2026-04-21', true, 2026),
('Dia do Trabalho', '2026-05-01', true, 2026),
('Corpus Christi', '2026-06-04', true, 2026),
('Independência', '2026-09-07', true, 2026),
('Nossa Sra Aparecida', '2026-10-12', true, 2026),
('Finados', '2026-11-02', true, 2026),
('Proclamação da República', '2026-11-15', true, 2026),
('Natal', '2026-12-25', true, 2026);

-- RLS
ALTER TABLE gym_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gym_hours_read" ON gym_hours FOR SELECT TO authenticated USING (true);
CREATE POLICY "gym_events_read" ON gym_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "holidays_read" ON holidays FOR SELECT TO authenticated USING (true);
