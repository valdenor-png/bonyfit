import { supabase } from '../services/supabase';

export async function checkRateLimit(action: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  try {
    const { data, error } = await supabase.functions.invoke('rate-limiter', {
      body: { user_id: user.id, action },
    });

    if (error) {
      console.warn('Rate limiter error:', error);
      return true; // Allow on error to not block user
    }

    return data?.allowed !== false;
  } catch (err) {
    console.warn('Rate limiter unreachable:', err);
    return true; // Allow on network error
  }
}
