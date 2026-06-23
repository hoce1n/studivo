-- CreateTable
CREATE TABLE "pushsubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "studyhallId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pushsubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "renewalreminder" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "studyhallId" TEXT NOT NULL,
    "reminderKey" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "renewalreminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pushsubscription_endpoint_key" ON "pushsubscription"("endpoint");

-- CreateIndex
CREATE INDEX "pushsubscription_userId_idx" ON "pushsubscription"("userId");

-- CreateIndex
CREATE INDEX "pushsubscription_studyhallId_idx" ON "pushsubscription"("studyhallId");

-- CreateIndex
CREATE INDEX "renewalreminder_studyhallId_idx" ON "renewalreminder"("studyhallId");

-- CreateIndex
CREATE UNIQUE INDEX "renewalreminder_subscriptionId_reminderKey_key" ON "renewalreminder"("subscriptionId", "reminderKey");

-- AddForeignKey
ALTER TABLE "pushsubscription" ADD CONSTRAINT "pushsubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pushsubscription" ADD CONSTRAINT "pushsubscription_studyhallId_fkey" FOREIGN KEY ("studyhallId") REFERENCES "studyhall"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "renewalreminder" ADD CONSTRAINT "renewalreminder_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "renewalreminder" ADD CONSTRAINT "renewalreminder_studyhallId_fkey" FOREIGN KEY ("studyhallId") REFERENCES "studyhall"("id") ON DELETE CASCADE ON UPDATE CASCADE;
