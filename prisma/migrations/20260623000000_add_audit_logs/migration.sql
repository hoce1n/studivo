CREATE TABLE "auditlog" (
    "id" TEXT NOT NULL,
    "studyhallId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditlog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "auditlog_studyhallId_createdAt_idx" ON "auditlog"("studyhallId", "createdAt");
CREATE INDEX "auditlog_userId_idx" ON "auditlog"("userId");

ALTER TABLE "auditlog" ADD CONSTRAINT "auditlog_studyhallId_fkey" FOREIGN KEY ("studyhallId") REFERENCES "studyhall"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "auditlog" ADD CONSTRAINT "auditlog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
