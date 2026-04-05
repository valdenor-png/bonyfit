import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';

const PERCENTAGES = [100, 95, 90, 85, 80, 75, 70, 65, 60];

function calculateOneRepMax(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  // Epley formula
  return weight * (1 + reps / 30);
}

export default function OneRepMaxCalc() {
  const [weightInput, setWeightInput] = useState('');
  const [repsInput, setRepsInput] = useState('');

  const weight = parseFloat(weightInput) || 0;
  const reps = parseInt(repsInput, 10) || 0;

  const oneRepMax = useMemo(
    () => calculateOneRepMax(weight, reps),
    [weight, reps],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calculadora 1RM</Text>

      {/* Inputs */}
      <View style={styles.inputsRow}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Peso (kg)</Text>
          <TextInput
            style={styles.input}
            value={weightInput}
            onChangeText={setWeightInput}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.orange}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Reps</Text>
          <TextInput
            style={styles.input}
            value={repsInput}
            onChangeText={setRepsInput}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.orange}
          />
        </View>
      </View>

      {/* Result */}
      {oneRepMax > 0 && (
        <>
          <View style={styles.resultSection}>
            <Text style={styles.resultLabel}>1RM Estimado</Text>
            <Text style={styles.resultValue}>
              {oneRepMax.toFixed(1)}{' '}
              <Text style={styles.resultUnit}>kg</Text>
            </Text>
          </View>

          {/* Percentage table */}
          <View style={styles.table}>
            {PERCENTAGES.map((pct) => {
              const pctWeight = (oneRepMax * pct) / 100;
              return (
                <View style={styles.tableRow} key={pct}>
                  <Text style={styles.tablePct}>{pct}%</Text>
                  <View style={styles.tableDivider} />
                  <Text style={styles.tableWeight}>
                    {pctWeight.toFixed(1)} kg
                  </Text>
                </View>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  inputsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: fonts.numbersBold,
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
  },
  resultSection: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  resultLabel: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  resultValue: {
    fontFamily: fonts.numbersExtraBold,
    fontSize: 32,
    color: colors.orange,
    marginTop: spacing.xs,
  },
  resultUnit: {
    fontFamily: fonts.numbersBold,
    fontSize: 18,
    color: colors.textSecondary,
  },
  table: {
    borderTopWidth: 1,
    borderTopColor: colors.elevated,
    paddingTop: spacing.md,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  tablePct: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    width: 50,
  },
  tableDivider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.elevated,
    marginHorizontal: spacing.md,
  },
  tableWeight: {
    fontFamily: fonts.numbersBold,
    fontSize: 14,
    color: colors.text,
    width: 80,
    textAlign: 'right',
  },
});
