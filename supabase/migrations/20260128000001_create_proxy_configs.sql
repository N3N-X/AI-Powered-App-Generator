-- Create proxy_configs table for per-project proxy service configuration
CREATE TABLE IF NOT EXISTS proxy_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  service TEXT NOT NULL, -- 'email', 'sms', 'push', 'storage', 'maps'
  config JSONB NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, service)
);

CREATE INDEX IF NOT EXISTS idx_proxy_configs_project ON proxy_configs(project_id);

-- Enable RLS
ALTER TABLE proxy_configs ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can manage configs for their own projects
CREATE POLICY "Users can read own project proxy configs"
  ON proxy_configs FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own project proxy configs"
  ON proxy_configs FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own project proxy configs"
  ON proxy_configs FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own project proxy configs"
  ON proxy_configs FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Service account / admin access
CREATE POLICY "Service role has full access to proxy_configs"
  ON proxy_configs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
