import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';

// ─── TYPES ──────────────────────────────────────────────
interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface ScannedProduct {
  name: string;
  brand: string;
  servingSize: string;
  nutrition: NutritionInfo;
}

interface RecentScan {
  id: string;
  name: string;
  calories: number;
}

type ServingOption = '100g' | '1 porção' | '1 unidade';
type MealOption = 'Café' | 'Almoço' | 'Jantar' | 'Lanche';

// ─── MOCK DATA ──────────────────────────────────────────
const MOCK_PRODUCT: ScannedProduct = {
  name: 'Whey Protein Isolado',
  brand: 'Growth Supplements',
  servingSize: '30g',
  nutrition: {
    calories: 120,
    protein: 25,
    carbs: 2,
    fat: 1.5,
  },
};

const RECENT_SCANS: RecentScan[] = [
  { id: '1', name: 'Whey Protein Isolado', calories: 120 },
  { id: '2', name: 'Barra de Cereal Integral', calories: 95 },
  { id: '3', name: 'Iogurte Grego Natural', calories: 140 },
  { id: '4', name: 'Pasta de Amendoim', calories: 188 },
  { id: '5', name: 'Leite Desnatado 200ml', calories: 72 },
];

const SERVING_OPTIONS: ServingOption[] = ['100g', '1 porção', '1 unidade'];
const MEAL_OPTIONS: MealOption[] = ['Café', 'Almoço', 'Jantar', 'Lanche'];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── COMPONENT ──────────────────────────────────────────
interface Props {
  navigation: any;
}

export default function ScannerScreen({ navigation }: Props) {
  const [showProduct, setShowProduct] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedServing, setSelectedServing] = useState<ServingOption>('1 porção');
  const [selectedMeal, setSelectedMeal] = useState<MealOption>('Almoço');
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [scanLineAnim]);

  const handleSimulateScan = () => {
    setShowProduct(true);
    Animated.spring(sheetAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 9,
    }).start();
  };

  const handleCloseSheet = () => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setShowProduct(false));
  };

  const getMultiplier = (): number => {
    switch (selectedServing) {
      case '100g':
        return 100 / 30;
      case '1 porção':
        return 1;
      case '1 unidade':
        return 1.5;
      default:
        return 1;
    }
  };

  const viewfinderHeight = SCREEN_WIDTH * 0.85;
  const scanLineTranslate = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, viewfinderHeight - 4],
  });

  const sheetTranslate = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  const multiplier = getMultiplier();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>{'←'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scanner</Text>
          <View style={styles.backBtn} />
        </View>

        {/* Viewfinder */}
        <View style={[styles.viewfinder, { height: viewfinderHeight }]}>
          {/* Corner Brackets */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {/* Scan Line */}
          <Animated.View
            style={[
              styles.scanLine,
              { transform: [{ translateY: scanLineTranslate }] },
            ]}
          />

          {/* Center Text */}
          <Text style={styles.viewfinderText}>Aponte para o código de barras</Text>

          {/* Image placeholder */}
          <View style={styles.barcodeIcon}>
            <View style={styles.barcodeLine} />
            <View style={[styles.barcodeLine, { width: 3 }]} />
            <View style={[styles.barcodeLine, { width: 5 }]} />
            <View style={[styles.barcodeLine, { width: 2 }]} />
            <View style={[styles.barcodeLine, { width: 4 }]} />
            <View style={styles.barcodeLine} />
            <View style={[styles.barcodeLine, { width: 6 }]} />
            <View style={[styles.barcodeLine, { width: 2 }]} />
          </View>
        </View>

        {/* Simulate Scan Button */}
        <TouchableOpacity style={styles.simulateBtn} onPress={handleSimulateScan} activeOpacity={0.8}>
          <Text style={styles.simulateBtnText}>Simular scan</Text>
        </TouchableOpacity>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar alimento manualmente..."
            placeholderTextColor={colors.textMuted}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* Recent Scans */}
        <Text style={styles.sectionTitle}>Escaneados recentemente</Text>
        {RECENT_SCANS.map((item) => (
          <View key={item.id} style={styles.recentItem}>
            <View style={styles.recentInfo}>
              <Text style={styles.recentName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.recentCalories}>{item.calories} kcal</Text>
            </View>
            <TouchableOpacity style={styles.addSmallBtn} activeOpacity={0.7}>
              <Text style={styles.addSmallBtnText}>Adicionar</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Product Bottom Sheet */}
      {showProduct && (
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={styles.sheetBackdrop} onPress={handleCloseSheet} activeOpacity={1} />
          <Animated.View
            style={[styles.sheetContainer, { transform: [{ translateY: sheetTranslate }] }]}
          >
            <View style={styles.sheetHandle} />

            {/* Product Info */}
            <View style={styles.productHeader}>
              <View style={styles.productImagePlaceholder}>
                <Text style={styles.productImageIcon}>📦</Text>
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{MOCK_PRODUCT.name}</Text>
                <Text style={styles.productBrand}>{MOCK_PRODUCT.brand}</Text>
              </View>
            </View>

            {/* Nutrition Info */}
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {Math.round(MOCK_PRODUCT.nutrition.calories * multiplier)}
                </Text>
                <Text style={styles.nutritionLabel}>kcal</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={[styles.nutritionValue, { color: colors.info }]}>
                  {(MOCK_PRODUCT.nutrition.protein * multiplier).toFixed(1)}g
                </Text>
                <Text style={styles.nutritionLabel}>Proteína</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={[styles.nutritionValue, { color: colors.warning }]}>
                  {(MOCK_PRODUCT.nutrition.carbs * multiplier).toFixed(1)}g
                </Text>
                <Text style={styles.nutritionLabel}>Carbos</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={[styles.nutritionValue, { color: colors.danger }]}>
                  {(MOCK_PRODUCT.nutrition.fat * multiplier).toFixed(1)}g
                </Text>
                <Text style={styles.nutritionLabel}>Gordura</Text>
              </View>
            </View>

            {/* Serving Size Selector */}
            <Text style={styles.selectorLabel}>Porção</Text>
            <View style={styles.selectorRow}>
              {SERVING_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.selectorChip,
                    selectedServing === option && styles.selectorChipActive,
                  ]}
                  onPress={() => setSelectedServing(option)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.selectorChipText,
                      selectedServing === option && styles.selectorChipTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Meal Selector */}
            <Text style={styles.selectorLabel}>Refeição</Text>
            <View style={styles.selectorRow}>
              {MEAL_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.selectorChip,
                    selectedMeal === option && styles.selectorChipActive,
                  ]}
                  onPress={() => setSelectedMeal(option)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.selectorChipText,
                      selectedMeal === option && styles.selectorChipTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Add Button */}
            <TouchableOpacity style={styles.addBtn} activeOpacity={0.8}>
              <Text style={styles.addBtnText}>Adicionar</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── STYLES ─────────────────────────────────────────────
const CORNER_SIZE = 24;
const CORNER_WIDTH = 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 24,
    color: colors.text,
  },
  headerTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 20,
    color: colors.text,
  },

  // Viewfinder
  viewfinder: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: colors.orange,
  },
  cornerTL: {
    top: spacing.lg,
    left: spacing.lg,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: spacing.lg,
    right: spacing.lg,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: spacing.lg,
    left: spacing.lg,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: spacing.lg,
    right: spacing.lg,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderBottomRightRadius: 4,
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: spacing.xl,
    right: spacing.xl,
    height: 2,
    backgroundColor: colors.orange,
    opacity: 0.8,
    borderRadius: 1,
  },
  viewfinderText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  barcodeIcon: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 40,
  },
  barcodeLine: {
    width: 4,
    height: 40,
    backgroundColor: colors.textMuted,
    borderRadius: 1,
  },

  // Simulate Button
  simulateBtn: {
    backgroundColor: colors.elevated,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.orange,
    borderStyle: 'dashed',
  },
  simulateBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.orange,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
    paddingVertical: spacing.md,
  },

  // Recent scans
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  recentInfo: {
    flex: 1,
  },
  recentName: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.text,
  },
  recentCalories: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addSmallBtn: {
    backgroundColor: colors.orange + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  addSmallBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.orange,
  },

  // Bottom Sheet
  sheetOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheetContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
    paddingTop: spacing.md,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.textMuted,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },

  // Product
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  productImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  productImageIcon: {
    fontSize: 28,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.text,
  },
  productBrand: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Nutrition
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.elevated,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontFamily: fonts.numbersExtraBold,
    fontSize: 18,
    color: colors.orange,
  },
  nutritionLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Selectors
  selectorLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  selectorChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.elevated,
    alignItems: 'center',
  },
  selectorChipActive: {
    backgroundColor: colors.orange,
  },
  selectorChipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  selectorChipTextActive: {
    color: '#FFFFFF',
  },

  // Add Button
  addBtn: {
    backgroundColor: colors.orange,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  addBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
