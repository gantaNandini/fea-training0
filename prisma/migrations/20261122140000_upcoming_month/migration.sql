-- Month (1-12) an UPCOMING course is planned for. NULL = shown under "In progress".
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "upcomingMonth" INTEGER;
