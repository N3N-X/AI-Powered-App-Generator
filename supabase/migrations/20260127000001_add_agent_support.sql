-- Migration: Add agent support columns and agent_sessions table
-- Part of Phase 3: Agent Architecture for RUX

-- Add columns to existing projects table for agent state persistence
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS app_spec JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS feature_registry JSONB DEFAULT '[]'::jsonb;

-- Agent session tracking for long-running operations and resumable checkpoints
CREATE TABLE IF NOT EXISTS agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  state JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  goals JSONB DEFAULT '[]'::jsonb,
  decisions JSONB DEFAULT '[]'::jsonb,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on agent_sessions
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access their own agent sessions
CREATE POLICY "Users can view own agent sessions"
  ON agent_sessions FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own agent sessions"
  ON agent_sessions FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own agent sessions"
  ON agent_sessions FOR UPDATE
  USING (auth.uid()::text = user_id);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_agent_sessions_project
  ON agent_sessions(project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_sessions_user
  ON agent_sessions(user_id, status);

CREATE INDEX IF NOT EXISTS idx_agent_sessions_status
  ON agent_sessions(status) WHERE status = 'running';
