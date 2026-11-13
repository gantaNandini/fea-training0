-- Add topics array and optional dateRange to Certificate.
-- topics: populated automatically from course outcomes; can be overridden via the admin cert editor for workshop/offline certs.
-- dateRange: optional display string shown on the certificate instead of the issuedAt date (e.g. "13 February to 31 March 2026").
ALTER TABLE "Certificate" ADD COLUMN IF NOT EXISTS "topics"    TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "Certificate" ADD COLUMN IF NOT EXISTS "dateRange" TEXT;
