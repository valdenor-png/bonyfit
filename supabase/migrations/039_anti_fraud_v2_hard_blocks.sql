-- ============================================
-- Migration 039: Anti-Fraude v2 — Hard Blocks (sem intervenção manual)
-- ============================================
-- Filosofia: passou = ganhou ponto. Não passou = bloqueado. Sem exceção.
-- Substitui o sistema de trust_score/fraud_flags por bloqueio binário.

-- 1. fraud_log (somente registro, append-only, sem resolução)
CREATE TABLE IF NOT EXISTS public.fraud_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  detalhes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fraud_log_user ON public.fraud_log(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_log_created ON public.fraud_log(created_at);

ALTER TABLE public.fraud_log ENABLE ROW LEVEL SECURITY;

-- Só dono vê (dashboard read-only)
CREATE POLICY "fraud_log_dono_select" ON public.fraud_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND cargo_slug = 'dono')
  );

-- Append-only: ninguém edita/deleta
REVOKE INSERT, UPDATE, DELETE ON public.fraud_log FROM authenticated;

-- 2. user_points sem status pendente (ganhou = confirmado, ponto final)
-- A tabela já existe da migration 035, mas vamos remover a constraint de status
-- e simplificar — se existir, ajustar; se não, criar.
DO $$
BEGIN
  -- Remove a constraint de status se existir (do sistema anterior)
  ALTER TABLE public.user_points DROP CONSTRAINT IF EXISTS user_points_status_check;
  ALTER TABLE public.user_points DROP COLUMN IF EXISTS status;
EXCEPTION WHEN undefined_table THEN
  -- Tabela não existe, criar do zero
  CREATE TABLE public.user_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    pontos INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    referencia_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX idx_user_points_user ON public.user_points(user_id);
  ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
  CREATE POLICY user_points_select ON public.user_points FOR SELECT USING (user_id = auth.uid());
  REVOKE INSERT, UPDATE, DELETE ON public.user_points FROM authenticated;
END $$;

-- 3. Recriar view de pontos (sem status)
CREATE OR REPLACE VIEW public.user_points_total AS
SELECT
  user_id,
  COALESCE(SUM(pontos), 0) AS pontos_total,
  COUNT(*) FILTER (WHERE tipo = 'checkin') AS total_checkins,
  COUNT(*) FILTER (WHERE tipo = 'treino_bonus') AS total_treinos
FROM public.user_points
GROUP BY user_id;

-- 4. Adicionar status 'invalidado' em workout_logs_v2 (para treinos com padrão suspeito)
-- Usamos uma coluna simples
ALTER TABLE public.workout_logs_v2 ADD COLUMN IF NOT EXISTS invalidado BOOLEAN DEFAULT FALSE;
