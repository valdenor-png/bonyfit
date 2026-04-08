// ─── Envelope Pattern ────────────────────────────────────────
// Sucesso: { ok: true, data: T, meta: { ... } | null }
// Erro:    { ok: false, error: { message: string, code: string } }

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, x-app-token, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

export interface ApiMeta {
  total?: number
  limit?: number
  offset?: number
  has_more?: boolean
  next_cursor?: string | null
}

export function success<T>(data: T, meta?: ApiMeta, status = 200) {
  return new Response(
    JSON.stringify({ ok: true, data, meta: meta ?? null }),
    { status, headers: CORS_HEADERS }
  )
}

export function error(message: string, status = 400, code?: string) {
  return new Response(
    JSON.stringify({
      ok: false,
      error: { message, code: code ?? httpCodeToError(status) },
    }),
    { status, headers: CORS_HEADERS }
  )
}

export function cors() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

function httpCodeToError(status: number): string {
  const map: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE',
    429: 'RATE_LIMITED',
    500: 'INTERNAL_ERROR',
  }
  return map[status] ?? 'UNKNOWN_ERROR'
}
