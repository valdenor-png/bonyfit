-- ============================================
-- BONY FIT — CARGO SUPERVISOR
-- Migration 014
-- ============================================

-- 1. Criar cargo Supervisor
INSERT INTO cargos (nome, slug, descricao, pode_trocar_modo, ordem, permissoes) VALUES
('Supervisor', 'supervisor', 'Personal líder do salão — designa personais, gerencia VIPs e supervisiona o salão', true, 2, '{
  "pode_treinar": true,
  "pode_usar_feed": true,
  "pode_usar_loja": true,
  "pode_escanear_qr_aula": true,
  "pode_escanear_catraca": true,
  "pode_ver_ranking": true,
  "pode_ver_conquistas": true,
  "pode_enviar_dm": true,
  "pode_postar_feed": true,
  "pode_vincular_alunos": true,
  "pode_montar_treino_para_aluno": true,
  "pode_acompanhar_progresso_aluno": true,
  "pode_abrir_sessao_individual": true,
  "pode_gerar_qr_sessao": true,
  "pode_ver_lista_seus_alunos": true,
  "pode_designar_personal_vip": true,
  "pode_ver_todos_personais_unidade": true,
  "pode_ver_escolhas_alunos_vip": true,
  "pode_ver_avaliacoes_pendentes_unidade": true,
  "pode_ver_distribuicao_alunos": true,
  "pode_gerenciar_salao": true
}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- 2. Atualizar RLS personal_alunos
DROP POLICY IF EXISTS "pa_select" ON personal_alunos;
CREATE POLICY "pa_select" ON personal_alunos FOR SELECT USING (
  personal_id = auth.uid()
  OR aluno_id = auth.uid()
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND cargo_slug = 'dono')
  OR EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.cargo_slug = 'supervisor'
    AND u.unit_id = personal_alunos.unidade_id
  )
);

DROP POLICY IF EXISTS "pa_update" ON personal_alunos;
CREATE POLICY "pa_update" ON personal_alunos FOR UPDATE USING (
  personal_id = auth.uid()
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND cargo_slug = 'dono')
  OR EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.cargo_slug = 'supervisor'
    AND u.unit_id = personal_alunos.unidade_id
  )
);

DROP POLICY IF EXISTS "pa_insert" ON personal_alunos;
CREATE POLICY "pa_insert" ON personal_alunos FOR INSERT WITH CHECK (
  personal_id = auth.uid()
  OR aluno_id = auth.uid()
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND cargo_slug IN ('dono', 'supervisor'))
);

-- 3. Supervisor vê avaliações da unidade
DROP POLICY IF EXISTS "agend_aval_select" ON agendamento_avaliacoes;
CREATE POLICY "agend_aval_select" ON agendamento_avaliacoes FOR SELECT USING (
  aluno_id = auth.uid() OR personal_id = auth.uid()
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND cargo_slug IN ('dono'))
  OR EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.cargo_slug = 'supervisor'
    AND u.unit_id = agendamento_avaliacoes.unidade_id
  )
);

DROP POLICY IF EXISTS "agend_aval_update" ON agendamento_avaliacoes;
CREATE POLICY "agend_aval_update" ON agendamento_avaliacoes FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND cargo_slug IN ('dono'))
  OR (aluno_id = auth.uid() AND status IN ('solicitado', 'agendado'))
  OR EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.cargo_slug = 'supervisor'
    AND u.unit_id = agendamento_avaliacoes.unidade_id
  )
);

-- 4. Supervisor vê workout_plans da unidade
DROP POLICY IF EXISTS "wp_select" ON workout_plans;
CREATE POLICY "wp_select" ON workout_plans FOR SELECT USING (
  aluno_id = auth.uid() OR personal_id = auth.uid()
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND cargo_slug = 'dono')
  OR EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.cargo_slug = 'supervisor'
  )
);

-- 5. Supervisor vê logs da unidade
DROP POLICY IF EXISTS "wl2_select_own" ON workout_logs_v2;
CREATE POLICY "wl2_select" ON workout_logs_v2 FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND cargo_slug IN ('dono', 'supervisor'))
);

-- 6. Supervisor vê avaliações da unidade
DROP POLICY IF EXISTS "avaliacoes_select" ON avaliacoes;
CREATE POLICY "avaliacoes_select" ON avaliacoes FOR SELECT USING (
  aluno_id = auth.uid() OR avaliador_id = auth.uid()
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND cargo_slug IN ('dono', 'supervisor'))
);
