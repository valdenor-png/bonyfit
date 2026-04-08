// ─── Rate Limiting via RPC ───────────────────────────────────

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RateLimitConfig {
  action: string
  maxPerMinute?: number
}

// Default limits per action
export const RATE_LIMITS: Record<string, number> = {
  checkin:        5,
  complete_set:   30,
  post_create:    10,
  post_like:      60,
  dm_send:        30,
  ranking_fetch:  60,
  shop_purchase:  10,
  report:         5,
  redeem_points:  5,
  social_post:    10,
  social_like:    60,
  default:        30,
}

/**
 * Check rate limit for a user action.
 * Throws 429 if limit exceeded.
 * Uses database RPC for atomic check+increment.
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
  config: RateLimitConfig
): Promise<void> {
  const maxPerMinute = config.maxPerMinute ?? RATE_LIMITS[config.action] ?? RATE_LIMITS.default

  const { data } = await supabase.rpc('check_rate_limit', {
    p_user_id: userId,
    p_action: config.action,
    p_max_per_minute: maxPerMinute,
  })

  if (data === false) {
    throw {
      status: 429,
      code: 'RATE_LIMITED',
      message: `Limite excedido: máximo ${maxPerMinute} requisições por minuto para '${config.action}'`,
    }
  }
}
