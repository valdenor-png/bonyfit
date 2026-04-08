// ─── Authentication & RBAC ───────────────────────────────────

import { SupabaseClient, createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface AuthUser {
  id: string
  email?: string
  role: string
  unit_id?: string
}

/**
 * Extract JWT from Authorization header, validate with Supabase Auth,
 * fetch user profile with role for RBAC.
 */
export async function requireAuth(
  req: Request,
  supabase: SupabaseClient
): Promise<AuthUser> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) {
    throw { status: 401, code: 'NO_TOKEN', message: 'Token de autenticação ausente' }
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    throw { status: 401, code: 'INVALID_TOKEN', message: 'Token inválido ou expirado' }
  }

  // Fetch profile with role
  const { data: profile } = await supabase
    .from('users')
    .select('role, unit_id')
    .eq('id', user.id)
    .single()

  return {
    id: user.id,
    email: user.email,
    role: profile?.role ?? 'aluno',
    unit_id: profile?.unit_id,
  }
}

/**
 * Require specific role(s) for RBAC.
 * Roles: 'aluno' | 'personal' | 'professor' | 'financeiro' | 'dono'
 */
export async function requireRole(
  req: Request,
  supabase: SupabaseClient,
  allowedRoles: string[]
): Promise<AuthUser> {
  const user = await requireAuth(req, supabase)

  if (!allowedRoles.includes(user.role)) {
    throw {
      status: 403,
      code: 'FORBIDDEN',
      message: `Role '${user.role}' não tem permissão. Necessário: ${allowedRoles.join(', ')}`,
    }
  }

  return user
}

/**
 * Create a Supabase client with service_role key (full access).
 * Use for webhooks/cron where there's no user JWT.
 */
export function getServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
}

/**
 * Verify app origin via X-App-Token header.
 * Skip gracefully if APP_CHECK_SECRET is not configured.
 */
export function verifyAppOrigin(req: Request): void {
  const secret = Deno.env.get('APP_CHECK_SECRET')
  if (!secret) return
  const token = req.headers.get('X-App-Token')
  if (token !== secret) {
    throw { status: 401, code: 'INVALID_APP_TOKEN', message: 'Origem não autorizada' }
  }
}
