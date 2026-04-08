import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

/**
 * Supabase Realtime subscription for live training friends.
 * Invalidates mutual-friends query when checkins change.
 * Returns live count of training friends.
 */
export function useLiveFriends(userId?: string) {
  const queryClient = useQueryClient();
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('live-friends')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_checkins',
        },
        () => {
          // Invalidate mutual friends to re-check who's training
          queryClient.invalidateQueries({ queryKey: ['mutual-friends', userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  // Derive count from mutual friends data
  useEffect(() => {
    const data = queryClient.getQueryData<any[]>(['mutual-friends', userId]);
    if (data) {
      setLiveCount(data.filter((f: any) => f.isTraining).length);
    }
  });

  return liveCount;
}
