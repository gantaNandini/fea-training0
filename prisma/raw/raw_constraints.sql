-- Raw SQL migration (requirements.md REQ-269A / REQ-269B).
-- `pnpm db:init` copies this file into prisma/migrations/<timestamp>_raw_constraints/migration.sql.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Exactly one primary category per course
CREATE UNIQUE INDEX "CourseCategory_one_primary_per_course"
  ON "CourseCategory" ("courseId")
  WHERE "isPrimary" = true;

-- CHECK constraints
ALTER TABLE "Review"
  ADD CONSTRAINT "Review_rating_range" CHECK ("rating" BETWEEN 1 AND 5);

ALTER TABLE "Course"
  ADD CONSTRAINT "Course_price_nonneg" CHECK ("price" >= 0);

ALTER TABLE "Course"
  ADD CONSTRAINT "Course_discount_lt_price"
  CHECK ("discountPrice" IS NULL OR "discountPrice" < "price");

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_total_nonneg" CHECK ("total" >= 0);

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_amount_nonneg" CHECK ("amount" >= 0);

ALTER TABLE "Coupon"
  ADD CONSTRAINT "Coupon_discount_valid"
  CHECK ("discountValue" >= 0 AND ("discountType" <> 'PERCENT' OR "discountValue" <= 10000));

ALTER TABLE "Lesson"
  ADD CONSTRAINT "Lesson_duration_nonneg" CHECK ("durationSeconds" >= 0);

ALTER TABLE "CartItem"
  ADD CONSTRAINT "CartItem_owner_present" CHECK ("userId" IS NOT NULL OR "sessionId" IS NOT NULL);

-- CourseStats view (REQ-269B): one CTE per child table so joins never multiply rows.
CREATE OR REPLACE VIEW "CourseStats" AS
WITH lesson_agg AS (
  SELECT s."courseId",
         COUNT(l.id)::int                              AS "lessonCount",
         COALESCE(SUM(l."durationSeconds"), 0)::int    AS "totalSeconds"
  FROM "Section" s
  LEFT JOIN "Lesson" l ON l."sectionId" = s.id
  GROUP BY s."courseId"
),
review_agg AS (
  SELECT "courseId",
         AVG(rating) FILTER (WHERE approved = true)::float8 AS "avgRating",
         COUNT(*) FILTER (WHERE approved = true)::int        AS "reviewCount"
  FROM "Review"
  GROUP BY "courseId"
),
enroll_agg AS (
  SELECT "courseId",
         COUNT(DISTINCT "userId")::int AS "studentCount"
  FROM "Enrollment"
  GROUP BY "courseId"
)
SELECT
  c.id                                  AS "courseId",
  COALESCE(la."lessonCount", 0)         AS "lessonCount",
  COALESCE(la."totalSeconds", 0)        AS "totalSeconds",
  ra."avgRating"                        AS "avgRating",   -- NULL when no approved reviews
  COALESCE(ra."reviewCount", 0)         AS "reviewCount",
  COALESCE(ea."studentCount", 0)        AS "studentCount"
FROM "Course" c
LEFT JOIN lesson_agg la ON la."courseId" = c.id
LEFT JOIN review_agg ra ON ra."courseId" = c.id
LEFT JOIN enroll_agg ea ON ea."courseId" = c.id;
