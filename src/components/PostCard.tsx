import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';
import type { Post } from '../types/social';
import Skull from './Skull';

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  onProfilePress: (userId: string) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function PostCard({
  post,
  onLike,
  onComment,
  onShare,
  onProfilePress,
}: PostCardProps) {
  const initials = getInitials(post.user_name);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => onProfilePress(post.user_id)}
          style={styles.profileRow}
        >
          {post.user_avatar ? (
            <Image
              source={{ uri: post.user_avatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{post.user_name}</Text>
              {post.points_earned > 0 && (
                <View style={styles.pointsBadge}>
                  <Text style={styles.pointsBadgeText}>
                    +{post.points_earned} pts
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.meta}>
              {post.unit_name} · {timeAgo(post.created_at)}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Image area */}
      {post.image_url ? (
        <Image
          source={{ uri: post.image_url }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Skull size={48} opacity={0.3} />
        </View>
      )}

      {/* Text content */}
      {post.text.length > 0 && (
        <Text style={styles.text}>{post.text}</Text>
      )}

      {/* Hashtags */}
      {post.hashtags.length > 0 && (
        <View style={styles.hashtagRow}>
          {post.hashtags.map((tag) => (
            <Text key={tag} style={styles.hashtag}>
              #{tag}
            </Text>
          ))}
        </View>
      )}

      {/* Action bar */}
      <View style={styles.actionBar}>
        <Pressable
          onPress={() => onLike(post.id)}
          style={styles.actionButton}
        >
          <Text
            style={[
              styles.actionIcon,
              post.liked_by_me && styles.actionIconActive,
            ]}
          >
            {post.liked_by_me ? '♥' : '♡'}
          </Text>
          <Text
            style={[
              styles.actionCount,
              post.liked_by_me && styles.actionCountActive,
            ]}
          >
            {post.likes_count}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onComment(post.id)}
          style={styles.actionButton}
        >
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionCount}>{post.comments_count}</Text>
        </Pressable>

        <Pressable
          onPress={() => onShare(post.id)}
          style={styles.actionButton}
        >
          <Text style={styles.actionIcon}>↗</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
  },
  headerInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  pointsBadge: {
    backgroundColor: 'rgba(242,101,34,0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  pointsBadgeText: {
    color: colors.orange,
    fontFamily: fonts.numbersBold,
    fontSize: 11,
  },
  meta: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  image: {
    width: '100%',
    height: 200,
  },
  imagePlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  hashtagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  hashtag: {
    color: colors.orange,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: spacing.xl,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionIcon: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  actionIconActive: {
    color: colors.danger,
  },
  actionCount: {
    color: colors.textSecondary,
    fontFamily: fonts.numbers,
    fontSize: 13,
  },
  actionCountActive: {
    color: colors.danger,
  },
});
