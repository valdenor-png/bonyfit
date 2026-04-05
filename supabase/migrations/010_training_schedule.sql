CREATE TABLE IF NOT EXISTS training_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES users(id),
  template_id UUID REFERENCES workout_templates(id),
  workout_name TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  status TEXT DEFAULT 'scheduled',
  completed_workout_id UUID REFERENCES workout_logs_v2(id),
  unidade_id UUID REFERENCES units(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schedule_user_date ON training_schedule(user_id, scheduled_date);

ALTER TABLE training_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schedule_select_own" ON training_schedule FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "schedule_insert" ON training_schedule FOR INSERT WITH CHECK (true);
CREATE POLICY "schedule_update_own" ON training_schedule FOR UPDATE USING (user_id = auth.uid());
