-- Item 0.1: Fix double-booking integrity gap.
--
-- Problem: `@@unique([membershipId, endsAt])` does NOT prevent multiple open
-- (endsAt = NULL) seat_assignments, because Postgres treats every NULL as
-- distinct from every other NULL by default. Two rows with the same
-- membership_id and ends_at = NULL can both exist under that constraint.
--
-- Fix: replace it with two PARTIAL UNIQUE INDEXES that only apply to open
-- rows (ends_at IS NULL). Partial indexes ignore NULL-distinctness because
-- the WHERE clause filters rows before uniqueness is checked — a row either
-- matches the predicate and is checked, or doesn't exist in the index at all.
--
-- NOTE (Prisma limitation): partial indexes cannot be expressed in
-- schema.prisma. This migration is the source of truth for these two
-- constraints. Any future `prisma migrate dev` will NOT see them in the
-- schema and may propose dropping them — always run migrate commands with
-- `--create-only` and review the generated SQL before applying.

-- Drop the old, NULL-distinct-broken constraint.
ALTER TABLE "seat_assignments" DROP CONSTRAINT IF EXISTS "seat_assignments_membership_id_ends_at_key";

-- Guarantee: a seat can have at most one OPEN assignment at a time.
-- This is the core "no double-booking" invariant.
CREATE UNIQUE INDEX "seat_assignments_seat_id_open_key"
  ON "seat_assignments" ("seat_id")
  WHERE "ends_at" IS NULL;

-- Guarantee: a membership can have at most one OPEN assignment at a time
-- (replaces what the old broken unique was trying to do).
CREATE UNIQUE INDEX "seat_assignments_membership_id_open_key"
  ON "seat_assignments" ("membership_id")
  WHERE "ends_at" IS NULL;
