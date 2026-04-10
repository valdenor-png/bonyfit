import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';

export interface Friend {
  id: string;
  friendshipId: string;
  name: string;
  avatar_url: string | null;
  level: string;
}

export interface FriendRequest {
  id: string;
  userId: string;
  name: string;
  avatar_url: string | null;
  level: string;
  createdAt: string;
}

export type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'blocked';

export function useFriends() {
  const user = useAuth((s) => s.user);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('friendships')
      .select('id, user_id_1, user_id_2, users_1:user_id_1(id, name, avatar_url, level), users_2:user_id_2(id, name, avatar_url, level)')
      .eq('status', 'accepted')
      .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
      .limit(200);

    const mapped: Friend[] = (data ?? []).map((f: any) => {
      const other = f.user_id_1 === user.id ? f.users_2 : f.users_1;
      return {
        id: other?.id ?? '',
        friendshipId: f.id,
        name: other?.name ?? 'Usuário',
        avatar_url: other?.avatar_url,
        level: other?.level ?? 'Bronze',
      };
    });
    setFriends(mapped);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  return { friends, loading, reload: load };
}

export function useFriendRequests() {
  const user = useAuth((s) => s.user);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('friendships')
      .select('id, user_id_1, created_at, sender:user_id_1(id, name, avatar_url, level)')
      .eq('user_id_2', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(50);

    const mapped: FriendRequest[] = (data ?? []).map((f: any) => ({
      id: f.id,
      userId: f.sender?.id ?? f.user_id_1,
      name: f.sender?.name ?? 'Usuário',
      avatar_url: f.sender?.avatar_url,
      level: f.sender?.level ?? 'Bronze',
      createdAt: f.created_at,
    }));
    setRequests(mapped);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  return { requests, loading, reload: load };
}

export function useFriendshipStatus(targetUserId: string) {
  const user = useAuth((s) => s.user);
  const [status, setStatus] = useState<FriendshipStatus>('none');
  const [friendshipId, setFriendshipId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id || !targetUserId) return;
    (async () => {
      const { data } = await supabase
        .from('friendships')
        .select('id, user_id_1, user_id_2, status')
        .or(`and(user_id_1.eq.${user.id},user_id_2.eq.${targetUserId}),and(user_id_1.eq.${targetUserId},user_id_2.eq.${user.id})`)
        .maybeSingle();

      if (!data) { setStatus('none'); setFriendshipId(null); return; }
      setFriendshipId(data.id);
      if (data.status === 'accepted') setStatus('accepted');
      else if (data.status === 'blocked') setStatus('blocked');
      else if (data.user_id_1 === user.id) setStatus('pending_sent');
      else setStatus('pending_received');
    })();
  }, [user?.id, targetUserId]);

  return { status, friendshipId };
}

export async function sendFriendRequest(targetUserId: string) {
  const { error } = await supabase.from('friendships').insert({
    user_id_1: (await supabase.auth.getUser()).data.user?.id,
    user_id_2: targetUserId,
    status: 'pending',
  });
  if (error) throw error;
}

export async function acceptFriendRequest(friendshipId: string) {
  const { error } = await supabase.from('friendships').update({
    status: 'accepted',
    accepted_at: new Date().toISOString(),
  }).eq('id', friendshipId);
  if (error) throw error;
}

export async function removeFriend(friendshipId: string) {
  const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
  if (error) throw error;
}

export function useFriendsTrainingNow(friendIds: string[]) {
  const [training, setTraining] = useState<Array<{ user_id: string; name: string; avatar_url: string | null }>>([]);

  useEffect(() => {
    if (friendIds.length === 0) { setTraining([]); return; }

    const load = async () => {
      const { data } = await supabase
        .from('friends_training_now')
        .select('user_id, name, avatar_url')
        .in('user_id', friendIds);
      setTraining(data ?? []);
    };
    load();

    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [friendIds.join(',')]);

  return training;
}
