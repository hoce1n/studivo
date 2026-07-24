/*
  Warnings:

  - A unique constraint covering the columns `[membership_id,ends_at]` on the table `seat_assignments` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "seat_assignments_membership_id_ends_at_key" ON "seat_assignments"("membership_id", "ends_at");
