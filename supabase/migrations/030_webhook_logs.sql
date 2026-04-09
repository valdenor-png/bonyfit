-- ============================================
-- Migration 030: Tabela de idempotência para webhooks
-- ============================================

CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payment_id TEXT NOT NULL,
  customer_id TEXT,
  value NUMERIC(12,2),
  source_ip TEXT,
  verified_at_api BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_id ON webhook_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_payment_id ON webhook_logs(payment_id);

ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
-- Sem policy de SELECT para authenticated — só service_role acessa
