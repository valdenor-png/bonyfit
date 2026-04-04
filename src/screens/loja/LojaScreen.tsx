import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, spacing, radius } from '../../tokens';
import type { LojaProduto, LojaCategoria } from '../../types/cargo';
import Button from '../../components/Button';

// --- MOCK DATA ---

const CATEGORIES: LojaCategoria[] = [
  { id: 'all', nome: 'Todos', slug: 'todos', icone: null, ordem: 0 },
  { id: 'cat1', nome: 'Acai Bony', slug: 'acai', icone: '🍇', ordem: 1 },
  { id: 'cat2', nome: 'Polpas', slug: 'polpas', icone: '🥤', ordem: 2 },
  { id: 'cat3', nome: 'Suplementos', slug: 'suplementos', icone: '💊', ordem: 3 },
  { id: 'cat4', nome: 'Vestuario', slug: 'vestuario', icone: '👕', ordem: 4 },
  { id: 'cat5', nome: 'Acessorios', slug: 'acessorios', icone: '🎒', ordem: 5 },
];

const PRODUCTS: LojaProduto[] = [
  { id: 'p1', categoria_id: 'cat1', nome: 'Acai Bony 500ml', descricao: 'Acai puro da Amazonia, sem adicao de acucar. Fonte natural de energia e antioxidantes.', preco: 18.90, imagem_url: null, variacoes: [{ nome: 'Tamanho', opcoes: ['300ml', '500ml', '1L'] }], estoque: 50, ativo: true, destaque: true, categoria_nome: 'Acai Bony', categoria_icone: '🍇' },
  { id: 'p2', categoria_id: 'cat1', nome: 'Acai Bony Premium', descricao: 'Acai premium com guarana e banana. Blend energetico perfeito para o pos-treino.', preco: 24.90, imagem_url: null, variacoes: [{ nome: 'Tamanho', opcoes: ['500ml', '1L'] }], estoque: 30, ativo: true, destaque: false, categoria_nome: 'Acai Bony', categoria_icone: '🍇' },
  { id: 'p3', categoria_id: 'cat1', nome: 'Acai Bowl Kit', descricao: 'Kit completo para preparar seu acai bowl em casa. Inclui granola, banana chips e mel.', preco: 32.90, imagem_url: null, variacoes: [], estoque: 20, ativo: true, destaque: false, categoria_nome: 'Acai Bony', categoria_icone: '🍇' },
  { id: 'p4', categoria_id: 'cat2', nome: 'Polpa de Cupuacu 400g', descricao: 'Polpa natural de cupuacu. Rica em vitamina C e fibras.', preco: 14.90, imagem_url: null, variacoes: [], estoque: 40, ativo: true, destaque: false, categoria_nome: 'Polpas', categoria_icone: '🥤' },
  { id: 'p5', categoria_id: 'cat2', nome: 'Mix Polpas Detox', descricao: 'Blend de polpas verdes: couve, espinafre, gengibre e limao. Ideal para detox matinal.', preco: 19.90, imagem_url: null, variacoes: [{ nome: 'Sabor', opcoes: ['Verde', 'Tropical', 'Frutas Vermelhas'] }], estoque: 25, ativo: true, destaque: true, categoria_nome: 'Polpas', categoria_icone: '🥤' },
  { id: 'p6', categoria_id: 'cat3', nome: 'Whey Protein 900g', descricao: 'Whey protein concentrado sabor chocolate. 25g de proteina por dose.', preco: 129.90, imagem_url: null, variacoes: [{ nome: 'Sabor', opcoes: ['Chocolate', 'Baunilha', 'Morango'] }], estoque: 15, ativo: true, destaque: true, categoria_nome: 'Suplementos', categoria_icone: '💊' },
  { id: 'p7', categoria_id: 'cat3', nome: 'Creatina 300g', descricao: 'Creatina monohidratada pura. Melhora a performance e ganho de forca.', preco: 89.90, imagem_url: null, variacoes: [], estoque: 20, ativo: true, destaque: false, categoria_nome: 'Suplementos', categoria_icone: '💊' },
  { id: 'p8', categoria_id: 'cat3', nome: 'Pre-Treino Bony Boost', descricao: 'Pre-treino com cafeina, beta-alanina e citrulina. Energia e foco para seu treino.', preco: 79.90, imagem_url: null, variacoes: [{ nome: 'Sabor', opcoes: ['Frutas Tropicais', 'Limao', 'Uva'] }], estoque: 18, ativo: true, destaque: false, categoria_nome: 'Suplementos', categoria_icone: '💊' },
  { id: 'p9', categoria_id: 'cat4', nome: 'Camiseta Bony Fit', descricao: 'Camiseta dry-fit com logo Bony Fit. Tecido respiravel e leve.', preco: 59.90, imagem_url: null, variacoes: [{ nome: 'Tamanho', opcoes: ['P', 'M', 'G', 'GG'] }], estoque: 35, ativo: true, destaque: false, categoria_nome: 'Vestuario', categoria_icone: '👕' },
  { id: 'p10', categoria_id: 'cat4', nome: 'Regata Treino', descricao: 'Regata masculina para treino. Tecido tecnologico com protecao UV.', preco: 49.90, imagem_url: null, variacoes: [{ nome: 'Tamanho', opcoes: ['P', 'M', 'G', 'GG'] }], estoque: 28, ativo: true, destaque: false, categoria_nome: 'Vestuario', categoria_icone: '👕' },
  { id: 'p11', categoria_id: 'cat5', nome: 'Garrafa Bony 1L', descricao: 'Garrafa termica de aco inox. Mantem gelada por ate 24h.', preco: 69.90, imagem_url: null, variacoes: [{ nome: 'Cor', opcoes: ['Preto', 'Laranja', 'Branco'] }], estoque: 22, ativo: true, destaque: true, categoria_nome: 'Acessorios', categoria_icone: '🎒' },
  { id: 'p12', categoria_id: 'cat5', nome: 'Mochila Bony Fit', descricao: 'Mochila esportiva com compartimento para tenis e notebook. Resistente a agua.', preco: 149.90, imagem_url: null, variacoes: [], estoque: 10, ativo: true, destaque: false, categoria_nome: 'Acessorios', categoria_icone: '🎒' },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = spacing.sm;
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - CARD_GAP) / 2;

// --- COMPONENT ---

interface Props {
  navigation?: any;
}

export default function LojaScreen({ navigation }: Props) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<{ product: LojaProduto; qty: number; variation?: string }[]>([]);
  const [detailProduct, setDetailProduct] = useState<LojaProduto | null>(null);
  const [detailQty, setDetailQty] = useState(1);
  const [detailVariation, setDetailVariation] = useState<Record<string, string>>({});

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const filteredProducts =
    selectedCategory === 'all'
      ? PRODUCTS
      : PRODUCTS.filter((p) => p.categoria_id === selectedCategory);

  const openDetail = (product: LojaProduto) => {
    setDetailProduct(product);
    setDetailQty(1);
    const defaults: Record<string, string> = {};
    product.variacoes.forEach((v) => {
      if (v.opcoes.length > 0) defaults[v.nome] = v.opcoes[0];
    });
    setDetailVariation(defaults);
  };

  const addToCart = () => {
    if (!detailProduct) return;
    const variationStr = Object.values(detailVariation).join(' / ');
    setCart((prev) => [
      ...prev,
      { product: detailProduct, qty: detailQty, variation: variationStr || undefined },
    ]);
    Alert.alert('Adicionado!', `${detailProduct.nome} x${detailQty} no carrinho.`);
    setDetailProduct(null);
  };

  const gradientForCategory = (emoji: string | undefined): [string, string] => {
    switch (emoji) {
      case '🍇': return ['#4A1A6B', '#7B2D8E'];
      case '🥤': return ['#1A5C3A', '#2E8B57'];
      case '💊': return ['#1A3A5C', '#2E5B8B'];
      case '👕': return ['#5C1A1A', '#8B2E2E'];
      case '🎒': return ['#5C4A1A', '#8B6E2E'];
      default: return [colors.elevated, colors.card];
    }
  };

  const renderProduct = useCallback(
    ({ item }: { item: LojaProduto }) => {
      const grad = gradientForCategory(item.categoria_icone);
      return (
        <TouchableOpacity
          style={styles.productCard}
          activeOpacity={0.8}
          onPress={() => openDetail(item)}
        >
          <LinearGradient colors={grad} style={styles.productImage}>
            <Text style={styles.productEmoji}>{item.categoria_icone || '📦'}</Text>
            {item.destaque && (
              <View style={styles.destaqueBadge}>
                <Text style={styles.destaqueBadgeText}>DESTAQUE</Text>
              </View>
            )}
          </LinearGradient>
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>
              {item.nome}
            </Text>
            <Text style={styles.productPrice}>
              R$ {item.preco.toFixed(2).replace('.', ',')}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [],
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Loja Bony Fit</Text>
        <TouchableOpacity style={styles.cartBtn} activeOpacity={0.7}>
          <Text style={styles.cartIcon}>🛒</Text>
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryChips}
      >
        {CATEGORIES.map((cat) => {
          const isSelected = cat.id === selectedCategory;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => setSelectedCategory(cat.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {cat.icone ? `${cat.icone} ${cat.nome}` : cat.nome}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Product grid */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        renderItem={renderProduct}
      />

      {/* Detail modal */}
      <Modal
        visible={detailProduct !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailProduct(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {detailProduct && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Close */}
                <TouchableOpacity
                  style={styles.modalClose}
                  onPress={() => setDetailProduct(null)}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>

                {/* Large image area */}
                <LinearGradient
                  colors={gradientForCategory(detailProduct.categoria_icone)}
                  style={styles.modalImage}
                >
                  <Text style={styles.modalEmoji}>
                    {detailProduct.categoria_icone || '📦'}
                  </Text>
                </LinearGradient>

                {/* Info */}
                <Text style={styles.modalName}>{detailProduct.nome}</Text>
                <Text style={styles.modalPrice}>
                  R$ {detailProduct.preco.toFixed(2).replace('.', ',')}
                </Text>
                {detailProduct.descricao && (
                  <Text style={styles.modalDesc}>{detailProduct.descricao}</Text>
                )}

                {/* Variations */}
                {detailProduct.variacoes.map((v) => (
                  <View key={v.nome} style={styles.variationSection}>
                    <Text style={styles.variationLabel}>{v.nome}</Text>
                    <View style={styles.variationChips}>
                      {v.opcoes.map((opt) => {
                        const isSelected = detailVariation[v.nome] === opt;
                        return (
                          <TouchableOpacity
                            key={opt}
                            style={[
                              styles.variationChip,
                              isSelected && styles.variationChipSelected,
                            ]}
                            onPress={() =>
                              setDetailVariation((prev) => ({ ...prev, [v.nome]: opt }))
                            }
                          >
                            <Text
                              style={[
                                styles.variationChipText,
                                isSelected && styles.variationChipTextSelected,
                              ]}
                            >
                              {opt}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))}

                {/* Quantity */}
                <View style={styles.qtyRow}>
                  <Text style={styles.qtyLabel}>Quantidade</Text>
                  <View style={styles.qtyStepper}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => setDetailQty((q) => Math.max(1, q - 1))}
                    >
                      <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyValue}>{detailQty}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => setDetailQty((q) => q + 1)}
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Buy button */}
                <Button title="Comprar" onPress={addToCart} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: spacing.lg,
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
  categoryChips: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  chipSelected: {
    backgroundColor: colors.orange,
  },
  chipText: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
  },
  gridContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: CARD_WIDTH * 0.75,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  productEmoji: {
    fontSize: 40,
  },
  destaqueBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.orange,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  destaqueBadgeText: {
    fontSize: 9,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    letterSpacing: 0.5,
  },
  productInfo: {
    padding: spacing.md,
  },
  productName: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  productPrice: {
    fontSize: 15,
    fontFamily: fonts.numbersBold,
    color: colors.orange,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalClose: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  modalCloseText: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.textSecondary,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  modalEmoji: {
    fontSize: 64,
  },
  modalName: {
    fontSize: 20,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  modalPrice: {
    fontSize: 24,
    fontFamily: fonts.numbersExtraBold,
    color: colors.orange,
    marginBottom: spacing.md,
  },
  modalDesc: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  variationSection: {
    marginBottom: spacing.lg,
  },
  variationLabel: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  variationChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  variationChip: {
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.elevated,
  },
  variationChipSelected: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  variationChipText: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
  },
  variationChipTextSelected: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  qtyLabel: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  qtyStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.elevated,
  },
  qtyBtnText: {
    fontSize: 20,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  qtyValue: {
    minWidth: 44,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: fonts.numbersBold,
    color: colors.text,
  },
});
