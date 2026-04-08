import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { getLevelColor, getLevelIcon } from '../constants/levels';

interface FollowUser {
  id: string;
  name: string;
  avatar_url: string | null;
  level: string;
  isFollowing: boolean;
}

// ── Mock fallback data ────────────────────────────────────────
const MOCK_USERS: FollowUser[] = [
  { id: 'm1', name: 'Ana Paula', avatar_url: null, level: 'Ouro', isFollowing: true },
  { id: 'm2', name: 'Carlos Eduardo', avatar_url: null, level: 'Platina', isFollowing: false },
  { id: 'm3', name: 'Maria Silva', avatar_url: null, level: 'Diamante', isFollowing: true },
  { id: 'm4', name: 'Rafael Santos', avatar_url: null, level: 'Bronze', isFollowing: false },
  { id: 'm5', name: 'Juliana Rocha', avatar_url: null, level: 'Prata', isFollowing: true },
  { id: 'm6', name: 'Pedro Oliveira', avatar_url: null, level: 'Ouro', isFollowing: false },
  { id: 'm7', name: 'Fernanda Lima', avatar_url: null, level: 'Platina', isFollowing: true },
  { id: 'm8', name: 'Lucas Mendes', avatar_url: null, level: 'Bronze', isFollowing: false },
  { id: 'm9', name: 'Camila Costa', avatar_url: null, level: 'Prata', isFollowing: true },
  { id: 'm10', name: 'Thiago Alves', avatar_url: null, level: 'Ouro', isFollowing: false },
];

interface Props {
  navigation: any;
  route: any;
}

export default function FollowersListScreen({ navigation, route }: Props) {
  const { type = 'followers', userId } = route.params || {};
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<FollowUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  const isFollowersTab = type === 'followers';
  const title = isFollowersTab ? 'Seguidores' : 'Seguindo';

  // ── Load users from Supabase ────────────────────────────────
  const loadUsers = useCallback(async () => {
    if (!userId) {
      setUsers(MOCK_USERS);
      setFilteredUsers(MOCK_USERS);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let query;
      if (isFollowersTab) {
        // People who follow userId
        query = supabase
          .from('follows')
          .select('follower_id, follower:follower_id(id, name, avatar_url, level)')
          .eq('following_id', userId);
      } else {
        // People userId follows
        query = supabase
          .from('follows')
          .select('following_id, following:following_id(id, name, avatar_url, level)')
          .eq('follower_id', userId);
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        // Fallback to mock
        setUsers(MOCK_USERS);
        setFilteredUsers(MOCK_USERS);
        setLoading(false);
        return;
      }

      // Check which ones current user follows
      let followingSet = new Set<string>();
      if (currentUser?.id) {
        const { data: myFollows } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', currentUser.id);
        if (myFollows) {
          followingSet = new Set(myFollows.map((f: any) => f.following_id));
        }
      }

      const mapped: FollowUser[] = data.map((row: any) => {
        const u = isFollowersTab ? row.follower : row.following;
        return {
          id: u.id,
          name: u.name,
          avatar_url: u.avatar_url,
          level: u.level || 'Bronze',
          isFollowing: followingSet.has(u.id),
        };
      });

      setUsers(mapped);
      setFilteredUsers(mapped);
    } catch {
      setUsers(MOCK_USERS);
      setFilteredUsers(MOCK_USERS);
    } finally {
      setLoading(false);
    }
  }, [userId, isFollowersTab, currentUser?.id]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // ── Update header ───────────────────────────────────────────
  useEffect(() => {
    navigation.setOptions({
      title: `${title} (${filteredUsers.length})`,
    });
  }, [navigation, title, filteredUsers.length]);

  // ── Search filter ───────────────────────────────────────────
  useEffect(() => {
    if (!search.trim()) {
      setFilteredUsers(users);
      return;
    }
    const q = search.toLowerCase();
    setFilteredUsers(users.filter((u) => u.name.toLowerCase().includes(q)));
  }, [search, users]);

  // ── Toggle follow ───────────────────────────────────────────
  const toggleFollow = async (targetUser: FollowUser) => {
    if (!currentUser?.id || currentUser.id === targetUser.id) return;

    setTogglingIds((prev) => new Set(prev).add(targetUser.id));

    try {
      if (targetUser.isFollowing) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', targetUser.id);
      } else {
        // Follow
        await supabase
          .from('follows')
          .insert({ follower_id: currentUser.id, following_id: targetUser.id });
      }

      // Update local state
      const update = (list: FollowUser[]) =>
        list.map((u) =>
          u.id === targetUser.id ? { ...u, isFollowing: !u.isFollowing } : u,
        );
      setUsers(update);
      setFilteredUsers(update);
    } catch {
      // silently fail
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(targetUser.id);
        return next;
      });
    }
  };

  // ── Render user row ─────────────────────────────────────────
  const renderUser = ({ item }: { item: FollowUser }) => {
    const lvlColor = getLevelColor(item.level);
    const lvlIcon = getLevelIcon(item.level);
    const initials = item.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
    const isMe = currentUser?.id === item.id;
    const isToggling = togglingIds.has(item.id);

    return (
      <View style={styles.userRow}>
        {/* Avatar */}
        {item.avatar_url ? (
          <Image
            source={{ uri: item.avatar_url }}
            style={[styles.userAvatar, { borderColor: lvlColor }]}
          />
        ) : (
          <View style={[styles.userAvatar, styles.userAvatarFallback, { borderColor: lvlColor, backgroundColor: lvlColor + '33' }]}>
            <Text style={[styles.userAvatarInitials, { color: lvlColor }]}>{initials}</Text>
          </View>
        )}

        {/* Name + Level */}
        <View style={styles.userInfoCol}>
          <Text style={styles.userNameText} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={[styles.userLevelPill, { backgroundColor: lvlColor + '22' }]}>
            <Text style={styles.userLevelText}>
              {lvlIcon} {item.level}
            </Text>
          </View>
        </View>

        {/* Follow button */}
        {!isMe && (
          <TouchableOpacity
            style={[
              styles.followBtn,
              item.isFollowing ? styles.followBtnFollowing : styles.followBtnNotFollowing,
            ]}
            onPress={() => toggleFollow(item)}
            disabled={isToggling}
          >
            {isToggling ? (
              <ActivityIndicator size="small" color={item.isFollowing ? colors.text : '#FFFFFF'} />
            ) : (
              <Text
                style={[
                  styles.followBtnText,
                  item.isFollowing ? styles.followBtnTextFollowing : styles.followBtnTextNotFollowing,
                ]}
              >
                {item.isFollowing ? 'Seguindo' : 'Seguir'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ── Empty state ─────────────────────────────────────────────
  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>{isFollowersTab ? '\u{1F465}' : '\u{1F50D}'}</Text>
      <Text style={styles.emptyText}>
        {isFollowersTab ? 'Nenhum seguidor' : 'Nao segue ninguem'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar..."
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.orange} />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Search */
  searchContainer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  searchInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#333333',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.text,
  },

  /* List */
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
  },

  /* User row */
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.elevated,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
  },
  userAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarInitials: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
  },
  userInfoCol: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userNameText: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: 2,
  },
  userLevelPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  userLevelText: {
    fontSize: 11,
    fontFamily: fonts.bodyMedium,
    color: colors.text,
  },

  /* Follow button */
  followBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    minWidth: 90,
    alignItems: 'center',
  },
  followBtnNotFollowing: {
    backgroundColor: colors.orange,
  },
  followBtnFollowing: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#444444',
  },
  followBtnText: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
  },
  followBtnTextNotFollowing: {
    color: '#FFFFFF',
  },
  followBtnTextFollowing: {
    color: colors.text,
  },

  /* Empty */
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: fonts.body,
    color: colors.textMuted,
  },
});
