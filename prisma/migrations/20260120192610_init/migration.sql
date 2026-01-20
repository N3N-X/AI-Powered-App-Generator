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
CREATE TYPE "ProxyService" AS ENUM ('XAI', 'OPENAI', 'ANTHROPIC', 'GOOGLE_AI', 'GROQ', 'COHERE', 'MISTRAL', 'PERPLEXITY', 'DALL_E', 'STABLE_DIFFUSION', 'MIDJOURNEY', 'FLUX', 'GOOGLE_SEARCH', 'IMAGE_SEARCH', 'PLACES', 'MAPS', 'SERP', 'TRANSCRIBE', 'TTS', 'VIDEO', 'PDF', 'OCR', 'EMAIL', 'SMS', 'PUSH', 'WHATSAPP', 'STORAGE', 'DATABASE', 'ANALYTICS', 'QR_CODE', 'WEATHER', 'TRANSLATE', 'CURRENCY', 'EMAIL_VALIDATE', 'PHONE_VALIDATE', 'DOMAIN_WHOIS', 'NEWS', 'STOCKS', 'CRYPTO', 'MOVIES', 'BOOKS', 'SPORTS');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
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

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "User_clerkId_idx" ON "User"("clerkId");

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
