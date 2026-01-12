-- Add build_type column to generated_apps table for Dioxus migration
ALTER TABLE generated_apps ADD COLUMN build_type TEXT DEFAULT 'source';

-- Update existing apps to use Dioxus
UPDATE generated_apps SET platform = 'windows' WHERE platform IS NULL;
UPDATE generated_apps SET build_type = 'source' WHERE build_type IS NULL;
