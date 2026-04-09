-- ============================================
-- Migration 032: workout_sets.exercise_id nullable + exercise_name
-- ============================================
-- O exercise_id era NOT NULL mas treinos com exercícios mock (IDs curtos)
-- causavam erro "invalid input syntax for type uuid".
-- Tornar nullable permite salvar sets de exercícios não cadastrados no banco.
-- exercise_name preserva o nome do exercício mesmo sem FK.

ALTER TABLE workout_sets ALTER COLUMN exercise_id DROP NOT NULL;
ALTER TABLE workout_sets ADD COLUMN IF NOT EXISTS exercise_name TEXT;
