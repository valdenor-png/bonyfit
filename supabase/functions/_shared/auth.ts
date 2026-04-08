// ─── Authentication & RBAC ───────────────────────────────────

import { SupabaseClient, createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface AuthUser {
  id: string
  email?: string
  cargo: string
  unit_id?: string
}

/**
 * Extract JWT from Authorization header, validate with Supabase Auth,
 * fetch user profile with cargo for RBAC.
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

  // Fetch profile with cargo
  const { data: perfil } = await supabase
    .from('users')
    .select('cargo_id, unit_id, cargos(slug)')
    .eq('id', user.id)
    .single()

  const cargoSlug = (perfil as any)?.cargos?.slug ?? 'aluno'

  return {
    id: user.id,
    email: user.email,
    cargo: cargoSlug,
    unit_id: perfil?.unit_id,
  }
}

/**
 * Require specific cargo(s) for RBAC.
 * Cargos: 'dono' | 'supervisor' | 'financeiro' | 'personal' | 'professor_*' | 'aluno'
 */
export async function requireRole(
  req: Request,
  supabase: SupabaseClient,
  allowedRoles: string[]
): Promise<AuthUser> {
  const user = await requireAuth(req, supabase)

  if (!allowedRoles.includes(user.cargo)) {
    throw {
      status: 403,
      code: 'FORBIDDEN',
      message: `Cargo '${user.cargo}' não tem permissão. Necessário: ${allowedRoles.join(', ')}`,
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
