-- Add missing enum value APP_AUTH if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'APP_AUTH' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ProxyService')) THEN
        ALTER TYPE "ProxyService" ADD VALUE 'APP_AUTH';
    END IF;
END $$;
