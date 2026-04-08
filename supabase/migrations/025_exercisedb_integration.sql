-- ============================================
-- Migration 025: ExerciseDB Integration
-- Add columns for external exercise databases
-- ============================================

-- ── NEW COLUMNS ──────────────────────────────────────────────

ALTER TABLE exercises ADD COLUMN IF NOT EXISTS external_id TEXT UNIQUE;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS name_pt TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS body_part TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS body_part_pt TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS target_muscle TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS target_muscle_pt TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS equipment_pt TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS instructions_pt TEXT[];
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ── INDEXES ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_exercises_body_part ON exercises(body_part);
CREATE INDEX IF NOT EXISTS idx_exercises_target_muscle ON exercises(target_muscle);
CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category);
CREATE INDEX IF NOT EXISTS idx_exercises_external_id ON exercises(external_id);

-- ── STORAGE BUCKET ───────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('exercise-images', 'exercise-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "exercise_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'exercise-images');

CREATE POLICY "exercise_images_service_write" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'exercise-images' AND auth.role() = 'service_role');

-- ── UPDATE SEARCH VECTOR to include name_pt ──────────────────

CREATE OR REPLACE FUNCTION exercises_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', coalesce(NEW.name_pt, NEW.name, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(NEW.target_muscle_pt, NEW.muscle_group, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(NEW.equipment_pt, NEW.equipment, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── BACKFILL existing exercises with body_part from muscle_group ──

UPDATE exercises
SET body_part = muscle_group,
    target_muscle = muscle_group,
    source = 'seed'
WHERE body_part IS NULL AND muscle_group IS NOT NULL;
