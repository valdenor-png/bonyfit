import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import CrossPlatformModal from '../components/ui/CrossPlatformModal';
import { colors, fonts, spacing, radius } from '../tokens';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  navigation: any;
}

const MOCK_ENTRIES = [
  { id: '1', date: '01/02/2026', weight: 82.0 },
  { id: '2', date: '08/02/2026', weight: 81.3 },
  { id: '3', date: '15/02/2026', weight: 80.8 },
  { id: '4', date: '22/02/2026', weight: 80.5 },
  { id: '5', date: '01/03/2026', weight: 79.9 },
  { id: '6', date: '08/03/2026', weight: 79.6 },
  { id: '7', date: '15/03/2026', weight: 79.2 },
  { id: '8', date: '22/03/2026', weight: 78.8 },
  { id: '9', date: '29/03/2026', weight: 78.5 },
  { id: '10', date: '03/04/2026', weight: 78.2 },
];

const GOAL_WEIGHT = 75.0;

export default function PesoScreen({ navigation }: Props) {
  const [entries, setEntries] = useState(MOCK_ENTRIES);
  const [modalVisible, setModalVisible] = useState(false);
  const [newWeight, setNewWeight] = useState('');

  const currentEntry = entries[entries.length - 1];
  const minWeight = Math.min(...entries.map((e) => e.weight));
  const maxWeight = Math.max(...entries.map((e) => e.weight));
  const avgWeight = entries.reduce((s, e) => s + e.weight, 0) / entries.length;
  const variation = maxWeight - minWeight;

  // Progress toward goal
  const startWeight = entries[0].weight;
  const totalToLose = startWeight - GOAL_WEIGHT;
  const lost = startWeight - currentEntry.weight;
  const progressPct = totalToLose > 0 ? Math.min(1, lost / totalToLose) : 0;

  // Bar chart scaling
  const barMin = Math.min(minWeight, GOAL_WEIGHT) - 1;
  const barMax = maxWeight + 1;
  const barRange = barMax - barMin;

  const getBarColor = (index: number): string => {
    if (index === 0) return colors.orange;
    const prev = entries[index - 1].weight;
    const curr = entries[index].weight;
    if (curr < prev) return colors.success;
    if (curr > prev) return colors.danger;
    return colors.orange;
  };

  const handleSave = () => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) return;
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(
      today.getMonth() + 1
    ).padStart(2, '0')}/${today.getFullYear()}`;
    setEntries([
      ...entries,
      { id: String(entries.length + 1), date: dateStr, weight },
    ]);
    setNewWeight('');
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.orange} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Acompanhamento de Peso</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Current weight */}
        <View style={styles.currentCard}>
          <Text style={styles.currentWeight}>{currentEntry.weight}</Text>
          <Text style={styles.currentUnit}>kg</Text>
        </View>
        <Text style={styles.currentDate}>{currentEntry.date}</Text>

        {/* Register button */}
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.registerButtonText}>Registrar peso</Text>
        </TouchableOpacity>

        {/* Goal card */}
        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalLabel}>Meta: {GOAL_WEIGHT} kg</Text>
            <Text style={styles.goalPercent}>
              {Math.round(progressPct * 100)}%
            </Text>
          </View>
          {/* Progress ring approximation as a bar */}
          <View style={styles.goalBarBg}>
            <View
              style={[
                styles.goalBarFill,
                { width: `${progressPct * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.goalSubtext}>
            Faltam {(currentEntry.weight - GOAL_WEIGHT).toFixed(1)} kg
          </Text>
        </View>

        {/* Chart - horizontal bars */}
        <Text style={styles.sectionTitle}>Historico</Text>
        <View style={styles.chartCard}>
          {entries.map((entry, index) => {
            const barWidth = ((entry.weight - barMin) / barRange) * 100;
            return (
              <View key={entry.id} style={styles.chartRow}>
                <Text style={styles.chartDate}>{entry.date}</Text>
                <View style={styles.chartBarContainer}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        width: `${barWidth}%`,
                        backgroundColor: getBarColor(index),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.chartValue}>{entry.weight}</Text>
              </View>
            );
          })}
        </View>

        {/* Stats */}
        <Text style={styles.sectionTitle}>Estatisticas</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Maior peso</Text>
            <Text style={styles.statValue}>{maxWeight} kg</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Menor peso</Text>
            <Text style={styles.statValue}>{minWeight} kg</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Variacao</Text>
            <Text style={styles.statValue}>{variation.toFixed(1)} kg</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Media</Text>
            <Text style={styles.statValue}>{avgWeight.toFixed(1)} kg</Text>
          </View>
        </View>
      </ScrollView>

      {/* Modal */}
      <CrossPlatformModal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Registrar peso</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: 78.5"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={newWeight}
              onChangeText={setNewWeight}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => {
                  setNewWeight('');
                  setModalVisible(false);
                }}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleSave}>
                <Text style={styles.modalSaveText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </CrossPlatformModal>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  currentCard: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  currentWeight: {
    color: colors.text,
    fontSize: 56,
    fontFamily: fonts.numbersExtraBold,
  },
  currentUnit: {
    color: colors.textSecondary,
    fontSize: 20,
    fontFamily: fonts.numbers,
  },
  currentDate: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.body,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  registerButton: {
    backgroundColor: colors.orange,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  registerButtonText: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.bodyBold,
  },
  goalCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  goalLabel: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.bodyBold,
  },
  goalPercent: {
    color: colors.orange,
    fontSize: 18,
    fontFamily: fonts.numbersBold,
  },
  goalBarBg: {
    height: 8,
    backgroundColor: colors.elevated,
    borderRadius: 4,
  },
  goalBarFill: {
    height: 8,
    backgroundColor: colors.orange,
    borderRadius: 4,
  },
  goalSubtext: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.body,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontFamily: fonts.bodyBold,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  chartDate: {
    color: colors.textSecondary,
    fontSize: 10,
    fontFamily: fonts.numbers,
    width: 70,
  },
  chartBarContainer: {
    flex: 1,
    height: 16,
    backgroundColor: colors.elevated,
    borderRadius: 4,
    marginHorizontal: spacing.sm,
  },
  chartBar: {
    height: 16,
    borderRadius: 4,
  },
  chartValue: {
    color: colors.text,
    fontSize: 12,
    fontFamily: fonts.numbersBold,
    width: 40,
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    width: '47%',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.body,
    marginBottom: spacing.xs,
  },
  statValue: {
    color: colors.text,
    fontSize: 20,
    fontFamily: fonts.numbersBold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xxl,
    width: '85%',
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontFamily: fonts.bodyBold,
    marginBottom: spacing.lg,
  },
  modalInput: {
    backgroundColor: colors.elevated,
    borderRadius: radius.sm,
    color: colors.text,
    fontFamily: fonts.numbersBold,
    fontSize: 24,
    padding: spacing.md,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  modalCancel: {
    flex: 1,
    backgroundColor: colors.elevated,
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
  },
  modalSave: {
    flex: 1,
    backgroundColor: colors.orange,
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalSaveText: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.bodyBold,
  },
});
