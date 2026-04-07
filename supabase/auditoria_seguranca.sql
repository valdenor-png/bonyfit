-- ============================================
-- BONY FIT — AUDITORIA DE SEGURANÇA COMPLETA
-- Cole tudo no SQL Editor do Supabase e rode
-- ============================================

-- ═══════════════════════════════════════
-- 1. TABELAS SEM RLS (CRÍTICO)
-- ═══════════════════════════════════════
SELECT '1. TABELAS SEM RLS' AS secao;

SELECT
  t.tablename AS tabela,
  CASE WHEN c.relrowsecurity THEN '✅ RLS Ativo' ELSE '⛔ SEM RLS - EXPOSTA' END AS status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
WHERE t.schemaname = 'public'
ORDER BY c.relrowsecurity, t.tablename;

-- ═══════════════════════════════════════
-- 2. TABELAS COM RLS MAS SEM POLICIES
-- ═══════════════════════════════════════
SELECT '2. RLS ATIVO SEM POLICIES' AS secao;

SELECT
  c.relname AS tabela,
  '⚠️ RLS ATIVO MAS SEM POLICY' AS status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity = true
  AND c.relname NOT IN (
    SELECT DISTINCT tablename FROM pg_policies WHERE schemaname = 'public'
  )
ORDER BY c.relname;

-- ═══════════════════════════════════════
-- 3. POLICIES SELECT ABERTAS (perigoso)
-- ═══════════════════════════════════════
SELECT '3. POLICIES SELECT ABERTAS' AS secao;

SELECT
  tablename AS tabela,
  policyname AS policy,
  CASE
    WHEN qual = 'true' THEN '⚠️ ABERTA - qualquer autenticado vê tudo'
    WHEN qual IS NULL THEN '🚨 SEM CONDIÇÃO'
    WHEN qual LIKE '%auth.uid()%' THEN '✅ Filtrado por user'
    ELSE '🔍 Revisar: ' || LEFT(qual, 80)
  END AS seguranca
FROM pg_policies
WHERE schemaname = 'public' AND cmd = 'SELECT'
ORDER BY
  CASE WHEN qual = 'true' OR qual IS NULL THEN 0 ELSE 1 END,
  tablename;

-- ═══════════════════════════════════════
-- 4. POLICIES DELETE (quem pode deletar)
-- ═══════════════════════════════════════
SELECT '4. POLICIES DELETE' AS secao;

SELECT
  tablename AS tabela,
  policyname AS policy,
  CASE
    WHEN qual LIKE '%auth.uid()%' THEN '✅ Só dono deleta'
    WHEN qual IS NULL OR qual = 'true' THEN '🚨 QUALQUER UM DELETA'
    ELSE '⚠️ Revisar: ' || LEFT(qual, 80)
  END AS seguranca
FROM pg_policies
WHERE schemaname = 'public' AND cmd = 'DELETE'
ORDER BY tablename;

-- ═══════════════════════════════════════
-- 5. TABELAS SEM POLICY DELETE
-- ═══════════════════════════════════════
SELECT '5. SEM POLICY DELETE' AS secao;

SELECT
  t.tablename AS tabela,
  '⚠️ Sem policy DELETE' AS status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
WHERE t.schemaname = 'public'
  AND c.relrowsecurity = true
  AND t.tablename NOT IN (
    SELECT DISTINCT tablename FROM pg_policies WHERE schemaname = 'public' AND cmd = 'DELETE'
  )
ORDER BY t.tablename;

-- ═══════════════════════════════════════
-- 6. STORAGE BUCKETS
-- ═══════════════════════════════════════
SELECT '6. STORAGE BUCKETS' AS secao;

SELECT
  id, name,
  CASE WHEN public THEN '⚠️ Público' ELSE '✅ Privado' END AS visibilidade,
  file_size_limit
FROM storage.buckets
ORDER BY name;

-- ═══════════════════════════════════════
-- 7. FUNCTIONS SECURITY DEFINER
-- ═══════════════════════════════════════
SELECT '7. FUNCTIONS SECURITY DEFINER' AS secao;

SELECT
  p.proname AS funcao,
  CASE p.prosecdef
    WHEN true THEN '🔑 SECURITY DEFINER (bypass RLS)'
    ELSE '✅ INVOKER (respeita RLS)'
  END AS tipo
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
ORDER BY p.prosecdef DESC, p.proname;

-- ═══════════════════════════════════════
-- 8. CONTAGEM TOTAL
-- ═══════════════════════════════════════
SELECT '8. RESUMO' AS secao;

SELECT
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') AS total_tabelas,
  (SELECT COUNT(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity = true) AS tabelas_com_rls,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') AS total_policies,
  (SELECT COUNT(*) FROM storage.buckets) AS total_buckets,
  (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.prosecdef = true) AS functions_definer;
