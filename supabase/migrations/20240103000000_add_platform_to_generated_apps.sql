-- Add platform column to generated_apps table
ALTER TABLE generated_apps ADD COLUMN platform TEXT DEFAULT 'windows';
