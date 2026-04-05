import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { colors, fonts } from '../tokens';

// ─── Level Colors ───────────────────────────────────────────────
const LEVEL_COLORS: Record<string, string> = {
  Bronze: '#CD7F32',
  Prata: '#A0A0A0',
  Ouro: '#DAA520',
  Platina: '#6BB5C9',
  Diamante: '#5B9BD5',
  Master: '#9B59B6',
};

// ─── Types ──────────────────────────────────────────────────────
interface PostUser {
  id: string;
  nome: string;
  nivel: string;
  unidade: string;
  avatar_url: string | null;
}

interface Post {
  id: string;
  user: PostUser;
  text: string;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  isLiked: boolean;
  created_at: string;
}

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onProfile: (userId: string) => void;
  onOptions: (postId: string) => void;
}

// ─── Helpers ────────────────────────────────────────────────────
function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatTimeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'AGORA';
  if (minutes < 60) return `HA ${minutes} MIN`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `HA ${hours} HORAS`;
  const days = Math.floor(hours / 24);
  return `HA ${days} DIAS`;
}

// ─── Component ──────────────────────────────────────────────────
export default function PostCard({
  post,
  onLike,
  onComment,
  onProfile,
  onOptions,
}: PostCardProps) {
  const levelColor = LEVEL_COLORS[post.user.nivel] || colors.orange;
  const initials = getInitials(post.user.nome);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={() => onProfile(post.user.id)}
          activeOpacity={0.7}
        >
          {post.user.avatar_url ? (
            <Image source={{ uri: post.user.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: levelColor }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{post.user.nome}</Text>
              <View style={[styles.levelBadge, { backgroundColor: levelColor + '26' }]}>
                <Text style={[styles.levelBadgeText, { color: levelColor }]}>
                  {post.user.nivel}
                </Text>
              </View>
            </View>
            <Text style={styles.unitName}>{post.user.unidade}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onOptions(post.id)} activeOpacity={0.6}>
          <Text style={styles.optionsIcon}>⋯</Text>
        </TouchableOpacity>
      </View>

      {/* Image */}
      {post.image_url && (
        <View style={styles.imageContainer}>
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imageEmoji}>💀</Text>
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsRow}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity onPress={() => onLike(post.id)} activeOpacity={0.6} style={styles.actionBtn}>
            <Text style={[styles.heartIcon, post.isLiked && styles.heartActive]}>
              {post.isLiked ? '❤️' : '♡'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onComment(post.id)} activeOpacity={0.6} style={styles.actionBtn}>
            <Text style={styles.commentIcon}>💬</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.6} style={styles.actionBtn}>
            <Text style={styles.shareIcon}>✈</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Likes */}
      <Text style={styles.likesText}>{post.likes_count} curtidas</Text>

      {/* Text */}
      <Text style={styles.postText}>
        <Text style={styles.postTextUser}>{post.user.nome} </Text>
        {post.text}
      </Text>

      {/* Comments */}
      {post.comments_count > 0 && (
        <TouchableOpacity onPress={() => onComment(post.id)} activeOpacity={0.6}>
          <Text style={styles.commentsLink}>
            Ver todos os {post.comments_count} comentarios
          </Text>
        </TouchableOpacity>
      )}

      {/* Time */}
      <Text style={styles.timeText}>{formatTimeAgo(post.created_at)}</Text>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  avatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },
  headerInfo: {
    marginLeft: 10,
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
    color: '#FFFFFF',
  },
  levelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  levelBadgeText: {
    fontSize: 9,
    fontFamily: fonts.bodyBold,
  },
  unitName: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: '#666666',
    marginTop: 1,
  },
  optionsIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    paddingLeft: 12,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#161616',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageEmoji: {
    fontSize: 64,
    opacity: 0.3,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionBtn: {
    padding: 2,
  },
  heartIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  heartActive: {
    color: '#F26522',
  },
  commentIcon: {
    fontSize: 22,
    color: '#FFFFFF',
  },
  shareIcon: {
    fontSize: 22,
    color: '#FFFFFF',
  },
  likesText: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  postText: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: '#cccccc',
    paddingHorizontal: 16,
    lineHeight: 18,
    marginBottom: 4,
  },
  postTextUser: {
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },
  commentsLink: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: '#666666',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: '#444444',
    paddingHorizontal: 16,
    paddingBottom: 12,
    textTransform: 'uppercase',
  },
});
