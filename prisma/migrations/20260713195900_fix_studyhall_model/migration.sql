-- AlterTable
ALTER TABLE "studyhall" ADD COLUMN     "galleryImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "heroImage" TEXT,
ADD COLUMN     "publicPageEnabled" BOOLEAN NOT NULL DEFAULT false;
