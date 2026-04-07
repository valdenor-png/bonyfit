import { create } from 'zustand';
import { supabase } from '../services/supabase';

// ─── Types ──────────────────────────────────────────────────────
interface Conversation {
  id: string;
  type: 'dm' | 'group' | 'official';
  name: string | null;
  otherUser?: { id: string; name: string; level: string; avatar_url: string | null };
  lastMessageText: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: string;
  metadata: any;
  createdAt: string;
}

interface MessagesStore {
  conversations: Conversation[];
  currentMessages: ChatMessage[];
  totalUnread: number;
  loading: boolean;

  fetchConversations: (userId: string) => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, senderId: string, content: string) => Promise<void>;
  startConversation: (myId: string, targetId: string) => Promise<string>;
  markAsRead: (conversationId: string, userId: string) => Promise<void>;
}

// ─── Mock Data ──────────────────────────────────────────────────
const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    type: 'dm',
    name: null,
    otherUser: { id: 'u1', name: 'Rafael Lima', level: 'Ouro', avatar_url: null },
    lastMessageText: 'Bora treinar amanhã?',
    lastMessageAt: new Date().toISOString(),
    unreadCount: 2,
  },
  {
    id: 'conv-2',
    type: 'dm',
    name: null,
    otherUser: { id: 'u2', name: 'Ana Martins', level: 'Platina', avatar_url: null },
    lastMessageText: 'Consegui bater meu PR!',
    lastMessageAt: new Date().toISOString(),
    unreadCount: 1,
  },
  {
    id: 'conv-3',
    type: 'dm',
    name: null,
    otherUser: { id: 'u3', name: 'João Pedro', level: 'Prata', avatar_url: null },
    lastMessageText: 'Valeu pela dica do supino',
    lastMessageAt: new Date(Date.now() - 86400000).toISOString(),
    unreadCount: 0,
  },
  {
    id: 'conv-4',
    type: 'dm',
    name: null,
    otherUser: { id: 'u4', name: 'Carla Santos', level: 'Diamante', avatar_url: null },
    lastMessageText: 'Foto do treino ficou top',
    lastMessageAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    unreadCount: 0,
  },
  {
    id: 'conv-5',
    type: 'official',
    name: 'Bony Fit Oficial',
    otherUser: { id: 'official', name: 'Bony Fit Oficial', level: 'Master', avatar_url: null },
    lastMessageText: 'Desafio semanal: quem...',
    lastMessageAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    unreadCount: 0,
  },
];

const MOCK_MESSAGES: ChatMessage[] = [
  { id: 'm1', conversationId: 'conv-1', senderId: 'u1', content: 'Fala mano, tudo certo?', type: 'text', metadata: null, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 'm2', conversationId: 'conv-1', senderId: 'me', content: 'Suave! Treinando pesado aqui', type: 'text', metadata: null, createdAt: new Date(Date.now() - 6600000).toISOString() },
  { id: 'm3', conversationId: 'conv-1', senderId: 'u1', content: 'Bora treinar junto amanhã? Vou fazer peito e tríceps', type: 'text', metadata: null, createdAt: new Date(Date.now() - 6000000).toISOString() },
  { id: 'm4', conversationId: 'conv-1', senderId: 'me', content: 'Fechou! Que horas?', type: 'text', metadata: null, createdAt: new Date(Date.now() - 5400000).toISOString() },
  { id: 'm5', conversationId: 'conv-1', senderId: 'u1', content: 'Umas 18h, tá bom pra ti?', type: 'text', metadata: null, createdAt: new Date(Date.now() - 4800000).toISOString() },
  { id: 'm6', conversationId: 'conv-1', senderId: 'me', content: 'Perfeito! Vou levar meu whey novo pra gente tomar depois', type: 'text', metadata: null, createdAt: new Date(Date.now() - 4200000).toISOString() },
  { id: 'm7', conversationId: 'conv-1', senderId: 'u1', content: 'Rafael te desafiou: 100 flexões em 5 min', type: 'challenge', metadata: { challengeType: 'pushups', target: 100, timeLimit: 300 }, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'm8', conversationId: 'conv-1', senderId: 'u1', content: 'Bora treinar amanhã?', type: 'text', metadata: null, createdAt: new Date(Date.now() - 3000000).toISOString() },
];

// ─── Store ──────────────────────────────────────────────────────
export const useMessagesStore = create<MessagesStore>((set, get) => ({
  conversations: [],
  currentMessages: [],
  totalUnread: 0,
  loading: false,

  fetchConversations: async (userId: string) => {
    set({ loading: true });
    try {
      // Query conversation_participants for user, join conversations
      const { data: participations, error } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          last_read_at,
          conversations (
            id,
            type,
            name,
            last_message_text,
            last_message_at
          )
        `)
        .eq('user_id', userId)
        .order('conversations(last_message_at)', { ascending: false });

      if (error || !participations || participations.length === 0) {
        // Use mock data as fallback
        set({ conversations: MOCK_CONVERSATIONS, totalUnread: 3, loading: false });
        return;
      }

      // For each conversation, get the other participant
      const convos: Conversation[] = [];
      let totalUnread = 0;

      for (const p of participations) {
        const conv = (p as any).conversations;
        if (!conv) continue;

        // Get other participant for DMs
        let otherUser: Conversation['otherUser'] = undefined;
        if (conv.type === 'dm') {
          const { data: otherParticipant } = await supabase
            .from('conversation_participants')
            .select('user_id, profiles(id, nome, nivel, avatar_url)')
            .eq('conversation_id', conv.id)
            .neq('user_id', userId)
            .single();

          if (otherParticipant) {
            const profile = (otherParticipant as any).profiles;
            if (profile) {
              otherUser = {
                id: profile.id,
                name: profile.nome,
                level: profile.nivel || 'Bronze',
                avatar_url: profile.avatar_url,
              };
            }
          }
        }

        // Calculate unread count
        let unreadCount = 0;
        if (p.last_read_at && conv.last_message_at) {
          if (new Date(conv.last_message_at) > new Date(p.last_read_at)) {
            const { count } = await supabase
              .from('messages_v2')
              .select('id', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .neq('sender_id', userId)
              .gt('created_at', p.last_read_at);
            unreadCount = count ?? 0;
          }
        } else if (!p.last_read_at && conv.last_message_at) {
          unreadCount = 1; // at least 1 unread
        }

        totalUnread += unreadCount;

        convos.push({
          id: conv.id,
          type: conv.type,
          name: conv.name,
          otherUser,
          lastMessageText: conv.last_message_text,
          lastMessageAt: conv.last_message_at,
          unreadCount,
        });
      }

      set({ conversations: convos, totalUnread, loading: false });
    } catch (err) {
      console.error('fetchConversations error:', err);
      // Fallback to mock
      set({ conversations: MOCK_CONVERSATIONS, totalUnread: 3, loading: false });
    }
  },

  fetchMessages: async (conversationId: string) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('messages_v2')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error || !data || data.length === 0) {
        // Mock fallback for conv-1
        const mockMsgs = MOCK_MESSAGES.filter(m => m.conversationId === conversationId);
        set({ currentMessages: mockMsgs.length > 0 ? mockMsgs : MOCK_MESSAGES, loading: false });
        return;
      }

      const messages: ChatMessage[] = data.map((m: any) => ({
        id: m.id,
        conversationId: m.conversation_id,
        senderId: m.sender_id,
        content: m.content,
        type: m.type || 'text',
        metadata: m.metadata,
        createdAt: m.created_at,
      }));

      set({ currentMessages: messages, loading: false });
    } catch (err) {
      console.error('fetchMessages error:', err);
      set({ currentMessages: MOCK_MESSAGES, loading: false });
    }
  },

  sendMessage: async (conversationId: string, senderId: string, content: string) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId,
      content,
      type: 'text',
      metadata: null,
      createdAt: new Date().toISOString(),
    };

    // Optimistic update
    set(state => ({
      currentMessages: [...state.currentMessages, newMsg],
    }));

    try {
      const { data, error } = await supabase
        .from('messages_v2')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content,
          type: 'text',
        })
        .select()
        .single();

      if (!error && data) {
        // Update the optimistic message with the real id
        set(state => ({
          currentMessages: state.currentMessages.map(m =>
            m.id === newMsg.id
              ? { ...m, id: data.id, createdAt: data.created_at }
              : m
          ),
        }));
      }

      // Update conversation last_message
      await supabase
        .from('conversations')
        .update({
          last_message_text: content,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      // Update local conversations list
      set(state => ({
        conversations: state.conversations.map(c =>
          c.id === conversationId
            ? { ...c, lastMessageText: content, lastMessageAt: new Date().toISOString() }
            : c
        ),
      }));
    } catch (err) {
      console.error('sendMessage error:', err);
    }
  },

  startConversation: async (myId: string, targetId: string) => {
    try {
      // Check if DM already exists between the two users
      const { data: myConvos } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', myId);

      if (myConvos && myConvos.length > 0) {
        const convIds = myConvos.map((c: any) => c.conversation_id);
        const { data: sharedConvos } = await supabase
          .from('conversation_participants')
          .select('conversation_id, conversations(type)')
          .eq('user_id', targetId)
          .in('conversation_id', convIds);

        const existingDM = sharedConvos?.find(
          (c: any) => c.conversations?.type === 'dm'
        );

        if (existingDM) {
          return existingDM.conversation_id;
        }
      }

      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({ type: 'dm' })
        .select()
        .single();

      if (convError || !newConv) {
        throw new Error('Failed to create conversation');
      }

      // Add both participants
      await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: newConv.id, user_id: myId },
          { conversation_id: newConv.id, user_id: targetId },
        ]);

      return newConv.id;
    } catch (err) {
      console.error('startConversation error:', err);
      return 'conv-1'; // Mock fallback
    }
  },

  markAsRead: async (conversationId: string, userId: string) => {
    try {
      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);

      // Update local state
      set(state => {
        const conv = state.conversations.find(c => c.id === conversationId);
        const removedUnread = conv?.unreadCount ?? 0;
        return {
          conversations: state.conversations.map(c =>
            c.id === conversationId ? { ...c, unreadCount: 0 } : c
          ),
          totalUnread: Math.max(0, state.totalUnread - removedUnread),
        };
      });
    } catch (err) {
      console.error('markAsRead error:', err);
    }
  },
}));
