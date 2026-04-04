import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { colors, fonts, spacing } from '../../tokens';
import { CATEGORIAS } from './LojaScreen';
import type { Produto } from './LojaScreen';

const formatPrice = (centavos: number) =>
  'R$ ' + (centavos / 100).toFixed(2).replace('.', ',');

interface Props {
  navigation?: any;
  route?: any;
}

export default function LojaCategoriaScreen({ navigation, route }: Props) {
  const categoriaId: string = route?.params?.categoriaId ?? '';
  const categoriaNome: string = route?.params?.categoriaNome ?? 'Categoria';

  const categoria = CATEGORIAS.find((c) => c.id === categoriaId);
  const produtos = categoria?.produtos ?? [];

  const renderProduct = ({ item }: { item: Produto }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => navigation?.navigate('LojaProdutoDetalhe', { produtoId: item.id })}
    >
      <View style={styles.cardImage}>
        <Text style={styles.cardEmoji}>{item.emoji}</Text>
        {item.destaque && <View style={styles.destaqueDot} />}
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>
          {item.nome}
        </Text>
        <Text style={styles.cardPrice}>{formatPrice(item.preco_centavos)}</Text>
      </View>
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>{categoriaNome}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Grid */}
      <FlatList
        data={produtos}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        renderItem={renderProduct}
      />
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
    justifyContent: 'space-between',
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
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  headerSpacer: {
    width: 70,
  },
  gridContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  card: {
    width: '48%',
    backgroundColor: '#161616',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222222',
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 100,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: {
    fontSize: 40,
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
    padding: spacing.md,
  },
  cardName: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.text,
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: 15,
    fontFamily: fonts.numbersBold,
    color: colors.orange,
  },
});
