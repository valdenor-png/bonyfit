import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import LevelBadge from './LevelBadge';
import WorkoutCard from './WorkoutCard';

interface PostUser {
  id: string;
  name: string;
  username?: string;
  level: string;
  unit?: string;
  avatar_url?: string | null;
}

interface PostMetadata {
  splitLabel?: string;
  splitName?: string;
  duration?: number;
  volume?: number;
  exercises?: number;
  sets?: number;
}

interface Props {
  user: PostUser;
  text?: string;
  metadata?: PostMetadata;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  timeAgo: string;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onUserPress: () => void;
  onMenuPress: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length <= 1) return (parts[0]?.[0] ?? '?').toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatCount(n: number): string {
  if (!n) return '';
  if (n < 1000) return n.toString();
  return (n / 1000).toFixed(1).replace('.0', '') + 'k';
}

function WorkoutPostCard({
  user,
  text,
  metadata,
  likesCount,
  commentsCount,
  isLiked,
  timeAgo,
  onLike,
  onComment,
  onShare,
  onUserPress,
  onMenuPress,
}: Props) {
  const likeScale = React.useRef(new Animated.Value(1)).current;

  const handleLikePress = () => {
    Animated.sequence([
      Animated.timing(likeScale, { toValue: 1.3, duration: 150, useNativeDriver: true }),
      Animated.timing(likeScale, { toValue: 1.0, duration: 150, useNativeDriver: true }),
    ]).start();
    onLike();
  };

  return (
    <View style={styles.container}>
      {/* ── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onUserPress} activeOpacity={0.7}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerInfo} onPress={onUserPress} activeOpacity={0.7}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{user.username || user.name}</Text>
            <LevelBadge level={user.level} />
            {user.unit && <Text style={styles.unitTag}>Un. {user.unit}</Text>}
          </View>
          <Text style={styles.timeAgo}>{timeAgo}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onMenuPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.menuDots}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* ── Text ───────────────────────────────────────── */}
      {text ? <Text style={styles.postText}>{text}</Text> : null}

      {/* ── Workout Card ───────────────────────────────── */}
      {metadata && (
        <WorkoutCard
          splitLabel={metadata.splitLabel}
          splitName={metadata.splitName}
          duration={metadata.duration}
          volume={metadata.volume}
          exercises={metadata.exercises}
          sets={metadata.sets}
        />
      )}

      {/* ── Actions ────────────────────────────────────── */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLikePress} activeOpacity={0.6}>
          <Animated.View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, transform: [{ scale: likeScale }] }}>
            <Text style={[styles.actionIcon, isLiked && styles.actionLiked]}>💪</Text>
            <Text style={[styles.actionCount, isLiked && styles.actionLiked]}>
              {formatCount(likesCount)}
            </Text>
          </Animated.View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={onComment} activeOpacity={0.6}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionCount}>{formatCount(commentsCount)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { marginLeft: 'auto' }]}
          onPress={onShare}
          activeOpacity={0.6}
        >
          <Text style={styles.actionIcon}>↗</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'transparent',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a1008',
    borderWidth: 1.5,
    borderColor: 'rgba(242,101,34,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  userName: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  unitTag: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 10,
    color: 'rgba(255,255,255,0.20)',
  },
  timeAgo: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.30)',
    marginTop: 2,
  },
  menuDots: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.30)',
    paddingHorizontal: 4,
  },
  // Text
  postText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.70)',
    lineHeight: 20,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  // Actions
  actions: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 12,
    paddingHorizontal: 24,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.40)',
  },
  actionCount: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.40)',
  },
  actionLiked: {
    color: '#F26522',
  },
});

export default React.memo(WorkoutPostCard);
