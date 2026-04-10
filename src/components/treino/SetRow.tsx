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
      {/* Número da série */}
      <View style={[styles.setNum, completed && styles.setNumDone]}>
        <Text style={[styles.setNumText, completed && styles.setNumTextDone]}>{index + 1}</Text>
      </View>

      {/* Peso */}
      <View style={styles.inputCol}>
        <Text style={styles.inputLabel}>KG</Text>
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
      </View>

      {/* Separador */}
      <Text style={styles.sep}>×</Text>

      {/* Reps */}
      <View style={styles.inputCol}>
        <Text style={styles.inputLabel}>REPS</Text>
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
      </View>

      {/* Tempo (se tipo Tempo) */}
      {showTempo && tempoSeconds != null && (
        <>
          <Text style={styles.sep}>×</Text>
          <View style={styles.inputCol}>
            <Text style={styles.inputLabel}>SEG</Text>
            <Text style={styles.tempoValue}>{tempoSeconds}</Text>
          </View>
        </>
      )}

      {/* Check */}
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
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  setNum: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  setNumDone: { backgroundColor: '#F26522' },
  setNumText: { fontSize: 13, fontFamily: fonts.numbersBold, color: '#AAA' },
  setNumTextDone: { color: '#FFF' },

  inputCol: {
    flex: 1,
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 9,
    fontFamily: fonts.bodyBold,
    color: '#666',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    width: '100%',
    height: 40,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: fonts.numbersBold,
    color: '#FFF',
    paddingHorizontal: 4,
  },
  inputDone: {
    backgroundColor: '#1A2E1A',
    color: '#22c55e',
  },

  sep: {
    color: '#555',
    fontSize: 16,
    fontFamily: fonts.numbersBold,
    marginHorizontal: 6,
    marginTop: 14,
  },

  tempoValue: {
    backgroundColor: '#2A1A0A',
    borderRadius: 8,
    width: '100%',
    height: 40,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 40,
    fontSize: 18,
    fontFamily: fonts.numbersBold,
    color: '#F26522',
    overflow: 'hidden',
  },

  check: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  checkDone: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
});
