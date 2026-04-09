import { create } from 'zustand';
import { supabase } from '../services/supabase';

// ─── Types ────────────────────────────────────────────────────
export interface Conversation {
  id: string;
  type: 'dm' | 'group' | 'official';
  name: string | null;
  otherUserId: string | null;
  otherUserName: string;
  otherUserLevel: string;
  lastMessageText: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  isOnline: boolean;
}

export interface ChatMessage {
  id: string;
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
  fetchMessages: (myId: string, otherId: string, conversationId?: string) => Promise<void>;
  sendMessage: (myId: string, otherId: string, content: string, conversationId?: string) => Promise<void>;
  startConversation: (myId: string, targetId: string) => Promise<string | null>;
  markAsRead: (conversationId: string, userId: string) => Promise<void>;
}

export const useMessagesStore = create<MessagesStore>((set) => ({
  conversations: [],
  currentMessages: [],
  totalUnread: 0,
  loading: false,

  fetchConversations: async (userId) => {
    set({ loading: true });
    try {
      const { data: parts } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', userId);

      if (!parts || parts.length === 0) {
        set({ conversations: [], totalUnread: 0, loading: false });
        return;
      }

      const convIds = parts.map((p) => p.conversation_id);
      const { data: convs } = await supabase
        .from('conversations')
        .select('*')
        .in('id', convIds)
        .order('last_message_at', { ascending: false });

      if (!convs) { set({ conversations: [], loading: false }); return; }

      const result: Conversation[] = [];
      let unreadTotal = 0;

      for (const conv of convs) {
        const { data: otherParts } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conv.id)
          .neq('user_id', userId)
          .limit(1);

        let other = { id: '', name: 'Usuário', level: 'Bronze' };
        if (otherParts?.[0]) {
          const { data: u } = await supabase
            .from('public_user_profile').select('id, name, level').eq('id', otherParts[0].user_id).single();
          if (u) other = u;
        }

        const myPart = parts.find((p) => p.conversation_id === conv.id);
        const unread = conv.last_message_at && myPart?.last_read_at
          ? new Date(conv.last_message_at) > new Date(myPart.last_read_at) ? 1 : 0 : 0;
        unreadTotal += unread;

        result.push({
          id: conv.id, type: conv.type || 'dm', name: conv.name,
          otherUserId: other.id,
          otherUserName: conv.type === 'official' ? 'Bony Fit Oficial' : other.name,
          otherUserLevel: other.level || 'Bronze',
          lastMessageText: conv.last_message_text,
          lastMessageAt: conv.last_message_at,
          unreadCount: unread, isOnline: false,
        });
      }
      set({ conversations: result, totalUnread: unreadTotal, loading: false });
    } catch (err) {
      console.warn('fetchConversations:', err);
      set({ loading: false });
    }
  },

  fetchMessages: async (myId, otherId, conversationId) => {
    set({ loading: true });
    try {
      let msgs: ChatMessage[] = [];

      // Try conversation_id first
      if (conversationId) {
        const { data } = await supabase.from('messages')
          .select('id, sender_id, text, created_at')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true }).limit(50);
        if (data?.length) {
          msgs = data.map((m: any) => ({
            id: m.id, senderId: m.sender_id, content: m.text || '',
            type: 'text', metadata: null, createdAt: m.created_at,
          }));
        }
      }

      // Fallback: sender/receiver
      if (!msgs.length && myId && otherId) {
        const { data } = await supabase.from('messages')
          .select('id, sender_id, text, created_at')
          .or(`and(sender_id.eq.${myId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${myId})`)
          .order('created_at', { ascending: true }).limit(50);
        if (data) {
          msgs = data.map((m: any) => ({
            id: m.id, senderId: m.sender_id, content: m.text || '',
            type: 'text', metadata: null, createdAt: m.created_at,
          }));
        }
      }

      set({ currentMessages: msgs, loading: false });
    } catch (err) {
      console.warn('fetchMessages:', err);
      set({ currentMessages: [], loading: false });
    }
  },

  sendMessage: async (myId, otherId, content, conversationId) => {
    if (!content.trim()) return;
    const temp: ChatMessage = {
      id: 'tmp-' + Date.now(), senderId: myId, content: content.trim(),
      type: 'text', metadata: null, createdAt: new Date().toISOString(),
    };
    set((s) => ({ currentMessages: [...s.currentMessages, temp] }));

    try {
      const row: any = { sender_id: myId, receiver_id: otherId, text: content.trim(), is_read: false };
      if (conversationId) row.conversation_id = conversationId;

      const { data } = await supabase.from('messages').insert(row).select('id').single();
      if (data) {
        set((s) => ({ currentMessages: s.currentMessages.map((m) => m.id === temp.id ? { ...m, id: data.id } : m) }));
      }
      if (conversationId) {
        await supabase.from('conversations').update({
          last_message_text: content.trim(),
          last_message_at: new Date().toISOString(),
          last_message_sender_id: myId,
        }).eq('id', conversationId);
      }
    } catch (err) { console.warn('sendMessage:', err); }
  },

  startConversation: async (myId, targetId) => {
    try {
      const { data: myConvs } = await supabase
        .from('conversation_participants').select('conversation_id').eq('user_id', myId);
      if (myConvs) {
        for (const mc of myConvs) {
          const { data } = await supabase.from('conversation_participants')
            .select('user_id').eq('conversation_id', mc.conversation_id).eq('user_id', targetId).single();
          if (data) return mc.conversation_id;
        }
      }
      const { data: conv } = await supabase.from('conversations').insert({ type: 'dm' }).select('id').single();
      if (!conv) return null;
      await supabase.from('conversation_participants').insert([
        { conversation_id: conv.id, user_id: myId },
        { conversation_id: conv.id, user_id: targetId },
      ]);
      return conv.id;
    } catch (err) { console.warn('startConversation:', err); return null; }
  },

  markAsRead: async (conversationId, userId) => {
    try {
      await supabase.from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId).eq('user_id', userId);
    } catch {}
  },
}));
