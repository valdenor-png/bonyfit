import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const LIMITS: Record<string, { max: number; window: number }> = {
  complete_set: { max: 30, window: 60 },
  check_in: { max: 3, window: 3600 },
  redeem_points: { max: 5, window: 300 },
  social_post: { max: 10, window: 600 },
  social_like: { max: 60, window: 60 },
};

Deno.serve(async (req) => {
  const { user_id, action } = await req.json();
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const limit = LIMITS[action];
  if (!limit) return new Response(JSON.stringify({ allowed: true }));

  const windowStart = new Date(Date.now() - limit.window * 1000).toISOString();

  const { count } = await supabase
    .from('rate_limit_log')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user_id)
    .eq('action', action)
    .gte('created_at', windowStart);

  if ((count ?? 0) >= limit.max) {
    await supabase.from('fraud_alerts').insert({
      user_id,
      action,
      attempt_count: count,
      blocked: true,
    });

    return new Response(
      JSON.stringify({ allowed: false, retry_after: limit.window }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  await supabase.from('rate_limit_log').insert({ user_id, action });

  return new Response(
    JSON.stringify({ allowed: true }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
