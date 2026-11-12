-- EventRegistration was created in 20261107100000.
-- This migration:
--   1. Makes organisation NOT NULL (no rows exist yet, so the UPDATE is a no-op).
--   2. Drops the two separate single-column indexes (email_idx, eventId_idx).
--   3. Adds the composite index used by the admin list.

UPDATE "EventRegistration" SET "organisation" = '' WHERE "organisation" IS NULL;
ALTER TABLE "EventRegistration" ALTER COLUMN "organisation" SET NOT NULL;

DROP INDEX IF EXISTS "EventRegistration_email_idx";
DROP INDEX IF EXISTS "EventRegistration_eventId_idx";

CREATE INDEX IF NOT EXISTS "EventRegistration_eventId_createdAt_idx"
  ON "EventRegistration"("eventId", "createdAt");
