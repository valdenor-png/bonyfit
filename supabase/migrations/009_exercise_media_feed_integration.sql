-- ============================================
-- BONY FIT — EXERCISE MEDIA + FEED INTEGRATION
-- Migration 009
-- ============================================

-- Adicionar colunas de mídia na tabela exercises
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS gif_url TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS instructions TEXT;

-- Bucket para mídia de exercícios
INSERT INTO storage.buckets (id, name, public)
SELECT 'exercise-media', 'exercise-media', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'exercise-media');

-- Storage policies
CREATE POLICY "exercise_media_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'exercise-media');
CREATE POLICY "exercise_media_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'exercise-media' AND auth.role() = 'authenticated');

-- Adicionar campo points_earned em workout_logs_v2 se não existir
ALTER TABLE workout_logs_v2 ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0;
