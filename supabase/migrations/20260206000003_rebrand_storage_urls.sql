-- Update all storage file URLs from storage.rux.sh to cdn.rulxy.space
-- Only public files have URLs stored (private files have url = NULL)

UPDATE storage_files
SET url = REPLACE(url, 'https://storage.rux.sh/', 'https://cdn.rulxy.space/')
WHERE url LIKE 'https://storage.rux.sh/%';

UPDATE blog_posts
SET url = REPLACE(url, 'https://storage.rux.sh/', 'https://cdn.rulxy.space/')
WHERE url LIKE 'https://storage.rux.sh/%';
