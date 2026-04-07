import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { colors, fonts, spacing } from '../tokens';

// ─── Level Colors ──────────────────────────────────────────────
const LEVEL_COLORS: Record<string, string> = {
  Bronze: '#CD7F32',
  Prata: '#A0A0A0',
  Ouro: '#DAA520',
  Platina: '#6BB5C9',
  Diamante: '#5B9BD5',
  Master: '#9B59B6',
};

// ─── Types ─────────────────────────────────────────────────────
interface TrainingUser {
  id: string;
  name: string;
  level: string;
  avatar_url: string | null;
}

interface TreinandoAgoraProps {
  users: TrainingUser[];
  onPress: (userId: string) => void;
}

// ─── Mock Data ─────────────────────────────────────────────────
export const MOCK_TRAINING_USERS: TrainingUser[] = [
  { id: 't1', name: 'Carlos Mendes', level: 'Ouro', avatar_url: null },
  { id: 't2', name: 'Ana Paula', level: 'Prata', avatar_url: null },
  { id: 't3', name: 'Rafael Silva', level: 'Diamante', avatar_url: null },
  { id: 't4', name: 'Julia Rocha', level: 'Bronze', avatar_url: null },
  { id: 't5', name: 'Pedro Lima', level: 'Platina', avatar_url: null },
  { id: 't6', name: 'Mariana Ferreira', level: 'Ouro', avatar_url: null },
  { id: 't7', name: 'Lucas Gomes', level: 'Master', avatar_url: null },
  { id: 't8', name: 'Camila Santos', level: 'Prata', avatar_url: null },
];

// ─── Pulsing Dot ───────────────────────────────────────────────
function PulsingDot() {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return <Animated.View style={[styles.greenDot, { opacity }]} />;
}

// ─── Helpers ───────────────────────────────────────────────────
function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── Component ─────────────────────────────────────────────────
export default function TreinandoAgora({ users, onPress }: TreinandoAgoraProps) {
  const MAX_VISIBLE = 6;
  const visibleUsers = users.slice(0, MAX_VISIBLE);
  const extraCount = users.length - MAX_VISIBLE;

  const renderItem = ({ item }: { item: TrainingUser }) => {
    const levelColor = LEVEL_COLORS[item.level] || colors.orange;
    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => onPress(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: levelColor }]}>
            <Text style={styles.initials}>{getInitials(item.name)}</Text>
          </View>
          <PulsingDot />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>
        🟢 TREINANDO AGORA ({users.length})
      </Text>

      {/* Horizontal List */}
      <FlatList
        data={visibleUsers}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListFooterComponent={
          extraCount > 0 ? (
            <TouchableOpacity style={styles.extraCard} activeOpacity={0.7}>
              <Text style={styles.extraText}>+{extraCount}</Text>
            </TouchableOpacity>
          ) : null
        }
      />
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  header: {
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    color: colors.success,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 16,
    marginBottom: spacing.sm,
  },
  list: {
    paddingHorizontal: 12,
    gap: 12,
  },
  userItem: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },
  greenDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.bg,
  },
  extraCard: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraText: {
    fontSize: 13,
    fontFamily: fonts.numbersBold,
    color: colors.textSecondary,
  },
});
