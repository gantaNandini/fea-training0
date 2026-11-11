-- Add internal registration support and seat limits to Event
ALTER TABLE "Event" ADD COLUMN "internalRegistration" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Event" ADD COLUMN "maxSeats" INTEGER;

-- Create EventRegistration table
CREATE TABLE "EventRegistration" (
    "id"           TEXT NOT NULL,
    "eventId"      TEXT NOT NULL,
    "fullName"     TEXT NOT NULL,
    "email"        TEXT NOT NULL,
    "phone"        TEXT NOT NULL,
    "organisation" TEXT,
    "designation"  TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("id")
);

-- Unique: one registration per email per event
CREATE UNIQUE INDEX "EventRegistration_eventId_email_key" ON "EventRegistration"("eventId", "email");

-- Index for fast queries by event and by email
CREATE INDEX "EventRegistration_eventId_idx" ON "EventRegistration"("eventId");
CREATE INDEX "EventRegistration_email_idx"   ON "EventRegistration"("email");

-- Foreign key
ALTER TABLE "EventRegistration"
  ADD CONSTRAINT "EventRegistration_eventId_fkey"
  FOREIGN KEY ("eventId")
  REFERENCES "Event"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
