-- Invite codes table
CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(12) UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  max_uses INTEGER,
  times_used INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  code_type VARCHAR(20) NOT NULL DEFAULT 'personal'
);

-- Track redemptions
CREATE TABLE IF NOT EXISTS invite_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code_id UUID NOT NULL REFERENCES invite_codes(id),
  inviter_id UUID NOT NULL REFERENCES auth.users(id),
  invitee_id UUID NOT NULL REFERENCES auth.users(id),
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  inviter_credits INTEGER NOT NULL DEFAULT 500,
  invitee_credits INTEGER NOT NULL DEFAULT 500,
  UNIQUE(invitee_id)
);

-- Extend users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS personal_invite_code VARCHAR(12) UNIQUE,
  ADD COLUMN IF NOT EXISTS total_invites INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invite_bonus_credits INTEGER NOT NULL DEFAULT 0;

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_owner ON invite_codes(owner_id);
CREATE INDEX IF NOT EXISTS idx_invite_redemptions_inviter ON invite_redemptions(inviter_id);
CREATE INDEX IF NOT EXISTS idx_invite_redemptions_invitee ON invite_redemptions(invitee_id);

-- RLS policies
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_redemptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own invite codes
CREATE POLICY "Users can view own codes" ON invite_codes
  FOR SELECT USING (owner_id = auth.uid());

-- Anyone can validate active codes (for signup validation)
CREATE POLICY "Anyone can validate active codes" ON invite_codes
  FOR SELECT USING (is_active = true);

-- Users can view their own redemptions (as inviter or invitee)
CREATE POLICY "Users can view own redemptions" ON invite_redemptions
  FOR SELECT USING (inviter_id = auth.uid() OR invitee_id = auth.uid());

-- Service role can insert/update (for API operations)
CREATE POLICY "Service can manage codes" ON invite_codes
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service can manage redemptions" ON invite_redemptions
  FOR ALL USING (true) WITH CHECK (true);

-- Function to generate invite code for new users
CREATE OR REPLACE FUNCTION generate_user_invite_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code VARCHAR(12);
  code_exists BOOLEAN;
BEGIN
  -- Generate a unique code
  LOOP
    new_code := 'RUX-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6));
    SELECT EXISTS(SELECT 1 FROM invite_codes WHERE code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;

  -- Insert the invite code
  INSERT INTO invite_codes (code, owner_id, code_type)
  VALUES (new_code, NEW.id, 'personal');

  -- Update user with their code
  UPDATE users SET personal_invite_code = new_code WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-generate invite code when user is created
DROP TRIGGER IF EXISTS on_user_created_generate_invite_code ON users;
CREATE TRIGGER on_user_created_generate_invite_code
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION generate_user_invite_code();

-- Generate codes for existing users who don't have one
DO $$
DECLARE
  user_record RECORD;
  new_code VARCHAR(12);
  code_exists BOOLEAN;
BEGIN
  FOR user_record IN SELECT id FROM users WHERE personal_invite_code IS NULL LOOP
    LOOP
      new_code := 'RUX-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6));
      SELECT EXISTS(SELECT 1 FROM invite_codes WHERE code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;

    INSERT INTO invite_codes (code, owner_id, code_type)
    VALUES (new_code, user_record.id, 'personal');

    UPDATE users SET personal_invite_code = new_code WHERE id = user_record.id;
  END LOOP;
END $$;
