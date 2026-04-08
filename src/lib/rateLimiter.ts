import { supabase } from '../services/supabase';

interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
}

/**
 * Check rate limit for an action.
 * Fail open: if the function is unreachable, allow the action.
 */
export async function checkRateLimit(action: string): Promise<RateLimitResult> {
  try {
    const { data, error } = await supabase.functions.invoke('rate-limiter', {
      body: { action },
    });

    if (error) {
      console.warn('Rate limiter error:', error);
      return { allowed: true };
    }

    return {
      allowed: data?.allowed !== false,
      remaining: data?.remaining,
    };
  } catch (err) {
    console.warn('Rate limiter unreachable:', err);
    return { allowed: true };
  }
}
