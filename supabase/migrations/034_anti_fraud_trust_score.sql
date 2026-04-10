-- ============================================
-- Migration 034: Sistema Anti-Fraude — trust_score + fraud_flags
-- ============================================

-- 1. trust_score na tabela users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 80;
DO $$ BEGIN
  ALTER TABLE public.users ADD CONSTRAINT trust_score_range CHECK (trust_score >= 0 AND trust_score <= 100);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Tabela de flags de fraude
CREATE TABLE IF NOT EXISTS public.fraud_flags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  flag_type TEXT NOT NULL,
  severidade TEXT NOT NULL CHECK (severidade IN ('alta', 'media', 'baixa')),
  detalhes JSONB DEFAULT '{}',
  resolvido BOOLEAN DEFAULT FALSE,
  resolvido_por UUID REFERENCES public.users(id),
  resolvido_at TIMESTAMPTZ,
  resolucao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fraud_flags_user ON public.fraud_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_flags_open ON public.fraud_flags(resolvido) WHERE resolvido = FALSE;

ALTER TABLE public.fraud_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fraud_flags_aluno_select" ON public.fraud_flags
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "fraud_flags_admin_select" ON public.fraud_flags
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND cargo_slug IN ('dono', 'financeiro'))
  );

CREATE POLICY "fraud_flags_admin_update" ON public.fraud_flags
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND cargo_slug = 'dono')
  );
