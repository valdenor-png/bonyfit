-- ============================================
-- Migration 035: Tabela de pontos separada (ledger)
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pontos INTEGER NOT NULL,
  tipo TEXT NOT NULL,
  referencia_id UUID,
  status TEXT NOT NULL DEFAULT 'confirmado' CHECK (status IN ('confirmado', 'pendente', 'cancelado')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_points_user ON public.user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_status ON public.user_points(status);

ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_points_select" ON public.user_points
  FOR SELECT USING (user_id = auth.uid());

REVOKE INSERT, UPDATE, DELETE ON public.user_points FROM authenticated;

-- View de saldo total por aluno
CREATE OR REPLACE VIEW public.user_points_total AS
SELECT
  user_id,
  COALESCE(SUM(pontos) FILTER (WHERE status = 'confirmado'), 0) AS pontos_total,
  COALESCE(SUM(pontos) FILTER (WHERE status = 'pendente'), 0) AS pontos_pendentes,
  COUNT(*) FILTER (WHERE tipo = 'checkin' AND status = 'confirmado') AS total_checkins,
  COUNT(*) FILTER (WHERE tipo = 'treino_bonus' AND status = 'confirmado') AS total_treinos
FROM public.user_points
GROUP BY user_id;

GRANT SELECT ON public.user_points_total TO authenticated;
