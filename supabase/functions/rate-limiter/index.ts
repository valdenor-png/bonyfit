import { createHandler } from '../_shared/handler.ts'
import { requireAuth, verifyAppOrigin } from '../_shared/auth.ts'
import { validateEnum } from '../_shared/validate.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'
import { success } from '../_shared/response.ts'
import { logAudit } from '../_shared/audit.ts'

const ACTIONS = [
  'complete_set',
  'check_in',
  'redeem_points',
  'social_post',
  'social_like',
  'dm_send',
  'post_create',
  'shop_purchase',
  'report',
] as const

const handler = createHandler(async (req, supabase) => {
  verifyAppOrigin(req)

  const user = await requireAuth(req, supabase)
  const body = await req.json()
  const action = validateEnum(body.action, [...ACTIONS])

  await checkRateLimit(supabase, user.id, { action })

  return success({ allowed: true })
}, { functionName: 'rate-limiter', allowedMethods: ['POST'] })

Deno.serve(handler)
