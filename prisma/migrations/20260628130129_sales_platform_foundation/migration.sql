-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('SUPER_ADMIN', 'SALES');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'DEMO', 'TRIAL', 'CUSTOMER', 'LOST');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('MARKETING_SITE', 'REFERRAL', 'DIRECT', 'OTHER');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "platformRole" "PlatformRole";

-- CreateTable
CREATE TABLE "lead" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "venueName" TEXT,
    "message" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "source" "LeadSource" NOT NULL DEFAULT 'MARKETING_SITE',
    "lostReason" TEXT,
    "ownerId" TEXT,
    "studyhallId" TEXT,
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demorequest" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "preferredTime" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'requested',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demorequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lead_studyhallId_key" ON "lead"("studyhallId");

-- CreateIndex
CREATE INDEX "lead_status_idx" ON "lead"("status");

-- CreateIndex
CREATE INDEX "lead_source_idx" ON "lead"("source");

-- CreateIndex
CREATE INDEX "lead_ownerId_idx" ON "lead"("ownerId");

-- CreateIndex
CREATE INDEX "lead_createdAt_idx" ON "lead"("createdAt");

-- CreateIndex
CREATE INDEX "demorequest_leadId_idx" ON "demorequest"("leadId");

-- CreateIndex
CREATE INDEX "demorequest_status_idx" ON "demorequest"("status");

-- CreateIndex
CREATE INDEX "user_platformRole_idx" ON "user"("platformRole");

-- AddForeignKey
ALTER TABLE "lead" ADD CONSTRAINT "lead_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead" ADD CONSTRAINT "lead_studyhallId_fkey" FOREIGN KEY ("studyhallId") REFERENCES "studyhall"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demorequest" ADD CONSTRAINT "demorequest_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
