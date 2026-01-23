-- Fix proxy_service enum to use lowercase values to match TypeScript

-- Drop the old enum type (this will fail if tables are using it)
-- So we need to first convert the column to text, drop enum, recreate, then convert back

-- Step 1: Convert all columns using proxy_service to text[]
ALTER TABLE project_api_keys ALTER COLUMN services TYPE text[] USING services::text[];

-- Step 2: Drop old enum
DROP TYPE IF EXISTS proxy_service CASCADE;

-- Step 3: Create new lowercase enum
CREATE TYPE proxy_service AS ENUM (
  -- AI Models
  'xai', 'openai', 'anthropic', 'google_ai', 'groq', 'cohere', 'mistral', 'perplexity',
  -- Image Generation
  'dall_e', 'stable_diffusion', 'midjourney', 'flux',
  -- Search & Data
  'google_search', 'image_search', 'places', 'maps', 'serp',
  -- Media Processing
  'transcribe', 'tts', 'video', 'pdf', 'ocr',
  -- Communication
  'email', 'sms', 'push', 'whatsapp',
  -- Data & Utilities
  'storage', 'database', 'app_auth', 'analytics', 'qr_code', 'weather', 'translate', 'currency',
  -- Validation & Verification
  'email_validate', 'phone_validate', 'domain_whois',
  -- Content APIs
  'news', 'stocks', 'crypto', 'movies', 'books', 'sports'
);

-- Step 4: Convert back to proxy_service[]
ALTER TABLE project_api_keys ALTER COLUMN services TYPE proxy_service[] USING services::proxy_service[];
