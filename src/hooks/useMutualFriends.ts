import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

export interface MutualFriend {
  id: string;
  name: string;
  username?: string;
  level: string;
  avatar_url: string | null;
  hasStory: boolean;
  isTraining: boolean;
}

/**
 * Fetch mutual friends (both follow each other).
 * Includes story status and training status.
 */
export function useMutualFriends(userId?: string) {
  return useQuery({
    queryKey: ['mutual-friends', userId],
    queryFn: async () => {
      if (!userId) return [];

      // Get mutual follows (both directions)
      const { data: following, error: e1 } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);
      if (e1) throw e1;

      const followingIds = (following || []).map((f) => f.following_id);
      if (followingIds.length === 0) return [];

      const { data: mutual, error: e2 } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', userId)
        .in('follower_id', followingIds);
      if (e2) throw e2;

      const mutualIds = (mutual || []).map((m) => m.follower_id);
      if (mutualIds.length === 0) return [];

      // Get user profiles
      const { data: users, error: e3 } = await supabase
        .from('public_user_profile')
        .select('id, name, username, level, avatar_url')
        .in('id', mutualIds);
      if (e3) throw e3;

      // Check active checkins
      const { data: checkins } = await supabase
        .from('active_checkins')
        .select('user_id')
        .in('user_id', mutualIds)
        .eq('status', 'active');

      const trainingSet = new Set((checkins || []).map((c) => c.user_id));

      // TODO: Check stories table when implemented
      // For now, hasStory = false
      const result: MutualFriend[] = (users || []).map((u) => ({
        id: u.id,
        name: u.name || '',
        username: u.username,
        level: u.level || 'Bronze',
        avatar_url: u.avatar_url,
        hasStory: false,
        isTraining: trainingSet.has(u.id),
      }));

      // Sort: training first, then by name
      result.sort((a, b) => {
        if (a.isTraining !== b.isTraining) return a.isTraining ? -1 : 1;
        if (a.hasStory !== b.hasStory) return a.hasStory ? -1 : 1;
        return (a.name || '').localeCompare(b.name || '');
      });

      return result;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}
