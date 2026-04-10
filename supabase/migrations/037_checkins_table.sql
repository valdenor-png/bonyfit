-- ============================================
-- Migration 037: Tabela de check-ins com geofencing
-- ============================================

CREATE TABLE IF NOT EXISTS public.checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  catraca_entrada_at TIMESTAMPTZ NOT NULL,
  gps_lat DECIMAL(10,7),
  gps_lng DECIMAL(10,7),
  gps_dentro_raio BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON public.checkins(user_id, created_at);

ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checkins_select" ON public.checkins
  FOR SELECT USING (user_id = auth.uid());

REVOKE INSERT, UPDATE, DELETE ON public.checkins FROM authenticated;
