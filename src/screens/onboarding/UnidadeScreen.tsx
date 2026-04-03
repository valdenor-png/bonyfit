import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../../tokens';
import ProgressRing from '../../components/ProgressRing';
import Button from '../../components/Button';

interface Props {
  navigation: any;
  onNext: (unitId: string) => void;
}

const UNITS = [
  { id: '1', name: 'Centro', address: 'Av. Barão do Rio Branco, 1500 — Centro', capacity: 120, current_count: 45 },
  { id: '2', name: 'Jaderlândia', address: 'Rua Jaderlândia, 230 — Jaderlândia', capacity: 80, current_count: 62 },
  { id: '3', name: 'Nova Olinda', address: 'Tv. Nova Olinda, 88 — Nova Olinda', capacity: 100, current_count: 30 },
  { id: '4', name: 'Apeú', address: 'Rod. BR-316, Km 52 — Apeú', capacity: 60, current_count: 55 },
  { id: '5', name: 'Icuí', address: 'Rua do Icuí, 412 — Icuí', capacity: 90, current_count: 20 },
];

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <View style={progressStyles.container}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            progressStyles.bar,
            { backgroundColor: i <= step ? colors.orange : colors.elevated },
          ]}
        />
      ))}
    </View>
  );
}

const progressStyles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 4, paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.lg },
  bar: { flex: 1, height: 3, borderRadius: 2 },
});

function getCapacityColor(pct: number) {
  if (pct < 0.5) return colors.success;
  if (pct < 0.8) return colors.orange;
  return colors.danger;
}

export default function UnidadeScreen({ navigation, onNext }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinue = () => {
    if (selected) {
      onNext(selected);
      navigation.navigate('Plano');
    }
  };

  return (
    <View style={styles.container}>
      <ProgressBar step={1} total={6} />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Escolha sua unidade</Text>
        <Text style={styles.subtitle}>
          Selecione a academia mais perto de você
        </Text>

        <View style={styles.list}>
          {UNITS.map((unit) => {
            const pct = unit.current_count / unit.capacity;
            const isSelected = selected === unit.id;
            return (
              <TouchableOpacity
                key={unit.id}
                style={[
                  styles.unitCard,
                  isSelected && styles.unitCardSelected,
                ]}
                onPress={() => setSelected(unit.id)}
                activeOpacity={0.7}
              >
                <ProgressRing
                  progress={pct}
                  size={48}
                  strokeWidth={4}
                  color={getCapacityColor(pct)}
                >
                  <Text style={styles.countText}>{unit.current_count}</Text>
                </ProgressRing>
                <View style={styles.unitInfo}>
                  <Text style={styles.unitName}>Bony Fit — {unit.name}</Text>
                  <Text style={styles.unitAddress}>{unit.address}</Text>
                </View>
                {isSelected && (
                  <View style={styles.checkCircle}>
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.buttons}>
          <Button
            title="Voltar"
            variant="outline"
            onPress={() => navigation.goBack()}
          />
          <Button
            title="Continuar"
            onPress={handleContinue}
            disabled={!selected}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  title: { fontSize: 22, fontFamily: fonts.bodyBold, color: colors.text, marginBottom: spacing.sm },
  subtitle: { fontSize: 14, fontFamily: fonts.body, color: colors.textSecondary, marginBottom: spacing.xxl },
  list: { gap: spacing.md, marginBottom: spacing.xxl },
  unitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.elevated,
    gap: spacing.md,
  },
  unitCardSelected: {
    backgroundColor: 'rgba(242, 101, 34, 0.1)',
    borderColor: 'rgba(242, 101, 34, 0.4)',
    borderWidth: 1.5,
  },
  unitInfo: { flex: 1 },
  unitName: { fontSize: 14, fontFamily: fonts.bodyBold, color: colors.text, marginBottom: 2 },
  unitAddress: { fontSize: 11, fontFamily: fonts.body, color: colors.textMuted },
  countText: { fontSize: 14, fontFamily: fonts.numbersBold, color: colors.text },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { color: colors.text, fontSize: 14, fontFamily: fonts.bodyBold },
  buttons: { gap: spacing.md },
});
