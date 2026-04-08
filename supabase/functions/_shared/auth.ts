// ─── Authentication Helpers ──────────────────────────────────

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface AuthResult {
  user: { id: string; email?: string };
  supabase: SupabaseClient;
}

/**
 * Extract JWT from Authorization header, validate with Supabase Auth,
 * return authenticated user + scoped supabase client.
 */
export async function getAuthenticatedUser(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Token de autenticação ausente');
  }

  const token = authHeader.replace('Bearer ', '');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('Usuário não autenticado');
  }

  return { user, supabase };
}

/**
 * Create a Supabase client with service_role key (full access).
 * Use for webhooks/cron where there's no user JWT.
 */
export function getServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}
