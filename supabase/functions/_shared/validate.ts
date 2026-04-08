// ─── Input Validation ────────────────────────────────────────

/**
 * Parse and validate request body using a Zod-compatible schema.
 * Works with any schema that has .safeParse()
 */
export async function parseBody<T>(
  req: Request,
  schema: { safeParse: (data: unknown) => { success: boolean; data?: T; error?: any } }
): Promise<T> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    throw { status: 400, code: 'INVALID_JSON', message: 'Body não é JSON válido' }
  }

  const result = schema.safeParse(body)
  if (!result.success) {
    const issues = result.error?.flatten?.() ?? result.error
    throw {
      status: 422,
      code: 'VALIDATION_ERROR',
      message: 'Dados inválidos',
      details: issues,
    }
  }

  return result.data as T
}

/**
 * Parse query params with defaults.
 */
export function parseQuery(url: URL, defaults: Record<string, string> = {}) {
  const params: Record<string, string> = { ...defaults }
  url.searchParams.forEach((value, key) => {
    params[key] = value
  })
  return params
}

/**
 * Parse and sanitize pagination params.
 * Supports both cursor and offset modes.
 */
export function parsePagination(url: URL) {
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 20), 1), 50)
  const cursor = url.searchParams.get('cursor') ?? null
  const offset = Math.max(Number(url.searchParams.get('offset') ?? 0), 0)
  const mode: 'cursor' | 'offset' = cursor ? 'cursor' : 'offset'

  return { limit, cursor, offset, mode }
}

// ─── Simple validators (no Zod dependency) ───────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function validateUUID(value: unknown): string {
  if (typeof value !== 'string' || !UUID_RE.test(value)) {
    throw { status: 422, code: 'INVALID_UUID', message: 'UUID inválido' }
  }
  return value
}

export function validateString(value: unknown, maxLength = 500): string {
  if (typeof value !== 'string') {
    throw { status: 422, code: 'INVALID_STRING', message: 'Valor deve ser texto' }
  }
  const clean = value.replace(/<[^>]*>/g, '').trim()
  if (clean.length === 0) {
    throw { status: 422, code: 'EMPTY_STRING', message: 'Valor não pode ser vazio' }
  }
  if (clean.length > maxLength) {
    throw { status: 422, code: 'STRING_TOO_LONG', message: `Valor excede ${maxLength} caracteres` }
  }
  return clean
}

export function validateNumber(value: unknown, min = 0, max = 99999): number {
  const num = Number(value)
  if (isNaN(num)) {
    throw { status: 422, code: 'INVALID_NUMBER', message: 'Valor deve ser numérico' }
  }
  if (num < min || num > max) {
    throw { status: 422, code: 'NUMBER_OUT_OF_RANGE', message: `Valor deve estar entre ${min} e ${max}` }
  }
  return Math.floor(num)
}

export function validateEnum<T extends string>(value: unknown, allowed: T[]): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw { status: 422, code: 'INVALID_ENUM', message: `Valor deve ser um de: ${allowed.join(', ')}` }
  }
  return value as T
}
