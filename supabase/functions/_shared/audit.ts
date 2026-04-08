// ─── Audit Logging ───────────────────────────────────────────

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface AuditEntry {
  userId: string
  action: string
  entityType?: string
  entityId?: string
  metadata?: Record<string, any>
  ip?: string
}

/**
 * Log an audit entry to the database.
 * Best-effort: never throws or breaks the main flow.
 */
export async function logAudit(supabase: SupabaseClient, entry: AuditEntry) {
  try {
    await supabase.rpc('log_audit', {
      p_user_id: entry.userId,
      p_action: entry.action,
      p_entity_type: entry.entityType ?? null,
      p_entity_id: entry.entityId ?? null,
      p_metadata: entry.metadata ?? {},
      p_ip: entry.ip ?? null,
    })
  } catch (err) {
    console.error('Audit log failed:', err)
  }
}
