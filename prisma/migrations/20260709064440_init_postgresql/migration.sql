-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "NoticeType" AS ENUM ('TEXT', 'IMAGE', 'MIXED', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "NoticeLevel" AS ENUM ('NORMAL', 'IMPORTANT', 'URGENT');

-- CreateEnum
CREATE TYPE "FitMode" AS ENUM ('cover', 'contain');

-- CreateEnum
CREATE TYPE "AssetKind" AS ENUM ('IMAGE', 'DOCUMENT', 'VIDEO', 'OTHER');

-- CreateEnum
CREATE TYPE "AssetRole" AS ENUM ('PRIMARY', 'ATTACHMENT', 'THUMBNAIL');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'ACTIVATE', 'DEACTIVATE');

-- CreateTable
CREATE TABLE "Factory" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Factory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisplayGroup" (
    "id" TEXT NOT NULL,
    "factoryId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisplayGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisplayDevice" (
    "id" TEXT NOT NULL,
    "displayGroupId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisplayDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'EDITOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFactory" (
    "userId" TEXT NOT NULL,
    "factoryId" TEXT NOT NULL,

    CONSTRAINT "UserFactory_pkey" PRIMARY KEY ("userId","factoryId")
);

-- CreateTable
CREATE TABLE "Notice" (
    "id" TEXT NOT NULL,
    "type" "NoticeType" NOT NULL DEFAULT 'TEXT',
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "level" "NoticeLevel" NOT NULL DEFAULT 'NORMAL',
    "durationSeconds" INTEGER NOT NULL DEFAULT 30,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "backgroundColor" TEXT NOT NULL DEFAULT '#111827',
    "textColor" TEXT NOT NULL DEFAULT '#f9fafb',
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "fitMode" "FitMode" NOT NULL DEFAULT 'cover',
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoticeTarget" (
    "noticeId" TEXT NOT NULL,
    "displayGroupId" TEXT NOT NULL,

    CONSTRAINT "NoticeTarget_pkey" PRIMARY KEY ("noticeId","displayGroupId")
);

-- CreateTable
CREATE TABLE "NoticeAsset" (
    "id" TEXT NOT NULL,
    "noticeId" TEXT NOT NULL,
    "kind" "AssetKind" NOT NULL,
    "role" "AssetRole" NOT NULL DEFAULT 'ATTACHMENT',
    "fileName" TEXT NOT NULL,
    "originalName" TEXT,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoticeAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoticeAuditLog" (
    "id" TEXT NOT NULL,
    "noticeId" TEXT,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "snapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoticeAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Factory_code_key" ON "Factory"("code");

-- CreateIndex
CREATE INDEX "Factory_isActive_idx" ON "Factory"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "DisplayGroup_code_key" ON "DisplayGroup"("code");

-- CreateIndex
CREATE INDEX "DisplayGroup_factoryId_idx" ON "DisplayGroup"("factoryId");

-- CreateIndex
CREATE INDEX "DisplayGroup_isActive_idx" ON "DisplayGroup"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "DisplayDevice_code_key" ON "DisplayDevice"("code");

-- CreateIndex
CREATE INDEX "DisplayDevice_displayGroupId_idx" ON "DisplayDevice"("displayGroupId");

-- CreateIndex
CREATE INDEX "DisplayDevice_isActive_idx" ON "DisplayDevice"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "UserFactory_factoryId_idx" ON "UserFactory"("factoryId");

-- CreateIndex
CREATE INDEX "Notice_isActive_idx" ON "Notice"("isActive");

-- CreateIndex
CREATE INDEX "Notice_type_idx" ON "Notice"("type");

-- CreateIndex
CREATE INDEX "Notice_level_idx" ON "Notice"("level");

-- CreateIndex
CREATE INDEX "Notice_startAt_endAt_idx" ON "Notice"("startAt", "endAt");

-- CreateIndex
CREATE INDEX "Notice_sortOrder_idx" ON "Notice"("sortOrder");

-- CreateIndex
CREATE INDEX "NoticeTarget_displayGroupId_idx" ON "NoticeTarget"("displayGroupId");

-- CreateIndex
CREATE INDEX "NoticeAsset_noticeId_idx" ON "NoticeAsset"("noticeId");

-- CreateIndex
CREATE INDEX "NoticeAsset_kind_idx" ON "NoticeAsset"("kind");

-- CreateIndex
CREATE INDEX "NoticeAsset_role_idx" ON "NoticeAsset"("role");

-- CreateIndex
CREATE INDEX "NoticeAuditLog_noticeId_idx" ON "NoticeAuditLog"("noticeId");

-- CreateIndex
CREATE INDEX "NoticeAuditLog_userId_idx" ON "NoticeAuditLog"("userId");

-- CreateIndex
CREATE INDEX "NoticeAuditLog_action_idx" ON "NoticeAuditLog"("action");

-- CreateIndex
CREATE INDEX "NoticeAuditLog_createdAt_idx" ON "NoticeAuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "DisplayGroup" ADD CONSTRAINT "DisplayGroup_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "Factory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisplayDevice" ADD CONSTRAINT "DisplayDevice_displayGroupId_fkey" FOREIGN KEY ("displayGroupId") REFERENCES "DisplayGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFactory" ADD CONSTRAINT "UserFactory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFactory" ADD CONSTRAINT "UserFactory_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "Factory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoticeTarget" ADD CONSTRAINT "NoticeTarget_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "Notice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoticeTarget" ADD CONSTRAINT "NoticeTarget_displayGroupId_fkey" FOREIGN KEY ("displayGroupId") REFERENCES "DisplayGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoticeAsset" ADD CONSTRAINT "NoticeAsset_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "Notice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoticeAuditLog" ADD CONSTRAINT "NoticeAuditLog_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "Notice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoticeAuditLog" ADD CONSTRAINT "NoticeAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
