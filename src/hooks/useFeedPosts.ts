import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

type FeedTab = 'pra_voce' | 'unidade' | 'seguindo';

export interface FeedPost {
  id: string;
  user: {
    id: string;
    name: string;
    username?: string;
    level: string;
    unit?: string;
    avatar_url: string | null;
  };
  text: string;
  image_url: string | null;
  post_type: string;
  metadata?: Record<string, any>;
  likes_count: number;
  comments_count: number;
  view_count: number;
  isLiked: boolean;
  created_at: string;
}

interface UseFeedPostsOptions {
  tab: FeedTab;
  unitId: string | null;
  userId?: string;
}

export function useFeedPosts({ tab, unitId, userId }: UseFeedPostsOptions) {
  return useQuery({
    queryKey: ['feed', tab, unitId, userId],
    queryFn: async () => {
      if (!userId) return [];

      let query = supabase
        .from('posts')
        .select(`
          id, text, image_url, post_type, metadata,
          likes_count, comments_count, view_count,
          created_at, user_id,
          users!posts_user_id_fkey (id, name, username, level, unit_id, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(30);

      if (tab === 'seguindo') {
        // Only mutual friends' posts
        const { data: following } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', userId)
          .limit(1000);

        const { data: followers } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('following_id', userId)
          .limit(1000);

        const followingIds = new Set((following || []).map((f) => f.following_id));
        const mutualIds = (followers || [])
          .filter((f) => followingIds.has(f.follower_id))
          .map((f) => f.follower_id);

        if (mutualIds.length === 0) return [];
        query = query.in('user_id', mutualIds);
      }

      if (tab === 'unidade' && unitId) {
        // Filter by unit — need to join with users
        const { data: unitUsers } = await supabase
          .from('public_user_profile')
          .select('id')
          .eq('unit_id', unitId);

        const unitUserIds = (unitUsers || []).map((u) => u.id);
        if (unitUserIds.length === 0) return [];
        query = query.in('user_id', unitUserIds);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Check which posts the user has liked
      const postIds = (data || []).map((p) => p.id);
      const { data: likes } = postIds.length > 0
        ? await supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', userId)
            .in('post_id', postIds)
        : { data: [] };

      const likedSet = new Set((likes || []).map((l) => l.post_id));

      return (data || []).map((post: any): FeedPost => {
        const u = post.users || {};
        return {
          id: post.id,
          user: {
            id: u.id || post.user_id,
            name: u.name || 'Usuário',
            username: u.username,
            level: u.level || 'Bronze',
            unit: u.unit_id,
            avatar_url: u.avatar_url,
          },
          text: post.text || '',
          image_url: post.image_url,
          post_type: post.post_type || 'manual',
          metadata: post.metadata,
          likes_count: post.likes_count || 0,
          comments_count: post.comments_count || 0,
          view_count: post.view_count || 0,
          isLiked: likedSet.has(post.id),
          created_at: post.created_at,
        };
      });
    },
    enabled: !!userId,
    staleTime: 60 * 1000, // 1min
  });
}
