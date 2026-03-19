-- Add direction to call_logs (incoming vs outgoing)
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS direction TEXT NOT NULL DEFAULT 'incoming';
CREATE INDEX IF NOT EXISTS idx_call_logs_direction ON call_logs(direction);

-- Extend voice_settings with SMS fields
ALTER TABLE voice_settings ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE voice_settings ADD COLUMN IF NOT EXISTS sms_auto_reply BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE voice_settings ADD COLUMN IF NOT EXISTS sms_system_prompt TEXT NOT NULL DEFAULT 'You are a helpful AI assistant for RUX, an AI-powered app generator platform. Respond to SMS messages concisely and helpfully. Keep responses under 160 characters when possible.';

-- Message logs for SMS tracking
CREATE TABLE IF NOT EXISTS message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_sid TEXT,
  direction TEXT NOT NULL DEFAULT 'incoming',
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  body TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  user_plan TEXT,
  ai_response TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_logs_created_at ON message_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_logs_direction ON message_logs(direction);
CREATE INDEX IF NOT EXISTS idx_message_logs_from ON message_logs(from_number);

-- RLS
ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role access message_logs" ON message_logs
  FOR ALL USING (auth.role() = 'service_role');
