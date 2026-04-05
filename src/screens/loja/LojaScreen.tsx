import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors, fonts, spacing } from '../../tokens';
import { useLojaStore } from '../../stores/lojaStore';

// --- HELPERS ---

const formatPrice = (centavos: number) =>
  'R$ ' + (centavos / 100).toFixed(2).replace('.', ',');

// --- TYPES ---

export interface ProdutoVariacao {
  nome: string;
  preco_centavos?: number;
}

export interface Produto {
  id: string;
  nome: string;
  preco_centavos: number;
  descricao: string;
  emoji: string;
  destaque: boolean;
  categoriaId: string;
  variacoes: ProdutoVariacao[];
}

export interface Categoria {
  id: string;
  nome: string;
  emoji: string;
  produtos: Produto[];
}

// --- MOCK DATA ---

const ROUPAS: Produto[] = [
  { id: 'r1', nome: 'Camiseta', preco_centavos: 6990, descricao: 'Camiseta dry-fit Bony Fit com tecido respiravel e leve.', emoji: '👕', destaque: true, categoriaId: 'roupas', variacoes: [{ nome: 'P' }, { nome: 'M' }, { nome: 'G' }, { nome: 'GG' }] },
  { id: 'r2', nome: 'Regata', preco_centavos: 5990, descricao: 'Regata masculina para treino com tecido tecnologico.', emoji: '🦺', destaque: false, categoriaId: 'roupas', variacoes: [{ nome: 'P' }, { nome: 'M' }, { nome: 'G' }] },
  { id: 'r3', nome: 'Short', preco_centavos: 7990, descricao: 'Short esportivo com bolsos laterais e tecido leve.', emoji: '🩳', destaque: false, categoriaId: 'roupas', variacoes: [{ nome: 'P' }, { nome: 'M' }, { nome: 'G' }, { nome: 'GG' }] },
  { id: 'r4', nome: 'Mochila', preco_centavos: 14990, descricao: 'Mochila esportiva resistente a agua com compartimento para tenis.', emoji: '🎒', destaque: true, categoriaId: 'roupas', variacoes: [{ nome: 'Unica' }] },
  { id: 'r5', nome: 'Bone', preco_centavos: 4990, descricao: 'Bone ajustavel com logo Bony Fit bordado.', emoji: '🧢', destaque: false, categoriaId: 'roupas', variacoes: [{ nome: 'Unico' }] },
  { id: 'r6', nome: 'Bolsa Termica', preco_centavos: 8990, descricao: 'Bolsa termica para marmitas com isolamento termico.', emoji: '🧊', destaque: false, categoriaId: 'roupas', variacoes: [{ nome: 'Pequena' }, { nome: 'Grande', preco_centavos: 11990 }] },
];

const SUPLEMENTOS: Produto[] = [
  { id: 's1', nome: 'Whey', preco_centavos: 12990, descricao: 'Whey protein concentrado 900g. 25g de proteina por dose.', emoji: '💪', destaque: true, categoriaId: 'suplementos', variacoes: [{ nome: 'Chocolate' }, { nome: 'Baunilha' }, { nome: 'Morango' }] },
  { id: 's2', nome: 'Creatina', preco_centavos: 8990, descricao: 'Creatina monohidratada pura 300g para performance.', emoji: '⚡', destaque: false, categoriaId: 'suplementos', variacoes: [{ nome: '300g' }, { nome: '500g', preco_centavos: 12990 }] },
  { id: 's3', nome: 'Pre-Treino', preco_centavos: 9990, descricao: 'Pre-treino com cafeina, beta-alanina e citrulina.', emoji: '🔥', destaque: false, categoriaId: 'suplementos', variacoes: [{ nome: 'Frutas' }, { nome: 'Limao' }, { nome: 'Uva' }] },
  { id: 's4', nome: 'BCAA', preco_centavos: 5990, descricao: 'BCAA 2:1:1 em capsulas para recuperacao muscular.', emoji: '💊', destaque: false, categoriaId: 'suplementos', variacoes: [{ nome: '120 caps' }, { nome: '240 caps', preco_centavos: 9990 }] },
  { id: 's5', nome: 'Glutamina', preco_centavos: 6990, descricao: 'Glutamina pura 300g para recuperacao e imunidade.', emoji: '🧬', destaque: false, categoriaId: 'suplementos', variacoes: [{ nome: '300g' }] },
  { id: 's6', nome: 'Multivitaminico', preco_centavos: 3990, descricao: 'Multivitaminico completo com 25 vitaminas e minerais.', emoji: '💎', destaque: false, categoriaId: 'suplementos', variacoes: [{ nome: '60 caps' }, { nome: '120 caps', preco_centavos: 6990 }] },
];

const ACAI: Produto[] = [
  { id: 'a1', nome: 'Acai Puro', preco_centavos: 1890, descricao: 'Acai puro da Amazonia sem adicao de acucar.', emoji: '🍇', destaque: true, categoriaId: 'acai', variacoes: [{ nome: '300ml' }, { nome: '500ml', preco_centavos: 2490 }, { nome: '1L', preco_centavos: 3990 }] },
  { id: 'a2', nome: 'Acai Premium', preco_centavos: 2490, descricao: 'Acai premium com guarana e banana, blend energetico.', emoji: '🫐', destaque: true, categoriaId: 'acai', variacoes: [{ nome: '500ml' }, { nome: '1L', preco_centavos: 3990 }] },
  { id: 'a3', nome: 'Polpa Acai', preco_centavos: 2990, descricao: 'Polpa de acai congelada para preparo em casa.', emoji: '🟣', destaque: false, categoriaId: 'acai', variacoes: [{ nome: '400g' }, { nome: '1kg', preco_centavos: 5990 }] },
  { id: 'a4', nome: 'Polpa Cupuacu', preco_centavos: 1990, descricao: 'Polpa natural de cupuacu rica em vitamina C.', emoji: '🟡', destaque: false, categoriaId: 'acai', variacoes: [{ nome: '400g' }] },
  { id: 'a5', nome: 'Polpa Bacaba', preco_centavos: 2290, descricao: 'Polpa de bacaba, fruta amazonica rica em oleicos.', emoji: '🟤', destaque: false, categoriaId: 'acai', variacoes: [{ nome: '400g' }] },
  { id: 'a6', nome: 'Mix Energia', preco_centavos: 1590, descricao: 'Mix energetico de polpas com guarana natural.', emoji: '🌿', destaque: false, categoriaId: 'acai', variacoes: [{ nome: '300ml' }, { nome: '500ml', preco_centavos: 2190 }] },
];

export const CATEGORIAS: Categoria[] = [
  { id: 'roupas', nome: 'ROUPAS', emoji: '👕', produtos: ROUPAS },
  { id: 'suplementos', nome: 'SUPLEMENTOS', emoji: '💪', produtos: SUPLEMENTOS },
  { id: 'acai', nome: 'ACAI BONE', emoji: '🍇', produtos: ACAI },
];

export const ALL_PRODUCTS: Produto[] = [...ROUPAS, ...SUPLEMENTOS, ...ACAI];

// --- COMPONENTS ---

function ProductCard({
  produto,
  onPress,
}: {
  produto: Produto;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={onPress}>
      <View style={styles.cardImage}>
        <Text style={styles.cardEmoji}>{produto.emoji}</Text>
        {produto.destaque && <View style={styles.destaqueDot} />}
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>
          {produto.nome}
        </Text>
        <Text style={styles.cardPrice}>{formatPrice(produto.preco_centavos)}</Text>
      </View>
    </TouchableOpacity>
  );
}

function CategorySection({
  categoria,
  onVerTodos,
  onProductPress,
}: {
  categoria: Categoria;
  onVerTodos: () => void;
  onProductPress: (produtoId: string) => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{categoria.nome}</Text>
        <TouchableOpacity onPress={onVerTodos} activeOpacity={0.7}>
          <Text style={styles.sectionLink}>Ver todos &gt;</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={categoria.produtos}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={140}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ProductCard
            produto={item}
            onPress={() => onProductPress(item.id)}
          />
        )}
      />
    </View>
  );
}

// --- SCREEN ---

interface Props {
  navigation?: any;
}

export default function LojaScreen({ navigation }: Props) {
  const itemCount = useLojaStore((s) => s.getItemCount());

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Loja Bony</Text>
        <TouchableOpacity style={styles.cartBtn} activeOpacity={0.7} onPress={() => navigation?.navigate('Carrinho')}>
          <Text style={styles.cartIcon}>🛒</Text>
          {itemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Category sections */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORIAS.map((cat) => (
          <CategorySection
            key={cat.id}
            categoria={cat}
            onVerTodos={() =>
              navigation?.navigate('LojaCategoria', {
                categoriaId: cat.id,
                categoriaNome: cat.nome,
              })
            }
            onProductPress={(produtoId) =>
              navigation?.navigate('LojaProdutoDetalhe', { produtoId })
            }
          />
        ))}
      </ScrollView>
    </View>
  );
}

// --- STYLES ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: 54,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  cartBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartIcon: {
    fontSize: 20,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.orange,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    fontSize: 11,
    fontFamily: fonts.numbersBold,
    color: colors.text,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  sectionLink: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.orange,
  },
  listContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  card: {
    width: 130,
    backgroundColor: '#161616',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222222',
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 80,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: {
    fontSize: 32,
  },
  destaqueDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.orange,
  },
  cardInfo: {
    padding: spacing.sm,
  },
  cardName: {
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
    color: colors.text,
    marginBottom: 2,
  },
  cardPrice: {
    fontSize: 14,
    fontFamily: fonts.numbersBold,
    color: colors.orange,
  },
});
