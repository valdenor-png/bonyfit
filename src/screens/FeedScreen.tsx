import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { useQueryClient } from '@tanstack/react-query';
import ScreenBackground from '../components/ScreenBackground';

// ─── Feed Components ────────────────────────────────────────────
import LiveFriendsBadge from '../components/feed/LiveFriendsBadge';
import StoriesRow, { StoryFriend } from '../components/feed/StoriesRow';
import FeedFilters from '../components/feed/FeedFilters';
import UnitSubFilter, { UnitOption } from '../components/feed/UnitSubFilter';
import WorkoutPostCard from '../components/feed/WorkoutPostCard';

import TrainingNowBar from '../components/feed/TrainingNowBar';

// ─── Hooks & Stores ─────────────────────────────────────────────
import { useMutualFriends } from '../hooks/useMutualFriends';
import { useLiveFriends } from '../hooks/useLiveFriends';
import { useFeedPosts, FeedPost } from '../hooks/useFeedPosts';
import { useFeedStore } from '../stores/feedStore';
import { useFriends, useFriendsTrainingNow } from '../hooks/useFriendships';

// ─── Utils ──────────────────────────────────────────────────────
function formatTimeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length <= 1) return (parts[0]?.[0] ?? '?').toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── Default units ──────────────────────────────────────────────
const DEFAULT_UNITS: UnitOption[] = [
  { id: null, name: 'Todas' },
  { id: 'centro', name: 'Un. 1 — Centro' },
  { id: 'jaderlandia', name: 'Un. 2 — Jaderlândia' },
  { id: 'nova-olinda', name: 'Un. 3 — Nova Olinda' },
  { id: 'apeu', name: 'Un. 4 — Apeu' },
  { id: 'icui', name: 'Un. 5 — Icui' },
];

interface Props {
  navigation: any;
}

export default function FeedScreen({ navigation }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ─── Store ──────────────────────────────────────────────────
  const { activeTab, selectedUnitId, setActiveTab, setSelectedUnit } = useFeedStore();

  // ─── Units ──────────────────────────────────────────────────
  const [units, setUnits] = useState<UnitOption[]>(DEFAULT_UNITS);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('units')
        .select('id, name')
        .order('name');
      if (data && data.length > 0) {
        setUnits([
          { id: null, name: 'Todas' },
          ...data.map((u: any, i: number) => ({
            id: u.id,
            name: `Un. ${i + 1} — ${u.name}`,
          })),
        ]);
      }
    })();
  }, []);

  // ─── Data hooks ─────────────────────────────────────────────
  const { data: mutualFriends } = useMutualFriends(user?.id);
  const liveCount = useLiveFriends(user?.id);
  const { friends } = useFriends();
  const friendIds = friends.map(f => f.id);
  const trainingNow = useFriendsTrainingNow(friendIds);
  const {
    data: posts,
    isLoading,
    refetch,
  } = useFeedPosts({
    tab: activeTab,
    unitId: selectedUnitId,
    userId: user?.id,
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetch(),
      queryClient.invalidateQueries({ queryKey: ['mutual-friends'] }),
    ]);
    setRefreshing(false);
  }, [refetch, queryClient]);

  // ─── Stories data ───────────────────────────────────────────
  const storyFriends: StoryFriend[] = (mutualFriends || []).map((f) => ({
    id: f.id,
    name: f.name,
    initials: getInitials(f.name),
    hasStory: f.hasStory,
    isTraining: f.isTraining,
  }));

  // ─── Like handler ───────────────────────────────────────────
  const handleLike = useCallback(
    async (postId: string, isLiked: boolean) => {
      if (!user?.id) return;
      if (isLiked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: user.id });
      }
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    [user?.id, queryClient]
  );

  // ─── Render post ────────────────────────────────────────────
  const renderPost = useCallback(
    ({ item }: { item: FeedPost }) => (
      <WorkoutPostCard
        user={item.user}
        text={item.text}
        metadata={
          item.post_type === 'treino' && item.metadata
            ? {
                splitLabel: item.metadata.splitLabel,
                splitName: item.metadata.splitNome || item.metadata.splitName,
                duration: item.metadata.duracao || item.metadata.duration,
                volume: item.metadata.volume,
                exercises: item.metadata.exercicios || item.metadata.exercises,
                sets: item.metadata.series || item.metadata.sets,
              }
            : undefined
        }
        likesCount={item.likes_count}
        commentsCount={item.comments_count}
        isLiked={item.isLiked}
        timeAgo={formatTimeAgo(item.created_at)}
        onLike={() => handleLike(item.id, item.isLiked)}
        onComment={() =>
          navigation.navigate('Comentarios', { postId: item.id })
        }
        onShare={() =>
          Share.share({ message: `Confira o treino no Bony Fit! 💪` })
        }
        onUserPress={() =>
          navigation.navigate('ProfileView', { userId: item.user.id })
        }
        onMenuPress={() => {}}
      />
    ),
    [handleLike, navigation]
  );

  const renderDivider = useCallback(
    () => <View style={styles.divider} />,
    []
  );

  // ─── Header (rendered as ListHeaderComponent) ──────────────
  const ListHeader = useCallback(
    () => (
      <View>
        {/* Header bar */}
        <View style={styles.headerBar}>
          <Text style={styles.logo}>Bony Fit</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              onPress={() => navigation.navigate('CriarPost')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.headerIcon}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('FriendRequests')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.headerIcon}>👥</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('MessagesList')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.headerIcon}>💬</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Live friends badge */}
        <LiveFriendsBadge count={liveCount} />

        {/* Stories */}
        <StoriesRow
          friends={storyFriends}
          onAddStory={() => navigation.navigate('Stories')}
          onViewStory={(userId) =>
            navigation.navigate('Stories', { userId })
          }
        />

        {/* Training Now */}
        <TrainingNowBar
          users={trainingNow}
          onUserPress={(userId) => navigation.navigate('ProfileView', { userId })}
        />

        {/* Filters */}
        <FeedFilters activeTab={activeTab} onChangeTab={setActiveTab} />

        {/* Unit sub-filter */}
        <UnitSubFilter
          visible={activeTab === 'unidade'}
          units={units}
          selectedUnitId={selectedUnitId}
          onSelectUnit={setSelectedUnit}
        />

        {/* Spacer */}
        <View style={{ height: 10 }} />
      </View>
    ),
    [
      liveCount,
      storyFriends,
      activeTab,
      units,
      selectedUnitId,
      setActiveTab,
      setSelectedUnit,
      navigation,
    ]
  );

  // ─── Empty state ────────────────────────────────────────────
  const ListEmpty = useCallback(
    () =>
      isLoading ? (
        <View style={{ paddingHorizontal: 20, gap: 16 }}>
          {[1,2,3].map(i => (
            <View key={i} style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)' }} />
                <View style={{ gap: 4, flex: 1 }}>
                  <View style={{ width: 120, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.06)' }} />
                  <View style={{ width: 60, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.04)' }} />
                </View>
              </View>
              <View style={{ width: '100%', height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.04)' }} />
              <View style={{ width: '70%', height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.04)' }} />
              <View style={{ width: '100%', height: 80, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)' }} />
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>Nenhum post ainda</Text>
          <Text style={styles.emptySubtitle}>
            Siga amigos e treine para ver o feed!
          </Text>
        </View>
      ),
    [isLoading]
  );

  return (
    <ScreenBackground variant="feed">
    <View style={styles.container}>
      <FlatList
        data={posts || []}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#F26522"
            colors={['#F26522']}
          />
        }
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={5}
        initialNumToRender={5}
        contentContainerStyle={styles.listContent}
      />
    </View>
    </ScreenBackground>
  );
}

// ─── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  listContent: {
    paddingBottom: 40,
  },

  // Header bar
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  logo: {
    fontFamily: 'Sora_700Bold',
    fontSize: 20,
    color: '#F26522',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.5)',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: 20,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.40)',
  },
});
