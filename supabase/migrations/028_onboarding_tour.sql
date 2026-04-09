-- ============================================
-- Migration 028: Onboarding Tour
-- ============================================

-- Adicionar coluna (pode já existir da migration 004)
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Marcar todos os existentes como true (já viram o app)
UPDATE users SET onboarding_completed = true WHERE onboarding_completed IS NULL OR onboarding_completed = false;
