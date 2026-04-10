import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../tokens';

interface Props {
  name: string;
  muscleGroup: string;
  setType: string;
  setsInfo: string; // e.g. "4 séries · 12 reps"
  status: 'pending' | 'partial' | 'complete';
  active?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  normal: 'Normal',
  dropset: 'Drop Set',
  tempo: 'Tempo',
  failure: 'Até Falha',
};

export default function ExerciseListItem({ name, muscleGroup, setType, setsInfo, status, active, disabled, onPress }: Props) {
  const iconBg = status === 'complete' ? '#22c55e' : status === 'partial' ? '#F26522' : '#222';

  return (
    <TouchableOpacity
      style={[styles.container, active && styles.active]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <View style={[styles.icon, { backgroundColor: iconBg }]}>
        {status === 'complete' ? (
          <Ionicons name="checkmark" size={20} color="#FFF" />
        ) : (
          <Ionicons name="barbell-outline" size={20} color={status === 'partial' ? '#FFF' : '#888'} />
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{name}</Text>
        <Text style={styles.subtitle}>{setsInfo}</Text>
        <View style={styles.badges}>
          <View style={styles.muscleBadge}>
            <Text style={styles.muscleBadgeText}>{muscleGroup}</Text>
          </View>
          {setType !== 'normal' && (
            <Text style={[styles.typeBadge, setType === 'tempo' && { color: '#F26522' }]}>
              {TYPE_LABELS[setType] ?? setType}
            </Text>
          )}
        </View>
      </View>
      {!disabled && <Ionicons name="chevron-forward" size={16} color="#444" />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  active: { borderWidth: 1.5, borderColor: '#F26522' },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  title: { fontSize: 14, fontFamily: fonts.bodyBold, color: '#FFF' },
  subtitle: { fontSize: 11, fontFamily: fonts.body, color: '#888', marginTop: 2 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  muscleBadge: { backgroundColor: 'rgba(242,101,34,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  muscleBadgeText: { color: '#F26522', fontSize: 10, fontFamily: fonts.bodyBold },
  typeBadge: { fontSize: 11, fontFamily: fonts.body, color: '#666' },
});
