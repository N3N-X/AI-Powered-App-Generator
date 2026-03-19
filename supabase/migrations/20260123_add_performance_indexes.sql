-- Performance Indexes Migration
-- Created: 2026-01-23
-- Purpose: Optimize query performance for frequently accessed tables

-- ============================================================
-- PROJECTS TABLE INDEXES
-- ============================================================

-- Index for finding projects by user_id (most common query)
CREATE INDEX IF NOT EXISTS idx_projects_user_id
ON projects(user_id);

-- Index for subdomain lookups (used for web app routing)
CREATE INDEX IF NOT EXISTS idx_projects_subdomain
ON projects(subdomain)
WHERE subdomain IS NOT NULL;

-- Index for custom domain lookups (used for domain verification)
CREATE INDEX IF NOT EXISTS idx_projects_custom_domain
ON projects(custom_domain)
WHERE custom_domain IS NOT NULL;

-- Composite index for user's projects sorted by updated_at
CREATE INDEX IF NOT EXISTS idx_projects_user_updated
ON projects(user_id, updated_at DESC);

-- Index for slug lookups (used for project routing)
CREATE INDEX IF NOT EXISTS idx_projects_user_slug
ON projects(user_id, slug);

-- ============================================================
-- PROJECT API KEYS TABLE INDEXES
-- ============================================================

-- Index for finding API keys by project_id
CREATE INDEX IF NOT EXISTS idx_api_keys_project_id
ON project_api_keys(project_id);

-- Index for API key hash lookups (authentication)
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash
ON project_api_keys(key_hash);

-- Index for finding active API keys by project
CREATE INDEX IF NOT EXISTS idx_api_keys_project_active
ON project_api_keys(project_id, active)
WHERE active = true;

-- Index for key prefix lookups (used for key identification)
CREATE INDEX IF NOT EXISTS idx_api_keys_key_prefix
ON project_api_keys(key_prefix);

-- ============================================================
-- BUILDS TABLE INDEXES
-- ============================================================

-- Index for finding builds by project_id
CREATE INDEX IF NOT EXISTS idx_builds_project_id
ON builds(project_id);

-- Index for finding builds by user_id
CREATE INDEX IF NOT EXISTS idx_builds_user_id
ON builds(user_id);

-- Index for filtering builds by status
CREATE INDEX IF NOT EXISTS idx_builds_status
ON builds(status);

-- Composite index for user's builds sorted by created_at
CREATE INDEX IF NOT EXISTS idx_builds_user_created
ON builds(user_id, created_at DESC);

-- Composite index for project builds by status
CREATE INDEX IF NOT EXISTS idx_builds_project_status
ON builds(project_id, status);

-- ============================================================
-- APP COLLECTIONS TABLE INDEXES
-- ============================================================

-- Index for finding collections by project_id
CREATE INDEX IF NOT EXISTS idx_collections_project_id
ON app_collections(project_id);

-- Composite index for finding collections by project and name
CREATE INDEX IF NOT EXISTS idx_collections_project_name
ON app_collections(project_id, name);

-- ============================================================
-- APP DOCUMENTS TABLE INDEXES
-- ============================================================

-- Index for finding documents by collection_id
CREATE INDEX IF NOT EXISTS idx_documents_collection_id
ON app_documents(collection_id);

-- Index for documents sorted by created_at
CREATE INDEX IF NOT EXISTS idx_documents_collection_created
ON app_documents(collection_id, created_at DESC);

-- ============================================================
-- APP USERS TABLE INDEXES
-- ============================================================

-- Index for finding app users by project_id
CREATE INDEX IF NOT EXISTS idx_app_users_project_id
ON app_users(project_id);

-- Index for email lookups within a project
CREATE INDEX IF NOT EXISTS idx_app_users_project_email
ON app_users(project_id, email);

-- ============================================================
-- APP SESSIONS TABLE INDEXES
-- ============================================================

-- Index for finding sessions by app_user_id
CREATE INDEX IF NOT EXISTS idx_app_sessions_user_id
ON app_sessions(app_user_id);

-- Index for finding sessions by expiration time
CREATE INDEX IF NOT EXISTS idx_app_sessions_expires_at
ON app_sessions(expires_at);

-- ============================================================
-- STORAGE FILES TABLE INDEXES
-- ============================================================

-- Index for finding storage files by project_id
CREATE INDEX IF NOT EXISTS idx_storage_files_project_id
ON storage_files(project_id);

-- Index for finding files by user_id
CREATE INDEX IF NOT EXISTS idx_storage_files_user_id
ON storage_files(user_id);

-- Composite index for project files sorted by created_at
CREATE INDEX IF NOT EXISTS idx_storage_files_project_created
ON storage_files(project_id, created_at DESC);

-- ============================================================
-- PROXY USAGE TABLE INDEXES
-- ============================================================

-- Index for finding usage records by user_id
CREATE INDEX IF NOT EXISTS idx_usage_user_id
ON proxy_usage(user_id);

-- Index for finding usage records by project_id
CREATE INDEX IF NOT EXISTS idx_usage_project_id
ON proxy_usage(project_id);

-- Index for time-based queries (analytics)
CREATE INDEX IF NOT EXISTS idx_usage_created_at
ON proxy_usage(created_at DESC);

-- Composite index for user usage over time
CREATE INDEX IF NOT EXISTS idx_usage_user_created
ON proxy_usage(user_id, created_at DESC);

-- ============================================================
-- USERS TABLE INDEXES
-- ============================================================

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email
ON users(email);

-- ============================================================
-- VERIFICATION
-- ============================================================

-- To verify indexes were created, run:
-- SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;
