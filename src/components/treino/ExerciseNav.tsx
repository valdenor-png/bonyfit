import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { fonts } from '../../tokens';

interface Props {
  prevName?: string;
  nextName?: string;
  isLast: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  onFinish?: () => void;
}

export default function ExerciseNav({ prevName, nextName, isLast, onPrev, onNext, onFinish }: Props) {
  return (
    <View style={styles.container}>
      {prevName && onPrev && (
        <TouchableOpacity style={styles.prevBtn} onPress={onPrev} activeOpacity={0.7}>
          <Text style={styles.prevText} numberOfLines={1}>← {prevName}</Text>
        </TouchableOpacity>
      )}
      {isLast ? (
        <TouchableOpacity style={styles.finishBtn} onPress={onFinish} activeOpacity={0.7}>
          <Text style={styles.finishText}>Finalizar ✓</Text>
        </TouchableOpacity>
      ) : (
        nextName && onNext && (
          <TouchableOpacity style={styles.nextBtn} onPress={onNext} activeOpacity={0.7}>
            <Text style={styles.nextText} numberOfLines={1}>{nextName} →</Text>
          </TouchableOpacity>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 4, marginBottom: 20 },
  prevBtn: { flex: 1, backgroundColor: '#222', padding: 12, borderRadius: 12, alignItems: 'center' },
  prevText: { color: '#CCC', fontSize: 13, fontFamily: fonts.body },
  nextBtn: { flex: 1, backgroundColor: '#F26522', padding: 12, borderRadius: 12, alignItems: 'center' },
  nextText: { color: '#FFF', fontSize: 13, fontFamily: fonts.bodyBold },
  finishBtn: { flex: 1, backgroundColor: '#22C55E', padding: 12, borderRadius: 12, alignItems: 'center' },
  finishText: { color: '#FFF', fontSize: 13, fontFamily: fonts.bodyBold },
});
