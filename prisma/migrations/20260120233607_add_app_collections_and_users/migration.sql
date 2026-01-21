-- AlterEnum
ALTER TYPE "ProxyService" ADD VALUE 'APP_AUTH';

-- CreateTable
CREATE TABLE "AppCollection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "AppCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppDocument" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "collectionId" TEXT NOT NULL,

    CONSTRAINT "AppDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "metadata" JSONB,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifyToken" TEXT,
    "resetToken" TEXT,
    "resetExpires" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "AppUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSession" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appUserId" TEXT NOT NULL,

    CONSTRAINT "AppSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppCollection_projectId_idx" ON "AppCollection"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "AppCollection_projectId_name_key" ON "AppCollection"("projectId", "name");

-- CreateIndex
CREATE INDEX "AppDocument_collectionId_idx" ON "AppDocument"("collectionId");

-- CreateIndex
CREATE INDEX "AppDocument_collectionId_createdAt_idx" ON "AppDocument"("collectionId", "createdAt");

-- CreateIndex
CREATE INDEX "AppUser_projectId_idx" ON "AppUser"("projectId");

-- CreateIndex
CREATE INDEX "AppUser_email_idx" ON "AppUser"("email");

-- CreateIndex
CREATE INDEX "AppUser_verifyToken_idx" ON "AppUser"("verifyToken");

-- CreateIndex
CREATE INDEX "AppUser_resetToken_idx" ON "AppUser"("resetToken");

-- CreateIndex
CREATE UNIQUE INDEX "AppUser_projectId_email_key" ON "AppUser"("projectId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "AppSession_token_key" ON "AppSession"("token");

-- CreateIndex
CREATE INDEX "AppSession_token_idx" ON "AppSession"("token");

-- CreateIndex
CREATE INDEX "AppSession_appUserId_idx" ON "AppSession"("appUserId");

-- CreateIndex
CREATE INDEX "AppSession_expiresAt_idx" ON "AppSession"("expiresAt");

-- AddForeignKey
ALTER TABLE "AppDocument" ADD CONSTRAINT "AppDocument_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "AppCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppSession" ADD CONSTRAINT "AppSession_appUserId_fkey" FOREIGN KEY ("appUserId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
