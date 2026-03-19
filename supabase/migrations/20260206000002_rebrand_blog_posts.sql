-- Update all blog posts: rebrand RUX → Rulxy and rux.sh → rulxy.com
-- Applies to title, content, excerpt, and meta_description

-- Update content (markdown body)
UPDATE blog_posts SET content = REPLACE(content, 'rux.sh', 'rulxy.com') WHERE content LIKE '%rux.sh%';
UPDATE blog_posts SET content = REPLACE(content, 'RUX', 'Rulxy') WHERE content LIKE '%RUX%';

-- Update title
UPDATE blog_posts SET title = REPLACE(title, 'rux.sh', 'rulxy.com') WHERE title LIKE '%rux.sh%';
UPDATE blog_posts SET title = REPLACE(title, 'RUX', 'Rulxy') WHERE title LIKE '%RUX%';

-- Update excerpt
UPDATE blog_posts SET excerpt = REPLACE(excerpt, 'rux.sh', 'rulxy.com') WHERE excerpt LIKE '%rux.sh%';
UPDATE blog_posts SET excerpt = REPLACE(excerpt, 'RUX', 'Rulxy') WHERE excerpt LIKE '%RUX%';

-- Update meta_description
UPDATE blog_posts SET meta_description = REPLACE(meta_description, 'rux.sh', 'rulxy.com') WHERE meta_description LIKE '%rux.sh%';
UPDATE blog_posts SET meta_description = REPLACE(meta_description, 'RUX', 'Rulxy') WHERE meta_description LIKE '%RUX%';
