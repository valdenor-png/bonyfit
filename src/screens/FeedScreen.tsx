import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  Image,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
interface StoryUser {
  id: string;
  nome: string;
  nivel: string;
  avatar_url: string | null;
  hasNewStory: boolean;
}

interface FeedPost {
  id: string;
  user: {
    id: string;
    nome: string;
    nivel: string;
    unidade: string;
    avatar_url: string | null;
  };
  text: string;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  isLiked: boolean;
  isSaved: boolean;
  created_at: string;
}

// ─── Time Formatter ─────────────────────────────────────────────
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

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── Mock Data ──────────────────────────────────────────────────
const MOCK_STORIES: StoryUser[] = [
  { id: 's1', nome: 'Carlos M.', nivel: 'Ouro', avatar_url: null, hasNewStory: true },
  { id: 's2', nome: 'Ana P.', nivel: 'Platina', avatar_url: null, hasNewStory: true },
  { id: 's3', nome: 'Rafael S.', nivel: 'Diamante', avatar_url: null, hasNewStory: false },
  { id: 's4', nome: 'Julia R.', nivel: 'Bronze', avatar_url: null, hasNewStory: true },
  { id: 's5', nome: 'Pedro L.', nivel: 'Master', avatar_url: null, hasNewStory: false },
];

const MOCK_POSTS: FeedPost[] = [
  {
    id: '1',
    user: { id: 'u1', nome: 'Carlos Mendes', nivel: 'Ouro', unidade: 'Centro', avatar_url: null },
    text: 'Treino de peito destruido hoje! Supino reto bateu recorde pessoal. Bora que bora!',
    image_url: 'https://placeholder.com/workout1.jpg',
    likes_count: 24,
    comments_count: 5,
    isLiked: false,
    isSaved: false,
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: '2',
    user: { id: 'u2', nome: 'Ana Paula', nivel: 'Platina', unidade: 'Jaderlandia', avatar_url: null },
    text: 'Streak de 15 dias! Ninguem me para. Disciplina e consistencia sao tudo nessa vida.',
    image_url: null,
    likes_count: 42,
    comments_count: 8,
    isLiked: true,
    isSaved: false,
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: '3',
    user: { id: 'u3', nome: 'Rafael Santos', nivel: 'Diamante', unidade: 'Nova Olinda', avatar_url: null },
    text: 'Primeira semana completa na Bony Fit! Ambiente animal, galera motivada. Melhor decisao que tomei!',
    image_url: 'https://placeholder.com/workout3.jpg',
    likes_count: 67,
    comments_count: 12,
    isLiked: false,
    isSaved: true,
    created_at: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
  {
    id: '4',
    user: { id: 'u4', nome: 'Julia Reis', nivel: 'Bronze', unidade: 'Apeu', avatar_url: null },
    text: 'Dia de perna e o melhor dia. Agachamento livre com carga nova, evoluindo sempre!',
    image_url: null,
    likes_count: 15,
    comments_count: 2,
    isLiked: false,
    isSaved: false,
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: '5',
    user: { id: 'u5', nome: 'Pedro Lima', nivel: 'Master', unidade: 'Icui', avatar_url: null },
    text: 'Shape vindo! 3 meses de dedicacao e o resultado ja aparece. Valeu Bony Fit!',
    image_url: 'https://placeholder.com/workout5.jpg',
    likes_count: 89,
    comments_count: 3,
    isLiked: true,
    isSaved: false,
    created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
  },
];

// ─── Feed Header ────────────────────────────────────────────────
function FeedHeader({
  onCreatePost,
  onChat,
  unreadCount,
}: {
  onCreatePost: () => void;
  onChat: () => void;
  unreadCount: number;
}) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Bony Fit</Text>
      <View style={styles.headerRight}>
        <TouchableOpacity onPress={onCreatePost} style={styles.headerBtn} activeOpacity={0.7}>
          <Text style={styles.headerIcon}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onChat} style={styles.headerBtn} activeOpacity={0.7}>
          <Text style={styles.headerIcon}>💬</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── My Story Circle ────────────────────────────────────────────
function MyStoryCircle() {
  return (
    <TouchableOpacity style={styles.storyItem} activeOpacity={0.7}>
      <View style={styles.myStoryCircle}>
        <Text style={styles.myStoryPlus}>+</Text>
      </View>
      <Text style={styles.storyLabel} numberOfLines={1}>
        Seu story
      </Text>
    </TouchableOpacity>
  );
}

// ─── Story Circle ───────────────────────────────────────────────
function StoryCircle({ story }: { story: StoryUser }) {
  const levelColor = LEVEL_COLORS[story.nivel] || colors.orange;
  const borderColor = story.hasNewStory ? colors.orange : '#333';
  const initials = getInitials(story.nome);

  return (
    <TouchableOpacity style={styles.storyItem} activeOpacity={0.7}>
      <View style={[styles.storyCircleOuter, { borderColor }]}>
        {story.avatar_url ? (
          <Image source={{ uri: story.avatar_url }} style={styles.storyAvatar} />
        ) : (
          <View style={[styles.storyAvatarFallback, { backgroundColor: levelColor }]}>
            <Text style={styles.storyInitials}>{initials}</Text>
          </View>
        )}
      </View>
      <Text style={styles.storyLabel} numberOfLines={1}>
        {story.nome.split(' ')[0]}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Post Card ──────────────────────────────────────────────────
function PostCard({
  post,
  onLike,
  onSave,
  onOptions,
}: {
  post: FeedPost;
  onLike: () => void;
  onSave: () => void;
  onOptions: () => void;
}) {
  const levelColor = LEVEL_COLORS[post.user.nivel] || colors.orange;
  const initials = getInitials(post.user.nome);

  return (
    <View style={styles.postCard}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.postHeaderLeft}>
          {post.user.avatar_url ? (
            <Image source={{ uri: post.user.avatar_url }} style={styles.postAvatar} />
          ) : (
            <View style={[styles.postAvatarFallback, { backgroundColor: levelColor }]}>
              <Text style={styles.postAvatarText}>{initials}</Text>
            </View>
          )}
          <View style={styles.postHeaderInfo}>
            <View style={styles.postNameRow}>
              <Text style={styles.postUserName}>{post.user.nome}</Text>
              <View
                style={[
                  styles.levelBadge,
                  { backgroundColor: levelColor + '26' },
                ]}
              >
                <Text style={[styles.levelBadgeText, { color: levelColor }]}>
                  {post.user.nivel}
                </Text>
              </View>
            </View>
            <Text style={styles.postUnitName}>{post.user.unidade}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onOptions} activeOpacity={0.6}>
          <Text style={styles.optionsIcon}>⋯</Text>
        </TouchableOpacity>
      </View>

      {/* Post Image */}
      {post.image_url && (
        <View style={styles.postImageContainer}>
          <View style={styles.postImagePlaceholder}>
            <Text style={styles.postImageEmoji}>💀</Text>
          </View>
        </View>
      )}

      {/* Actions Row */}
      <View style={styles.actionsRow}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity onPress={onLike} activeOpacity={0.6} style={styles.actionBtn}>
            <Text style={[styles.actionHeart, post.isLiked && styles.actionHeartActive]}>
              {post.isLiked ? '❤️' : '♡'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.6} style={styles.actionBtn}>
            <Text style={styles.actionComment}>💬</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.6} style={styles.actionBtn}>
            <Text style={styles.actionShare}>✈</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onSave} activeOpacity={0.6}>
          <Text style={[styles.actionSave, post.isSaved && styles.actionSaveActive]}>
            {post.isSaved ? '🔖' : '🔖'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Likes */}
      <Text style={styles.likesText}>
        {post.likes_count} curtidas
      </Text>

      {/* Post Text */}
      <Text style={styles.postText}>
        <Text style={styles.postTextUsername}>{post.user.nome} </Text>
        {post.text}
      </Text>

      {/* Comments Link */}
      {post.comments_count > 0 && (
        <TouchableOpacity activeOpacity={0.6}>
          <Text style={styles.commentsLink}>
            Ver todos os {post.comments_count} comentarios
          </Text>
        </TouchableOpacity>
      )}

      {/* Time */}
      <Text style={styles.postTime}>{formatTimeAgo(post.created_at)}</Text>
    </View>
  );
}

// ─── Stories Section (ListHeaderComponent) ──────────────────────
function StoriesSection() {
  return (
    <View>
      <FlatList
        data={MOCK_STORIES}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storiesList}
        ListHeaderComponent={<MyStoryCircle />}
        renderItem={({ item }) => <StoryCircle story={item} />}
      />
      <View style={styles.sectionSeparator} />
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────────────
interface Props {
  navigation: any;
}

export default function FeedScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>(MOCK_POSTS);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const loadPosts = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('posts')
        .select('id, text, image_url, hashtags, likes_count, comments_count, created_at, user_id, users!inner(id, name, level, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(20);

      if (data && data.length > 0) {
        const mappedPosts: FeedPost[] = data.map((post: any) => ({
          id: post.id,
          user: {
            id: post.users?.id ?? post.user_id,
            nome: post.users?.name ?? 'Usuario',
            nivel: post.users?.level ?? 'Bronze',
            unidade: '',
            avatar_url: post.users?.avatar_url ?? null,
          },
          text: post.text ?? '',
          image_url: post.image_url ?? null,
          likes_count: post.likes_count ?? 0,
          comments_count: post.comments_count ?? 0,
          isLiked: false,
          isSaved: false,
          created_at: post.created_at,
        }));
        setPosts(mappedPosts);
      } else {
        setPosts(MOCK_POSTS);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      setPosts(MOCK_POSTS);
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  const loadUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);
      setUnreadCount(count ?? 0);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  }, [user]);

  useEffect(() => {
    loadPosts();
    loadUnreadCount();
  }, [loadPosts, loadUnreadCount]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPosts();
    await loadUnreadCount();
    setRefreshing(false);
  }, [loadPosts, loadUnreadCount]);

  const handleLike = useCallback(async (postId: string) => {
    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              isLiked: !p.isLiked,
              likes_count: p.isLiked ? p.likes_count - 1 : p.likes_count + 1,
            }
          : p
      )
    );

    if (!user) return;

    try {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      if (post.isLiked) {
        // Unlike - delete from post_likes
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        // Like - insert into post_likes
        await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: user.id });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic update on error
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                isLiked: !p.isLiked,
                likes_count: p.isLiked ? p.likes_count - 1 : p.likes_count + 1,
              }
            : p
        )
      );
    }
  }, [user, posts]);

  const handleSave = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, isSaved: !p.isSaved } : p
      )
    );
  }, []);

  const handleOptions = useCallback((postId: string) => {
    Alert.alert('Opcoes', undefined, [
      { text: 'Denunciar', style: 'destructive' },
      { text: 'Silenciar' },
      { text: 'Copiar link' },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }, []);

  const handleCreatePost = useCallback(async () => {
    if (!newPostText.trim()) return;

    if (user) {
      try {
        const { data: inserted, error } = await supabase
          .from('posts')
          .insert({
            text: newPostText,
            user_id: user.id,
          })
          .select('id, text, image_url, created_at')
          .single();

        if (error) throw error;

        const newPost: FeedPost = {
          id: inserted.id,
          user: {
            id: user.id,
            nome: user.name ?? 'Voce',
            nivel: user.level ?? 'Bronze',
            unidade: '',
            avatar_url: user.avatar_url ?? null,
          },
          text: inserted.text,
          image_url: inserted.image_url ?? null,
          likes_count: 0,
          comments_count: 0,
          isLiked: false,
          isSaved: false,
          created_at: inserted.created_at,
        };
        setPosts((prev) => [newPost, ...prev]);
        setNewPostText('');
        setShowNewPost(false);
        return;
      } catch (error) {
        console.error('Error creating post:', error);
      }
    }

    // Fallback: local-only post
    const newPost: FeedPost = {
      id: Date.now().toString(),
      user: {
        id: user?.id ?? 'me',
        nome: user?.name ?? 'Voce',
        nivel: user?.level ?? 'Bronze',
        unidade: '',
        avatar_url: user?.avatar_url ?? null,
      },
      text: newPostText,
      image_url: null,
      likes_count: 0,
      comments_count: 0,
      isLiked: false,
      isSaved: false,
      created_at: new Date().toISOString(),
    };
    setPosts((prev) => [newPost, ...prev]);
    setNewPostText('');
    setShowNewPost(false);
  }, [newPostText, user]);

  return (
    <View style={styles.container}>
      <FeedHeader
        onCreatePost={() => setShowNewPost(true)}
        onChat={() => navigation.navigate('Chat')}
        unreadCount={unreadCount}
      />

      {loadingPosts ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.orange} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={<StoriesSection />}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onLike={() => handleLike(item.id)}
              onSave={() => handleSave(item.id)}
              onOptions={() => handleOptions(item.id)}
            />
          )}
          contentContainerStyle={styles.feedList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.orange}
              colors={[colors.orange]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* New Post Modal */}
      <Modal visible={showNewPost} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowNewPost(false)}>
                <Text style={styles.modalCancel}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Novo Post</Text>
              <TouchableOpacity onPress={handleCreatePost}>
                <Text
                  style={[
                    styles.modalPublish,
                    !newPostText.trim() && styles.modalPublishDisabled,
                  ]}
                >
                  Publicar
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="No que voce esta pensando?"
              placeholderTextColor={colors.textMuted}
              value={newPostText}
              onChangeText={setNewPostText}
              multiline
              autoFocus
            />
            <View style={styles.modalFooter}>
              <View style={styles.ptsBadge}>
                <Text style={styles.ptsBadgeText}>+25 pts</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: colors.bg,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: fonts.bodyBold,
    color: colors.orange,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerBtn: {
    position: 'relative',
  },
  headerIcon: {
    fontSize: 24,
    color: colors.text,
  },
  unreadBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: colors.orange,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    fontSize: 10,
    fontFamily: fonts.numbersBold,
    color: colors.text,
  },

  // Stories
  storiesList: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 14,
  },
  storyItem: {
    alignItems: 'center',
    width: 68,
  },
  myStoryCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#444',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  myStoryPlus: {
    fontSize: 24,
    color: '#444',
    fontFamily: fonts.body,
  },
  storyCircleOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  storyAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  storyAvatarFallback: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyInitials: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  storyLabel: {
    fontSize: 10,
    fontFamily: fonts.body,
    color: colors.text,
    marginTop: 4,
    textAlign: 'center',
  },
  sectionSeparator: {
    height: 1,
    backgroundColor: '#1a1a1a',
  },

  // Feed
  feedList: {
    paddingBottom: 40,
  },

  // Post Card
  postCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  postHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  postAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  postAvatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAvatarText: {
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  postHeaderInfo: {
    marginLeft: 10,
    flex: 1,
  },
  postNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postUserName: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: colors.text,
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
  postUnitName: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: '#666',
    marginTop: 1,
  },
  optionsIcon: {
    fontSize: 20,
    color: colors.text,
    paddingLeft: 12,
  },

  // Post Image
  postImageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#161616',
  },
  postImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#161616',
  },
  postImageEmoji: {
    fontSize: 64,
    opacity: 0.3,
  },

  // Actions
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
  actionHeart: {
    fontSize: 24,
    color: colors.text,
  },
  actionHeartActive: {
    color: colors.orange,
  },
  actionComment: {
    fontSize: 22,
    color: colors.text,
  },
  actionShare: {
    fontSize: 22,
    color: colors.text,
  },
  actionSave: {
    fontSize: 22,
    color: colors.text,
    opacity: 0.6,
  },
  actionSaveActive: {
    opacity: 1,
  },

  // Likes
  likesText: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    paddingHorizontal: 16,
    marginBottom: 4,
  },

  // Post Text
  postText: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: '#ccc',
    paddingHorizontal: 16,
    lineHeight: 18,
    marginBottom: 4,
  },
  postTextUsername: {
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },

  // Comments Link
  commentsLink: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: '#666',
    paddingHorizontal: 16,
    marginBottom: 4,
  },

  // Time
  postTime: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: '#444',
    paddingHorizontal: 16,
    paddingBottom: 12,
    textTransform: 'uppercase',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#141414',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    minHeight: 320,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalCancel: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: '#999',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  modalPublish: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.orange,
  },
  modalPublishDisabled: {
    opacity: 0.4,
  },
  modalInput: {
    fontSize: 15,
    fontFamily: fonts.body,
    color: colors.text,
    minHeight: 140,
    textAlignVertical: 'top',
  },
  modalFooter: {
    marginTop: 16,
    alignItems: 'flex-start',
  },
  ptsBadge: {
    backgroundColor: 'rgba(242,101,34,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ptsBadgeText: {
    fontSize: 12,
    fontFamily: fonts.numbersBold,
    color: colors.orange,
  },
});
