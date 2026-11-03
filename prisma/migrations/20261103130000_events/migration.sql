-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'CONFERENCE',
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "description" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "location" TEXT,
    "link" TEXT,
    "documentUrl" TEXT,
    "image" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Event_startsAt_idx" ON "Event"("startsAt");
