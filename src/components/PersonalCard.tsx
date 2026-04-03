import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';
import type { Trainer } from '../types/payment';

interface PersonalCardProps {
  trainer: Trainer;
}

function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '☆' : '') + '☆'.repeat(empty);
}

function formatSinceTime(timeStr: string | null): string {
  if (!timeStr) return '';
  // Expects ISO or HH:MM format
  try {
    const date = new Date(timeStr);
    if (!isNaN(date.getTime())) {
      return `Desde ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
  } catch {
    // fallback
  }
  return `Desde ${timeStr}`;
}

export default function PersonalCard({ trainer }: PersonalCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {trainer.avatar_url ? (
            <Image
              source={{ uri: trainer.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>
                {trainer.name[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
          {trainer.on_floor && <View style={styles.onlineDot} />}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.name}>{trainer.name}</Text>
          <Text style={styles.specialty}>{trainer.specialty}</Text>

          <View style={styles.metaRow}>
            {trainer.since_time && (
              <Text style={styles.metaText}>
                {formatSinceTime(trainer.since_time)}
              </Text>
            )}
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.stars}>{renderStars(trainer.rating)}</Text>
            <Text style={styles.metaText}>
              · {trainer.students_count} alunos
            </Text>
          </View>
        </View>

        {/* Floor badge */}
        {trainer.on_floor && (
          <View style={styles.floorBadge}>
            <Text style={styles.floorBadgeText}>No salão</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(242,101,34,0.2)',
  },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(242,101,34,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: colors.orange,
    fontFamily: fonts.bodyBold,
    fontSize: 20,
  },
  onlineDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.card,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
  },
  specialty: {
    color: colors.orange,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  metaText: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  stars: {
    color: colors.warning,
    fontSize: 12,
  },
  floorBadge: {
    backgroundColor: 'rgba(46,204,113,0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  floorBadgeText: {
    color: colors.success,
    fontFamily: fonts.numbersBold,
    fontSize: 11,
  },
});
