import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  navigation: any;
}

type Tab = 'medidas' | 'composicao' | 'fotos';

const MOCK_MEASUREMENTS = {
  peso: 78.5,
  altura: 175,
  peito: 98,
  cintura: 82,
  quadril: 96,
  bracoD: 34,
  bracoE: 33.5,
  coxaD: 56,
  coxaE: 55.5,
  lastDate: '15/02/2026',
  trends: {
    peso: 'down' as const,
    peito: 'up' as const,
    cintura: 'down' as const,
    quadril: 'stable' as const,
    bracoD: 'up' as const,
    bracoE: 'up' as const,
    coxaD: 'up' as const,
    coxaE: 'stable' as const,
  },
};

const MOCK_COMPOSITION = {
  bodyFatPct: 18.5,
  leanMass: 64.0,
  fatMass: 14.5,
  waterPct: 58.2,
  bmr: 1780,
  lastDate: '10/02/2026',
};

const PHOTO_POSITIONS = [
  { key: 'front', label: 'Frente' },
  { key: 'back', label: 'Costas' },
  { key: 'side_right', label: 'Lateral D' },
  { key: 'side_left', label: 'Lateral E' },
] as const;

function getStatusBadge(key: string, value: number): { label: string; color: string } {
  const ranges: Record<string, { ideal: [number, number] }> = {
    bodyFatPct: { ideal: [10, 20] },
    waterPct: { ideal: [55, 65] },
    bmr: { ideal: [1500, 2200] },
  };
  const range = ranges[key];
  if (!range) return { label: '', color: colors.textMuted };
  if (value < range.ideal[0]) return { label: 'Abaixo', color: colors.info };
  if (value > range.ideal[1]) return { label: 'Acima', color: colors.warning };
  return { label: 'Ideal', color: colors.success };
}

function getTrendIcon(trend: 'up' | 'down' | 'stable'): string {
  if (trend === 'up') return '↑';
  if (trend === 'down') return '↓';
  return '→';
}

function getTrendColor(trend: 'up' | 'down' | 'stable'): string {
  if (trend === 'up') return colors.success;
  if (trend === 'down') return colors.danger;
  return colors.warning;
}

export default function AvaliacaoFisicaScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('medidas');
  const [measurements, setMeasurements] = useState(MOCK_MEASUREMENTS);

  const imc = measurements.peso / Math.pow(measurements.altura / 100, 2);

  const renderTab = (tab: Tab, label: string) => (
    <TouchableOpacity
      style={[styles.tab, activeTab === tab && styles.tabActive]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderMeasureField = (
    label: string,
    value: number,
    unit: string,
    trendKey?: keyof typeof MOCK_MEASUREMENTS.trends
  ) => (
    <View style={styles.measureField}>
      <Text style={styles.measureLabel}>{label}</Text>
      <View style={styles.measureValueRow}>
        <Text style={styles.measureValue}>{value}</Text>
        <Text style={styles.measureUnit}>{unit}</Text>
        {trendKey && MOCK_MEASUREMENTS.trends[trendKey] && (
          <Text
            style={[
              styles.trendIcon,
              { color: getTrendColor(MOCK_MEASUREMENTS.trends[trendKey]) },
            ]}
          >
            {getTrendIcon(MOCK_MEASUREMENTS.trends[trendKey])}
          </Text>
        )}
      </View>
    </View>
  );

  const renderMedidas = () => (
    <View>
      <Text style={styles.lastDate}>Última medição: {measurements.lastDate}</Text>
      <View style={styles.measureGrid}>
        {renderMeasureField('Peso', measurements.peso, 'kg', 'peso')}
        {renderMeasureField('Altura', measurements.altura, 'cm')}
        {renderMeasureField('IMC', parseFloat(imc.toFixed(1)), '')}
        {renderMeasureField('Peito', measurements.peito, 'cm', 'peito')}
        {renderMeasureField('Cintura', measurements.cintura, 'cm', 'cintura')}
        {renderMeasureField('Quadril', measurements.quadril, 'cm', 'quadril')}
        {renderMeasureField('Braco D', measurements.bracoD, 'cm', 'bracoD')}
        {renderMeasureField('Braco E', measurements.bracoE, 'cm', 'bracoE')}
        {renderMeasureField('Coxa D', measurements.coxaD, 'cm', 'coxaD')}
        {renderMeasureField('Coxa E', measurements.coxaE, 'cm', 'coxaE')}
      </View>

      {/* Evolution placeholder */}
      <View style={styles.evolutionCard}>
        <Text style={styles.evolutionTitle}>Evolução</Text>
        {Object.entries(MOCK_MEASUREMENTS.trends).map(([key, trend]) => (
          <View key={key} style={styles.evolutionRow}>
            <Text style={styles.evolutionLabel}>{key}</Text>
            <Text
              style={[styles.evolutionTrend, { color: getTrendColor(trend) }]}
            >
              {getTrendIcon(trend)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderComposicao = () => {
    const items = [
      { key: 'bodyFatPct', label: '% Gordura', value: MOCK_COMPOSITION.bodyFatPct, unit: '%' },
      { key: 'leanMass', label: 'Massa Magra', value: MOCK_COMPOSITION.leanMass, unit: 'kg' },
      { key: 'fatMass', label: 'Massa Gorda', value: MOCK_COMPOSITION.fatMass, unit: 'kg' },
      { key: 'waterPct', label: 'Agua Corporal', value: MOCK_COMPOSITION.waterPct, unit: '%' },
      { key: 'bmr', label: 'Taxa Metabolica Basal', value: MOCK_COMPOSITION.bmr, unit: 'kcal' },
    ];

    return (
      <View>
        <Text style={styles.lastDate}>
          Ultima bioimpedancia: {MOCK_COMPOSITION.lastDate}
        </Text>
        {items.map((item) => {
          const status = getStatusBadge(item.key, item.value);
          return (
            <View key={item.key} style={styles.compositionCard}>
              <Text style={styles.compositionLabel}>{item.label}</Text>
              <View style={styles.compositionValueRow}>
                <Text style={styles.compositionValue}>{item.value}</Text>
                <Text style={styles.compositionUnit}>{item.unit}</Text>
              </View>
              {status.label !== '' && (
                <View style={[styles.statusBadge, { backgroundColor: status.color + '22' }]}>
                  <Text style={[styles.statusBadgeText, { color: status.color }]}>
                    {status.label}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderFotos = () => (
    <View>
      <View style={styles.photosGrid}>
        {PHOTO_POSITIONS.map((pos) => (
          <View key={pos.key} style={styles.photoSlot}>
            <View style={styles.photoPlaceholder}>
              <Text style={styles.cameraIcon}>📷</Text>
            </View>
            <Text style={styles.photoLabel}>{pos.label}</Text>
            <TouchableOpacity style={styles.photoButton} onPress={() => Alert.alert('Foto', 'Tirar foto de progresso')}>
              <Text style={styles.photoButtonText}>Tirar foto</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Comparison placeholder */}
      <View style={styles.comparisonCard}>
        <Text style={styles.comparisonTitle}>Comparação</Text>
        <View style={styles.comparisonRow}>
          <View style={styles.comparisonSlot}>
            <View style={styles.comparisonPlaceholder}>
              <Text style={styles.comparisonPlaceholderText}>Antes</Text>
            </View>
            <Text style={styles.comparisonDate}>--/--/----</Text>
          </View>
          <View style={styles.comparisonSlot}>
            <View style={styles.comparisonPlaceholder}>
              <Text style={styles.comparisonPlaceholderText}>Depois</Text>
            </View>
            <Text style={styles.comparisonDate}>--/--/----</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.addPhotosButton} onPress={() => Alert.alert('Fotos', 'Adicionar fotos de progresso')}>
        <Text style={styles.addPhotosText}>Adicionar fotos</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.orange} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Avaliação Física</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {renderTab('medidas', 'Medidas')}
        {renderTab('composicao', 'Composição')}
        {renderTab('fotos', 'Fotos')}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {activeTab === 'medidas' && renderMedidas()}
        {activeTab === 'composicao' && renderComposicao()}
        {activeTab === 'fotos' && renderFotos()}
      </ScrollView>
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
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.md,
  },
  backButton: {
    color: colors.orange,
    fontSize: 24,
    fontFamily: fonts.bodyBold,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontFamily: fonts.bodyBold,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.orange,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
  },
  tabTextActive: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  lastDate: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.body,
    marginBottom: spacing.lg,
  },
  measureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  measureField: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    width: '47%',
  },
  measureLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.body,
    marginBottom: spacing.xs,
  },
  measureValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  measureValue: {
    color: colors.text,
    fontSize: 22,
    fontFamily: fonts.numbersBold,
  },
  measureUnit: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.body,
  },
  trendIcon: {
    fontSize: 16,
    fontFamily: fonts.numbersBold,
    marginLeft: spacing.xs,
  },
  evolutionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  evolutionTitle: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    marginBottom: spacing.md,
  },
  evolutionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  evolutionLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.body,
    textTransform: 'capitalize',
  },
  evolutionTrend: {
    fontSize: 16,
    fontFamily: fonts.numbersBold,
  },
  compositionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  compositionLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.body,
    marginBottom: spacing.xs,
  },
  compositionValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  compositionValue: {
    color: colors.text,
    fontSize: 32,
    fontFamily: fonts.numbersExtraBold,
  },
  compositionUnit: {
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: fonts.body,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginTop: spacing.sm,
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  photoSlot: {
    width: '47%',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  photoPlaceholder: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.elevated,
    borderStyle: 'dashed',
  },
  cameraIcon: {
    fontSize: 32,
  },
  photoLabel: {
    color: colors.text,
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    marginTop: spacing.sm,
  },
  photoButton: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    backgroundColor: colors.elevated,
    borderRadius: radius.pill,
  },
  photoButtonText: {
    color: colors.text,
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
  },
  comparisonCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  comparisonTitle: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    marginBottom: spacing.md,
  },
  comparisonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  comparisonSlot: {
    flex: 1,
    alignItems: 'center',
  },
  comparisonPlaceholder: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: colors.elevated,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comparisonPlaceholderText: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.body,
  },
  comparisonDate: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: fonts.numbers,
    marginTop: spacing.xs,
  },
  addPhotosButton: {
    backgroundColor: colors.orange,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  addPhotosText: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.bodyBold,
  },
});
