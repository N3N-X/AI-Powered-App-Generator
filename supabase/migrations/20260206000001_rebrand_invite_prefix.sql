-- Update invite code generation to use RULXY- prefix for new codes
-- Existing RUX- codes remain valid (no data migration)

CREATE OR REPLACE FUNCTION generate_user_invite_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code VARCHAR(14);
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := 'RULXY-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6));
    SELECT EXISTS(SELECT 1 FROM invite_codes WHERE code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;

  INSERT INTO invite_codes (code, owner_id, code_type)
  VALUES (new_code, NEW.id, 'personal');

  UPDATE users SET personal_invite_code = new_code WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
