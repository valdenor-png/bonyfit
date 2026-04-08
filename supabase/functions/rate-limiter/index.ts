import { getAuthenticatedUser, getServiceClient } from '../_shared/auth.ts';
import { verifyAppOrigin } from '../_shared/appCheck.ts';
import { validateEnum } from '../_shared/validate.ts';
import { ok, error, cors } from '../_shared/response.ts';

const ACTIONS = [
  'complete_set',
  'check_in',
  'redeem_points',
  'social_post',
  'social_like',
] as const;

type Action = (typeof ACTIONS)[number];

const LIMITS: Record<Action, { max: number; window: number }> = {
  complete_set:  { max: 30, window: 60 },
  check_in:      { max: 3,  window: 3600 },
  redeem_points: { max: 5,  window: 300 },
  social_post:   { max: 10, window: 600 },
  social_like:   { max: 60, window: 60 },
};

Deno.serve(async (req) => {
  // ── OPTIONS preflight ──────────────────────────────────────
  if (req.method === 'OPTIONS') return cors();

  try {
    // ── App origin check ─────────────────────────────────────
    verifyAppOrigin(req);

    // ── Authenticate via JWT (não confiar no body) ───────────
    const { user } = await getAuthenticatedUser(req);
    const userId = user.id;

    // ── Validate input ───────────────────────────────────────
    const body = await req.json();
    const action = validateEnum(body.action, [...ACTIONS]);

    // ── Service client for rate limit tables ─────────────────
    const supabase = getServiceClient();
    const limit = LIMITS[action];
    const windowStart = new Date(Date.now() - limit.window * 1000).toISOString();

    // ── Count recent actions ─────────────────────────────────
    const { count } = await supabase
      .from('rate_limit_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action', action)
      .gte('created_at', windowStart);

    const used = count ?? 0;
    const remaining = Math.max(0, limit.max - used);

    if (used >= limit.max) {
      // Log fraud alert
      await supabase.from('fraud_alerts').insert({
        user_id: userId,
        action,
        attempt_count: used,
        blocked: true,
      });

      return error('Rate limit excedido', 429);
    }

    // ── Log action ───────────────────────────────────────────
    await supabase.from('rate_limit_log').insert({
      user_id: userId,
      action,
    });

    return ok({ allowed: true, remaining: remaining - 1 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    const status = message.includes('não autoriza') || message.includes('não autenticado')
      ? 401
      : 400;
    return error(message, status);
  }
});
