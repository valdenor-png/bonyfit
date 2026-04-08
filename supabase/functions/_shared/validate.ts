// ─── Input Validation Helpers ────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateUUID(value: unknown): string {
  if (typeof value !== 'string' || !UUID_RE.test(value)) {
    throw new Error('UUID inválido');
  }
  return value;
}

export function validateString(value: unknown, maxLength = 500): string {
  if (typeof value !== 'string') throw new Error('Valor deve ser texto');
  // Remove HTML tags
  const clean = value.replace(/<[^>]*>/g, '').trim();
  if (clean.length === 0) throw new Error('Valor não pode ser vazio');
  if (clean.length > maxLength) throw new Error(`Valor excede ${maxLength} caracteres`);
  return clean;
}

export function validateNumber(value: unknown, min = 0, max = 99999): number {
  const num = Number(value);
  if (isNaN(num)) throw new Error('Valor deve ser numérico');
  if (num < min || num > max) throw new Error(`Valor deve estar entre ${min} e ${max}`);
  return Math.floor(num);
}

export function validateEnum<T extends string>(value: unknown, allowed: T[]): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new Error(`Valor deve ser um de: ${allowed.join(', ')}`);
  }
  return value as T;
}
