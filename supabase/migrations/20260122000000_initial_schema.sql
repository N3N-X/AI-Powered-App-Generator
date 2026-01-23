-- ============================================
-- RUX Supabase Schema
-- Complete database schema with Row Level Security
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE plan AS ENUM ('FREE', 'PRO', 'ELITE');
CREATE TYPE role AS ENUM ('USER', 'ADMIN');
CREATE TYPE platform AS ENUM ('WEB', 'IOS', 'ANDROID');
CREATE TYPE build_status AS ENUM ('PENDING', 'QUEUED', 'BUILDING', 'SUCCESS', 'FAILED', 'CANCELLED');
CREATE TYPE build_platform AS ENUM ('ANDROID', 'IOS');
CREATE TYPE proxy_service AS ENUM (
  -- AI Models
  'XAI', 'OPENAI', 'ANTHROPIC', 'GOOGLE_AI', 'GROQ', 'COHERE', 'MISTRAL', 'PERPLEXITY',
  -- Image Generation
  'DALL_E', 'STABLE_DIFFUSION', 'MIDJOURNEY', 'FLUX',
  -- Search & Data
  'GOOGLE_SEARCH', 'IMAGE_SEARCH', 'PLACES', 'MAPS', 'SERP',
  -- Media Processing
  'TRANSCRIBE', 'TTS', 'VIDEO', 'PDF', 'OCR',
  -- Communication
  'EMAIL', 'SMS', 'PUSH', 'WHATSAPP',
  -- Data & Utilities
  'STORAGE', 'DATABASE', 'APP_AUTH', 'ANALYTICS', 'QR_CODE', 'WEATHER', 'TRANSLATE', 'CURRENCY',
  -- Validation & Verification
  'EMAIL_VALIDATE', 'PHONE_VALIDATE', 'DOMAIN_WHOIS',
  -- Payments
  'PAYMENTS',
  -- Content APIs
  'NEWS', 'STOCKS', 'CRYPTO', 'MOVIES', 'BOOKS', 'SPORTS'
);

-- ============================================
-- USERS TABLE
-- Links to Supabase Auth
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  plan plan DEFAULT 'FREE',
  role role DEFAULT 'USER',

  -- Stripe billing
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,

  -- Encrypted credentials
  github_token_encrypted TEXT,
  claude_key_encrypted TEXT,

  -- Credit system
  credits INTEGER DEFAULT 3000,
  total_credits_used INTEGER DEFAULT 0,
  last_credit_reset TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);

-- ============================================
-- PROJECTS TABLE
-- ============================================

CREATE TABLE projects (
  id TEXT PRIMARY KEY DEFAULT ('proj_' || gen_random_uuid()::text),
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL,
  platform platform DEFAULT 'WEB',

  -- Code storage - JSONB for flexible file structure
  code_files JSONB DEFAULT '{}'::jsonb,

  -- Chat history
  chat_history JSONB DEFAULT '[]'::jsonb,

  -- App configuration
  app_config JSONB,

  -- GitHub integration
  github_repo TEXT,
  github_url TEXT,

  -- Domain settings (WEB platform only)
  subdomain TEXT UNIQUE,
  custom_domain TEXT UNIQUE,
  domain_verified BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Relations
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  UNIQUE(user_id, slug)
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_subdomain ON projects(subdomain);
CREATE INDEX idx_projects_custom_domain ON projects(custom_domain);

-- ============================================
-- PROMPT HISTORY
-- ============================================

CREATE TABLE prompt_history (
  id TEXT PRIMARY KEY DEFAULT ('prompt_' || gen_random_uuid()::text),
  prompt TEXT NOT NULL,
  response TEXT,
  model TEXT NOT NULL,
  tokens INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Relations
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_prompt_history_user_id ON prompt_history(user_id);
CREATE INDEX idx_prompt_history_project_id ON prompt_history(project_id);
CREATE INDEX idx_prompt_history_created_at ON prompt_history(created_at);

-- ============================================
-- DEVELOPER CREDENTIALS
-- ============================================

CREATE TABLE developer_credentials (
  id TEXT PRIMARY KEY DEFAULT ('cred_' || gen_random_uuid()::text),
  platform TEXT NOT NULL,
  name TEXT NOT NULL,

  -- Encrypted data
  encrypted_data TEXT NOT NULL,
  metadata JSONB,

  -- Verification
  verified BOOLEAN DEFAULT false,
  last_verified TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Relations
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  UNIQUE(user_id, platform, name)
);

CREATE INDEX idx_dev_creds_user_id ON developer_credentials(user_id);

-- ============================================
-- BUILDS
-- ============================================

CREATE TABLE builds (
  id TEXT PRIMARY KEY DEFAULT ('build_' || gen_random_uuid()::text),
  platform build_platform NOT NULL,
  status build_status DEFAULT 'PENDING',

  -- EAS Build info
  eas_build_id TEXT UNIQUE,
  build_url TEXT,
  artifact_url TEXT,

  -- Build configuration
  build_profile TEXT DEFAULT 'production',
  version TEXT,
  build_number INTEGER,

  -- Logs and errors
  logs TEXT,
  error_message TEXT,

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Relations
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_builds_user_id ON builds(user_id);
CREATE INDEX idx_builds_project_id ON builds(project_id);
CREATE INDEX idx_builds_status ON builds(status);
CREATE INDEX idx_builds_eas_id ON builds(eas_build_id);

-- ============================================
-- WAITLIST
-- ============================================

CREATE TABLE waitlist_entries (
  id TEXT PRIMARY KEY DEFAULT ('wait_' || gen_random_uuid()::text),
  email TEXT UNIQUE NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_waitlist_email ON waitlist_entries(email);

-- ============================================
-- PROJECT API KEYS
-- ============================================

CREATE TABLE project_api_keys (
  id TEXT PRIMARY KEY DEFAULT ('key_' || gen_random_uuid()::text),
  name TEXT DEFAULT 'Default',
  key_hash TEXT UNIQUE NOT NULL,
  key_prefix TEXT NOT NULL,
  key_encrypted TEXT,

  -- Permissions
  services proxy_service[] NOT NULL,

  -- Rate limits
  rate_limit INTEGER,

  -- Status
  active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  -- Relations
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_api_keys_hash ON project_api_keys(key_hash);
CREATE INDEX idx_api_keys_project ON project_api_keys(project_id);

-- ============================================
-- PROXY USAGE
-- ============================================

CREATE TABLE proxy_usage (
  id TEXT PRIMARY KEY DEFAULT ('usage_' || gen_random_uuid()::text),
  service proxy_service NOT NULL,
  operation TEXT NOT NULL,

  -- Metrics
  credits_used INTEGER NOT NULL,
  request_size INTEGER,
  response_size INTEGER,
  latency_ms INTEGER,

  -- Metadata
  metadata JSONB,

  -- Status
  success BOOLEAN NOT NULL,
  error_code TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Relations
  api_key_id TEXT NOT NULL REFERENCES project_api_keys(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  user_id UUID NOT NULL
);

CREATE INDEX idx_proxy_usage_project ON proxy_usage(project_id, created_at);
CREATE INDEX idx_proxy_usage_user ON proxy_usage(user_id, created_at);
CREATE INDEX idx_proxy_usage_service ON proxy_usage(service, created_at);
CREATE INDEX idx_proxy_usage_api_key ON proxy_usage(api_key_id);

-- ============================================
-- PROXY CREDITS
-- ============================================

CREATE TABLE proxy_credits (
  id TEXT PRIMARY KEY DEFAULT ('pcred_' || gen_random_uuid()::text),

  balance INTEGER DEFAULT 0,
  monthly_allotment INTEGER DEFAULT 0,

  period_start TIMESTAMPTZ DEFAULT NOW(),
  period_end TIMESTAMPTZ NOT NULL,

  overage_credits INTEGER DEFAULT 0,
  overage_rate REAL DEFAULT 0.001,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_proxy_credits_user ON proxy_credits(user_id);
CREATE INDEX idx_proxy_credits_period ON proxy_credits(period_end);

-- ============================================
-- STORAGE FILES
-- ============================================

CREATE TABLE storage_files (
  id TEXT PRIMARY KEY DEFAULT ('file_' || gen_random_uuid()::text),
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size INTEGER NOT NULL,

  bucket TEXT DEFAULT 'rux-storage',
  key TEXT NOT NULL,
  url TEXT,

  is_public BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  project_id TEXT NOT NULL,
  user_id UUID NOT NULL,

  UNIQUE(bucket, key)
);

CREATE INDEX idx_storage_files_project ON storage_files(project_id);
CREATE INDEX idx_storage_files_user ON storage_files(user_id);

-- ============================================
-- APP COLLECTIONS (Generic Database)
-- ============================================

CREATE TABLE app_collections (
  id TEXT PRIMARY KEY DEFAULT ('coll_' || gen_random_uuid()::text),
  name TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  UNIQUE(project_id, name)
);

CREATE INDEX idx_app_collections_project ON app_collections(project_id);

-- ============================================
-- APP DOCUMENTS
-- ============================================

CREATE TABLE app_documents (
  id TEXT PRIMARY KEY DEFAULT ('doc_' || gen_random_uuid()::text),
  data JSONB NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  collection_id TEXT NOT NULL REFERENCES app_collections(id) ON DELETE CASCADE
);

CREATE INDEX idx_app_documents_collection ON app_documents(collection_id);
CREATE INDEX idx_app_documents_created_at ON app_documents(collection_id, created_at);

-- ============================================
-- APP USERS (Users of generated apps)
-- ============================================

CREATE TABLE app_users (
  id TEXT PRIMARY KEY DEFAULT ('appuser_' || gen_random_uuid()::text),
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  metadata JSONB,

  email_verified BOOLEAN DEFAULT false,
  verify_token TEXT,

  reset_token TEXT,
  reset_expires TIMESTAMPTZ,

  active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  UNIQUE(project_id, email)
);

CREATE INDEX idx_app_users_project ON app_users(project_id);
CREATE INDEX idx_app_users_email ON app_users(email);
CREATE INDEX idx_app_users_verify ON app_users(verify_token);
CREATE INDEX idx_app_users_reset ON app_users(reset_token);

-- ============================================
-- APP SESSIONS
-- ============================================

CREATE TABLE app_sessions (
  id TEXT PRIMARY KEY DEFAULT ('sess_' || gen_random_uuid()::text),
  token TEXT UNIQUE NOT NULL,
  user_agent TEXT,
  ip_address TEXT,

  expires_at TIMESTAMPTZ NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),

  app_user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE
);

CREATE INDEX idx_app_sessions_token ON app_sessions(token);
CREATE INDEX idx_app_sessions_user ON app_sessions(app_user_id);
CREATE INDEX idx_app_sessions_expires ON app_sessions(expires_at);

-- ============================================
-- TOKEN PURCHASES
-- ============================================

CREATE TABLE token_purchases (
  id TEXT PRIMARY KEY DEFAULT ('purchase_' || gen_random_uuid()::text),

  credits INTEGER NOT NULL,
  amount_paid INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',

  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id TEXT,

  status TEXT DEFAULT 'completed',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  refunded_at TIMESTAMPTZ,

  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_token_purchases_user ON token_purchases(user_id, created_at);
CREATE INDEX idx_token_purchases_stripe ON token_purchases(stripe_payment_intent_id);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE builds ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE proxy_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE proxy_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_purchases ENABLE ROW LEVEL SECURITY;

-- Users: Users can read/update their own record
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Projects: Users can manage their own projects
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Prompt History: Users can manage their own prompts
CREATE POLICY "Users can view own prompts" ON prompt_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create prompts" ON prompt_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Developer Credentials: Users can manage their own credentials
CREATE POLICY "Users can view own credentials" ON developer_credentials
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own credentials" ON developer_credentials
  FOR ALL USING (auth.uid() = user_id);

-- Builds: Users can manage their own builds
CREATE POLICY "Users can view own builds" ON builds
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create builds" ON builds
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own builds" ON builds
  FOR UPDATE USING (auth.uid() = user_id);

-- Project API Keys: Users can manage keys for their projects
CREATE POLICY "Users can view project API keys" ON project_api_keys
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage project API keys" ON project_api_keys
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = project_id AND projects.user_id = auth.uid()
    )
  );

-- Proxy Usage: Users can view their own usage
CREATE POLICY "Users can view own usage" ON proxy_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Proxy Credits: Users can view their own credits
CREATE POLICY "Users can view own credits" ON proxy_credits
  FOR SELECT USING (auth.uid() = user_id);

-- Storage Files: Users can manage their own files
CREATE POLICY "Users can view own files" ON storage_files
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own files" ON storage_files
  FOR ALL USING (auth.uid() = user_id);

-- App Collections: Users can manage collections for their projects
CREATE POLICY "Users can manage app collections" ON app_collections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = project_id AND projects.user_id = auth.uid()
    )
  );

-- App Documents: Users can manage documents in their collections
CREATE POLICY "Users can manage app documents" ON app_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM app_collections ac
      JOIN projects p ON p.id = ac.project_id
      WHERE ac.id = collection_id AND p.user_id = auth.uid()
    )
  );

-- Token Purchases: Users can view their own purchases
CREATE POLICY "Users can view own purchases" ON token_purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create purchases" ON token_purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Waitlist: Public read, insert only
ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join waitlist" ON waitlist_entries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view waitlist" ON waitlist_entries
  FOR SELECT USING (true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_developer_credentials_updated_at BEFORE UPDATE ON developer_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_builds_updated_at BEFORE UPDATE ON builds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proxy_credits_updated_at BEFORE UPDATE ON proxy_credits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_collections_updated_at BEFORE UPDATE ON app_collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_documents_updated_at BEFORE UPDATE ON app_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_users_updated_at BEFORE UPDATE ON app_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user creation from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name'),
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create user profile on auth signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- GRANTS
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Grant table permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT ON waitlist_entries TO anon;

-- Grant sequence permissions
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, authenticated;
