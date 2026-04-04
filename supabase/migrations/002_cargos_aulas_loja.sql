-- ============================================
-- BONY FIT — CARGOS, AULAS QR, LOJA
-- Migration 002
-- ============================================

-- ============================================
-- 1. CARGOS (RBAC)
-- ============================================
CREATE TABLE IF NOT EXISTS cargos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  descricao TEXT,
  permissoes JSONB NOT NULL DEFAULT '{}',
  modalidade TEXT,
  pode_trocar_modo BOOLEAN DEFAULT FALSE,
  ordem INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar campo cargo na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS cargo_id UUID REFERENCES cargos(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS cargo_slug TEXT DEFAULT 'aluno';

-- Seed de cargos
INSERT INTO cargos (nome, slug, descricao, pode_trocar_modo, ordem, permissoes) VALUES
('Aluno', 'aluno', 'Cargo padrão de todo novo usuário', false, 0, '{
  "pode_treinar": true,
  "pode_usar_feed": true,
  "pode_usar_loja": true,
  "pode_escanear_qr_aula": true,
  "pode_escanear_catraca": true,
  "pode_ver_ranking": true,
  "pode_ver_conquistas": true,
  "pode_enviar_dm": true,
  "pode_postar_feed": true
}'::jsonb),
('Personal', 'personal', 'Personal trainer — monta fichas e acompanha alunos', true, 1, '{
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
  "pode_ver_lista_seus_alunos": true
}'::jsonb),
('Financeiro', 'financeiro', 'Acesso a relatórios financeiros e cobranças', true, 2, '{
  "pode_treinar": true,
  "pode_usar_feed": true,
  "pode_usar_loja": true,
  "pode_escanear_qr_aula": true,
  "pode_ver_ranking": true,
  "pode_ver_relatorios_financeiros": true,
  "pode_ver_assinaturas": true,
  "pode_ver_inadimplencia": true,
  "pode_ver_vendas_loja": true,
  "pode_gerar_cobrancas": true
}'::jsonb),
('Dono', 'dono', 'Acesso total administrativo', true, 10, '{
  "pode_treinar": true,
  "pode_usar_feed": true,
  "pode_usar_loja": true,
  "pode_escanear_qr_aula": true,
  "pode_escanear_catraca": true,
  "pode_ver_ranking": true,
  "pode_ver_conquistas": true,
  "pode_enviar_dm": true,
  "pode_postar_feed": true,
  "pode_ver_admin": true,
  "pode_cadastrar_usuarios": true,
  "pode_atribuir_cargos": true,
  "pode_criar_cargos": true,
  "pode_criar_modalidades": true,
  "pode_ver_relatorios_financeiros": true,
  "pode_ver_relatorios_frequencia": true,
  "pode_gerenciar_catracas": true,
  "pode_gerenciar_loja": true,
  "pode_moderar_feed": true,
  "pode_deletar_post": true,
  "pode_banir_usuario_feed": true,
  "pode_ver_denuncias": true,
  "pode_gerenciar_unidades": true
}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 2. MODALIDADES DE AULA
-- ============================================
CREATE TABLE IF NOT EXISTS modalidades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descricao TEXT,
  icone TEXT,
  pontos_aula_completa INT DEFAULT 150,
  ativa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed de modalidades
INSERT INTO modalidades (nome, slug, descricao, icone, pontos_aula_completa) VALUES
('Dança', 'danca', 'Aulas de dança e ritmos', '💃', 150),
('Abdominal', 'abdominal', 'Aulas focadas em core e abdômen', '🔥', 120),
('Funcional', 'funcional', 'Treino funcional e mobilidade', '⚡', 150),
('Spinning', 'spinning', 'Ciclismo indoor de alta intensidade', '🚴', 180),
('Muay Thai', 'muay_thai', 'Arte marcial tailandesa', '🥊', 200),
('Yoga', 'yoga', 'Prática de yoga e meditação', '🧘', 100),
('HIIT', 'hiit', 'Treino intervalado de alta intensidade', '💪', 170),
('Alongamento', 'alongamento', 'Sessão de flexibilidade', '🤸', 80)
ON CONFLICT (slug) DO NOTHING;

-- Cargos de professor por modalidade
INSERT INTO cargos (nome, slug, descricao, pode_trocar_modo, modalidade, ordem, permissoes)
SELECT
  'Professor de ' || m.nome,
  'professor_' || m.slug,
  'Professor de ' || m.nome || ' — gerencia aulas de ' || lower(m.nome),
  true,
  m.slug,
  3,
  jsonb_build_object(
    'pode_treinar', true,
    'pode_usar_feed', true,
    'pode_usar_loja', true,
    'pode_escanear_qr_aula', true,
    'pode_escanear_catraca', true,
    'pode_ver_ranking', true,
    'pode_ver_conquistas', true,
    'pode_enviar_dm', true,
    'pode_postar_feed', true,
    'pode_criar_aula_coletiva', true,
    'pode_gerar_qr_aula', true,
    'pode_ver_lista_presenca', true,
    'pode_remover_aluno_da_aula', true,
    'pode_finalizar_aula', true,
    'pode_ver_historico_suas_aulas', true,
    'modalidades_permitidas', jsonb_build_array(m.slug)
  )
FROM modalidades m
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 3. SESSÕES DE AULA (QR Code)
-- ============================================
CREATE TABLE IF NOT EXISTS aula_sessoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  modalidade_id UUID REFERENCES modalidades(id) NOT NULL,
  professor_id UUID REFERENCES users(id) NOT NULL,
  unidade_id UUID REFERENCES units(id),
  qr_token TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_andamento', 'finalizada', 'cancelada')),
  horario_inicio TIMESTAMPTZ,
  horario_fim TIMESTAMPTZ,
  janela_qr_minutos INT DEFAULT 10,
  max_alunos INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. PRESENÇA EM AULA
-- ============================================
CREATE TABLE IF NOT EXISTS aula_presencas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sessao_id UUID REFERENCES aula_sessoes(id) NOT NULL,
  aluno_id UUID REFERENCES users(id) NOT NULL,
  escaneou_at TIMESTAMPTZ DEFAULT NOW(),
  removido BOOLEAN DEFAULT FALSE,
  removido_at TIMESTAMPTZ,
  removido_motivo TEXT,
  pontos_concedidos INT DEFAULT 0,
  presente_no_fim BOOLEAN DEFAULT FALSE,
  UNIQUE(sessao_id, aluno_id)
);

-- ============================================
-- 5. LOJA DA ACADEMIA
-- ============================================
CREATE TABLE IF NOT EXISTS loja_categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icone TEXT,
  ordem INT DEFAULT 0,
  ativa BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS loja_produtos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria_id UUID REFERENCES loja_categorias(id),
  nome TEXT NOT NULL,
  descricao TEXT,
  preco DECIMAL(10,2) NOT NULL,
  imagem_url TEXT,
  variacoes JSONB DEFAULT '[]',
  estoque INT,
  ativo BOOLEAN DEFAULT TRUE,
  destaque BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loja_pedidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  itens JSONB NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'preparando', 'pronto', 'entregue', 'cancelado')),
  metodo_pagamento TEXT,
  asaas_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed categorias loja
INSERT INTO loja_categorias (nome, slug, icone, ordem) VALUES
('Açaí Bony', 'acai', '🍇', 1),
('Polpas Bony', 'polpas', '🥤', 2),
('Suplementos', 'suplementos', '💊', 3),
('Vestuário', 'vestuario', '👕', 4),
('Acessórios', 'acessorios', '🎒', 5)
ON CONFLICT (slug) DO NOTHING;

-- Seed produtos
INSERT INTO loja_produtos (categoria_id, nome, descricao, preco, variacoes, destaque) VALUES
((SELECT id FROM loja_categorias WHERE slug='acai'), 'Açaí Bony 500ml', 'Açaí premium da casa com banana e granola', 18.90, '[{"nome": "Complemento", "opcoes": ["Leite ninho", "Paçoca", "Morango", "Nutella"]}]', true),
((SELECT id FROM loja_categorias WHERE slug='acai'), 'Açaí Bony 300ml', 'Açaí premium da casa tamanho individual', 14.90, '[{"nome": "Complemento", "opcoes": ["Leite ninho", "Paçoca", "Morango"]}]', false),
((SELECT id FROM loja_categorias WHERE slug='polpas'), 'Polpa Pré-Treino', 'Polpa energética com guaraná e açaí', 12.90, '[]', true),
((SELECT id FROM loja_categorias WHERE slug='polpas'), 'Polpa Pós-Treino', 'Polpa proteica com whey e banana', 15.90, '[]', false),
((SELECT id FROM loja_categorias WHERE slug='suplementos'), 'Whey Protein 900g', 'Whey protein concentrado sabor chocolate', 129.90, '[{"nome": "Sabor", "opcoes": ["Chocolate", "Baunilha", "Morango"]}]', true),
((SELECT id FROM loja_categorias WHERE slug='suplementos'), 'Creatina 300g', 'Creatina monohidratada pura', 89.90, '[]', false),
((SELECT id FROM loja_categorias WHERE slug='suplementos'), 'BCAA 120 cápsulas', 'Aminoácidos de cadeia ramificada', 59.90, '[]', false),
((SELECT id FROM loja_categorias WHERE slug='vestuario'), 'Camiseta Bony Fit', 'Camiseta dry-fit exclusiva Bony Fit', 69.90, '[{"nome": "Tamanho", "opcoes": ["P", "M", "G", "GG"]}]', true),
((SELECT id FROM loja_categorias WHERE slug='vestuario'), 'Regata Bony Fit', 'Regata dry-fit para treino', 59.90, '[{"nome": "Tamanho", "opcoes": ["P", "M", "G", "GG"]}]', false),
((SELECT id FROM loja_categorias WHERE slug='acessorios'), 'Mochila Bony Fit', 'Mochila esportiva com compartimento para tênis', 149.90, '[]', true),
((SELECT id FROM loja_categorias WHERE slug='acessorios'), 'Squeeze 1L', 'Squeeze exclusivo Bony Fit', 39.90, '[{"nome": "Cor", "opcoes": ["Preto", "Laranja", "Branco"]}]', false),
((SELECT id FROM loja_categorias WHERE slug='acessorios'), 'Luva de Treino', 'Luva de musculação com proteção de pulso', 49.90, '[{"nome": "Tamanho", "opcoes": ["P", "M", "G"]}]', false);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_cargo ON users(cargo_slug);
CREATE INDEX IF NOT EXISTS idx_aula_sessoes_professor ON aula_sessoes(professor_id);
CREATE INDEX IF NOT EXISTS idx_aula_sessoes_status ON aula_sessoes(status);
CREATE INDEX IF NOT EXISTS idx_aula_presencas_sessao ON aula_presencas(sessao_id);
CREATE INDEX IF NOT EXISTS idx_aula_presencas_aluno ON aula_presencas(aluno_id);
CREATE INDEX IF NOT EXISTS idx_loja_produtos_categoria ON loja_produtos(categoria_id);

-- ============================================
-- RLS
-- ============================================
ALTER TABLE cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE modalidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE aula_sessoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE aula_presencas ENABLE ROW LEVEL SECURITY;
ALTER TABLE loja_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE loja_categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cargos_select" ON cargos FOR SELECT USING (true);
CREATE POLICY "modalidades_select" ON modalidades FOR SELECT USING (true);
CREATE POLICY "loja_categorias_select" ON loja_categorias FOR SELECT USING (true);
CREATE POLICY "loja_produtos_select" ON loja_produtos FOR SELECT USING (ativo = true);
CREATE POLICY "aula_sessoes_select" ON aula_sessoes FOR SELECT USING (true);
CREATE POLICY "aula_sessoes_insert" ON aula_sessoes FOR INSERT WITH CHECK (professor_id = auth.uid());
CREATE POLICY "aula_sessoes_update" ON aula_sessoes FOR UPDATE USING (professor_id = auth.uid());
CREATE POLICY "aula_presencas_select" ON aula_presencas FOR SELECT USING (
  aluno_id = auth.uid() OR
  sessao_id IN (SELECT id FROM aula_sessoes WHERE professor_id = auth.uid())
);
CREATE POLICY "aula_presencas_insert" ON aula_presencas FOR INSERT WITH CHECK (aluno_id = auth.uid());
CREATE POLICY "aula_presencas_update" ON aula_presencas FOR UPDATE USING (
  sessao_id IN (SELECT id FROM aula_sessoes WHERE professor_id = auth.uid())
);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE aula_presencas;
ALTER PUBLICATION supabase_realtime ADD TABLE aula_sessoes;
