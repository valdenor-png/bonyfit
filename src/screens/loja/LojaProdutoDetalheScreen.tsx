import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors, fonts, spacing } from '../../tokens';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useLojaStore } from '../../stores/lojaStore';
import { ALL_PRODUCTS, CATEGORIAS } from './LojaScreen';
import type { ProdutoVariacao } from './LojaScreen';

const formatPrice = (centavos: number) =>
  'R$ ' + (centavos / 100).toFixed(2).replace('.', ',');

interface Props {
  navigation?: any;
  route?: any;
}

export default function LojaProdutoDetalheScreen({ navigation, route }: Props) {
  const produtoId: string = route?.params?.produtoId ?? '';
  const produto = ALL_PRODUCTS.find((p) => p.id === produtoId);
  const categoria = produto
    ? CATEGORIAS.find((c) => c.id === produto.categoriaId)
    : null;

  const { user } = useAuth();
  const addToCart = useLojaStore((s) => s.addToCart);

  const [selectedVariation, setSelectedVariation] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);

  // Load favorite status from Supabase
  useEffect(() => {
    if (!user || !produtoId) return;
    (async () => {
      try {
        const { data } = await supabase
          .from('loja_favoritos')
          .select('produto_id')
          .eq('usuario_id', user.id)
          .eq('produto_id', produtoId)
          .maybeSingle();
        setFavorited(!!data);
      } catch (error) {
        console.error('Error loading favorite:', error);
      }
    })();
  }, [user, produtoId]);

  const toggleFavorite = useCallback(async () => {
    if (!user) {
      setFavorited(!favorited);
      return;
    }

    const newFav = !favorited;
    setFavorited(newFav);

    try {
      if (newFav) {
        await supabase.from('loja_favoritos').insert({
          usuario_id: user.id,
          produto_id: produtoId,
        });
      } else {
        await supabase
          .from('loja_favoritos')
          .delete()
          .eq('usuario_id', user.id)
          .eq('produto_id', produtoId);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setFavorited(!newFav); // revert
    }
  }, [user, produtoId, favorited]);

  if (!produto) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation?.goBack()}
            activeOpacity={0.7}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Produto nao encontrado</Text>
        </View>
      </View>
    );
  }

  const currentVariation: ProdutoVariacao | undefined =
    produto.variacoes[selectedVariation];
  const currentPrice =
    currentVariation?.preco_centavos ?? produto.preco_centavos;

  const handleAddToCart = () => {
    addToCart({
      produtoId: produto.id,
      variacaoId: currentVariation ? String(selectedVariation) : null,
      variacaoNome: currentVariation?.nome ?? '',
      nome: produto.nome,
      precoUnitarioCentavos: currentPrice,
      imagemUrl: null,
    });
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1500);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation?.goBack()}
          activeOpacity={0.7}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Image area */}
        <View style={styles.imageArea}>
          <Text style={styles.imageEmoji}>{produto.emoji}</Text>
        </View>

        {/* Name & category */}
        <Text style={styles.productName}>{produto.nome}</Text>
        {categoria && (
          <Text style={styles.categoryName}>{categoria.nome}</Text>
        )}

        {/* Price */}
        <Text style={styles.productPrice}>{formatPrice(currentPrice)}</Text>

        {/* Description */}
        <Text style={styles.description}>{produto.descricao}</Text>

        {/* Variations */}
        {produto.variacoes.length > 0 && (
          <View style={styles.variationsSection}>
            <Text style={styles.variationsTitle}>OPCOES</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.variationsRow}
            >
              {produto.variacoes.map((v, index) => {
                const isSelected = index === selectedVariation;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.variationChip,
                      isSelected && styles.variationChipSelected,
                    ]}
                    onPress={() => setSelectedVariation(index)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.variationChipText,
                        isSelected && styles.variationChipTextSelected,
                      ]}
                    >
                      {v.nome}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Bottom row */}
      <View style={styles.bottomRow}>
        <TouchableOpacity
          style={styles.heartBtn}
          onPress={toggleFavorite}
          activeOpacity={0.7}
        >
          <Text style={styles.heartEmoji}>
            {favorited ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.addBtn, addedFeedback && styles.addBtnFeedback]}
          onPress={handleAddToCart}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>
            {addedFeedback ? 'Adicionado!' : '🛒 Adicionar'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 54,
    paddingBottom: spacing.md,
  },
  backBtn: {
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
  },
  backText: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.orange,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: 16,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 120,
  },
  imageArea: {
    width: '100%',
    height: 200,
    backgroundColor: '#161616',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  imageEmoji: {
    fontSize: 72,
  },
  productName: {
    fontSize: 18,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
    color: colors.orange,
    marginBottom: spacing.md,
  },
  productPrice: {
    fontSize: 24,
    fontFamily: fonts.numbersExtraBold,
    color: colors.orange,
    marginBottom: spacing.lg,
  },
  description: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.xxl,
  },
  variationsSection: {
    marginBottom: spacing.xxl,
  },
  variationsTitle: {
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  variationsRow: {
    gap: spacing.sm,
  },
  variationChip: {
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  variationChipSelected: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  variationChipText: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: '#999999',
  },
  variationChipTextSelected: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
  },
  bottomRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: 34,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    gap: spacing.md,
  },
  heartBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  heartEmoji: {
    fontSize: 18,
  },
  addBtn: {
    flex: 1,
    height: 48,
    backgroundColor: colors.orange,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnFeedback: {
    backgroundColor: colors.success,
  },
  addBtnText: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
});
