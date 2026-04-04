import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';

// ─── TYPES ──────────────────────────────────────────────
interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  bought: boolean;
}

interface Category {
  key: string;
  icon: string;
  name: string;
  items: ShoppingItem[];
  expanded: boolean;
}

// ─── INITIAL DATA ───────────────────────────────────────
const INITIAL_CATEGORIES: Category[] = [
  {
    key: 'proteinas',
    icon: '🥩',
    name: 'Proteínas',
    expanded: true,
    items: [
      { id: 'p1', name: 'Peito de frango', quantity: '1.5 kg', bought: false },
      { id: 'p2', name: 'Ovos', quantity: '30 un', bought: false },
      { id: 'p3', name: 'Atum em lata', quantity: '4 un', bought: false },
      { id: 'p4', name: 'Whey protein', quantity: '1 pote', bought: false },
    ],
  },
  {
    key: 'carboidratos',
    icon: '🍚',
    name: 'Carboidratos',
    expanded: true,
    items: [
      { id: 'c1', name: 'Arroz integral', quantity: '2 kg', bought: false },
      { id: 'c2', name: 'Batata doce', quantity: '1.5 kg', bought: false },
      { id: 'c3', name: 'Aveia', quantity: '500 g', bought: false },
      { id: 'c4', name: 'Pão integral', quantity: '1 pct', bought: false },
    ],
  },
  {
    key: 'vegetais',
    icon: '🥗',
    name: 'Vegetais',
    expanded: true,
    items: [
      { id: 'v1', name: 'Brócolis', quantity: '500 g', bought: false },
      { id: 'v2', name: 'Espinafre', quantity: '300 g', bought: false },
      { id: 'v3', name: 'Tomate', quantity: '1 kg', bought: false },
      { id: 'v4', name: 'Cebola', quantity: '500 g', bought: false },
    ],
  },
  {
    key: 'frutas',
    icon: '🍌',
    name: 'Frutas',
    expanded: true,
    items: [
      { id: 'f1', name: 'Banana', quantity: '1 cacho', bought: false },
      { id: 'f2', name: 'Maçã', quantity: '6 un', bought: false },
      { id: 'f3', name: 'Morango', quantity: '300 g', bought: false },
      { id: 'f4', name: 'Limão', quantity: '6 un', bought: false },
    ],
  },
  {
    key: 'outros',
    icon: '🥜',
    name: 'Outros',
    expanded: true,
    items: [
      { id: 'o1', name: 'Azeite', quantity: '500 ml', bought: false },
      { id: 'o2', name: 'Castanhas', quantity: '200 g', bought: false },
      { id: 'o3', name: 'Pasta de amendoim', quantity: '500 g', bought: false },
    ],
  },
];

// ─── COMPONENT ──────────────────────────────────────────
export default function ListaComprasScreen({ navigation }: any) {
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);

  const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0);
  const boughtItems = categories.reduce(
    (sum, cat) => sum + cat.items.filter((i) => i.bought).length,
    0
  );
  const progress = totalItems > 0 ? boughtItems / totalItems : 0;

  const toggleItem = (categoryKey: string, itemId: string) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.key !== categoryKey) return cat;
        return {
          ...cat,
          items: cat.items.map((item) =>
            item.id === itemId ? { ...item, bought: !item.bought } : item
          ),
        };
      })
    );
  };

  const toggleCategory = (categoryKey: string) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.key === categoryKey ? { ...cat, expanded: !cat.expanded } : cat
      )
    );
  };

  const clearBought = () => {
    Alert.alert('Limpar marcados', 'Desmarcar todos os itens comprados?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Limpar',
        onPress: () => {
          setCategories((prev) =>
            prev.map((cat) => ({
              ...cat,
              items: cat.items.map((item) => ({ ...item, bought: false })),
            }))
          );
        },
      },
    ]);
  };

  const handleShare = async () => {
    const lines: string[] = ['Lista de Compras - Bony Fit\n'];
    categories.forEach((cat) => {
      lines.push(`${cat.icon} ${cat.name}`);
      cat.items.forEach((item) => {
        const check = item.bought ? '✅' : '⬜';
        lines.push(`  ${check} ${item.name} — ${item.quantity}`);
      });
      lines.push('');
    });
    lines.push(`${boughtItems}/${totalItems} itens comprados`);

    try {
      await Share.share({ message: lines.join('\n') });
    } catch {
      Alert.alert('Erro', 'Não foi possível compartilhar a lista.');
    }
  };

  const sortedItems = (items: ShoppingItem[]) => {
    return [...items].sort((a, b) => {
      if (a.bought === b.bought) return 0;
      return a.bought ? 1 : -1;
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack?.()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lista de Compras</Text>
        <View style={styles.backButton} />
      </View>

      {/* Subtitle */}
      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>
          Baseado no seu plano alimentar da semana
        </Text>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            {boughtItems}/{totalItems} itens comprados
          </Text>
          <Text style={styles.progressPercent}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%` },
            ]}
          />
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {categories.map((category) => (
          <View key={category.key} style={styles.categoryContainer}>
            <TouchableOpacity
              style={styles.categoryHeader}
              onPress={() => toggleCategory(category.key)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryCount}>
                {category.items.filter((i) => i.bought).length}/{category.items.length}
              </Text>
              <Text style={styles.categoryChevron}>
                {category.expanded ? '▾' : '▸'}
              </Text>
            </TouchableOpacity>

            {category.expanded && (
              <View style={styles.itemsList}>
                {sortedItems(category.items).map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.itemRow}
                    onPress={() => toggleItem(category.key, item.id)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        item.bought && styles.checkboxChecked,
                      ]}
                    >
                      {item.bought && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.itemName,
                        item.bought && styles.itemNameBought,
                      ]}
                    >
                      {item.name}
                    </Text>
                    <Text
                      style={[
                        styles.itemQuantity,
                        item.bought && styles.itemQuantityBought,
                      ]}
                    >
                      {item.quantity}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Bottom Buttons */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={styles.shareButtonContainer}
            onPress={handleShare}
          >
            <Text style={styles.shareButtonText}>Compartilhar lista</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.clearButtonContainer}
            onPress={clearBought}
          >
            <Text style={styles.clearButtonText}>Limpar marcados</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ─────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: colors.text,
    fontSize: 20,
    fontFamily: fonts.bodyBold,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontFamily: fonts.bodyBold,
  },
  subtitleContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.body,
    textAlign: 'center',
  },
  progressContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
  },
  progressPercent: {
    color: colors.orange,
    fontSize: 14,
    fontFamily: fonts.numbersBold,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.elevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.orange,
    borderRadius: 3,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },
  categoryContainer: {
    marginBottom: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  categoryIcon: {
    fontSize: 22,
  },
  categoryName: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.bodyBold,
  },
  categoryCount: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.numbersBold,
    marginRight: spacing.sm,
  },
  categoryChevron: {
    color: colors.textMuted,
    fontSize: 16,
  },
  itemsList: {
    borderTopWidth: 1,
    borderTopColor: colors.elevated,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.elevated,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  checkmark: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.bodyBold,
  },
  itemName: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.body,
  },
  itemNameBought: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  itemQuantity: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
  },
  itemQuantityBought: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  shareButtonContainer: {
    flex: 1,
    backgroundColor: colors.orange,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  shareButtonText: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.bodyBold,
  },
  clearButtonContainer: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  clearButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.bodyBold,
  },
  bottomSpacer: {
    height: 40,
  },
});
