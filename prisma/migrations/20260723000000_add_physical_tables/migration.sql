-- Add a physical table layer between study halls and seats.
CREATE TABLE "physical_tables" (
  "id" TEXT NOT NULL,
  "studyhall_id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "physical_tables_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "physical_tables_studyhall_id_label_key" ON "physical_tables"("studyhall_id", "label");
CREATE INDEX "physical_tables_studyhall_id_idx" ON "physical_tables"("studyhall_id");

ALTER TABLE "physical_tables"
  ADD CONSTRAINT "physical_tables_studyhall_id_fkey"
  FOREIGN KEY ("studyhall_id") REFERENCES "studyhall"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "seats" ADD COLUMN "table_id" TEXT;

-- Existing seats are backfilled into one default table per study hall.
INSERT INTO "physical_tables" ("id", "studyhall_id", "label", "sort_order", "updated_at")
SELECT 'tbl_' || s."id", s."id", 'میز ۱', 1, CURRENT_TIMESTAMP
FROM "studyhall" s
WHERE EXISTS (
  SELECT 1 FROM "sections" sec JOIN "seats" seat ON seat."section_id" = sec."id" WHERE sec."studyhall_id" = s."id"
);

UPDATE "seats" seat
SET "table_id" = table_row."id"
FROM "sections" sec
JOIN "physical_tables" table_row ON table_row."studyhall_id" = sec."studyhall_id" AND table_row."label" = 'میز ۱'
WHERE seat."section_id" = sec."id";

ALTER TABLE "seats" ALTER COLUMN "table_id" SET NOT NULL;

DROP INDEX IF EXISTS "seats_section_id_number_key";
CREATE UNIQUE INDEX "seats_table_id_number_key" ON "seats"("table_id", "number");
CREATE INDEX "seats_table_id_idx" ON "seats"("table_id");

ALTER TABLE "seats" ALTER COLUMN "section_id" DROP NOT NULL;
ALTER TABLE "seats" DROP CONSTRAINT IF EXISTS "seats_section_id_fkey";
ALTER TABLE "seats"
  ADD CONSTRAINT "seats_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "physical_tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "seats"
  ADD CONSTRAINT "seats_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
