import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../tokens';

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  normal: { label: 'Normal', color: '#F26522' },
  aq: { label: 'AQ', color: '#A855F7' },
  pr: { label: 'PR', color: '#EF4444' },
  dropset: { label: 'Drop', color: '#06B6D4' },
  rir: { label: 'RIR', color: '#10B981' },
  tempo: { label: 'Tempo', color: '#F26522' },
  failure: { label: 'Falha', color: '#EF4444' },
};

interface Props {
  index: number;
  weight: number | null;
  reps: number | null;
  completed: boolean;
  isCurrent: boolean;
  setType: string;
  prevWeight?: number | null;
  prevReps?: number | null;
  editable?: boolean;
  onToggle: () => void;
  onWeightChange: (val: number | null) => void;
  onRepsChange: (val: number | null) => void;
  onTypeChange?: (type: string) => void;
}

export default function SetRow({
  index, weight, reps, completed, isCurrent, setType,
  prevWeight, prevReps, editable = true,
  onToggle, onWeightChange, onRepsChange, onTypeChange,
}: Props) {
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const cfg = TYPE_CONFIG[setType] ?? TYPE_CONFIG.normal;
  const typeColor = cfg.color;

  const rowBg = completed
    ? '#1A1A1A'
    : isCurrent
      ? `${typeColor}0A`
      : '#1A1A1A';

  const rowBorder = completed
    ? '#2A2A2A'
    : isCurrent
      ? `${typeColor}55`
      : '#2A2A2A';

  const leftBorder = isCurrent && !completed ? typeColor : 'transparent';

  return (
    <View style={[
      styles.container,
      { backgroundColor: rowBg, borderColor: rowBorder, borderLeftColor: leftBorder },
      completed && styles.completedRow,
    ]}>
      {/* Left: Ball + Type */}
      <View style={styles.leftCol}>
        <View style={[
          styles.ball,
          completed
            ? { backgroundColor: '#22C55E22' }
            : isCurrent
              ? { backgroundColor: `${typeColor}22` }
              : { backgroundColor: '#2A2A2A55' },
        ]}>
          {completed ? (
            <Text style={[styles.ballText, { color: '#22C55E' }]}>✓</Text>
          ) : (
            <Text style={[styles.ballText, {
              color: isCurrent ? typeColor : '#888',
            }]}>{index + 1}</Text>
          )}
        </View>

        {/* Type pill */}
        <TouchableOpacity
          style={[styles.typePill, { backgroundColor: `${typeColor}18`, borderColor: `${typeColor}44` }]}
          onPress={() => onTypeChange && setShowTypeMenu(!showTypeMenu)}
          disabled={!onTypeChange || completed}
          activeOpacity={0.7}
        >
          <Text style={[styles.typePillText, { color: typeColor }]}>{cfg.label}</Text>
        </TouchableOpacity>

        {/* Type popover */}
        {showTypeMenu && (
          <View style={styles.popover}>
            {Object.entries(TYPE_CONFIG).filter(([k]) => !['tempo', 'failure'].includes(k)).map(([key, val]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.popoverItem,
                  key === setType && { backgroundColor: `${val.color}30`, borderWidth: 1.5, borderColor: val.color },
                ]}
                onPress={() => {
                  onTypeChange?.(key);
                  setShowTypeMenu(false);
                }}
              >
                <Text style={[styles.popoverText, { color: val.color }]}>{val.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Center: Reps × Weight */}
      <View style={styles.centerCol}>
        <View style={styles.inputGroup}>
          <TextInput
            style={[styles.input, completed && styles.inputDone]}
            value={reps?.toString() ?? ''}
            onChangeText={(v) => onRepsChange(v ? parseInt(v) : null)}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor="#555"
            editable={editable && !completed}
            maxLength={3}
          />
          <Text style={styles.inputLabel}>REPS</Text>
        </View>

        <Text style={styles.sep}>×</Text>

        <View style={styles.inputGroup}>
          <TextInput
            style={[styles.input, completed && styles.inputDone]}
            value={weight?.toString() ?? ''}
            onChangeText={(v) => onWeightChange(v ? parseFloat(v) : null)}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor="#555"
            editable={editable && !completed}
            maxLength={5}
          />
          <Text style={styles.inputLabel}>KG</Text>
        </View>
      </View>

      {/* Right: Previous + Check */}
      <View style={styles.rightCol}>
        {prevWeight != null && prevReps != null && (
          <Text style={styles.prevText}>ant: {prevReps}×{prevWeight}kg</Text>
        )}
        <TouchableOpacity
          style={[styles.check, completed && styles.checkDone]}
          onPress={onToggle}
          disabled={!editable || completed}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {completed && <Ionicons name="checkmark" size={16} color="#FFF" />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    paddingLeft: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 3,
  },
  completedRow: { opacity: 0.5 },

  leftCol: { width: 44, alignItems: 'center', marginRight: 8, position: 'relative' },
  ball: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  ballText: { fontSize: 13, fontFamily: fonts.numbersBold },

  typePill: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  typePillText: { fontSize: 9, fontFamily: fonts.numbersBold, letterSpacing: 0.5 },

  popover: {
    position: 'absolute',
    bottom: '100%',
    left: -10,
    marginBottom: 6,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 10,
    padding: 5,
    flexDirection: 'row',
    gap: 4,
    zIndex: 100,
    elevation: 10,
  },
  popoverItem: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  popoverText: { fontSize: 10, fontFamily: fonts.numbersBold },

  centerCol: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  inputGroup: { alignItems: 'center' },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    width: 52,
    height: 38,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: fonts.numbersBold,
    color: '#FFF',
    paddingHorizontal: 4,
  },
  inputDone: { backgroundColor: '#1A2E1A', color: '#22c55e' },
  inputLabel: { fontSize: 9, fontFamily: fonts.numbersBold, color: '#888', letterSpacing: 1, marginTop: 2 },
  sep: { color: '#2A2A2A', fontSize: 20, fontFamily: fonts.numbersBold, marginHorizontal: 2, marginBottom: 12 },

  rightCol: { alignItems: 'flex-end', marginLeft: 8, gap: 4 },
  prevText: { fontSize: 10, fontFamily: fonts.body, color: '#888' },
  check: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
});
