-- Add document ownership columns to app_documents
-- owner_type: 'global' (creator content visible to all) or 'user' (user-specific content)
-- owner_id: NULL for global content, app_user.id for user-specific content

ALTER TABLE app_documents
  ADD COLUMN IF NOT EXISTS owner_type TEXT NOT NULL DEFAULT 'global',
  ADD COLUMN IF NOT EXISTS owner_id TEXT;

CREATE INDEX IF NOT EXISTS idx_app_documents_owner
  ON app_documents(collection_id, owner_type);

CREATE INDEX IF NOT EXISTS idx_app_documents_owner_id
  ON app_documents(collection_id, owner_id);
