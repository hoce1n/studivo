-- CreateTable
CREATE TABLE "studyhall" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL DEFAULT 'سالن مطالعه',
    "totalSeats" INTEGER NOT NULL DEFAULT 0,
    "monthlyFee" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "phoneNumber" TEXT,
    "role" TEXT NOT NULL DEFAULT 'staff',
    "studyhallId" TEXT,
    CONSTRAINT "user_studyhallId_fkey" FOREIGN KEY ("studyhallId") REFERENCES "studyhall" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_user" ("createdAt", "email", "emailVerified", "id", "image", "name", "updatedAt") SELECT "createdAt", "email", "emailVerified", "id", "image", "name", "updatedAt" FROM "user";
DROP TABLE "user";
ALTER TABLE "new_user" RENAME TO "user";
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
CREATE UNIQUE INDEX "user_studyhallId_phoneNumber_key" ON "user"("studyhallId", "phoneNumber");
CREATE INDEX "user_studyhallId_idx" ON "user"("studyhallId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateTable
CREATE TABLE "seat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "seatNumber" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studyhallId" TEXT NOT NULL,
    CONSTRAINT "seat_studyhallId_fkey" FOREIGN KEY ("studyhallId") REFERENCES "studyhall" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "seatId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "studyhallId" TEXT NOT NULL,
    CONSTRAINT "subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "subscription_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "seat" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "subscription_studyhallId_fkey" FOREIGN KEY ("studyhallId") REFERENCES "studyhall" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "seat_studyhallId_seatNumber_key" ON "seat"("studyhallId", "seatNumber");

-- CreateIndex
CREATE INDEX "subscription_userId_idx" ON "subscription"("userId");

-- CreateIndex
CREATE INDEX "subscription_seatId_idx" ON "subscription"("seatId");

-- CreateIndex
CREATE INDEX "subscription_studyhallId_idx" ON "subscription"("studyhallId");
