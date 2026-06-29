/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `studyhall` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "studyhall" ADD COLUMN     "galleryImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "heroImage" TEXT,
ADD COLUMN     "publicPageEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "studyhall_slug_key" ON "studyhall"("slug");
