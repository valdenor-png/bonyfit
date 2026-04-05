import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';
import Button from '../components/Button';

interface Measurement {
  id: string;
  date: string;
  weight: number;
  height?: number;
  bodyFat?: number;
  chest?: number;
  waist?: number;
  hip?: number;
  leftArm?: number;
  rightArm?: number;
  leftThigh?: number;
  rightThigh?: number;
  leftCalf?: number;
  rightCalf?: number;
}

const MOCK_MEASUREMENTS: Measurement[] = [
  {
    id: '1',
    date: '2026-04-01',
    weight: 78.2,
    height: 175,
    bodyFat: 18.5,
    chest: 98,
    waist: 82,
    hip: 96,
    leftArm: 34,
    rightArm: 34.5,
    leftThigh: 56,
    rightThigh: 56.5,
    leftCalf: 37,
    rightCalf: 37,
  },
  {
    id: '2',
    date: '2026-03-15',
    weight: 79.0,
    height: 175,
    bodyFat: 19.0,
    chest: 97,
    waist: 83,
    hip: 96,
    leftArm: 33.5,
    rightArm: 34,
    leftThigh: 55.5,
    rightThigh: 56,
    leftCalf: 37,
    rightCalf: 37,
  },
  {
    id: '3',
    date: '2026-03-01',
    weight: 79.8,
    height: 175,
    bodyFat: 19.8,
    chest: 97,
    waist: 84,
    hip: 97,
    leftArm: 33,
    rightArm: 33.5,
    leftThigh: 55,
    rightThigh: 55.5,
    leftCalf: 36.5,
    rightCalf: 36.5,
  },
  {
    id: '4',
    date: '2026-02-15',
    weight: 80.5,
    height: 175,
    bodyFat: 20.2,
    chest: 96,
    waist: 85,
    hip: 97,
    leftArm: 32.5,
    rightArm: 33,
    leftThigh: 54.5,
    rightThigh: 55,
    leftCalf: 36,
    rightCalf: 36,
  },
  {
    id: '5',
    date: '2026-02-01',
    weight: 81.3,
    height: 175,
    bodyFat: 21.0,
    chest: 96,
    waist: 86,
    hip: 98,
    leftArm: 32,
    rightArm: 32.5,
    leftThigh: 54,
    rightThigh: 54.5,
    leftCalf: 36,
    rightCalf: 36,
  },
];

const EMPTY_FORM: Omit<Measurement, 'id' | 'date'> = {
  weight: 0,
  height: undefined,
  bodyFat: undefined,
  chest: undefined,
  waist: undefined,
  hip: undefined,
  leftArm: undefined,
  rightArm: undefined,
  leftThigh: undefined,
  rightThigh: undefined,
  leftCalf: undefined,
  rightCalf: undefined,
};

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export default function MeasurementsScreen() {
  const [measurements, setMeasurements] = useState<Measurement[]>(MOCK_MEASUREMENTS);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const latest = measurements.length > 0 ? measurements[0] : null;

  // Weight chart data (last 8 entries, most recent on top)
  const chartData = measurements.slice(0, 8).reverse();
  const maxWeight = Math.max(...chartData.map((m) => m.weight));

  const handleSave = () => {
    const newMeasurement: Measurement = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      weight: parseFloat(form.weight) || 0,
      height: form.height ? parseFloat(form.height) : undefined,
      bodyFat: form.bodyFat ? parseFloat(form.bodyFat) : undefined,
      chest: form.chest ? parseFloat(form.chest) : undefined,
      waist: form.waist ? parseFloat(form.waist) : undefined,
      hip: form.hip ? parseFloat(form.hip) : undefined,
      leftArm: form.leftArm ? parseFloat(form.leftArm) : undefined,
      rightArm: form.rightArm ? parseFloat(form.rightArm) : undefined,
      leftThigh: form.leftThigh ? parseFloat(form.leftThigh) : undefined,
      rightThigh: form.rightThigh ? parseFloat(form.rightThigh) : undefined,
      leftCalf: form.leftCalf ? parseFloat(form.leftCalf) : undefined,
      rightCalf: form.rightCalf ? parseFloat(form.rightCalf) : undefined,
    };
    setMeasurements((prev) => [newMeasurement, ...prev]);
    setForm({});
    setModalVisible(false);
  };

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const renderFormField = (label: string, key: string, unit: string) => (
    <View style={styles.formRow} key={key}>
      <Text style={styles.formLabel}>{label}</Text>
      <View style={styles.formInputWrapper}>
        <TextInput
          style={styles.formInput}
          value={form[key] || ''}
          onChangeText={(v) => updateField(key, v)}
          keyboardType="numeric"
          placeholderTextColor={colors.textMuted}
          placeholder="0"
          selectionColor={colors.orange}
        />
        <Text style={styles.formUnit}>{unit}</Text>
      </View>
    </View>
  );

  const renderChartBar = (entry: Measurement, index: number) => {
    const barWidth = maxWeight > 0 ? (entry.weight / maxWeight) * 100 : 0;
    const prevWeight = index > 0 ? chartData[index - 1].weight : entry.weight;
    const isDecreasing = entry.weight <= prevWeight;
    const barColor = isDecreasing ? colors.success : colors.orange;

    return (
      <View style={styles.chartRow} key={entry.id}>
        <Text style={styles.chartDate}>{formatDate(entry.date).slice(0, 5)}</Text>
        <View style={styles.chartBarTrack}>
          <View
            style={[
              styles.chartBar,
              { width: `${barWidth}%`, backgroundColor: barColor },
            ]}
          />
        </View>
        <Text style={styles.chartValue}>{entry.weight.toFixed(1)}</Text>
      </View>
    );
  };

  const renderMeasurement = ({ item }: { item: Measurement }) => {
    const isExpanded = expandedId === item.id;

    return (
      <TouchableOpacity
        style={styles.historyCard}
        activeOpacity={0.8}
        onPress={() => setExpandedId(isExpanded ? null : item.id)}
      >
        <View style={styles.historyHeader}>
          <Text style={styles.historyDate}>{formatDate(item.date)}</Text>
          <View style={styles.historyStats}>
            <Text style={styles.historyWeight}>{item.weight.toFixed(1)} kg</Text>
            {item.bodyFat != null && (
              <Text style={styles.historyFat}>{item.bodyFat.toFixed(1)}% BF</Text>
            )}
          </View>
        </View>
        {isExpanded && (
          <View style={styles.historyDetails}>
            {item.chest != null && <DetailRow label="Peito" value={`${item.chest} cm`} />}
            {item.waist != null && <DetailRow label="Cintura" value={`${item.waist} cm`} />}
            {item.hip != null && <DetailRow label="Quadril" value={`${item.hip} cm`} />}
            {item.leftArm != null && (
              <DetailRow label="Braço E/D" value={`${item.leftArm} / ${item.rightArm} cm`} />
            )}
            {item.leftThigh != null && (
              <DetailRow label="Coxa E/D" value={`${item.leftThigh} / ${item.rightThigh} cm`} />
            )}
            {item.leftCalf != null && (
              <DetailRow label="Panturrilha E/D" value={`${item.leftCalf} / ${item.rightCalf} cm`} />
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medidas Corporais</Text>
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.newButtonText}>+ Nova Medida</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={measurements}
        keyExtractor={(item) => item.id}
        renderItem={renderMeasurement}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            {/* Summary card */}
            {latest && (
              <View style={styles.summaryCard}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Peso Atual</Text>
                  <Text style={styles.summaryValue}>{latest.weight.toFixed(1)} kg</Text>
                </View>
                {latest.bodyFat != null && (
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Gordura Corporal</Text>
                    <Text style={styles.summaryValue}>{latest.bodyFat.toFixed(1)}%</Text>
                  </View>
                )}
              </View>
            )}

            {/* Weight chart */}
            {chartData.length > 1 && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Evolucao do Peso</Text>
                {chartData.map((entry, index) => renderChartBar(entry, index))}
              </View>
            )}

            <Text style={styles.sectionTitle}>Historico</Text>
          </>
        }
      />

      {/* Form Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContent}
          >
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Nova Medida</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {renderFormField('Peso', 'weight', 'kg')}
              {renderFormField('Altura', 'height', 'cm')}
              {renderFormField('Gordura Corporal', 'bodyFat', '%')}
              <View style={styles.formDivider} />
              {renderFormField('Peito', 'chest', 'cm')}
              {renderFormField('Cintura', 'waist', 'cm')}
              {renderFormField('Quadril', 'hip', 'cm')}
              {renderFormField('Braco Esquerdo', 'leftArm', 'cm')}
              {renderFormField('Braco Direito', 'rightArm', 'cm')}
              {renderFormField('Coxa Esquerda', 'leftThigh', 'cm')}
              {renderFormField('Coxa Direita', 'rightThigh', 'cm')}
              {renderFormField('Panturrilha Esq.', 'leftCalf', 'cm')}
              {renderFormField('Panturrilha Dir.', 'rightCalf', 'cm')}
              <View style={{ height: spacing.lg }} />
              <Button title="Salvar" onPress={handleSave} />
              <View style={{ height: spacing.sm }} />
              <Button
                title="Cancelar"
                variant="ghost"
                onPress={() => {
                  setForm({});
                  setModalVisible(false);
                }}
              />
              <View style={{ height: spacing.xxl }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 22,
    color: colors.text,
  },
  newButton: {
    backgroundColor: colors.orange,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  newButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.text,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  // Summary card
  summaryCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontFamily: fonts.numbersExtraBold,
    fontSize: 22,
    color: colors.text,
    marginTop: spacing.xs,
  },
  // Chart
  chartCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  chartTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.md,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  chartDate: {
    fontFamily: fonts.numbers,
    fontSize: 11,
    color: colors.textSecondary,
    width: 42,
  },
  chartBarTrack: {
    flex: 1,
    height: 14,
    backgroundColor: colors.elevated,
    borderRadius: 7,
    overflow: 'hidden',
    marginHorizontal: spacing.sm,
  },
  chartBar: {
    height: '100%',
    borderRadius: 7,
  },
  chartValue: {
    fontFamily: fonts.numbersBold,
    fontSize: 12,
    color: colors.text,
    width: 44,
    textAlign: 'right',
  },
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
  },
  // History cards
  historyCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDate: {
    fontFamily: fonts.numbersBold,
    fontSize: 14,
    color: colors.text,
  },
  historyStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  historyWeight: {
    fontFamily: fonts.numbersBold,
    fontSize: 14,
    color: colors.text,
  },
  historyFat: {
    fontFamily: fonts.numbers,
    fontSize: 13,
    color: colors.textSecondary,
  },
  historyDetails: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.elevated,
    paddingTop: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  detailLabel: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  detailValue: {
    fontFamily: fonts.numbersBold,
    fontSize: 13,
    color: colors.text,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.textMuted,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 20,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  formLabel: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  formInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 100,
  },
  formInput: {
    fontFamily: fonts.numbersBold,
    fontSize: 16,
    color: colors.text,
    flex: 1,
    textAlign: 'right',
    padding: 0,
  },
  formUnit: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
  formDivider: {
    height: 1,
    backgroundColor: colors.elevated,
    marginVertical: spacing.md,
  },
});
