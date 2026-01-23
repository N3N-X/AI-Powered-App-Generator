-- Add firebaseUid column if it doesn't exist
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "firebaseUid" TEXT;

-- Make it unique
CREATE UNIQUE INDEX IF NOT EXISTS "User_firebaseUid_key" ON "User"("firebaseUid");
