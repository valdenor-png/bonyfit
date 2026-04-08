// ─── Response Helpers ────────────────────────────────────────

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-app-token, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** 200 JSON response with CORS */
export function ok(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

/** Error JSON response with CORS */
export function error(message: string, status = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

/** 204 preflight response for OPTIONS */
export function cors(): Response {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
