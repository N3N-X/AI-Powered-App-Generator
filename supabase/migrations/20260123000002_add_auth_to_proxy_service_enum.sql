-- Add 'auth' to proxy_service enum
-- This migration adds the 'auth' service to the proxy_service enum type

ALTER TYPE proxy_service ADD VALUE IF NOT EXISTS 'auth';
