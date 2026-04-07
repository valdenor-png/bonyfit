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
  Share,
  ActivityIndicator,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';
import ScreenBackground from '../components/ScreenBackground';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 2;
const GRID_ITEM_SIZE = (SCREEN_WIDTH - GRID_GAP * 2) / 3;

// ── Level config ──────────────────────────────────────────────
const LEVEL_COLORS: Record<string, string> = {
  Bronze: '#CD7F32',
  Prata: '#C0C0C0',
  Ouro: '#FFD700',
  Platina: '#3B82F6',
  Diamante: '#A855F7',
  Master: '#E74C3C',
};

const LEVEL_ICONS: Record<string, string> = {
  Bronze: '\u{1F949}',
  Prata: '\u{1F948}',
  Ouro: '\u{1F947}',
  Platina: '\u{1F4A0}',
  Diamante: '\u{1F48E}',
  Master: '\u{1F451}',
};

// ── Mock data ─────────────────────────────────────────────────
const MOCK_TREINO_POSTS = [
  { id: 't1', label: 'Peito + Tri', volume: '8.2t', color: '#F26522' },
  { id: 't2', label: 'Costas + Bi', volume: '7.5t', color: '#3B82F6' },
  { id: 't3', label: 'Pernas', volume: '12.1t', color: '#2ECC71' },
  { id: 't4', label: 'Ombros', volume: '5.3t', color: '#A855F7' },
  { id: 't5', label: 'Full Body', volume: '9.8t', color: '#E74C3C' },
];

const MOCK_FOTO_POSTS = [
  { id: 'f1' },
  { id: 'f2' },
];

const ACHIEVEMENTS = [
  { emoji: '\u{1F525}', label: 'Streak 7d', unlocked: true },
  { emoji: '\u{1F4AA}', label: '1o treino', unlocked: true },
  { emoji: '\u{1F3C6}', label: 'Top 10', unlocked: true },
  { emoji: '\u{26A1}', label: 'Madrugador', unlocked: true },
  { emoji: '\u{1F451}', label: 'Diamante', unlocked: false },
  { emoji: '\u{1F3AF}', label: 'Streak 30d', unlocked: false },
  { emoji: '\u{1F48E}', label: '100 treinos', unlocked: false },
  { emoji: '\u{1F31F}', label: '50k pontos', unlocked: false },
];

const MOCK_PRS = [
  { exercise: 'Supino Reto', value: '100 kg' },
  { exercise: 'Agachamento', value: '140 kg' },
  { exercise: 'Levantamento Terra', value: '160 kg' },
  { exercise: 'Desenvolvimento', value: '60 kg' },
];

// ── Tabs ──────────────────────────────────────────────────────
type TabKey = 'treinos' | 'fotos' | 'stats';
const TABS: { key: TabKey; icon: string; label: string }[] = [
  { key: 'treinos', icon: '\u{1F3CB}\u{FE0F}', label: 'Treinos' },
  { key: 'fotos', icon: '\u{1F4F8}', label: 'Fotos' },
  { key: 'stats', icon: '\u{1F4CA}', label: 'Stats' },
];

interface Props {
  navigation: any;
}

export default function ProfileScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('treinos');
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const level = user?.level || 'Bronze';
  const levelColor = LEVEL_COLORS[level] || LEVEL_COLORS.Bronze;
  const levelIcon = LEVEL_ICONS[level] || LEVEL_ICONS.Bronze;
  const points = user?.points ?? 0;
  const name = user?.name || 'Usuario';
  const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
  const streak = user?.current_streak ?? user?.streak ?? 0;
  const totalWorkouts = user?.total_workouts ?? 0;
  const postsCount = MOCK_TREINO_POSTS.length + MOCK_FOTO_POSTS.length;

  // ── Load follower counts ────────────────────────────────────
  const loadCounts = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [{ count: fwers }, { count: fwing }] = await Promise.all([
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', user.id),
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', user.id),
      ]);
      setFollowersCount(fwers ?? 0);
      setFollowingCount(fwing ?? 0);
    } catch {
      // keep defaults
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  // ── Share handler ───────────────────────────────────────────
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Confira meu perfil no Bony Fit! ${name} - Level ${level} com ${points.toLocaleString('pt-BR')} pontos`,
      });
    } catch {
      // cancelled
    }
  };

  // ── Render helpers ──────────────────────────────────────────
  const renderAvatar = () => {
    if (user?.avatar_url) {
      return (
        <View style={[styles.avatarRing, { borderColor: levelColor }]}>
          <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
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
      <Text style={styles.headerStatValue}>{typeof value === 'number' ? value : value}</Text>
      <Text style={styles.headerStatLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const renderTreinoGrid = () => (
    <FlatList
      data={MOCK_TREINO_POSTS}
      numColumns={3}
      scrollEnabled={false}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.gridContainer}
      columnWrapperStyle={styles.gridRow}
      renderItem={({ item }) => (
        <View style={[styles.gridItem, { backgroundColor: item.color + '22' }]}>
          <Text style={[styles.gridItemLabel, { color: item.color }]}>{item.label}</Text>
          <Text style={[styles.gridItemVolume, { color: item.color }]}>{item.volume}</Text>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>{'\u{1F3CB}\u{FE0F}'}</Text>
          <Text style={styles.emptyText}>Nenhum treino registrado</Text>
        </View>
      }
    />
  );

  const renderFotosGrid = () => (
    <FlatList
      data={MOCK_FOTO_POSTS}
      numColumns={3}
      scrollEnabled={false}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.gridContainer}
      columnWrapperStyle={styles.gridRow}
      renderItem={() => (
        <View style={styles.fotoPlaceholder} />
      )}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>{'\u{1F4F8}'}</Text>
          <Text style={styles.emptyText}>Nenhuma foto publicada</Text>
        </View>
      }
    />
  );

  const renderStats = () => {
    const memberSince = user?.created_at
      ? new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      : '--';

    return (
      <View style={styles.statsTabContent}>
        <Text style={styles.statsSubtitle}>Records Pessoais (PRs)</Text>
        {MOCK_PRS.map((pr, idx) => (
          <View key={idx} style={styles.prRow}>
            <Text style={styles.prExercise}>{pr.exercise}</Text>
            <Text style={styles.prValue}>{pr.value}</Text>
          </View>
        ))}

        <View style={styles.statsDivider} />

        <Text style={styles.statsSubtitle}>Frequencia</Text>
        <Text style={styles.statsInfo}>Media: 4.2 treinos/semana</Text>
        <Text style={styles.statsInfo}>Melhor mes: Janeiro (22 treinos)</Text>

        <View style={styles.statsDivider} />

        <Text style={styles.statsSubtitle}>Membro desde</Text>
        <Text style={styles.statsInfo}>{memberSince}</Text>
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'treinos':
        return renderTreinoGrid();
      case 'fotos':
        return renderFotosGrid();
      case 'stats':
        return renderStats();
    }
  };

  const unlockedBadges = ACHIEVEMENTS.filter((a) => a.unlocked);
  const lockedCount = ACHIEVEMENTS.filter((a) => !a.unlocked).length;

  if (loading && !user) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.orange} size="large" />
      </View>
    );
  }

  return (
    <ScreenBackground>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── A) Header row: avatar + stats ───────────────────── */}
      <View style={styles.headerRow}>
        {renderAvatar()}
        <View style={styles.headerStats}>
          {renderStatItem(postsCount, 'posts')}
          {renderStatItem(
            followersCount,
            'seguidores',
            () => navigation.navigate('FollowersList', { type: 'followers', userId: user?.id }),
          )}
          {renderStatItem(
            followingCount,
            'seguindo',
            () => navigation.navigate('FollowersList', { type: 'following', userId: user?.id }),
          )}
        </View>
      </View>

      {/* ── B) User info ────────────────────────────────────── */}
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

      {/* ── C) Action buttons ───────────────────────────────── */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('EditarPerfil')}
        >
          <Text style={styles.actionBtnText}>Editar perfil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
          <Text style={styles.actionBtnText}>Compartilhar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtnIcon}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.settingsIcon}>{'\u2699\uFE0F'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── D) Training stats card ──────────────────────────── */}
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

      {/* ── E) Badges / Conquistas ──────────────────────────── */}
      <Text style={styles.sectionTitle}>Conquistas</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.badgesRow}
      >
        {unlockedBadges.map((badge, idx) => (
          <View key={idx} style={styles.badgeItem}>
            <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
            <Text style={styles.badgeLabel}>{badge.label}</Text>
          </View>
        ))}
        {lockedCount > 0 && (
          <View style={[styles.badgeItem, styles.badgeMore]}>
            <Text style={styles.badgeMoreText}>+{lockedCount}</Text>
          </View>
        )}
      </ScrollView>

      {/* ── F) Content tabs ─────────────────────────────────── */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabItem,
              activeTab === tab.key && styles.tabItemActive,
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === tab.key && styles.tabLabelActive,
              ]}
            >
              {tab.icon} {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {renderTabContent()}
    </ScrollView>
    </ScreenBackground>
  );
}

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingBottom: spacing.xxl + 40,
  },

  /* A) Header row */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  avatarRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 78,
    height: 78,
    borderRadius: 39,
  },
  avatarFallback: {
    width: 78,
    height: 78,
    borderRadius: 39,
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
    color: colors.textMuted,
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
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.elevated,
    borderRadius: radius.sm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  actionBtnIcon: {
    backgroundColor: colors.elevated,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 16,
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
  badgeMore: {
    justifyContent: 'center',
  },
  badgeMoreText: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.textSecondary,
  },

  /* F) Content tabs */
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: colors.elevated,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.elevated,
    marginBottom: spacing.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: colors.orange,
  },
  tabLabel: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.text,
  },

  /* Grid */
  gridContainer: {
    paddingHorizontal: 0,
  },
  gridRow: {
    gap: GRID_GAP,
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: GRID_GAP,
  },
  gridItemLabel: {
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    textAlign: 'center',
    marginBottom: 4,
  },
  gridItemVolume: {
    fontSize: 14,
    fontFamily: fonts.numbersBold,
  },
  fotoPlaceholder: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    backgroundColor: '#2A2A2A',
    marginBottom: GRID_GAP,
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
    color: colors.textMuted,
  },

  /* Stats tab */
  statsTabContent: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  statsSubtitle: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  prRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A1A',
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  prExercise: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.text,
  },
  prValue: {
    fontSize: 13,
    fontFamily: fonts.numbersBold,
    color: colors.orange,
  },
  statsDivider: {
    height: 1,
    backgroundColor: colors.elevated,
    marginVertical: spacing.lg,
  },
  statsInfo: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
});
