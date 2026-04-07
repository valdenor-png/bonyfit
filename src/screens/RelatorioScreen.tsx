import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  Share,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';

// ─── TYPES ──────────────────────────────────────────────
interface Measurement {
  name: string;
  value: string;
  change: string;
  direction: 'up' | 'down' | 'same';
}

interface Badge {
  emoji: string;
  name: string;
}

interface TopExercise {
  name: string;
  sessions: number;
  volume: string;
}

// ─── MOCK DATA ──────────────────────────────────────────
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const WEIGHT_DATA = [82.5, 82.1, 81.8, 81.5, 81.9, 81.2, 80.8];

const MEASUREMENTS: Measurement[] = [
  { name: 'Braço D', value: '38.5 cm', change: '+0.8', direction: 'up' },
  { name: 'Braço E', value: '37.9 cm', change: '+0.5', direction: 'up' },
  { name: 'Peitoral', value: '102 cm', change: '+1.2', direction: 'up' },
  { name: 'Cintura', value: '82 cm', change: '-1.5', direction: 'down' },
  { name: 'Quadril', value: '98 cm', change: '-0.3', direction: 'down' },
  { name: 'Coxa D', value: '58 cm', change: '+0.6', direction: 'up' },
  { name: 'Panturrilha D', value: '38 cm', change: '0.0', direction: 'same' },
];

const BADGES: Badge[] = [
  { emoji: '🔥', name: 'Sequência de 15 dias' },
  { emoji: '💪', name: '100 séries de supino' },
  { emoji: '🏃', name: 'Maratonista — 50km corridos' },
  { emoji: '⭐', name: 'Nível 12 alcançado' },
];

const TOP_EXERCISES: TopExercise[] = [
  { name: 'Supino reto', sessions: 12, volume: '8.400 kg' },
  { name: 'Agachamento livre', sessions: 10, volume: '12.000 kg' },
  { name: 'Puxada frontal', sessions: 9, volume: '5.600 kg' },
];

// ─── COMPONENT ──────────────────────────────────────────
export default function RelatorioScreen({ navigation }: any) {
  const [month, setMonth] = useState(2); // March (0-indexed)
  const [year, setYear] = useState(2026);

  const goToPrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const handleExportPDF = () => {
    Alert.alert('PDF gerado!', 'Compartilhar?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Compartilhar', onPress: () => Share.share({ message: 'Meu relatório Bony Fit' }) },
    ]);
  };

  const handleShare = () => {
    Alert.alert('Compartilhar', 'Relatório compartilhado com sucesso!');
  };

  const maxWeight = Math.max(...WEIGHT_DATA);
  const minWeight = Math.min(...WEIGHT_DATA);
  const weightRange = maxWeight - minWeight || 1;

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
        <Text style={styles.headerTitle}>Relatório Mensal</Text>
        <View style={styles.backButton} />
      </View>

      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={goToPrevMonth} style={styles.monthArrow}>
          <Text style={styles.monthArrowText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {MONTHS[month]} {year}
        </Text>
        <TouchableOpacity onPress={goToNextMonth} style={styles.monthArrow}>
          <Text style={styles.monthArrowText}>→</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Resumo */}
        <View style={styles.reportSection}>
          <Text style={styles.reportSectionTitle}>Resumo</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>17</Text>
              <Text style={styles.statLabel}>Treinos</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>4.2x</Text>
              <Text style={styles.statLabel}>Frequência/sem</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>45.000</Text>
              <Text style={styles.statLabel}>Volume (kg)</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>22h</Text>
              <Text style={styles.statLabel}>Tempo total</Text>
            </View>
          </View>
        </View>

        {/* Evolucao de Peso */}
        <View style={styles.reportSection}>
          <Text style={styles.reportSectionTitle}>Evolução de Peso</Text>
          <View style={styles.chartContainer}>
            <View style={styles.chartBars}>
              {WEIGHT_DATA.map((weight, index) => {
                const height = ((weight - minWeight) / weightRange) * 80 + 20;
                return (
                  <View key={index} style={styles.barWrapper}>
                    <Text style={styles.barLabel}>
                      {weight.toFixed(1)}
                    </Text>
                    <View
                      style={[
                        styles.bar,
                        {
                          height,
                          backgroundColor:
                            index === WEIGHT_DATA.length - 1
                              ? colors.orange
                              : colors.elevated,
                        },
                      ]}
                    />
                    <Text style={styles.barDay}>S{index + 1}</Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.weightSummary}>
              <View style={styles.weightItem}>
                <Text style={styles.weightItemLabel}>Início</Text>
                <Text style={styles.weightItemValue}>{WEIGHT_DATA[0]} kg</Text>
              </View>
              <View style={styles.weightItem}>
                <Text style={styles.weightItemLabel}>Final</Text>
                <Text style={styles.weightItemValue}>
                  {WEIGHT_DATA[WEIGHT_DATA.length - 1]} kg
                </Text>
              </View>
              <View style={styles.weightItem}>
                <Text style={styles.weightItemLabel}>Delta</Text>
                <Text
                  style={[styles.weightItemValue, { color: colors.success }]}
                >
                  {(WEIGHT_DATA[WEIGHT_DATA.length - 1] - WEIGHT_DATA[0]).toFixed(1)} kg
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Medidas */}
        <View style={styles.reportSection}>
          <Text style={styles.reportSectionTitle}>Medidas</Text>
          <View style={styles.tableCard}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>Medida</Text>
              <Text style={[styles.tableHeaderText, { width: 80, textAlign: 'right' }]}>Valor</Text>
              <Text style={[styles.tableHeaderText, { width: 60, textAlign: 'right' }]}>Var.</Text>
            </View>
            {MEASUREMENTS.map((m, index) => (
              <View
                key={m.name}
                style={[
                  styles.tableRow,
                  index < MEASUREMENTS.length - 1 && styles.tableRowBorder,
                ]}
              >
                <Text style={[styles.tableCell, { flex: 1 }]}>{m.name}</Text>
                <Text style={[styles.tableCellValue, { width: 80, textAlign: 'right' }]}>
                  {m.value}
                </Text>
                <Text
                  style={[
                    styles.tableCellChange,
                    {
                      width: 60,
                      textAlign: 'right',
                      color:
                        m.direction === 'up'
                          ? colors.success
                          : m.direction === 'down'
                          ? colors.info
                          : colors.textMuted,
                    },
                  ]}
                >
                  {m.direction === 'up' ? '↑' : m.direction === 'down' ? '↓' : '—'}{' '}
                  {m.change}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Conquistas do mes */}
        <View style={styles.reportSection}>
          <Text style={styles.reportSectionTitle}>Conquistas do mês</Text>
          <View style={styles.card}>
            {BADGES.map((badge, index) => (
              <View
                key={badge.name}
                style={[
                  styles.badgeItem,
                  index < BADGES.length - 1 && styles.badgeItemBorder,
                ]}
              >
                <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                <Text style={styles.badgeName}>{badge.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Ranking */}
        <View style={styles.reportSection}>
          <Text style={styles.reportSectionTitle}>Ranking</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>7°</Text>
              <Text style={styles.statLabel}>Posição</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>1.850</Text>
              <Text style={styles.statLabel}>Pontos ganhos</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Nível</Text>
            </View>
          </View>
        </View>

        {/* Top exercicios */}
        <View style={styles.reportSection}>
          <Text style={styles.reportSectionTitle}>Top exercícios</Text>
          <View style={styles.card}>
            {TOP_EXERCISES.map((exercise, index) => (
              <View
                key={exercise.name}
                style={[
                  styles.exerciseItem,
                  index < TOP_EXERCISES.length - 1 && styles.exerciseItemBorder,
                ]}
              >
                <View style={styles.exerciseRank}>
                  <Text style={styles.exerciseRankText}>{index + 1}</Text>
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseMeta}>
                    {exercise.sessions} sessões • {exercise.volume}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Buttons */}
        <TouchableOpacity style={styles.exportButton} onPress={handleExportPDF}>
          <Text style={styles.exportButtonText}>Exportar PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>Compartilhar</Text>
        </TouchableOpacity>

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
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xl,
  },
  monthArrow: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthArrowText: {
    color: colors.text,
    fontSize: 18,
    fontFamily: fonts.bodyBold,
  },
  monthText: {
    color: colors.text,
    fontSize: 17,
    fontFamily: fonts.bodyBold,
    minWidth: 160,
    textAlign: 'center',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },
  reportSection: {
    marginBottom: spacing.xxl,
  },
  reportSectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  statValue: {
    color: colors.orange,
    fontSize: 24,
    fontFamily: fonts.numbersExtraBold,
    marginBottom: 4,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.body,
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 130,
    marginBottom: spacing.lg,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontFamily: fonts.numbers,
    marginBottom: 4,
  },
  bar: {
    width: 20,
    borderRadius: 4,
    minHeight: 10,
  },
  barDay: {
    color: colors.textMuted,
    fontSize: 10,
    fontFamily: fonts.body,
    marginTop: 4,
  },
  weightSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.elevated,
    paddingTop: spacing.md,
  },
  weightItem: {
    alignItems: 'center',
  },
  weightItemLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.body,
    marginBottom: 2,
  },
  weightItemValue: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.numbersBold,
  },
  tableCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.elevated,
  },
  tableHeaderText: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  tableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.elevated,
  },
  tableCell: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.body,
  },
  tableCellValue: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.numbersBold,
  },
  tableCellChange: {
    fontSize: 13,
    fontFamily: fonts.numbersBold,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  badgeItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.elevated,
  },
  badgeEmoji: {
    fontSize: 24,
  },
  badgeName: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  exerciseItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.elevated,
  },
  exerciseRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.orange + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseRankText: {
    color: colors.orange,
    fontSize: 14,
    fontFamily: fonts.numbersBold,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.bodyMedium,
    marginBottom: 2,
  },
  exerciseMeta: {
    color: colors.textMuted,
    fontSize: 13,
    fontFamily: fonts.body,
  },
  exportButton: {
    backgroundColor: colors.orange,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  exportButtonText: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.bodyBold,
  },
  shareButton: {
    borderWidth: 1.5,
    borderColor: colors.orange,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  shareButtonText: {
    color: colors.orange,
    fontSize: 15,
    fontFamily: fonts.bodyBold,
  },
  bottomSpacer: {
    height: 40,
  },
});
