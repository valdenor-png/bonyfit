import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';

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
interface Comment {
  id: string;
  text: string;
  created_at: string;
  user_id: string;
  user: {
    id: string;
    name: string;
    level: string;
    avatar_url: string | null;
  };
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
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

// ─── Comment Item ───────────────────────────────────────────────
function CommentItem({
  comment,
  isOwn,
  onDelete,
}: {
  comment: Comment;
  isOwn: boolean;
  onDelete: () => void;
}) {
  const levelColor = LEVEL_COLORS[comment.user.level] || colors.orange;
  const initials = getInitials(comment.user.name);

  return (
    <View style={styles.commentCard}>
      <View style={[styles.avatar, { backgroundColor: levelColor }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.commentBody}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentUserName}>{comment.user.name}</Text>
          <View style={[styles.levelBadge, { backgroundColor: levelColor + '26' }]}>
            <Text style={[styles.levelBadgeText, { color: levelColor }]}>
              {comment.user.level}
            </Text>
          </View>
          <Text style={styles.commentTime}>{formatTimeAgo(comment.created_at)}</Text>
        </View>
        <Text style={styles.commentText}>{comment.text}</Text>
      </View>
      {isOwn && (
        <TouchableOpacity onPress={onDelete} activeOpacity={0.6} style={styles.deleteBtn}>
          <Text style={styles.deleteIcon}>🗑</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Screen ─────────────────────────────────────────────────────
interface Props {
  navigation: any;
  route: any;
}

export default function ComentariosScreen({ navigation, route }: Props) {
  const { postId, postUserName } = route?.params ?? {};
  const { user } = useAuth();

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const loadComments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select('id, text, created_at, user_id, users!user_id(id, name, level, avatar_url)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const mapped: Comment[] = (data ?? []).map((c: any) => ({
        id: c.id,
        text: c.text,
        created_at: c.created_at,
        user_id: c.user_id,
        user: {
          id: c.users?.id ?? c.user_id,
          name: c.users?.name ?? 'Usuario',
          level: c.users?.level ?? 'Bronze',
          avatar_url: c.users?.avatar_url ?? null,
        },
      }));

      setComments(mapped);
    } catch (error) {
      console.error('Error loading comments:', error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSend = useCallback(async () => {
    if (!text.trim() || !user || sending) return;

    setSending(true);
    const trimmed = text.trim();
    setText('');

    // Optimistic add
    const tempId = 'temp_' + Date.now();
    const optimistic: Comment = {
      id: tempId,
      text: trimmed,
      created_at: new Date().toISOString(),
      user_id: user.id,
      user: {
        id: user.id,
        name: user.name ?? 'Voce',
        level: user.level ?? 'Bronze',
        avatar_url: user.avatar_url ?? null,
      },
    };
    setComments((prev) => [...prev, optimistic]);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const { data, error } = await supabase
        .from('post_comments')
        .insert({ post_id: postId, user_id: user.id, text: trimmed })
        .select('id, text, created_at, user_id')
        .single();

      if (error) throw error;

      // Replace temp with real
      setComments((prev) =>
        prev.map((c) =>
          c.id === tempId ? { ...c, id: data.id, created_at: data.created_at } : c
        )
      );
    } catch (error) {
      console.error('Error sending comment:', error);
      // Remove optimistic on failure
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      setText(trimmed);
      Alert.alert('Erro', 'Nao foi possivel enviar o comentario.');
    } finally {
      setSending(false);
    }
  }, [text, user, postId, sending]);

  const handleDelete = useCallback(
    async (commentId: string) => {
      Alert.alert('Excluir comentario', 'Tem certeza?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setComments((prev) => prev.filter((c) => c.id !== commentId));
            try {
              await supabase.from('post_comments').delete().eq('id', commentId);
            } catch (error) {
              console.error('Error deleting comment:', error);
              loadComments();
            }
          },
        },
      ]);
    },
    [loadComments]
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comentarios</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Comments List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.orange} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CommentItem
              comment={item}
              isOwn={item.user_id === user?.id}
              onDelete={() => handleDelete(item.id)}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            comments.length === 0 && styles.listContentEmpty,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>💬</Text>
              <Text style={styles.emptyText}>
                Nenhum comentario ainda.{'\n'}Seja o primeiro!
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            if (comments.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
        />
      )}

      {/* Bottom Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Escreva um comentario..."
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          onPress={handleSend}
          activeOpacity={0.7}
          disabled={!text.trim() || sending}
          style={[
            styles.sendBtn,
            (!text.trim() || sending) && styles.sendBtnDisabled,
          ]}
        >
          <Text
            style={[
              styles.sendBtnText,
              (!text.trim() || sending) && styles.sendBtnTextDisabled,
            ]}
          >
            Enviar
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: 54,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  backBtn: {
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
  },
  backText: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.orange,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  headerSpacer: {
    width: 60,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingVertical: spacing.md,
    paddingBottom: 100,
  },
  listContentEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: '#1a1a1a',
    marginHorizontal: spacing.xl,
  },
  commentCard: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: '#141414',
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: radius.md,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },
  commentBody: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  commentUserName: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  levelBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  levelBadgeText: {
    fontSize: 9,
    fontFamily: fonts.bodyBold,
    textTransform: 'uppercase',
  },
  commentTime: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.textMuted,
  },
  commentText: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  deleteBtn: {
    paddingLeft: spacing.sm,
    justifyContent: 'center',
  },
  deleteIcon: {
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    backgroundColor: '#0A0A0A',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#141414',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.text,
    marginRight: spacing.sm,
  },
  sendBtn: {
    height: 40,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.orange,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.elevated,
  },
  sendBtnText: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  sendBtnTextDisabled: {
    color: colors.textMuted,
  },
});
