-- Remove the internalRegistration / maxSeats columns that were added in
-- 20261107100000_event_registrations. The overlay's registration system no longer
-- uses per-event seat limits or the internalRegistration flag; all WEBINAR and
-- WORKSHOP events accept registrations via the form by default.
ALTER TABLE "Event" DROP COLUMN IF EXISTS "internalRegistration";
ALTER TABLE "Event" DROP COLUMN IF EXISTS "maxSeats";
