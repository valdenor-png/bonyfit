import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts, spacing, radius } from '../tokens';
import { useAuth } from '../hooks/useAuth';
import { useMessagesStore } from '../stores/messagesStore';
import { getLevelColor } from '../constants/levels';

// ─── Helpers ────────────────────────────────────────────────────
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';

  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function shouldShowDateSeparator(messages: any[], index: number): boolean {
  if (index === 0) return true;
  const curr = new Date(messages[index].createdAt).toDateString();
  const prev = new Date(messages[index - 1].createdAt).toDateString();
  return curr !== prev;
}

// ─── Challenge Card ─────────────────────────────────────────────
function ChallengeCard({ message }: { message: any }) {
  return (
    <View style={challengeStyles.container}>
      <Text style={challengeStyles.icon}>⚡</Text>
      <Text style={challengeStyles.text}>{message.content}</Text>
      <View style={challengeStyles.buttons}>
        <TouchableOpacity
          style={challengeStyles.acceptBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() => Alert.alert('Desafio', 'Desafio aceito! 💪')}
        >
          <Text style={challengeStyles.acceptText}>Aceitar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={challengeStyles.declineBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() => Alert.alert('Desafio', 'Desafio recusado.')}
        >
          <Text style={challengeStyles.declineText}>Recusar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const challengeStyles = StyleSheet.create({
  container: {
    backgroundColor: '#1C1C1C',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 14,
    maxWidth: '78%',
    alignSelf: 'flex-start',
    borderLeftWidth: 3,
    borderLeftColor: colors.orange,
  },
  icon: {
    fontSize: 20,
    marginBottom: 6,
  },
  text: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.text,
    marginBottom: 12,
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: colors.orange,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  acceptText: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  declineBtn: {
    flex: 1,
    backgroundColor: colors.elevated,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  declineText: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: '#A0A0A0',
  },
});

// ─── Message Bubble ─────────────────────────────────────────────
function MessageBubble({ message, isMine }: { message: any; isMine: boolean }) {
  if (message.type === 'challenge') {
    return <ChallengeCard message={message} />;
  }

  return (
    <View style={[styles.bubbleWrapper, isMine ? styles.bubbleRight : styles.bubbleLeft]}>
      <View style={[styles.bubble, isMine ? styles.bubbleSent : styles.bubbleReceived]}>
        <Text style={[styles.bubbleText, isMine && styles.bubbleTextSent]}>
          {message.content}
        </Text>
      </View>
      <Text style={[styles.bubbleTime, isMine ? styles.bubbleTimeRight : styles.bubbleTimeLeft]}>
        {formatMessageTime(message.createdAt)}
      </Text>
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────────────
export default function ConversationScreen({ route }: { route: any }) {
  const navigation = useNavigation();
  const { conversationId, userName, userLevel, otherUserId } = route.params;
  const { user } = useAuth();
  const { currentMessages, fetchMessages, sendMessage, markAsRead } = useMessagesStore();
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const myId = user?.id || '';
  const otherId = otherUserId || '';
  const level = userLevel || 'Ouro';
  const isOnline = true;

  useEffect(() => {
    if (myId) {
      fetchMessages(myId, otherId, conversationId);
      markAsRead(conversationId, myId);
    }
  }, [conversationId, myId]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || !myId) return;
    setText('');
    sendMessage(myId, otherId, trimmed, conversationId);
  }, [text, conversationId, myId, otherId, sendMessage]);

  // Messages ordered for display (newest at bottom, inverted FlatList shows newest first)
  const orderedMessages = [...currentMessages].reverse();

  const renderMessage = useCallback(({ item, index }: { item: any; index: number }) => {
    const isMine = item.senderId === myId || item.senderId === 'me';
    // Since list is inverted, index 0 = newest. For date separators, compare with next (older)
    const realIndex = currentMessages.length - 1 - index;
    const showDate = shouldShowDateSeparator(currentMessages, realIndex);

    return (
      <View>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>
              {formatDateSeparator(item.createdAt)}
            </Text>
          </View>
        )}
        <MessageBubble message={item} isMine={isMine} />
      </View>
    );
  }, [myId, currentMessages]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={[styles.headerAvatar, { backgroundColor: getLevelColor(level) }]}>
          <Text style={styles.headerAvatarText}>{getInitials(userName)}</Text>
        </View>

        <View style={styles.headerInfo}>
          <View style={styles.headerNameRow}>
            <Text style={styles.headerName} numberOfLines={1}>{userName}</Text>
            {userLevel && (
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>{userLevel}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.headerStatus, isOnline ? styles.statusOnline : styles.statusOffline]}>
            {isOnline ? '● Online - Bony Fit Centro' : 'Offline'}
          </Text>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={orderedMessages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          inverted
          removeClippedSubviews={true}
          maxToRenderPerBatch={15}
          initialNumToRender={20}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          style={styles.flex}
        />

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={styles.cameraBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => {
              Alert.alert('Enviar imagem', '', [
                { text: 'Câmera', onPress: () => Alert.alert('Em breve', 'Câmera em desenvolvimento.') },
                { text: 'Galeria', onPress: () => Alert.alert('Em breve', 'Galeria em desenvolvimento.') },
                { text: 'Cancelar', style: 'cancel' },
              ]);
            }}
          >
            <Text style={styles.cameraIcon}>📷</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            placeholder="Mensagem..."
            placeholderTextColor="#666666"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={2000}
          />

          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim()}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.sendIcon}>▶</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginRight: spacing.sm,
  },
  backIcon: {
    fontSize: 22,
    color: colors.orange,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerAvatarText: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  headerInfo: {
    flex: 1,
  },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerName: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    flexShrink: 1,
  },
  levelBadge: {
    backgroundColor: colors.orange,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  levelBadgeText: {
    fontSize: 10,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  headerStatus: {
    fontSize: 11,
    fontFamily: fonts.body,
    marginTop: 1,
  },
  statusOnline: {
    color: '#34D399',
  },
  statusOffline: {
    color: '#A0A0A0',
  },

  // Messages
  messagesList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dateSeparatorText: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: '#A0A0A0',
    backgroundColor: colors.elevated,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },

  // Bubbles
  bubbleWrapper: {
    marginBottom: spacing.sm,
    maxWidth: '78%',
  },
  bubbleRight: {
    alignSelf: 'flex-end',
  },
  bubbleLeft: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bubbleSent: {
    backgroundColor: colors.orange,
    borderBottomRightRadius: 4,
  },
  bubbleReceived: {
    backgroundColor: '#1C1C1C',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.text,
    lineHeight: 20,
  },
  bubbleTextSent: {
    color: colors.text,
  },
  bubbleTime: {
    fontSize: 10,
    fontFamily: fonts.numbers,
    color: '#A0A0A0',
    marginTop: 3,
  },
  bubbleTimeRight: {
    textAlign: 'right',
  },
  bubbleTimeLeft: {
    textAlign: 'left',
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: colors.elevated,
    backgroundColor: colors.bg,
  },
  cameraBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  cameraIcon: {
    fontSize: 20,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.text,
    maxHeight: 100,
    minHeight: 38,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendIcon: {
    fontSize: 16,
    color: colors.text,
  },
});
