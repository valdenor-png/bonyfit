import { z } from 'https://esm.sh/zod@3.23'
import { createHandler } from '../_shared/handler.ts'
import { requireAuth } from '../_shared/auth.ts'
import { parseBody } from '../_shared/validate.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'
import { logAudit } from '../_shared/audit.ts'
import { success } from '../_shared/response.ts'

const bodySchema = z.object({
  catraca_entrada_at: z.string(),
  gps_lat: z.number().optional(),
  gps_lng: z.number().optional(),
})

// Haversine distance in meters
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const handler = createHandler(async (req, supabase) => {
  const user = await requireAuth(req, supabase)
  await checkRateLimit(supabase, user.id, { action: 'checkin', maxPerMinute: 5 })

  const body = await parseBody(req, bodySchema)

  // Validate timestamp is recent (last 10 minutes)
  const catracaTime = new Date(body.catraca_entrada_at).getTime()
  if (Math.abs(Date.now() - catracaTime) > 10 * 60 * 1000) {
    throw { status: 400, code: 'TIMESTAMP_OLD', message: 'Timestamp da catraca deve ser dos últimos 10 minutos' }
  }

  // Check max 1 per day
  const today = new Date().toISOString().split('T')[0]
  const { data: existing } = await supabase
    .from('checkins')
    .select('id')
    .eq('user_id', user.id)
    .gte('created_at', today)
    .lt('created_at', today + 'T23:59:59Z')
    .maybeSingle()

  if (existing) {
    throw { status: 400, code: 'ALREADY_CHECKED_IN', message: 'Check-in já realizado hoje' }
  }

  // Cooldown 12h
  const { data: lastCheckin } = await supabase
    .from('checkins')
    .select('created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lastCheckin) {
    const diff = Date.now() - new Date(lastCheckin.created_at).getTime()
    if (diff < 12 * 60 * 60 * 1000) {
      throw { status: 400, code: 'COOLDOWN', message: 'Aguarde 12h entre check-ins' }
    }
  }

  // GPS check
  let gpsDentroRaio = true
  const raio = parseInt(Deno.env.get('BONY_FIT_GPS_RAIO') ?? '150')

  if (body.gps_lat != null && body.gps_lng != null) {
    try {
      const unidades = JSON.parse(Deno.env.get('BONY_FIT_UNIDADES') ?? '[]')
      gpsDentroRaio = unidades.some((u: { lat: number; lng: number }) =>
        haversine(body.gps_lat!, body.gps_lng!, u.lat, u.lng) < raio
      )
    } catch {
      gpsDentroRaio = true // fail open if config missing
    }
  }

  // Insert checkin
  const { data: checkin, error: insertError } = await supabase
    .from('checkins')
    .insert({
      user_id: user.id,
      catraca_entrada_at: body.catraca_entrada_at,
      gps_lat: body.gps_lat ?? null,
      gps_lng: body.gps_lng ?? null,
      gps_dentro_raio: gpsDentroRaio,
    })
    .select('id')
    .single()

  if (insertError) throw insertError

  // Flag GPS if outside radius too many times
  if (!gpsDentroRaio) {
    const { count } = await supabase
      .from('fraud_flags')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('flag_type', 'gps_fora_raio')

    if ((count ?? 0) > 5) {
      await supabase.from('fraud_flags').insert({
        user_id: user.id,
        flag_type: 'gps_fora_raio',
        severidade: 'media',
        detalhes: { lat: body.gps_lat, lng: body.gps_lng, checkin_id: checkin.id },
      })
    }
  }

  // Award points
  await supabase.from('user_points').insert({
    user_id: user.id,
    pontos: 100,
    tipo: 'checkin',
    referencia_id: checkin.id,
    status: 'confirmado',
  })

  await logAudit(supabase, {
    userId: user.id,
    action: 'checkin',
    entityType: 'checkin',
    entityId: checkin.id,
    metadata: { gps_dentro_raio: gpsDentroRaio },
  })

  return success({ checkin_id: checkin.id, pontos: 100, gps_dentro_raio: gpsDentroRaio })
}, { functionName: 'checkin', allowedMethods: ['POST'] })

Deno.serve(handler)
