import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';
import PostCard from '../components/PostCard';
import UnitBubble from '../components/UnitBubble';
import Skull from '../components/Skull';
import { Post } from '../types/social';

interface Props {
  navigation: any;
}

const MOCK_UNITS = [
  { id: '1', name: 'Centro', capacity: 120, current_count: 45 },
  { id: '2', name: 'Jaderlândia', capacity: 80, current_count: 62 },
  { id: '3', name: 'Nova Olinda', capacity: 100, current_count: 30 },
  { id: '4', name: 'Apeú', capacity: 60, current_count: 55 },
  { id: '5', name: 'Icuí', capacity: 90, current_count: 20 },
];

const MOCK_POSTS: Post[] = [
  {
    id: '1',
    user_id: 'u1',
    user_name: 'M***a S.',
    user_avatar: null,
    unit_name: 'Centro',
    text: 'Treino de peito destruído hoje! 💪 Supino reto bateu recorde pessoal. Bora que bora!',
    image_url: null,
    hashtags: ['#BonyFit', '#TreinoPesado', '#Superação'],
    likes_count: 24,
    comments_count: 5,
    liked_by_me: false,
    points_earned: 50,
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: '2',
    user_id: 'u2',
    user_name: 'R***o L.',
    user_avatar: null,
    unit_name: 'Jaderlândia',
    text: 'Streak de 15 dias! Ninguém me para 🔥',
    image_url: null,
    hashtags: ['#Streak', '#Disciplina'],
    likes_count: 42,
    comments_count: 8,
    liked_by_me: true,
    points_earned: 25,
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: '3',
    user_id: 'u3',
    user_name: 'A***a M.',
    user_avatar: null,
    unit_name: 'Nova Olinda',
    text: 'Primeira semana completa na Bony Fit! Ambiente animal, galera motivada. Melhor decisão que tomei!',
    image_url: null,
    hashtags: ['#NovaMembro', '#BonyFit', '#Motivação'],
    likes_count: 67,
    comments_count: 12,
    liked_by_me: false,
    points_earned: 25,
    created_at: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
];

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Agora';
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

export default function FeedScreen({ navigation }: Props) {
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostText, setNewPostText] = useState('');

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              liked_by_me: !p.liked_by_me,
              likes_count: p.liked_by_me ? p.likes_count - 1 : p.likes_count + 1,
            }
          : p
      )
    );
  };

  const handleCreatePost = () => {
    if (!newPostText.trim()) return;
    const hashtags = newPostText.match(/#\w+/g) || [];
    const newPost: Post = {
      id: Date.now().toString(),
      user_id: 'me',
      user_name: 'Você',
      user_avatar: null,
      unit_name: 'Centro',
      text: newPostText,
      image_url: null,
      hashtags,
      likes_count: 0,
      comments_count: 0,
      liked_by_me: false,
      points_earned: 25,
      created_at: new Date().toISOString(),
    };
    setPosts((prev) => [newPost, ...prev]);
    setNewPostText('');
    setShowNewPost(false);
  };

  return (
    <View style={styles.container}>
      {/* Unit capacity bubbles */}
      <View style={styles.bubblesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bubbles}
        >
          {MOCK_UNITS.map((unit) => (
            <UnitBubble
              key={unit.id}
              name={unit.name}
              current={unit.current_count}
              capacity={unit.capacity}
            />
          ))}
        </ScrollView>
      </View>

      {/* New post button */}
      <TouchableOpacity
        style={styles.newPostBtn}
        onPress={() => setShowNewPost(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.newPostPlaceholder}>No que você está pensando?</Text>
        <Text style={styles.newPostBadge}>+25 pts</Text>
      </TouchableOpacity>

      {/* Posts list */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={{ ...item, created_at: formatTime(item.created_at) }}
            onLike={() => handleLike(item.id)}
            onComment={() => {}}
            onShare={() => {}}
            onProfilePress={() => navigation.navigate('ProfileView', { userId: item.user_id })}
          />
        )}
        contentContainerStyle={styles.postsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.orange}
            colors={[colors.orange]}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* New Post Modal */}
      <Modal visible={showNewPost} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowNewPost(false)}>
                <Text style={styles.modalCancel}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Novo Post</Text>
              <TouchableOpacity onPress={handleCreatePost}>
                <Text style={[styles.modalPost, !newPostText.trim() && styles.modalPostDisabled]}>
                  Publicar
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="Compartilhe seu treino..."
              placeholderTextColor={colors.textMuted}
              value={newPostText}
              onChangeText={setNewPostText}
              multiline
              autoFocus
            />
            <Text style={styles.modalHint}>Use #hashtags para categorizar • +25 pts</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  bubblesContainer: {
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.elevated,
  },
  bubbles: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  newPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 0.5,
    borderColor: colors.elevated,
  },
  newPostPlaceholder: { flex: 1, fontSize: 13, fontFamily: fonts.body, color: colors.textMuted },
  newPostBadge: { fontSize: 11, fontFamily: fonts.numbersBold, color: colors.orange },
  postsList: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  separator: { height: spacing.md },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalCancel: { fontSize: 14, fontFamily: fonts.body, color: colors.textSecondary },
  modalTitle: { fontSize: 16, fontFamily: fonts.bodyBold, color: colors.text },
  modalPost: { fontSize: 14, fontFamily: fonts.bodyBold, color: colors.orange },
  modalPostDisabled: { opacity: 0.4 },
  modalInput: {
    fontSize: 15,
    fontFamily: fonts.body,
    color: colors.text,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  modalHint: { fontSize: 11, fontFamily: fonts.body, color: colors.textMuted, marginTop: spacing.md },
});
