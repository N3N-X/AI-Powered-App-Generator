-- Row Level Security (RLS) Policies Migration
-- Created: 2026-01-23
-- Purpose: Enable RLS and create policies for data isolation and security

-- Note: This migration drops existing policies first to avoid conflicts

-- Drop existing policies if they exist
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.tablename || ';';
    END LOOP;
END $$;

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE builds ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE proxy_usage ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Projects table policies
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Project API keys policies
CREATE POLICY "Users can view own project API keys"
  ON project_api_keys FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM projects WHERE id = project_id));

CREATE POLICY "Users can insert own project API keys"
  ON project_api_keys FOR INSERT
  WITH CHECK (auth.uid() = (SELECT user_id FROM projects WHERE id = project_id));

CREATE POLICY "Users can update own project API keys"
  ON project_api_keys FOR UPDATE
  USING (auth.uid() = (SELECT user_id FROM projects WHERE id = project_id));

CREATE POLICY "Users can delete own project API keys"
  ON project_api_keys FOR DELETE
  USING (auth.uid() = (SELECT user_id FROM projects WHERE id = project_id));

-- Builds table policies
CREATE POLICY "Users can view own builds"
  ON builds FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own builds"
  ON builds FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own builds"
  ON builds FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own builds"
  ON builds FOR DELETE
  USING (auth.uid() = user_id);

-- App users policies
CREATE POLICY "Users can view app users for own projects"
  ON app_users FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM projects WHERE id = project_id));

CREATE POLICY "Users can insert app users for own projects"
  ON app_users FOR INSERT
  WITH CHECK (auth.uid() = (SELECT user_id FROM projects WHERE id = project_id));

CREATE POLICY "Users can update app users for own projects"
  ON app_users FOR UPDATE
  USING (auth.uid() = (SELECT user_id FROM projects WHERE id = project_id));

CREATE POLICY "Users can delete app users for own projects"
  ON app_users FOR DELETE
  USING (auth.uid() = (SELECT user_id FROM projects WHERE id = project_id));

-- App sessions policies (via app_users)
CREATE POLICY "Users can view app sessions for own projects"
  ON app_sessions FOR SELECT
  USING (auth.uid() = (
    SELECT p.user_id
    FROM app_users au
    JOIN projects p ON au.project_id = p.id
    WHERE au.id = app_user_id
  ));

CREATE POLICY "Users can insert app sessions for own projects"
  ON app_sessions FOR INSERT
  WITH CHECK (auth.uid() = (
    SELECT p.user_id
    FROM app_users au
    JOIN projects p ON au.project_id = p.id
    WHERE au.id = app_user_id
  ));

CREATE POLICY "Users can update app sessions for own projects"
  ON app_sessions FOR UPDATE
  USING (auth.uid() = (
    SELECT p.user_id
    FROM app_users au
    JOIN projects p ON au.project_id = p.id
    WHERE au.id = app_user_id
  ));

CREATE POLICY "Users can delete app sessions for own projects"
  ON app_sessions FOR DELETE
  USING (auth.uid() = (
    SELECT p.user_id
    FROM app_users au
    JOIN projects p ON au.project_id = p.id
    WHERE au.id = app_user_id
  ));

-- App collections policies
CREATE POLICY "Users can view collections for own projects"
  ON app_collections FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM projects WHERE id = project_id));

CREATE POLICY "Users can insert collections for own projects"
  ON app_collections FOR INSERT
  WITH CHECK (auth.uid() = (SELECT user_id FROM projects WHERE id = project_id));

CREATE POLICY "Users can update collections for own projects"
  ON app_collections FOR UPDATE
  USING (auth.uid() = (SELECT user_id FROM projects WHERE id = project_id));

CREATE POLICY "Users can delete collections for own projects"
  ON app_collections FOR DELETE
  USING (auth.uid() = (SELECT user_id FROM projects WHERE id = project_id));

-- App documents policies (via collections)
CREATE POLICY "Users can view documents for own projects"
  ON app_documents FOR SELECT
  USING (auth.uid() = (
    SELECT p.user_id
    FROM app_collections c
    JOIN projects p ON c.project_id = p.id
    WHERE c.id = collection_id
  ));

CREATE POLICY "Users can insert documents for own projects"
  ON app_documents FOR INSERT
  WITH CHECK (auth.uid() = (
    SELECT p.user_id
    FROM app_collections c
    JOIN projects p ON c.project_id = p.id
    WHERE c.id = collection_id
  ));

CREATE POLICY "Users can update documents for own projects"
  ON app_documents FOR UPDATE
  USING (auth.uid() = (
    SELECT p.user_id
    FROM app_collections c
    JOIN projects p ON c.project_id = p.id
    WHERE c.id = collection_id
  ));

CREATE POLICY "Users can delete documents for own projects"
  ON app_documents FOR DELETE
  USING (auth.uid() = (
    SELECT p.user_id
    FROM app_collections c
    JOIN projects p ON c.project_id = p.id
    WHERE c.id = collection_id
  ));

-- Storage files policies
CREATE POLICY "Users can view storage files for own projects"
  ON storage_files FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert storage files for own projects"
  ON storage_files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update storage files for own projects"
  ON storage_files FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete storage files for own projects"
  ON storage_files FOR DELETE
  USING (auth.uid() = user_id);

-- Proxy usage policies
CREATE POLICY "Users can view own proxy usage"
  ON proxy_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own proxy usage"
  ON proxy_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);
