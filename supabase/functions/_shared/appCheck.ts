// ─── App Origin Verification ─────────────────────────────────

/**
 * Verify that the request comes from our app by checking X-App-Token header.
 * If APP_CHECK_SECRET is not set in env, skip gracefully (dev mode).
 */
export function verifyAppOrigin(req: Request): void {
  const secret = Deno.env.get('APP_CHECK_SECRET');
  if (!secret) return; // Skip if not configured (dev/staging)

  const token = req.headers.get('X-App-Token');
  if (token !== secret) {
    throw new Error('Origem não autorizada');
  }
}
