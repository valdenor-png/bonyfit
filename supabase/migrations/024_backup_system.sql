-- ============================================
-- Migration 024: Backup System
-- backup_history, backup_snapshot RPC, backup_record_counts RPC
-- ============================================

-- ── BACKUP HISTORY ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS backup_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_type TEXT NOT NULL DEFAULT 'full_snapshot',
  storage_location TEXT NOT NULL DEFAULT 'supabase_storage',
  file_name TEXT,
  size_bytes BIGINT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  tables_included TEXT[] DEFAULT '{}',
  record_counts JSONB DEFAULT '{}',
  duration_ms INT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_backup_history_status ON backup_history(status, created_at DESC);

ALTER TABLE backup_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_backup" ON backup_history
  FOR ALL USING (auth.role() = 'service_role');

-- ── STORAGE BUCKET ───────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('backups', 'backups', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "backups_service_only_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'backups' AND auth.role() = 'service_role');

CREATE POLICY "backups_service_only_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'backups' AND auth.role() = 'service_role');

-- ── RPC: backup_record_counts ────────────────────────────────

CREATE OR REPLACE FUNCTION backup_record_counts()
RETURNS JSONB AS $$
DECLARE
  result JSONB := '{}';
  tbl RECORD;
  cnt BIGINT;
BEGIN
  FOR tbl IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  LOOP
    EXECUTE format('SELECT count(*) FROM %I', tbl.table_name) INTO cnt;
    result := result || jsonb_build_object(tbl.table_name, cnt);
  END LOOP;

  result := result || jsonb_build_object('generated_at', now()::text);
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── RPC: backup_snapshot ─────────────────────────────────────
-- Returns a JSON object with all table data for critical tables

CREATE OR REPLACE FUNCTION backup_snapshot()
RETURNS JSONB AS $$
DECLARE
  result JSONB := '{}';
  critical_tables TEXT[] := ARRAY[
    'users', 'exercises', 'workout_sessions', 'workout_logs',
    'posts', 'follows', 'messages', 'conversations',
    'indicacoes', 'avaliacoes', 'aula_sessoes', 'aula_presencas',
    'loja_pedidos', 'active_checkins', 'audit_log'
  ];
  tbl TEXT;
  tbl_data JSONB;
BEGIN
  FOREACH tbl IN ARRAY critical_tables
  LOOP
    BEGIN
      EXECUTE format('SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM %I t', tbl)
        INTO tbl_data;
      result := result || jsonb_build_object(tbl, tbl_data);
    EXCEPTION WHEN OTHERS THEN
      result := result || jsonb_build_object(tbl, '[]'::jsonb);
    END;
  END LOOP;

  result := result || jsonb_build_object('generated_at', now()::text);
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
