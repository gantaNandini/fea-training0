-- Restore a nullable seatLimit column on Event.
-- NULL means unlimited (webinars stay unlimited by default).
-- The workshop can be set to 20 via Admin > Events > edit.
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "seatLimit" INTEGER;
