import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../tokens';
import { Message } from '../types/social';

interface Props {
  navigation: any;
  route: { params: { userId: string; userName: string } };
}

const MOCK_MESSAGES: Message[] = [
  { id: '1', sender_id: 'u1', receiver_id: 'me', text: 'Fala! Viu meu treino hoje?', read: true, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: '2', sender_id: 'me', receiver_id: 'u1', text: 'Vi sim! Tá monstro! 💪', read: true, created_at: new Date(Date.now() - 3500000).toISOString() },
  { id: '3', sender_id: 'u1', receiver_id: 'me', text: 'Bora treinar juntos amanhã?', read: true, created_at: new Date(Date.now() - 3400000).toISOString() },
];

export default function ChatScreen({ navigation, route }: Props) {
  const { userName } = route.params;
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const handleSend = () => {
    if (!text.trim()) return;
    const newMsg: Message = {
      id: Date.now().toString(),
      sender_id: 'me',
      receiver_id: route.params.userId,
      text: text.trim(),
      read: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMsg]);
    setText('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const isMe = (msg: Message) => msg.sender_id === 'me';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>{userName[0]}</Text>
        </View>
        <Text style={styles.headerName}>{userName}</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.msgRow, isMe(item) && styles.msgRowMe]}>
              <View style={[styles.msgBubble, isMe(item) ? styles.msgBubbleMe : styles.msgBubbleOther]}>
                <Text style={[styles.msgText, isMe(item) && styles.msgTextMe]}>{item.text}</Text>
              </View>
            </View>
          )}
          contentContainerStyle={styles.msgList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Input */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Digite sua mensagem..."
            placeholderTextColor={colors.textMuted}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim()}
          >
            <Text style={styles.sendText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.elevated,
    gap: spacing.md,
  },
  backText: { fontSize: 22, color: colors.orange },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(242, 101, 34, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: { fontSize: 14, fontFamily: fonts.bodyBold, color: colors.orange },
  headerName: { fontSize: 15, fontFamily: fonts.bodyBold, color: colors.text },
  msgList: { padding: spacing.lg, paddingBottom: spacing.md },
  msgRow: { marginBottom: spacing.sm, alignItems: 'flex-start' },
  msgRowMe: { alignItems: 'flex-end' },
  msgBubble: {
    maxWidth: '78%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
  },
  msgBubbleMe: {
    backgroundColor: colors.orange,
    borderBottomRightRadius: 4,
  },
  msgBubbleOther: {
    backgroundColor: colors.card,
    borderBottomLeftRadius: 4,
  },
  msgText: { fontSize: 14, fontFamily: fonts.body, color: colors.text },
  msgTextMe: { color: colors.text },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: colors.elevated,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.text,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendText: { fontSize: 18, color: colors.text },
});
