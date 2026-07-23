ALTER TABLE "seats" ADD COLUMN "studyhall_id" TEXT;

UPDATE "seats" AS seat
SET "studyhall_id" = section."studyhall_id"
FROM "sections" AS section
WHERE seat."section_id" = section."id";

ALTER TABLE "seats" ALTER COLUMN "studyhall_id" SET NOT NULL;

ALTER TABLE "seats" DROP CONSTRAINT IF EXISTS "seats_section_id_fkey";
ALTER TABLE "seats" DROP CONSTRAINT IF EXISTS "seats_section_id_number_key";

ALTER TABLE "seats" ADD CONSTRAINT "seats_studyhall_id_fkey" FOREIGN KEY ("studyhall_id") REFERENCES "studyhall"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "seats" ADD CONSTRAINT "seats_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "seats" ADD CONSTRAINT "seats_studyhall_id_number_key" UNIQUE ("studyhall_id", "number");

CREATE INDEX IF NOT EXISTS "seats_studyhall_id_idx" ON "seats"("studyhall_id");
