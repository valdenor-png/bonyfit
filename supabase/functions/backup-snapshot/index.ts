import { createHandler } from '../_shared/handler.ts'
import { logAudit } from '../_shared/audit.ts'
import { success } from '../_shared/response.ts'

const handler = createHandler(async (req, supabase) => {
  // 1. Verify secret (no user auth — cron/external call)
  const secret = req.headers.get('x-backup-secret')
  if (secret !== Deno.env.get('BACKUP_SECRET')) {
    throw { status: 401, code: 'INVALID_SECRET', message: 'Secret inválido' }
  }

  const startTime = Date.now()

  // 2. Generate snapshot
  const { data: snapshot, error: snapError } = await supabase.rpc('backup_snapshot')
  if (snapError) {
    await registerFailure(supabase, snapError.message)
    throw { status: 500, message: 'Erro ao gerar snapshot', code: 'SNAPSHOT_ERROR' }
  }

  // 3. Save to Storage
  const fileName = `backup_${new Date().toISOString().split('T')[0]}.json`
  const jsonContent = JSON.stringify(snapshot)
  const sizeBytes = new TextEncoder().encode(jsonContent).length

  const { error: uploadError } = await supabase.storage
    .from('backups')
    .upload(fileName, jsonContent, {
      contentType: 'application/json',
      upsert: true,
    })

  if (uploadError) {
    await registerFailure(supabase, uploadError.message)
    throw { status: 500, message: 'Erro ao salvar backup', code: 'UPLOAD_ERROR' }
  }

  // 4. Record counts + history
  const { data: counts } = await supabase.rpc('backup_record_counts')
  const durationMs = Date.now() - startTime

  await supabase.from('backup_history').insert({
    backup_type: 'full_snapshot',
    storage_location: 'supabase_storage',
    file_name: fileName,
    size_bytes: sizeBytes,
    status: 'completed',
    tables_included: counts ? Object.keys(counts).filter((k: string) => k !== 'generated_at') : [],
    record_counts: counts ?? {},
    duration_ms: durationMs,
  })

  // 5. Audit
  await logAudit(supabase, {
    userId: '00000000-0000-0000-0000-000000000000',
    action: 'backup_completed',
    metadata: { file_name: fileName, size_bytes: sizeBytes, duration_ms: durationMs, record_counts: counts },
  })

  return success({ file_name: fileName, size_bytes: sizeBytes, duration_ms: durationMs, record_counts: counts })
}, { functionName: 'backup-snapshot', allowedMethods: ['POST'] })

// Helper: register failed backup in history
async function registerFailure(supabase: any, errorMessage: string) {
  try {
    await supabase.from('backup_history').insert({
      backup_type: 'full_snapshot',
      storage_location: 'supabase_storage',
      status: 'failed',
      error_message: errorMessage,
    })
    await logAudit(supabase, {
      userId: '00000000-0000-0000-0000-000000000000',
      action: 'backup_failed',
      metadata: { error: errorMessage },
    })
  } catch {
    // Best-effort logging
  }
}

Deno.serve(handler)
