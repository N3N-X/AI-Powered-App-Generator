-- Add phone_number to users table for caller identification
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);

-- Voice webhook settings (single-row config)
CREATE TABLE IF NOT EXISTS voice_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN NOT NULL DEFAULT true,
  greeting_message TEXT NOT NULL DEFAULT 'Hello! Thank you for calling RUX. How can I help you today?',
  pro_greeting_message TEXT NOT NULL DEFAULT 'Welcome back, {name}! I can connect you with our team. First, how can I help you today?',
  forwarding_number TEXT NOT NULL DEFAULT '+13103007171',
  system_prompt TEXT NOT NULL DEFAULT 'You are a helpful AI phone agent for RUX, an AI-powered app generator platform. Be concise and friendly. Keep responses under 2 sentences since this is a phone conversation. Ask callers how you can help them.',
  max_conversation_turns INTEGER NOT NULL DEFAULT 5,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- Insert default settings row
INSERT INTO voice_settings (id) VALUES (gen_random_uuid());

-- Call logs
CREATE TABLE IF NOT EXISTS call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid TEXT UNIQUE NOT NULL,
  caller_number TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  user_plan TEXT,
  status TEXT NOT NULL DEFAULT 'in-progress',
  forwarded BOOLEAN NOT NULL DEFAULT false,
  duration_seconds INTEGER,
  conversation JSONB NOT NULL DEFAULT '[]',
  outcome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_call_logs_created_at ON call_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_logs_caller ON call_logs(caller_number);
CREATE INDEX IF NOT EXISTS idx_call_logs_call_sid ON call_logs(call_sid);

-- RLS policies
ALTER TABLE voice_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can access these tables (accessed from server-side API routes)
CREATE POLICY "Service role access voice_settings" ON voice_settings
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role access call_logs" ON call_logs
  FOR ALL USING (auth.role() = 'service_role');
