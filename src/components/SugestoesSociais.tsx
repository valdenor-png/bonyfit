import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';

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
interface Sugestao {
  id: string;
  name: string;
  level: string;
  horario: string;
  treinos: number;
}

interface SugestoesSociaisProps {
  sugestoes: Sugestao[];
  onFollow: (userId: string) => void;
}

// ─── Mock Data ─────────────────────────────────────────────────
export const MOCK_SUGESTOES: Sugestao[] = [
  { id: 'sg1', name: 'Fernando Costa', level: 'Ouro', horario: '18h-19h', treinos: 12 },
  { id: 'sg2', name: 'Beatriz Lima', level: 'Prata', horario: '19h-20h', treinos: 8 },
];

// ─── Helpers ───────────────────────────────────────────────────
function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── Component ─────────────────────────────────────────────────
export default function SugestoesSociais({ sugestoes, onFollow }: SugestoesSociaisProps) {
  const data = sugestoes.length > 0 ? sugestoes.slice(0, 2) : MOCK_SUGESTOES;

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>🕐 TREINA NO SEU HORARIO</Text>

      {/* User Cards */}
      {data.map((user) => {
        const levelColor = LEVEL_COLORS[user.level] || colors.orange;
        return (
          <View key={user.id} style={styles.userCard}>
            <View style={styles.userLeft}>
              <View style={[styles.avatar, { backgroundColor: levelColor }]}>
                <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
              </View>
              <View style={styles.userInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <View style={[styles.levelBadge, { backgroundColor: levelColor + '26' }]}>
                    <Text style={[styles.levelText, { color: levelColor }]}>
                      {user.level}
                    </Text>
                  </View>
                </View>
                <Text style={styles.details}>
                  Treina {user.horario} · {user.treinos} treinos juntos
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.followBtn}
              onPress={() => onFollow(user.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.followText}>SEGUIR</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginVertical: spacing.sm,
  },
  header: {
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  userLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },
  userInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  levelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  levelText: {
    fontSize: 9,
    fontFamily: fonts.bodyBold,
  },
  details: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  followBtn: {
    borderWidth: 1.5,
    borderColor: colors.orange,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  followText: {
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    color: colors.orange,
    letterSpacing: 0.5,
  },
});
