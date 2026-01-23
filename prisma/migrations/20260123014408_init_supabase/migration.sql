-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'PRO', 'ELITE');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('WEB', 'IOS', 'ANDROID');

-- CreateEnum
CREATE TYPE "BuildStatus" AS ENUM ('PENDING', 'QUEUED', 'BUILDING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BuildPlatform" AS ENUM ('ANDROID', 'IOS');

-- CreateEnum
CREATE TYPE "ProxyService" AS ENUM ('XAI', 'OPENAI', 'ANTHROPIC', 'GOOGLE_AI', 'GROQ', 'COHERE', 'MISTRAL', 'PERPLEXITY', 'DALL_E', 'STABLE_DIFFUSION', 'MIDJOURNEY', 'FLUX', 'GOOGLE_SEARCH', 'IMAGE_SEARCH', 'PLACES', 'MAPS', 'SERP', 'TRANSCRIBE', 'TTS', 'VIDEO', 'PDF', 'OCR', 'EMAIL', 'SMS', 'PUSH', 'WHATSAPP', 'STORAGE', 'DATABASE', 'APP_AUTH', 'ANALYTICS', 'QR_CODE', 'WEATHER', 'TRANSLATE', 'CURRENCY', 'EMAIL_VALIDATE', 'PHONE_VALIDATE', 'DOMAIN_WHOIS', 'PAYMENTS', 'NEWS', 'STOCKS', 'CRYPTO', 'MOVIES', 'BOOKS', 'SPORTS');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "role" "Role" NOT NULL DEFAULT 'USER',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "githubTokenEncrypted" TEXT,
    "claudeKeyEncrypted" TEXT,
    "credits" INTEGER NOT NULL DEFAULT 3000,
    "totalCreditsUsed" INTEGER NOT NULL DEFAULT 0,
    "lastCreditReset" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "platform" "Platform" NOT NULL DEFAULT 'WEB',
    "codeFiles" JSONB NOT NULL DEFAULT '{}',
    "chatHistory" JSONB NOT NULL DEFAULT '[]',
    "appConfig" JSONB,
    "githubRepo" TEXT,
    "githubUrl" TEXT,
    "subdomain" TEXT,
    "customDomain" TEXT,
    "domainVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptHistory" (
    "id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "response" TEXT,
    "model" TEXT NOT NULL,
    "tokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "PromptHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeveloperCredential" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "encryptedData" TEXT NOT NULL,
    "metadata" JSONB,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "lastVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "DeveloperCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Build" (
    "id" TEXT NOT NULL,
    "platform" "BuildPlatform" NOT NULL,
    "status" "BuildStatus" NOT NULL DEFAULT 'PENDING',
    "easBuildId" TEXT,
    "buildUrl" TEXT,
    "artifactUrl" TEXT,
    "buildProfile" TEXT NOT NULL DEFAULT 'production',
    "version" TEXT,
    "buildNumber" INTEGER,
    "logs" TEXT,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "Build_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectApiKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Default',
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "keyEncrypted" TEXT,
    "services" "ProxyService"[],
    "rateLimit" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "projectId" TEXT NOT NULL,

    CONSTRAINT "ProjectApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProxyUsage" (
    "id" TEXT NOT NULL,
    "service" "ProxyService" NOT NULL,
    "operation" TEXT NOT NULL,
    "creditsUsed" INTEGER NOT NULL,
    "requestSize" INTEGER,
    "responseSize" INTEGER,
    "latencyMs" INTEGER,
    "metadata" JSONB,
    "success" BOOLEAN NOT NULL,
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "apiKeyId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ProxyUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProxyCredits" (
    "id" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "monthlyAllotment" INTEGER NOT NULL DEFAULT 0,
    "periodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "overageCredits" INTEGER NOT NULL DEFAULT 0,
    "overageRate" DOUBLE PRECISION NOT NULL DEFAULT 0.001,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ProxyCredits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageFile" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "bucket" TEXT NOT NULL DEFAULT 'rux-storage',
    "key" TEXT NOT NULL,
    "url" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "StorageFile_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "TokenPurchase" (
    "id" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "amountPaid" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "stripePaymentIntentId" TEXT,
    "stripeChargeId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refundedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,

    CONSTRAINT "TokenPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_stripeCustomerId_idx" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_subdomain_key" ON "Project"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "Project_customDomain_key" ON "Project"("customDomain");

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "Project"("userId");

-- CreateIndex
CREATE INDEX "Project_subdomain_idx" ON "Project"("subdomain");

-- CreateIndex
CREATE INDEX "Project_customDomain_idx" ON "Project"("customDomain");

-- CreateIndex
CREATE UNIQUE INDEX "Project_userId_slug_key" ON "Project"("userId", "slug");

-- CreateIndex
CREATE INDEX "PromptHistory_userId_idx" ON "PromptHistory"("userId");

-- CreateIndex
CREATE INDEX "PromptHistory_projectId_idx" ON "PromptHistory"("projectId");

-- CreateIndex
CREATE INDEX "PromptHistory_createdAt_idx" ON "PromptHistory"("createdAt");

-- CreateIndex
CREATE INDEX "DeveloperCredential_userId_idx" ON "DeveloperCredential"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DeveloperCredential_userId_platform_name_key" ON "DeveloperCredential"("userId", "platform", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Build_easBuildId_key" ON "Build"("easBuildId");

-- CreateIndex
CREATE INDEX "Build_userId_idx" ON "Build"("userId");

-- CreateIndex
CREATE INDEX "Build_projectId_idx" ON "Build"("projectId");

-- CreateIndex
CREATE INDEX "Build_status_idx" ON "Build"("status");

-- CreateIndex
CREATE INDEX "Build_easBuildId_idx" ON "Build"("easBuildId");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_email_key" ON "WaitlistEntry"("email");

-- CreateIndex
CREATE INDEX "WaitlistEntry_email_idx" ON "WaitlistEntry"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectApiKey_keyHash_key" ON "ProjectApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ProjectApiKey_keyHash_idx" ON "ProjectApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ProjectApiKey_projectId_idx" ON "ProjectApiKey"("projectId");

-- CreateIndex
CREATE INDEX "ProxyUsage_projectId_createdAt_idx" ON "ProxyUsage"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "ProxyUsage_userId_createdAt_idx" ON "ProxyUsage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ProxyUsage_service_createdAt_idx" ON "ProxyUsage"("service", "createdAt");

-- CreateIndex
CREATE INDEX "ProxyUsage_apiKeyId_idx" ON "ProxyUsage"("apiKeyId");

-- CreateIndex
CREATE UNIQUE INDEX "ProxyCredits_userId_key" ON "ProxyCredits"("userId");

-- CreateIndex
CREATE INDEX "ProxyCredits_userId_idx" ON "ProxyCredits"("userId");

-- CreateIndex
CREATE INDEX "ProxyCredits_periodEnd_idx" ON "ProxyCredits"("periodEnd");

-- CreateIndex
CREATE INDEX "StorageFile_projectId_idx" ON "StorageFile"("projectId");

-- CreateIndex
CREATE INDEX "StorageFile_userId_idx" ON "StorageFile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StorageFile_bucket_key_key" ON "StorageFile"("bucket", "key");

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

-- CreateIndex
CREATE UNIQUE INDEX "TokenPurchase_stripePaymentIntentId_key" ON "TokenPurchase"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "TokenPurchase_userId_createdAt_idx" ON "TokenPurchase"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "TokenPurchase_stripePaymentIntentId_idx" ON "TokenPurchase"("stripePaymentIntentId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptHistory" ADD CONSTRAINT "PromptHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptHistory" ADD CONSTRAINT "PromptHistory_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeveloperCredential" ADD CONSTRAINT "DeveloperCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Build" ADD CONSTRAINT "Build_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Build" ADD CONSTRAINT "Build_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectApiKey" ADD CONSTRAINT "ProjectApiKey_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProxyUsage" ADD CONSTRAINT "ProxyUsage_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ProjectApiKey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppDocument" ADD CONSTRAINT "AppDocument_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "AppCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppSession" ADD CONSTRAINT "AppSession_appUserId_fkey" FOREIGN KEY ("appUserId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenPurchase" ADD CONSTRAINT "TokenPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
