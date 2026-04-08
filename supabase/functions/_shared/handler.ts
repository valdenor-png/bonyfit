// ─── Edge Function Handler Wrapper ───────────────────────────

import { SupabaseClient, createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { error, cors } from './response.ts'

type HandlerFn = (req: Request, supabase: SupabaseClient) => Promise<Response>

interface HandlerOptions {
  allowedMethods?: string[]
  functionName: string
}

/**
 * Wrapper principal para Edge Functions.
 * Fornece: CORS, method validation, Supabase client, error boundary, error logging.
 */
export function createHandler(handler: HandlerFn, options: HandlerOptions) {
  return async (req: Request) => {
    // CORS preflight
    if (req.method === 'OPTIONS') return cors()

    // Method validation
    if (options.allowedMethods && !options.allowedMethods.includes(req.method)) {
      return error(`Método ${req.method} não permitido`, 405, 'METHOD_NOT_ALLOWED')
    }

    // Create Supabase client with service_role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    try {
      return await handler(req, supabase)
    } catch (err: any) {
      // Known errors (thrown by helpers with status + message)
      if (err.status && err.message) {
        return error(err.message, err.status, err.code)
      }

      // Unexpected error — log to database
      console.error(`[${options.functionName}] Unexpected error:`, err)
      try {
        await supabase.rpc('log_api_error', {
          p_function_name: options.functionName,
          p_error_message: err.message ?? String(err),
          p_error_code: err.code ?? 'UNHANDLED',
          p_stack_trace: err.stack ?? null,
          p_request_method: req.method,
          p_request_path: new URL(req.url).pathname,
        })
      } catch {
        // If error logging fails, don't break the response
      }

      return error('Erro interno do servidor', 500, 'INTERNAL_ERROR')
    }
  }
}
