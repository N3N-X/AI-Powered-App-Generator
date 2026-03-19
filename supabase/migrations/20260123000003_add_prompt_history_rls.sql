-- Add RLS policies for prompt_history table
-- This table was missing from the initial RLS migration

-- Enable RLS on prompt_history
ALTER TABLE prompt_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own prompt history" ON prompt_history;
DROP POLICY IF EXISTS "Users can insert own prompt history" ON prompt_history;

-- Users can view their own prompt history
CREATE POLICY "Users can view own prompt history"
  ON prompt_history FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own prompt history
CREATE POLICY "Users can insert own prompt history"
  ON prompt_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);
