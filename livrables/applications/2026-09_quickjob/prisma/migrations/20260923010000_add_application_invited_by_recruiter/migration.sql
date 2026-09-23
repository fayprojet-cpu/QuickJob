-- Additive, NOT NULL with a default: safe on existing rows (all become false).
ALTER TABLE "applications" ADD COLUMN "invitedByRecruiter" BOOLEAN NOT NULL DEFAULT false;
