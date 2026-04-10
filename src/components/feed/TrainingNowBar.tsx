import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { fonts } from '../../tokens';

interface TrainingUser {
  user_id: string;
  name: string;
  avatar_url: string | null;
}

interface Props {
  users: TrainingUser[];
  onUserPress: (userId: string) => void;
}

export default function TrainingNowBar({ users, onUserPress }: Props) {
  if (users.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.dot} />
        <Text style={styles.label}>Treinando agora</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatars}>
        {users.slice(0, 5).map((u) => {
          const initials = u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
          return (
            <TouchableOpacity key={u.user_id} onPress={() => onUserPress(u.user_id)} activeOpacity={0.7}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
        {users.length > 5 && (
          <View style={styles.moreCircle}>
            <Text style={styles.moreText}>+{users.length - 5}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
  label: { fontSize: 13, fontFamily: fonts.bodyBold, color: 'rgba(255,255,255,0.7)' },
  avatars: { flexDirection: 'row', gap: 10 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#2A2A2A',
    borderWidth: 2, borderColor: '#22C55E',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#FFF', fontSize: 14, fontFamily: fonts.bodyBold },
  moreCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#1A1A1A',
    borderWidth: 1, borderColor: '#333',
    alignItems: 'center', justifyContent: 'center',
  },
  moreText: { color: '#888', fontSize: 12, fontFamily: fonts.bodyBold },
});
