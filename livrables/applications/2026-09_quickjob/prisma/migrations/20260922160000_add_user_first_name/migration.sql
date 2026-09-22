-- Additive, nullable column: safe on existing rows (no backfill needed,
-- existing accounts are prompted to fill it in from the app).
ALTER TABLE "users" ADD COLUMN "firstName" TEXT;
