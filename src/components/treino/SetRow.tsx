import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../tokens';

interface Props {
  index: number;
  weight: number | null;
  reps: number | null;
  tempoSeconds?: number | null;
  completed: boolean;
  showTempo?: boolean;
  editable?: boolean;
  onToggle: () => void;
  onWeightChange: (val: number | null) => void;
  onRepsChange: (val: number | null) => void;
}

export default function SetRow({
  index, weight, reps, tempoSeconds, completed, showTempo, editable = true,
  onToggle, onWeightChange, onRepsChange,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={[styles.setNum, completed && styles.setNumDone]}>
        <Text style={[styles.setNumText, completed && styles.setNumTextDone]}>{index + 1}</Text>
      </View>

      <View style={styles.values}>
        <View style={styles.valueCol}>
          <TextInput
            style={[styles.valueInput, completed && styles.valueDone]}
            value={weight?.toString() ?? ''}
            onChangeText={(v) => onWeightChange(v ? parseFloat(v) : null)}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor="#555"
            editable={editable && !completed}
          />
          <Text style={styles.valueLabel}>KG</Text>
        </View>

        <Text style={styles.sep}>×</Text>

        <View style={styles.valueCol}>
          <TextInput
            style={[styles.valueInput, completed && styles.valueDone]}
            value={reps?.toString() ?? ''}
            onChangeText={(v) => onRepsChange(v ? parseInt(v) : null)}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor="#555"
            editable={editable && !completed}
          />
          <Text style={styles.valueLabel}>REPS</Text>
        </View>

        {showTempo && tempoSeconds != null && (
          <>
            <Text style={styles.sep}>×</Text>
            <View style={styles.valueCol}>
              <Text style={styles.tempoValue}>{tempoSeconds}s</Text>
              <Text style={styles.valueLabel}>TEMPO</Text>
            </View>
          </>
        )}
      </View>

      <TouchableOpacity
        style={[styles.check, completed && styles.checkDone]}
        onPress={onToggle}
        disabled={!editable}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {completed && <Ionicons name="checkmark" size={18} color="#FFF" />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 6,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  setNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center' },
  setNumDone: { backgroundColor: '#F26522' },
  setNumText: { fontSize: 12, fontFamily: fonts.numbersBold, color: '#AAA' },
  setNumTextDone: { color: '#FFF' },
  values: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  valueCol: { alignItems: 'center' },
  valueInput: { fontSize: 16, fontFamily: fonts.numbersBold, color: '#FFF', textAlign: 'center', minWidth: 40, padding: 0 },
  valueDone: { color: '#22c55e' },
  valueLabel: { fontSize: 9, fontFamily: fonts.bodyMedium, color: '#777', textTransform: 'uppercase', marginTop: 1 },
  sep: { color: '#444', fontSize: 14 },
  tempoValue: { fontSize: 16, fontFamily: fonts.numbersBold, color: '#F26522' },
  check: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: '#333', alignItems: 'center', justifyContent: 'center' },
  checkDone: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
});
