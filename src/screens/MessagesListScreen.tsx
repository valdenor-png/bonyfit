import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';
import { useAuth } from '../hooks/useAuth';
import { useMessagesStore } from '../stores/messagesStore';

// ─── Level Colors ───────────────────────────────────────────────
const LEVEL_COLORS: Record<string, string> = {
  Bronze: '#CD7F32',
  Prata: '#A0A0A0',
  Ouro: '#DAA520',
  Platina: '#6BB5C9',
  Diamante: '#5B9BD5',
  Master: '#9B59B6',
};

// ─── Online status mock ─────────────────────────────────────────
const ONLINE_USERS = new Set(['u1', 'u2']);

// ─── Helpers ────────────────────────────────────────────────────
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatTimestamp(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Ontem';

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  if (diffDays < 7) return dayNames[date.getDay()];

  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// ─── Chat Item ──────────────────────────────────────────────────
interface ChatItemProps {
  conversation: any;
  onPress: () => void;
}

function ChatItem({ conversation, onPress }: ChatItemProps) {
  const { otherUser, type, name, lastMessageText, lastMessageAt, unreadCount } = conversation;
  const displayName = type === 'official' ? name : otherUser?.name || 'Desconhecido';
  const level = otherUser?.level || 'Bronze';
  const isOnline = ONLINE_USERS.has(otherUser?.id || '');
  const isOfficial = type === 'official';
  const hasUnread = unreadCount > 0;

  return (
    <TouchableOpacity style={styles.chatItem} onPress={onPress} activeOpacity={0.7}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { backgroundColor: isOfficial ? colors.orange : (LEVEL_COLORS[level] || '#CD7F32') }]}>
          <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
        </View>
        {isOnline && !isOfficial && <View style={styles.onlineDot} />}
      </View>

      {/* Content */}
      <View style={styles.chatContent}>
        <Text
          style={[styles.chatName, isOfficial && styles.chatNameOfficial]}
          numberOfLines={1}
        >
          {displayName}
        </Text>
        <Text
          style={[styles.chatPreview, hasUnread && styles.chatPreviewUnread]}
          numberOfLines={1}
        >
          {lastMessageText || 'Nenhuma mensagem'}
        </Text>
      </View>

      {/* Right side */}
      <View style={styles.chatRight}>
        <Text style={styles.chatTime}>{formatTimestamp(lastMessageAt)}</Text>
        {hasUnread && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ────────────────────────────────────────────────
export default function MessagesListScreen({ navigation }: { navigation: any }) {
  const { user } = useAuth();
  const { conversations, loading, fetchConversations } = useMessagesStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchConversations(user.id);
    }
  }, [user?.id]);

  const filteredConversations = conversations.filter(c => {
    if (!search.trim()) return true;
    const name = c.type === 'official' ? c.name : c.otherUser?.name;
    return name?.toLowerCase().includes(search.toLowerCase());
  });

  const handleConversationPress = useCallback((conv: any) => {
    const userName = conv.type === 'official' ? conv.name : conv.otherUser?.name || 'Chat';
    const userLevel = conv.otherUser?.level;
    navigation.navigate('Conversation', {
      conversationId: conv.id,
      userName,
      userLevel,
    });
  }, [navigation]);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <ChatItem
      conversation={item}
      onPress={() => handleConversationPress(item)}
    />
  ), [handleConversationPress]);

  const renderEmpty = useCallback(() => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>💬</Text>
        <Text style={styles.emptyText}>Nenhuma conversa ainda.</Text>
        <Text style={styles.emptySubtext}>Comece uma!</Text>
      </View>
    );
  }, [loading]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mensagens</Text>
        <TouchableOpacity style={styles.newChatBtn} activeOpacity={0.7}>
          <Text style={styles.newChatIcon}>✏️</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar conversa..."
          placeholderTextColor="#666666"
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />
      </View>

      {/* Loading */}
      {loading && conversations.length === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.orange} />
        </View>
      )}

      {/* Conversations */}
      <FlatList
        data={filteredConversations}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={filteredConversations.length === 0 ? styles.emptyList : undefined}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.elevated,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 22,
    color: colors.orange,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  newChatBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newChatIcon: {
    fontSize: 20,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    height: 42,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.text,
    height: 42,
    padding: 0,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Chat item
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#34D399',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  chatContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  chatName: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: 2,
  },
  chatNameOfficial: {
    color: colors.orange,
  },
  chatPreview: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: '#A0A0A0',
  },
  chatPreviewUnread: {
    color: colors.text,
    fontFamily: fonts.bodyBold,
  },
  chatRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  chatTime: {
    fontSize: 11,
    fontFamily: fonts.numbers,
    color: '#A0A0A0',
  },
  unreadBadge: {
    backgroundColor: colors.orange,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontFamily: fonts.numbersBold,
    color: colors.text,
  },

  // Empty
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: fonts.bodyMedium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: '#A0A0A0',
  },
});
