-- ============================================
-- BONY FIT — REAVALIAÇÕES + INDICAÇÕES
-- Migration 005
-- ============================================

-- Reavaliações físicas
CREATE TABLE IF NOT EXISTS avaliacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  avaliador_id UUID REFERENCES users(id) NOT NULL,
  unidade_id UUID REFERENCES units(id),
  peso_kg DECIMAL(5,2),
  altura_cm DECIMAL(5,1),
  percentual_gordura DECIMAL(4,1),
  massa_magra_kg DECIMAL(5,2),
  imc DECIMAL(4,1),
  circ_braco_dir DECIMAL(4,1),
  circ_braco_esq DECIMAL(4,1),
  circ_peitoral DECIMAL(4,1),
  circ_cintura DECIMAL(4,1),
  circ_abdomen DECIMAL(4,1),
  circ_quadril DECIMAL(4,1),
  circ_coxa_dir DECIMAL(4,1),
  circ_coxa_esq DECIMAL(4,1),
  circ_panturrilha_dir DECIMAL(4,1),
  circ_panturrilha_esq DECIMAL(4,1),
  foto_frente_url TEXT,
  foto_costas_url TEXT,
  foto_lateral_url TEXT,
  observacoes TEXT,
  pontos_base INT DEFAULT 0,
  pontos_bonus INT DEFAULT 0,
  pontos_total INT DEFAULT 0,
  melhorias JSONB DEFAULT '{}',
  avaliacao_anterior_id UUID REFERENCES avaliacoes(id),
  diferenca JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Config de pontos de avaliação
CREATE TABLE IF NOT EXISTS config_pontos_avaliacao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pontos_base INT DEFAULT 300,
  pontos_reduziu_gordura INT DEFAULT 150,
  pontos_aumentou_massa INT DEFAULT 150,
  pontos_bonus_combo INT DEFAULT 100,
  pontos_bonus_perfeito INT DEFAULT 200,
  intervalo_minimo_dias INT DEFAULT 30,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indicações (referral)
CREATE TABLE IF NOT EXISTS indicacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  indicador_id UUID REFERENCES users(id) NOT NULL,
  indicado_id UUID REFERENCES users(id),
  indicado_nome TEXT,
  codigo_indicacao TEXT UNIQUE,
  status TEXT DEFAULT 'pendente',
  pontos_indicador INT DEFAULT 0,
  pontos_indicado INT DEFAULT 0,
  pontos_creditados_em TIMESTAMPTZ,
  pontos_estornados_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Config de pontos de indicação
CREATE TABLE IF NOT EXISTS config_pontos_indicacao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pontos_indicador INT DEFAULT 500,
  pontos_indicado INT DEFAULT 100,
  limite_mensal INT DEFAULT 10,
  dias_minimos_para_estorno INT DEFAULT 30,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campos adicionais em users
ALTER TABLE users ADD COLUMN IF NOT EXISTS objetivo TEXT DEFAULT 'saude_geral';
ALTER TABLE users ADD COLUMN IF NOT EXISTS codigo_indicacao TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS indicado_por UUID REFERENCES users(id);

-- Seed configs
INSERT INTO config_pontos_avaliacao (pontos_base, pontos_reduziu_gordura, pontos_aumentou_massa, pontos_bonus_combo, pontos_bonus_perfeito, intervalo_minimo_dias)
VALUES (300, 150, 150, 100, 200, 30)
ON CONFLICT DO NOTHING;

INSERT INTO config_pontos_indicacao (pontos_indicador, pontos_indicado, limite_mensal, dias_minimos_para_estorno)
VALUES (500, 100, 10, 30)
ON CONFLICT DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_avaliacoes_aluno ON avaliacoes(aluno_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_avaliador ON avaliacoes(avaliador_id);
CREATE INDEX IF NOT EXISTS idx_indicacoes_indicador ON indicacoes(indicador_id);
CREATE INDEX IF NOT EXISTS idx_indicacoes_indicado ON indicacoes(indicado_id);
CREATE INDEX IF NOT EXISTS idx_indicacoes_codigo ON indicacoes(codigo_indicacao);
CREATE INDEX IF NOT EXISTS idx_indicacoes_status ON indicacoes(status);

-- RLS
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_pontos_avaliacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_pontos_indicacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "avaliacoes_select" ON avaliacoes FOR SELECT USING (
  aluno_id = auth.uid() OR avaliador_id = auth.uid()
);
CREATE POLICY "avaliacoes_insert" ON avaliacoes FOR INSERT WITH CHECK (avaliador_id = auth.uid());
CREATE POLICY "indicacoes_select" ON indicacoes FOR SELECT USING (
  indicador_id = auth.uid() OR indicado_id = auth.uid()
);
CREATE POLICY "indicacoes_insert" ON indicacoes FOR INSERT WITH CHECK (indicador_id = auth.uid());
CREATE POLICY "config_avaliacao_select" ON config_pontos_avaliacao FOR SELECT USING (true);
CREATE POLICY "config_indicacao_select" ON config_pontos_indicacao FOR SELECT USING (true);
