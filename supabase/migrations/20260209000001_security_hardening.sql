-- Security Hardening Migration
-- Created: 2026-02-09
-- Fixes: C4 (generation_jobs RLS), C6 (atomic credit deduction),
--        H1 (system_config table), H3 (token_purchases RLS)

-- ============================================
-- C4: Enable RLS on generation_jobs + generation_job_events
-- ============================================

ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_job_events ENABLE ROW LEVEL SECURITY;

-- generation_jobs: users can view/manage their own jobs
CREATE POLICY "Users can view own generation jobs"
  ON generation_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generation jobs"
  ON generation_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own generation jobs"
  ON generation_jobs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own generation jobs"
  ON generation_jobs FOR DELETE
  USING (auth.uid() = user_id);

-- generation_job_events: access through job ownership
CREATE POLICY "Users can view events for own jobs"
  ON generation_job_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM generation_jobs
      WHERE generation_jobs.id = job_id
        AND generation_jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert events for own jobs"
  ON generation_job_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM generation_jobs
      WHERE generation_jobs.id = job_id
        AND generation_jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete events for own jobs"
  ON generation_job_events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM generation_jobs
      WHERE generation_jobs.id = job_id
        AND generation_jobs.user_id = auth.uid()
    )
  );

-- ============================================
-- C6: Atomic credit deduction function
-- ============================================

CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  UPDATE users
  SET credits = credits - p_amount,
      total_credits_used = COALESCE(total_credits_used, 0) + p_amount
  WHERE id = p_user_id
    AND credits >= p_amount
  RETURNING credits INTO v_new_balance;

  IF FOUND THEN
    RETURN QUERY SELECT true, v_new_balance;
  ELSE
    -- Return current balance on failure
    RETURN QUERY
      SELECT false, COALESCE(u.credits, 0)
      FROM users u
      WHERE u.id = p_user_id;
  END IF;
END;
$$;

-- ============================================
-- H1: System config table for maintenance mode etc.
-- ============================================

CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES users(id)
);

ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Anyone can read system config (for maintenance mode checks)
CREATE POLICY "System config is publicly readable"
  ON system_config FOR SELECT
  USING (true);

-- Only admins can modify system config
CREATE POLICY "Admins can manage system config"
  ON system_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'ADMIN'
    )
  );

-- Insert default maintenance mode setting
INSERT INTO system_config (key, value)
VALUES ('maintenance_mode', '{"enabled": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- H3: Ensure token_purchases table exists with RLS
-- ============================================

CREATE TABLE IF NOT EXISTS token_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credits INTEGER NOT NULL,
  amount_paid INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  stripe_payment_intent_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'completed',
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE token_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own token purchases"
  ON token_purchases FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert/update (via webhook)
-- No INSERT/UPDATE policies for anon — webhook uses createAdminClient()

CREATE INDEX IF NOT EXISTS idx_token_purchases_user_id
  ON token_purchases(user_id);

CREATE INDEX IF NOT EXISTS idx_token_purchases_stripe_pi
  ON token_purchases(stripe_payment_intent_id);
