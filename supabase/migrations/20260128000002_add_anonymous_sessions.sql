-- Add anonymous session support to app_users
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS is_anonymous boolean NOT NULL DEFAULT false;

-- Index for cleanup queries (find old anonymous users)
CREATE INDEX IF NOT EXISTS idx_app_users_anonymous
  ON app_users (is_anonymous, last_login_at)
  WHERE is_anonymous = true;
