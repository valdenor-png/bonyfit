-- ============================================
-- BONY FIT — LOJA COMPLETA (estilo iFood)
-- Migration 003
-- ============================================

-- Atualizar categorias para apenas 3
DELETE FROM loja_produtos;
DELETE FROM loja_categorias;

INSERT INTO loja_categorias (nome, slug, icone, ordem) VALUES
('Roupas', 'roupas', '👕', 1),
('Suplementos', 'suplementos', '💊', 2),
('Açaí Bone', 'acai_bone', '🍇', 3)
ON CONFLICT (slug) DO UPDATE SET nome = EXCLUDED.nome, icone = EXCLUDED.icone, ordem = EXCLUDED.ordem;

-- Variações dos produtos
CREATE TABLE IF NOT EXISTS loja_variacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID REFERENCES loja_produtos(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  preco_centavos INT,
  estoque INT DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  ordem INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Itens do pedido (detalhado)
CREATE TABLE IF NOT EXISTS loja_pedido_itens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID REFERENCES loja_pedidos(id) ON DELETE CASCADE NOT NULL,
  produto_id UUID REFERENCES loja_produtos(id) NOT NULL,
  variacao_id UUID REFERENCES loja_variacoes(id),
  quantidade INT NOT NULL DEFAULT 1,
  preco_unitario_centavos INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favoritos
CREATE TABLE IF NOT EXISTS loja_favoritos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  produto_id UUID REFERENCES loja_produtos(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, produto_id)
);

-- Usar preco_centavos na tabela de produtos (adicionar coluna se não existe)
ALTER TABLE loja_produtos ADD COLUMN IF NOT EXISTS preco_centavos INT;

-- Seed Roupas
INSERT INTO loja_produtos (categoria_id, nome, descricao, preco, preco_centavos, ativo, destaque, ordem) VALUES
((SELECT id FROM loja_categorias WHERE slug='roupas'), 'Camiseta Bony Fit', 'Camiseta dry-fit exclusiva Bony Fit. Tecido respirável para treinos intensos.', 69.90, 6990, true, true, 1),
((SELECT id FROM loja_categorias WHERE slug='roupas'), 'Regata Bony Fit', 'Regata dry-fit para treino. Conforto e estilo.', 59.90, 5990, true, false, 2),
((SELECT id FROM loja_categorias WHERE slug='roupas'), 'Short Bony Fit', 'Short esportivo com bolso lateral para celular.', 79.90, 7990, true, false, 3),
((SELECT id FROM loja_categorias WHERE slug='roupas'), 'Mochila Bony Fit', 'Mochila esportiva com compartimento para tênis e garrafa.', 149.90, 14990, true, true, 4),
((SELECT id FROM loja_categorias WHERE slug='roupas'), 'Boné Bony Fit', 'Boné aba curva com logo bordado.', 49.90, 4990, true, false, 5),
((SELECT id FROM loja_categorias WHERE slug='roupas'), 'Bolsa Térmica Bony', 'Bolsa térmica para marmita fitness. Mantém por 6h.', 89.90, 8990, true, false, 6);

-- Seed Suplementos
INSERT INTO loja_produtos (categoria_id, nome, descricao, preco, preco_centavos, ativo, destaque, ordem) VALUES
((SELECT id FROM loja_categorias WHERE slug='suplementos'), 'Whey Protein 900g', 'Whey protein concentrado. 25g de proteína por dose.', 129.90, 12990, true, true, 1),
((SELECT id FROM loja_categorias WHERE slug='suplementos'), 'Creatina 300g', 'Creatina monohidratada pura. 60 doses.', 89.90, 8990, true, true, 2),
((SELECT id FROM loja_categorias WHERE slug='suplementos'), 'Pré-Treino 300g', 'Pré-treino com cafeína, beta-alanina e citrulina.', 99.90, 9990, true, false, 3),
((SELECT id FROM loja_categorias WHERE slug='suplementos'), 'BCAA 120 cápsulas', 'Aminoácidos de cadeia ramificada 2:1:1.', 59.90, 5990, true, false, 4),
((SELECT id FROM loja_categorias WHERE slug='suplementos'), 'Glutamina 300g', 'L-Glutamina pura para recuperação muscular.', 69.90, 6990, true, false, 5),
((SELECT id FROM loja_categorias WHERE slug='suplementos'), 'Multivitamínico 60 caps', 'Vitaminas e minerais essenciais para atletas.', 39.90, 3990, true, false, 6);

-- Seed Açaí Bone
INSERT INTO loja_produtos (categoria_id, nome, descricao, preco, preco_centavos, ativo, destaque, ordem) VALUES
((SELECT id FROM loja_categorias WHERE slug='acai_bone'), 'Açaí Bone Puro', 'Açaí puro da Bone. Cremoso e natural, direto de Castanhal.', 18.90, 1890, true, true, 1),
((SELECT id FROM loja_categorias WHERE slug='acai_bone'), 'Açaí Bone Premium', 'Açaí premium com guaraná e banana. Pronto para consumo.', 24.90, 2490, true, true, 2),
((SELECT id FROM loja_categorias WHERE slug='acai_bone'), 'Polpa de Açaí 1kg', 'Polpa de açaí congelada para preparar em casa.', 29.90, 2990, true, false, 3),
((SELECT id FROM loja_categorias WHERE slug='acai_bone'), 'Polpa de Cupuaçu 1kg', 'Polpa de cupuaçu amazônico congelada.', 19.90, 1990, true, false, 4),
((SELECT id FROM loja_categorias WHERE slug='acai_bone'), 'Polpa de Bacaba 1kg', 'Polpa de bacaba congelada. Sabor da Amazônia.', 22.90, 2290, true, false, 5),
((SELECT id FROM loja_categorias WHERE slug='acai_bone'), 'Mix Bone Energia', 'Mix de açaí com guaraná, banana e mel. Pré-treino natural.', 15.90, 1590, true, false, 6);

-- Variações Roupas
INSERT INTO loja_variacoes (produto_id, nome, estoque, ordem)
SELECT p.id, v.nome, 20, v.ordem
FROM loja_produtos p
CROSS JOIN (VALUES ('P', 1), ('M', 2), ('G', 3), ('GG', 4)) AS v(nome, ordem)
WHERE p.categoria_id = (SELECT id FROM loja_categorias WHERE slug='roupas')
AND p.nome NOT LIKE '%Mochila%' AND p.nome NOT LIKE '%Bolsa%';

-- Mochila e Bolsa: tamanho único
INSERT INTO loja_variacoes (produto_id, nome, estoque, ordem)
SELECT p.id, 'Único', 15, 1
FROM loja_produtos p
WHERE p.categoria_id = (SELECT id FROM loja_categorias WHERE slug='roupas')
AND (p.nome LIKE '%Mochila%' OR p.nome LIKE '%Bolsa%' OR p.nome LIKE '%Boné%');

-- Variações Suplementos (sabores)
INSERT INTO loja_variacoes (produto_id, nome, estoque, ordem)
SELECT p.id, v.nome, 30, v.ordem
FROM loja_produtos p
CROSS JOIN (VALUES ('Chocolate', 1), ('Baunilha', 2), ('Morango', 3)) AS v(nome, ordem)
WHERE p.nome LIKE '%Whey%' OR p.nome LIKE '%Pré-Treino%';

-- Suplementos sem sabor: variação única
INSERT INTO loja_variacoes (produto_id, nome, estoque, ordem)
SELECT p.id, 'Natural', 25, 1
FROM loja_produtos p
WHERE p.categoria_id = (SELECT id FROM loja_categorias WHERE slug='suplementos')
AND p.nome NOT LIKE '%Whey%' AND p.nome NOT LIKE '%Pré-Treino%';

-- Variações Açaí (tamanhos)
INSERT INTO loja_variacoes (produto_id, nome, preco_centavos, estoque, ordem)
SELECT p.id, v.nome, v.preco, 50, v.ordem
FROM loja_produtos p
CROSS JOIN (VALUES ('300ml', 1490, 1), ('500ml', NULL, 2), ('1L', 3490, 3)) AS v(nome, preco, ordem)
WHERE p.nome LIKE '%Açaí Bone%';

-- Polpas: variação por peso
INSERT INTO loja_variacoes (produto_id, nome, preco_centavos, estoque, ordem)
SELECT p.id, v.nome, v.preco, 40, v.ordem
FROM loja_produtos p
CROSS JOIN (VALUES ('400g', NULL, 1), ('1kg', NULL, 2), ('2kg', 4990, 3)) AS v(nome, preco, ordem)
WHERE p.nome LIKE '%Polpa%';

-- Mix Bone: tamanho único
INSERT INTO loja_variacoes (produto_id, nome, estoque, ordem)
SELECT p.id, '350ml', 60, 1
FROM loja_produtos p WHERE p.nome LIKE '%Mix Bone%';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_loja_variacoes_produto ON loja_variacoes(produto_id);
CREATE INDEX IF NOT EXISTS idx_loja_pedido_itens_pedido ON loja_pedido_itens(pedido_id);
CREATE INDEX IF NOT EXISTS idx_loja_favoritos_usuario ON loja_favoritos(usuario_id);

-- RLS
ALTER TABLE loja_variacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE loja_pedido_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE loja_favoritos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "variacoes_select" ON loja_variacoes FOR SELECT USING (ativo = true);
CREATE POLICY "pedido_itens_select" ON loja_pedido_itens FOR SELECT USING (
  pedido_id IN (SELECT id FROM loja_pedidos WHERE user_id = auth.uid())
);
CREATE POLICY "favoritos_all" ON loja_favoritos FOR ALL USING (usuario_id = auth.uid());
