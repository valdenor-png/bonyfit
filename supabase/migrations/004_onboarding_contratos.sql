-- ============================================
-- BONY FIT — ONBOARDING, CONTRATOS, PLANOS
-- Migration 004
-- ============================================

-- Questionário de saúde (PAR-Q)
CREATE TABLE IF NOT EXISTS questionario_saude (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  respostas JSONB NOT NULL,
  requer_atestado BOOLEAN DEFAULT FALSE,
  atestado_entregue BOOLEAN DEFAULT FALSE,
  atestado_url TEXT,
  preenchido_por TEXT DEFAULT 'app',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template do contrato (editável pelo dono)
CREATE TABLE IF NOT EXISTS contrato_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  versao TEXT NOT NULL UNIQUE,
  titulo TEXT NOT NULL,
  texto TEXT NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  criado_por UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contratos assinados
CREATE TABLE IF NOT EXISTS contratos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  versao_contrato TEXT NOT NULL,
  texto_contrato TEXT NOT NULL,
  assinatura_url TEXT NOT NULL,
  ip_dispositivo TEXT,
  dispositivo_info TEXT,
  assinado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metodo TEXT DEFAULT 'app',
  link_assinatura TEXT,
  link_expira_em TIMESTAMPTZ,
  link_usado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Planos disponíveis
CREATE TABLE IF NOT EXISTS planos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco_centavos INT NOT NULL,
  duracao_dias INT NOT NULL,
  beneficios JSONB,
  ativo BOOLEAN DEFAULT TRUE,
  destaque BOOLEAN DEFAULT FALSE,
  ordem INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assinaturas
CREATE TABLE IF NOT EXISTS assinaturas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  plano_id UUID REFERENCES planos(id) NOT NULL,
  status TEXT DEFAULT 'pendente_pagamento',
  data_inicio DATE,
  data_fim DATE,
  asaas_subscription_id TEXT,
  metodo_pagamento TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campos adicionais no users
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completo BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS requer_atestado_medico BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS catraca_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS catraca_vinculada BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cadastrado_via TEXT DEFAULT 'app';
ALTER TABLE users ADD COLUMN IF NOT EXISTS cadastrado_por UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS data_nascimento DATE;

-- Seed template de contrato
INSERT INTO contrato_templates (versao, titulo, texto, ativo) VALUES
('v1.0', 'Contrato de Prestação de Serviços — Bony Fit Academias',
'CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE ATIVIDADE FÍSICA

BONY FIT ACADEMIAS LTDA, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº XX.XXX.XXX/0001-XX, com sede em Castanhal/PA, doravante denominada CONTRATADA;

E o(a) Sr(a). {nome}, inscrito(a) no CPF sob o nº {cpf}, doravante denominado(a) CONTRATANTE.

CLÁUSULA 1ª — DO OBJETO
O presente contrato tem por objeto a prestação de serviços de atividade física orientada nas dependências da rede Bony Fit Academias, conforme plano escolhido pelo CONTRATANTE.

CLÁUSULA 2ª — DO PLANO E VALOR
O CONTRATANTE optou pelo plano {plano}, no valor de {valor}, com vigência de {duracao} dias a partir da data de ativação do acesso.

CLÁUSULA 3ª — DA COBRANÇA RECORRENTE
O CONTRATANTE autoriza a cobrança recorrente no método de pagamento escolhido (PIX, cartão de crédito ou boleto bancário). O valor será debitado automaticamente a cada ciclo de faturamento.

CLÁUSULA 4ª — DO ACESSO
O acesso às dependências da academia será realizado mediante validação na catraca de reconhecimento. O CONTRATANTE compromete-se a manter seus dados cadastrais atualizados.

CLÁUSULA 5ª — DAS OBRIGAÇÕES DO CONTRATANTE
a) Utilizar os equipamentos de forma adequada e seguir orientações dos profissionais;
b) Manter a higiene pessoal e dos equipamentos após o uso;
c) Respeitar os demais alunos e funcionários;
d) Portar-se de acordo com as regras internas da academia;
e) Informar qualquer condição de saúde que possa afetar a prática de exercícios.

CLÁUSULA 6ª — DAS OBRIGAÇÕES DA CONTRATADA
a) Disponibilizar estrutura adequada para a prática de atividades físicas;
b) Manter profissionais qualificados durante o horário de funcionamento;
c) Garantir a segurança dos equipamentos;
d) Proteger os dados pessoais do CONTRATANTE conforme LGPD.

CLÁUSULA 7ª — DA SAÚDE E RESPONSABILIDADE
O CONTRATANTE declara ter respondido ao Questionário de Prontidão para Atividade Física (PAR-Q) e assume a veracidade das informações prestadas. A Bony Fit recomenda avaliação médica prévia e não se responsabiliza por lesões decorrentes de uso inadequado dos equipamentos ou omissão de informações de saúde.

CLÁUSULA 8ª — DO CANCELAMENTO
O cancelamento poderá ser solicitado a qualquer momento pelo aplicativo ou presencialmente. O acesso permanecerá ativo até o final do período já pago. Não há reembolso proporcional de mensalidades já pagas.

CLÁUSULA 9ª — DA GAMIFICAÇÃO
O sistema de pontos, ranking e recompensas é de caráter motivacional. Os pontos não possuem valor monetário e podem ser alterados ou descontinuados a critério da CONTRATADA.

CLÁUSULA 10ª — DA PROTEÇÃO DE DADOS (LGPD)
Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), o CONTRATANTE autoriza a coleta e tratamento de seus dados pessoais para:
a) Cadastro e identificação;
b) Controle de acesso via catraca;
c) Cobrança e faturamento;
d) Comunicação sobre serviços e promoções;
e) Gamificação e funcionalidades do aplicativo.

Os dados não serão compartilhados com terceiros sem consentimento, exceto quando exigido por lei. O CONTRATANTE pode solicitar acesso, correção ou exclusão de seus dados a qualquer momento.

CLÁUSULA 11ª — DO FORO
Fica eleito o foro da Comarca de Castanhal — PA para dirimir quaisquer questões oriundas do presente contrato.

Castanhal/PA, {data}.

CONTRATADA: Bony Fit Academias LTDA
CONTRATANTE: {nome} — CPF: {cpf}', true)
ON CONFLICT (versao) DO NOTHING;

-- Seed planos
INSERT INTO planos (nome, descricao, preco_centavos, duracao_dias, beneficios, ativo, destaque, ordem) VALUES
('Mensal', 'Plano mensal com acesso a 1 unidade', 8990, 30, '["Acesso a 1 unidade", "Treinos ilimitados", "App completo", "Aulas coletivas"]'::jsonb, true, false, 1),
('Trimestral', 'Plano trimestral com desconto de 22%', 6990, 90, '["Acesso a 1 unidade", "Treinos ilimitados", "App completo", "Aulas coletivas", "Desconto de 22%"]'::jsonb, true, true, 2),
('Semestral', 'Plano semestral com desconto de 33%', 5990, 180, '["Acesso a todas unidades", "Treinos ilimitados", "App completo", "Aulas coletivas", "Desconto de 33%"]'::jsonb, true, false, 3),
('Anual', 'Plano anual com acesso total e maior economia', 4990, 365, '["Acesso a todas unidades", "Treinos ilimitados", "App completo", "Aulas coletivas", "Desconto de 44%", "Prioridade em aulas"]'::jsonb, true, false, 4)
ON CONFLICT DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_questionario_usuario ON questionario_saude(usuario_id);
CREATE INDEX IF NOT EXISTS idx_contratos_usuario ON contratos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_usuario ON assinaturas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_status ON assinaturas(status);

-- RLS
ALTER TABLE questionario_saude ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contrato_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE assinaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "questionario_select" ON questionario_saude FOR SELECT USING (usuario_id = auth.uid());
CREATE POLICY "questionario_insert" ON questionario_saude FOR INSERT WITH CHECK (usuario_id = auth.uid());
CREATE POLICY "contratos_select" ON contratos FOR SELECT USING (usuario_id = auth.uid());
CREATE POLICY "contratos_insert" ON contratos FOR INSERT WITH CHECK (usuario_id = auth.uid());
CREATE POLICY "templates_select" ON contrato_templates FOR SELECT USING (ativo = true);
CREATE POLICY "planos_select" ON planos FOR SELECT USING (ativo = true);
CREATE POLICY "assinaturas_select" ON assinaturas FOR SELECT USING (usuario_id = auth.uid());
CREATE POLICY "assinaturas_insert" ON assinaturas FOR INSERT WITH CHECK (usuario_id = auth.uid());
