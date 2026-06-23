-- CreateTable
CREATE TABLE "otpverification" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otpverification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "otpverification_phoneNumber_purpose_idx" ON "otpverification"("phoneNumber", "purpose");
