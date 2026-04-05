import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';

const AVAILABLE_PLATES = [20, 15, 10, 5, 2.5, 1.25];

const PLATE_COLORS: Record<number, string> = {
  20: '#E74C3C',    // red
  15: '#F1C40F',    // yellow
  10: '#2ECC71',    // green
  5: '#FFFFFF',     // white
  2.5: '#1A1A1A',   // black
  1.25: '#888888',  // gray
};

const PLATE_HEIGHTS: Record<number, number> = {
  20: 80,
  15: 70,
  10: 60,
  5: 50,
  2.5: 44,
  1.25: 40,
};

const PLATE_WIDTHS: Record<number, number> = {
  20: 18,
  15: 16,
  10: 14,
  5: 12,
  2.5: 10,
  1.25: 8,
};

interface PlateBreakdown {
  plates: number[];
  achievedWeight: number;
}

function calculatePlates(targetWeight: number, barWeight: number): PlateBreakdown {
  const perSide = (targetWeight - barWeight) / 2;

  if (perSide <= 0) {
    return { plates: [], achievedWeight: barWeight };
  }

  const plates: number[] = [];
  let remaining = perSide;

  for (const plate of AVAILABLE_PLATES) {
    while (remaining >= plate - 0.001) {
      plates.push(plate);
      remaining -= plate;
    }
  }

  const actualPerSide = plates.reduce((sum, p) => sum + p, 0);
  const achievedWeight = barWeight + actualPerSide * 2;

  return { plates, achievedWeight };
}

function formatBreakdown(plates: number[]): string {
  if (plates.length === 0) return 'Somente a barra';

  const counts: Record<number, number> = {};
  for (const p of plates) {
    counts[p] = (counts[p] || 0) + 1;
  }

  return (
    'Cada lado: ' +
    Object.entries(counts)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([weight, count]) => `${count}\u00D7${Number(weight) % 1 === 0 ? Number(weight) : Number(weight).toFixed(2)}kg`)
      .join(' + ')
  );
}

export default function PlateCalculator() {
  const [weightInput, setWeightInput] = useState('100');
  const [barWeight, setBarWeight] = useState<20 | 15>(20);

  const targetWeight = parseFloat(weightInput) || 0;

  const result = useMemo(
    () => calculatePlates(targetWeight, barWeight),
    [targetWeight, barWeight],
  );

  const showWarning = targetWeight > barWeight && result.achievedWeight !== targetWeight;

  return (
    <View style={styles.container}>
      {/* Weight Input */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Peso desejado</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.weightInput}
            value={weightInput}
            onChangeText={setWeightInput}
            keyboardType="numeric"
            selectionColor={colors.orange}
            placeholderTextColor={colors.textMuted}
            placeholder="0"
          />
          <Text style={styles.kgLabel}>kg</Text>
        </View>
      </View>

      {/* Bar weight selector */}
      <View style={styles.barSection}>
        <Text style={styles.barLabel}>Peso da barra</Text>
        <View style={styles.barOptions}>
          {([20, 15] as const).map((w) => (
            <TouchableOpacity
              key={w}
              style={[styles.barOption, barWeight === w && styles.barOptionActive]}
              onPress={() => setBarWeight(w)}
            >
              <Text
                style={[
                  styles.barOptionText,
                  barWeight === w && styles.barOptionTextActive,
                ]}
              >
                {w}kg
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Visual barbell */}
      <View style={styles.barbellContainer}>
        <View style={styles.barbellVisual}>
          {/* Left plates (reversed) */}
          <View style={styles.platesLeft}>
            {[...result.plates].reverse().map((plate, i) => (
              <View
                key={`l-${i}`}
                style={[
                  styles.plate,
                  {
                    backgroundColor: PLATE_COLORS[plate],
                    height: PLATE_HEIGHTS[plate],
                    width: PLATE_WIDTHS[plate],
                    borderColor:
                      plate === 2.5
                        ? colors.textMuted
                        : plate === 5
                        ? '#DDD'
                        : 'transparent',
                    borderWidth: plate === 2.5 || plate === 5 ? 1 : 0,
                  },
                ]}
              />
            ))}
          </View>

          {/* Collar left */}
          <View style={styles.collar} />

          {/* Bar */}
          <View style={styles.bar} />

          {/* Collar right */}
          <View style={styles.collar} />

          {/* Right plates */}
          <View style={styles.platesRight}>
            {result.plates.map((plate, i) => (
              <View
                key={`r-${i}`}
                style={[
                  styles.plate,
                  {
                    backgroundColor: PLATE_COLORS[plate],
                    height: PLATE_HEIGHTS[plate],
                    width: PLATE_WIDTHS[plate],
                    borderColor:
                      plate === 2.5
                        ? colors.textMuted
                        : plate === 5
                        ? '#DDD'
                        : 'transparent',
                    borderWidth: plate === 2.5 || plate === 5 ? 1 : 0,
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Breakdown text */}
      <Text style={styles.breakdown}>{formatBreakdown(result.plates)}</Text>

      {showWarning && (
        <Text style={styles.warning}>
          Peso mais proximo possivel: {result.achievedWeight.toFixed(2)} kg
        </Text>
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
  inputSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  weightInput: {
    fontFamily: fonts.numbersExtraBold,
    fontSize: 36,
    color: colors.text,
    borderBottomWidth: 2,
    borderBottomColor: colors.orange,
    textAlign: 'center',
    minWidth: 100,
    paddingVertical: spacing.xs,
  },
  kgLabel: {
    fontFamily: fonts.numbersBold,
    fontSize: 18,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  barSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  barLabel: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  barOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  barOption: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.textMuted,
  },
  barOptionActive: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  barOptionText: {
    fontFamily: fonts.numbersBold,
    fontSize: 13,
    color: colors.textSecondary,
  },
  barOptionTextActive: {
    color: colors.text,
  },
  // Barbell visual
  barbellContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  barbellVisual: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  platesLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  platesRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  plate: {
    borderRadius: 3,
  },
  collar: {
    width: 6,
    height: 28,
    backgroundColor: '#555',
    borderRadius: 2,
  },
  bar: {
    width: 60,
    height: 8,
    backgroundColor: '#777',
    borderRadius: 4,
  },
  breakdown: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  warning: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.warning,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
