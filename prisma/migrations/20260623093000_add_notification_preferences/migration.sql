ALTER TABLE "studyhall"
ADD COLUMN "reminderDaysBefore" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN "renewalRemindersEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "expiryRemindersEnabled" BOOLEAN NOT NULL DEFAULT true;
