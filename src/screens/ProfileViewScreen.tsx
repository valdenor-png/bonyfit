import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Share,
} from 'react-native';
import CrossPlatformModal from '../components/ui/CrossPlatformModal';
import { colors, fonts, spacing, radius } from '../tokens';
import ScreenBackground from '../components/ScreenBackground';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import SocialIconsBar from '../components/profile/SocialIconsBar';
import { getLevelColor, getLevelIcon } from '../constants/levels';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 2;
const GRID_ITEM_SIZE = (SCREEN_WIDTH - GRID_GAP * 2) / 3;

interface Props {
  navigation: any;
  route: { params: { userId: string } };
}

export default function ProfileViewScreen({ navigation, route }: Props) {
  const { userId } = route.params;
  const { user: currentUser } = useAuth();

  // ── State ──────────────────────────────────────────────────
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [posts, setPosts] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // ── Load profile data ──────────────────────────────────────
  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      // Profile
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      setProfile(userData);

      // Counts
      const [
        { count: fwers },
        { count: fwing },
        { count: pCount },
      ] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      ]);
      setFollowersCount(fwers ?? 0);
      setFollowingCount(fwing ?? 0);
      setPostsCount(pCount ?? 0);

      // Am I following this user?
      if (currentUser?.id) {
        const { data: followData } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', currentUser.id)
          .eq('following_id', userId)
          .maybeSingle();
        setIsFollowing(!!followData);
      }

      // Posts
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      setPosts(postsData || []);

      // Badges
      const { data: badgesData } = await supabase
        .from('user_badges')
        .select('*, badges(*)')
        .eq('user_id', userId);
      setBadges(badgesData || []);
    } catch {
      // keep defaults
    } finally {
      setLoading(false);
    }
  }, [userId, currentUser?.id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const isOwnProfile = currentUser?.id === userId;

  // ── Follow/Unfollow ────────────────────────────────────────
  const handleFollow = async () => {
    if (!currentUser?.id || followLoading || isOwnProfile) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', userId);
        setIsFollowing(false);
        setFollowersCount((c) => Math.max(0, c - 1));
      } else {
        await supabase
          .from('follows')
          .insert({ follower_id: currentUser.id, following_id: userId });
        setIsFollowing(true);
        setFollowersCount((c) => c + 1);
      }
    } catch {
      // revert silently
    } finally {
      setFollowLoading(false);
    }
  };

  // ── Block/Report ───────────────────────────────────────────
  const handleBlock = async () => {
    setShowMenu(false);
    if (!currentUser?.id) return;
    await supabase.from('blocks').insert({ blocker_id: currentUser.id, blocked_id: userId });
    navigation.goBack();
  };

  const handleReport = async () => {
    setShowMenu(false);
    if (!currentUser?.id) return;
    await supabase.from('reports').insert({ reporter_id: currentUser.id, reported_id: userId, reason: 'conteudo_improprio' });
  };

  // ── Derived values ─────────────────────────────────────────
  if (loading || !profile) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.orange} size="large" />
      </View>
    );
  }

  const level = profile.level || 'Bronze';
  const levelColor = getLevelColor(level);
  const levelIcon = getLevelIcon(level);
  const points = profile.total_points ?? profile.points ?? 0;
  const name = profile.name || 'Usuário';
  const username = profile.username;
  const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
  const streak = profile.current_streak ?? profile.streak ?? 0;
  const totalWorkouts = profile.total_workouts ?? 0;

  // ── Share handler ──────────────────────────────────────────
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Confira o perfil de ${name} no Bony Fit! Level ${level} com ${points.toLocaleString('pt-BR')} pontos`,
      });
    } catch {}
  };

  // ── Render helpers ──────────────────────────────────────────
  const renderAvatar = () => {
    if (profile.avatar_url) {
      return (
        <View style={[styles.avatarRing, { borderColor: levelColor }]}>
          <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
        </View>
      );
    }
    return (
      <View style={[styles.avatarRing, { borderColor: levelColor }]}>
        <View style={[styles.avatarFallback, { backgroundColor: levelColor + '33' }]}>
          <Text style={[styles.avatarInitials, { color: levelColor }]}>{initials}</Text>
        </View>
      </View>
    );
  };

  const renderStatItem = (value: number | string, label: string, onPress?: () => void) => (
    <TouchableOpacity
      style={styles.headerStatItem}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <Text style={styles.headerStatValue}>{value}</Text>
      <Text style={styles.headerStatLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScreenBackground>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── Header: back + username + menu ─────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backArrow}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>{username || name}</Text>
        <TouchableOpacity onPress={() => setShowMenu(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.menuDots}>{'\u22EE'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── A) Avatar + Stats row ──────────────────────────── */}
      <View style={styles.headerRow}>
        {renderAvatar()}
        <View style={styles.headerStats}>
          {renderStatItem(postsCount, 'posts')}
          {renderStatItem(
            followersCount,
            'seguidores',
            () => navigation.navigate('FollowersList', { type: 'followers', userId }),
          )}
          {renderStatItem(
            followingCount,
            'seguindo',
            () => navigation.navigate('FollowersList', { type: 'following', userId }),
          )}
        </View>
      </View>

      {/* ── B) User info ───────────────────────────────────── */}
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{name}</Text>

        <View style={[styles.levelPill, { backgroundColor: levelColor + '22' }]}>
          <Text style={styles.levelPillText}>
            {levelIcon} {level} {'\u00B7'} {points.toLocaleString('pt-BR')} pts
          </Text>
        </View>

        <Text style={styles.unitText}>{'\u{1F4CD}'} Bony Fit {'\u2014'} Centro</Text>
        <Text style={styles.streakText}>{'\u{1F525}'} Streak: {streak} dias</Text>
      </View>

      {/* ── Social links ───────────────────────────────────── */}
      <SocialIconsBar userId={userId} editable={false} />

      {/* ── C) Action buttons ──────────────────────────────── */}
      <View style={styles.actionRow}>
        {isOwnProfile ? (
          <>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('EditarPerfil')}
              activeOpacity={0.7}
            >
              <Text style={styles.editBtnText}>Editar perfil</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <Text style={styles.editBtnText}>Compartilhar</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.followBtn, isFollowing && styles.followBtnActive]}
              onPress={handleFollow}
              activeOpacity={0.7}
              disabled={followLoading}
            >
              <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
                {isFollowing ? 'Seguindo' : 'Seguir'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.messageBtn}
              onPress={() => navigation.navigate('Chat', { userId, userName: name })}
              activeOpacity={0.7}
            >
              <Text style={styles.messageBtnText}>Mensagem</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* ── D) Training stats card ─────────────────────────── */}
      <View style={styles.trainingCard}>
        <View style={styles.trainingStatItem}>
          <Text style={styles.trainingStatValue}>{'\u{1F3CB}\u{FE0F}'} {totalWorkouts}</Text>
          <Text style={styles.trainingStatLabel}>treinos</Text>
        </View>
        <View style={styles.trainingStatItem}>
          <Text style={styles.trainingStatValue}>{'\u{1F4CA}'} {(totalWorkouts * 1.2).toFixed(1)}t</Text>
          <Text style={styles.trainingStatLabel}>volume</Text>
        </View>
        <View style={styles.trainingStatItem}>
          <Text style={styles.trainingStatValue}>{'\u{1F525}'} {streak}</Text>
          <Text style={styles.trainingStatLabel}>streak max</Text>
        </View>
      </View>

      {/* ── E) Conquistas ──────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Conquistas</Text>
      {badges.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.badgesRow}
        >
          {badges.map((b: any, idx: number) => (
            <View key={idx} style={styles.badgeItem}>
              <Text style={styles.badgeEmoji}>{b.badges?.emoji || '\u{1F3C6}'}</Text>
              <Text style={styles.badgeLabel}>{b.badges?.label || b.badge_id}</Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyBadges}>
          <Text style={styles.emptyBadgesText}>Nenhuma conquista ainda</Text>
        </View>
      )}

      {/* ── F) Feed do usuário ─────────────────────────────── */}
      <Text style={styles.sectionTitle}>Posts</Text>
      {posts.length > 0 ? (
        posts.map((post: any) => (
          <View key={post.id} style={styles.postCard}>
            {/* Post header */}
            <View style={styles.postHeader}>
              <View style={styles.postAvatar}>
                <Text style={styles.postAvatarText}>{initials}</Text>
              </View>
              <View style={styles.postHeaderInfo}>
                <Text style={styles.postUserName}>{name}</Text>
                <Text style={styles.postTime}>
                  {formatTimeAgo(post.created_at)}
                </Text>
              </View>
            </View>

            {/* Post text */}
            {post.text ? <Text style={styles.postText}>{post.text}</Text> : null}

            {/* Workout metadata card */}
            {post.post_type === 'treino' && post.metadata && (
              <View style={styles.workoutMetaCard}>
                <View style={styles.workoutTitleRow}>
                  <View style={styles.trophyBox}>
                    <Text style={{ fontSize: 14 }}>{'\u{1F3C6}'}</Text>
                  </View>
                  <View>
                    <Text style={styles.workoutCompleteLabel}>Treino completo</Text>
                    <Text style={styles.workoutSplitName}>
                      {post.metadata.splitLabel ? `${post.metadata.splitLabel} — ` : ''}
                      {post.metadata.splitNome || post.metadata.splitName || 'Treino'}
                    </Text>
                  </View>
                </View>
                <View style={styles.workoutStatsRow}>
                  {post.metadata.duracao && (
                    <Text style={styles.workoutStat}>{post.metadata.duracao}min</Text>
                  )}
                  {post.metadata.volume && (
                    <Text style={styles.workoutStat}>{post.metadata.volume}kg</Text>
                  )}
                  {post.metadata.exercicios && (
                    <Text style={styles.workoutStat}>{post.metadata.exercicios} exerc.</Text>
                  )}
                </View>
              </View>
            )}

            {/* Post actions */}
            <View style={styles.postActions}>
              <Text style={styles.postActionText}>{'\u{1F4AA}'} {post.likes_count || 0}</Text>
              <Text style={styles.postActionText}>{'\u{1F4AC}'} {post.comments_count || 0}</Text>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>{'\u{1F4ED}'}</Text>
          <Text style={styles.emptyText}>Nenhum post ainda</Text>
        </View>
      )}
    </ScrollView>

    {/* ── Menu Modal ──────────────────────────────────────── */}
    <CrossPlatformModal visible={showMenu} transparent animationType="fade">
      <TouchableOpacity
        style={styles.menuOverlay}
        activeOpacity={1}
        onPress={() => setShowMenu(false)}
      >
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} onPress={handleBlock}>
            <Text style={styles.menuItemDanger}>{'\u{1F6AB}'} Bloquear usuário</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handleReport}>
            <Text style={styles.menuItemDanger}>{'\u26A0\uFE0F'} Denunciar conteúdo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemLast]}
            onPress={() => setShowMenu(false)}
          >
            <Text style={styles.menuItemCancel}>{'\u2715'} Cancelar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </CrossPlatformModal>
    </ScreenBackground>
  );
}

// ── Time formatter ────────────────────────────────────────────
function formatTimeAgo(dateString: string): string {
  if (!dateString) return '';
  const diff = Date.now() - new Date(dateString).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return `há ${d}d`;
}

// ── Styles (matching ProfileScreen) ──────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingBottom: spacing.xxl + 40,
  },

  /* Top bar */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  backArrow: {
    fontSize: 22,
    color: colors.text,
  },
  topBarTitle: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  menuDots: {
    fontSize: 22,
    color: colors.textSecondary,
  },

  /* A) Header row */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  avatarRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarFallback: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 28,
    fontFamily: fonts.bodyBold,
  },
  headerStats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: spacing.xl,
  },
  headerStatItem: {
    alignItems: 'center',
  },
  headerStatValue: {
    fontSize: 18,
    fontFamily: fonts.numbersBold,
    color: colors.text,
  },
  headerStatLabel: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: '#888888',
    marginTop: 2,
  },

  /* B) User info */
  userInfo: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  userName: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  levelPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    marginBottom: spacing.xs,
  },
  levelPillText: {
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  unitText: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  streakText: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },

  /* C) Action buttons */
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: 12,
    marginBottom: spacing.xl,
  },
  editBtn: {
    flex: 1,
    height: 40,
    backgroundColor: colors.elevated,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },
  followBtn: {
    flex: 1,
    height: 40,
    backgroundColor: '#F26522',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followBtnActive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#F26522',
  },
  followBtnText: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },
  followBtnTextActive: {
    color: '#F26522',
  },
  messageBtn: {
    flex: 1,
    height: 40,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBtnText: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },

  /* D) Training stats card */
  trainingCard: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: radius.md,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    padding: spacing.lg,
  },
  trainingStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  trainingStatValue: {
    fontSize: 14,
    fontFamily: fonts.numbersBold,
    color: colors.text,
    marginBottom: 2,
  },
  trainingStatLabel: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.textMuted,
  },

  /* E) Badges */
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  badgesRow: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  badgeItem: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.md,
    width: 72,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  badgeEmoji: {
    fontSize: 24,
  },
  badgeLabel: {
    fontSize: 10,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyBadges: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  emptyBadgesText: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textMuted,
  },

  /* F) Posts */
  postCard: {
    backgroundColor: '#141414',
    borderRadius: 16,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a1008',
    borderWidth: 1.5,
    borderColor: 'rgba(242,101,34,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAvatarText: {
    fontFamily: fonts.numbersBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  postHeaderInfo: {
    flex: 1,
  },
  postUserName: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  postTime: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: 'rgba(255,255,255,0.30)',
    marginTop: 2,
  },
  postText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.70)',
    lineHeight: 20,
    marginBottom: 10,
  },
  workoutMetaCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  workoutTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  trophyBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(242,101,34,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutCompleteLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: '#F26522',
  },
  workoutSplitName: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.50)',
  },
  workoutStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  workoutStat: {
    fontFamily: fonts.numbersBold,
    fontSize: 12,
    color: 'rgba(255,255,255,0.60)',
  },
  postActions: {
    flexDirection: 'row',
    gap: 16,
  },
  postActionText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.40)',
  },

  /* Empty state */
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: '#666666',
  },

  /* Menu modal */
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  menuCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  menuItem: {
    padding: spacing.xl,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.elevated,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemDanger: {
    fontSize: 15,
    fontFamily: fonts.bodyMedium,
    color: colors.danger,
    textAlign: 'center',
  },
  menuItemCancel: {
    fontSize: 15,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
