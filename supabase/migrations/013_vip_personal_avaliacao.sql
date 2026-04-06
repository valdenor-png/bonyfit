-- ============================================
-- BONY FIT — PLANO VIP + ESCOLHA PERSONAL + AGENDAMENTO AVALIAÇÃO
-- Migration 013
-- ============================================

-- === PLANO VIP ===
ALTER TABLE plans ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'padrao';
ALTER TABLE plans ADD COLUMN IF NOT EXISTS personal_exclusivo BOOLEAN DEFAULT false;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS avaliacao_mensal BOOLEAN DEFAULT false;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS duracao_sessao_min INT DEFAULT 60;

INSERT INTO plans (name, price, period, tipo, personal_exclusivo, avaliacao_mensal, duracao_sessao_min, features)
VALUES (
  'VIP', 199.90, 'mensal', 'vip', true, true, 60,
  '["Personal exclusivo", "Avaliação mensal", "Todas unidades", "Treinos ilimitados", "App completo", "Sessão 1h com personal"]'
) ON CONFLICT DO NOTHING;

-- === AJUSTAR PERSONAL_ALUNOS ===
ALTER TABLE personal_alunos ALTER COLUMN personal_id DROP NOT NULL;
ALTER TABLE personal_alunos ADD COLUMN IF NOT EXISTS modo_escolha TEXT DEFAULT 'direto';
ALTER TABLE personal_alunos ADD COLUMN IF NOT EXISTS atribuido_por UUID REFERENCES users(id);
ALTER TABLE personal_alunos ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'app';
ALTER TABLE personal_alunos ADD COLUMN IF NOT EXISTS unidade_id UUID REFERENCES units(id);

-- Personal responsável por unidade
ALTER TABLE units ADD COLUMN IF NOT EXISTS personal_responsavel_id UUID REFERENCES users(id);
ALTER TABLE units ADD COLUMN IF NOT EXISTS personal_responsavel_2_id UUID REFERENCES users(id);

-- Atualizar RLS personal_alunos
DROP POLICY IF EXISTS "pa_select" ON personal_alunos;
CREATE POLICY "pa_select" ON personal_alunos FOR SELECT USING (
  personal_id = auth.uid()
  OR aluno_id = auth.uid()
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND cargo_slug = 'dono')
  OR (status = 'pendente' AND unidade_id IN (
    SELECT id FROM units WHERE personal_responsavel_id = auth.uid() OR personal_responsavel_2_id = auth.uid()
  ))
);

DROP POLICY IF EXISTS "pa_update" ON personal_alunos;
CREATE POLICY "pa_update" ON personal_alunos FOR UPDATE USING (
  personal_id = auth.uid()
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND cargo_slug = 'dono')
  OR (status = 'pendente' AND unidade_id IN (
    SELECT id FROM units WHERE personal_responsavel_id = auth.uid() OR personal_responsavel_2_id = auth.uid()
  ))
);

-- === AGENDAMENTO DE AVALIAÇÃO ===
CREATE TABLE IF NOT EXISTS agendamento_avaliacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  personal_id UUID REFERENCES users(id),
  unidade_id UUID NOT NULL REFERENCES units(id),
  data_agendada DATE,
  horario_inicio TIME,
  horario_fim TIME,
  status TEXT DEFAULT 'solicitado',
  solicitado_por TEXT DEFAULT 'app',
  confirmado_por UUID REFERENCES users(id),
  avaliacao_id UUID REFERENCES avaliacoes(id),
  observacoes_aluno TEXT,
  observacoes_recepcao TEXT,
  motivo_cancelamento TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agend_aval_aluno ON agendamento_avaliacoes(aluno_id);
CREATE INDEX IF NOT EXISTS idx_agend_aval_status ON agendamento_avaliacoes(status);
CREATE INDEX IF NOT EXISTS idx_agend_aval_data ON agendamento_avaliacoes(data_agendada);

ALTER TABLE agendamento_avaliacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agend_aval_select" ON agendamento_avaliacoes FOR SELECT USING (
  aluno_id = auth.uid() OR personal_id = auth.uid()
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND cargo_slug IN ('dono'))
);
CREATE POLICY "agend_aval_insert" ON agendamento_avaliacoes FOR INSERT WITH CHECK (
  aluno_id = auth.uid()
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND cargo_slug IN ('dono'))
);
CREATE POLICY "agend_aval_update" ON agendamento_avaliacoes FOR UPDATE USING (
  aluno_id = auth.uid()
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND cargo_slug IN ('dono'))
);
