# PYTHAGORAS Learning Platform — Phase 1

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4 · Prisma 6 + PostgreSQL 16 · Auth.js v5 · Razorpay (with a mock provider for demos).

> **Read this first — honest status**
> This code was written in an environment with **no access to the npm registry**, so it has **never been installed, type-checked, linted, built or run**. Only the pure utility unit tests (pricing, cart, coupon, Origin check, redirects, progress, contrast) were executed. Expect a first round of small fixes (typos, a wrong import, a Next/Prisma/Auth.js typing mismatch). Dependency versions in `package.json` are **ranges, not a tested lockfile**. `design.md` was not available, so the visual design follows `requirements.md` plus the colour/typography rules, not a Figma-level spec.
> Quickest path: run the steps below, paste any error here, and it gets fixed.

## Prerequisites
Node.js 20.11+ (22 recommended), pnpm 9+, Docker (for Postgres).

## Setup
```bash
cp .env.example .env            # then set NEXTAUTH_SECRET (openssl rand -base64 32)
docker compose up -d            # Postgres 16 on :5434 (dev) and :5433 (tests); 5434 avoids clashing with a local PostgreSQL on 5432
pnpm install
pnpm db:init                    # creates the migration, applies the raw SQL (sequence, partial index, CHECKs, CourseStats view)
pnpm db:seed                    # categories, 13 courses, content; demo accounts when SEED_DEMO_ACCOUNTS=true
pnpm dev                        # http://localhost:3000
```
Demo logins (only when `SEED_DEMO_ACCOUNTS=true`): `student@demo.test` / `Demo1234!` (enrolled in courses 2 and 3, one pending review) and `admin@demo.test` / `Admin1234!` (opens `/admin`).
Coupons: `WELCOME10` (10 %), `FLAT1000` (₹1,000).
With `PAYMENT_PROVIDER=mock` the "Pay now" button completes the order instantly (no gateway).

**Remove all demo accounts before launch.**

## Admin console (`/admin`)
Log in as an ADMIN (demo: `admin@demo.test` / `Admin1234!`). Sections: Dashboard (revenue, KPIs), Courses (add/edit any number of courses with sections and lessons, publish/unpublish, categories, coupons), Enrolment (history, enrol a student), Report (admin / instructor revenue), Users (admins, instructors, students), Message (contact inbox + reply), Settings (system, website, instructor share, SMTP, payment/Google status, About and policy pages, home page content), Manage profile.
* Run `pnpm install` again (new dependency: nodemailer) before starting.
* Course images are uploaded to `public/uploads/media` (local disk; use S3/R2 on serverless hosts). Lesson PDFs are private and served by signed URL.
* Lesson videos: paste a YouTube/Vimeo link (watch links are converted to embeds). Unlisted embeds are not content protection.
* Not included yet: instructor "applications" and payout mark-as-paid (needs new tables), real video hosting.

## Speed: use `pnpm demo` for client demos
`pnpm dev` compiles each page the first time you open it, which feels slow (several seconds, worse on Windows with antivirus scanning). For a snappy demo run a production build instead:
```bash
pnpm demo        # next build && next start  -> http://localhost:3000, every page pre-built
```
This needs `ALLOW_MOCK_IN_PRODUCTION="true"` in `.env` (local use only) so the mock payment still works. Stop `pnpm dev` first (both use port 3000).

## Scripts
| Command | What it does |
|---|---|
| `pnpm lint` / `pnpm typecheck` | ESLint / `tsc --noEmit` |
| `pnpm test:unit` | Vitest, pure functions |
| `pnpm test:integration` | Vitest against `DATABASE_URL_TEST` (port 5433); applies migrations, truncates between tests |
| `pnpm test:e2e` | Playwright against `pnpm dev` with the mock provider (seed the dev DB first) |

### Regenerating screenshot baselines
```bash
docker run --rm --ipc=host -v ${PWD}:/work -w /work mcr.microsoft.com/playwright:v1.49.0-jammy \
  sh -c "corepack enable && pnpm install && pnpm test:e2e --project=layout --update-snapshots"
```
(Use the Playwright version that matches `@playwright/test` in `package.json`.) Commit the generated images.

## Local vs hosted demo
* **Local:** `PAYMENT_PROVIDER=mock`, `NODE_ENV=development`.
* **Hosted (e.g. Vercel):** the mock provider **throws when `NODE_ENV=production`** on purpose. Use `PAYMENT_PROVIDER=razorpay` with Razorpay **TEST** keys, set `SEED_DEMO_ACCOUNTS=true` only for the demo database, and set `NEXTAUTH_URL`, `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET`.
* Video: lessons use placeholders. If you point lessons at YouTube/Vimeo embeds, remember **unlisted embeds are not content protection**. Allowed embed origins are set in `VIDEO_ORIGINS`.
* Local file storage is for development only; it does not work on serverless hosts.
* `pnpm build` needs a reachable database (static params and cached pages read it).

## Manual Razorpay test-mode checklist
1. Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` (test) and `RAZORPAY_WEBHOOK_SECRET`; `PAYMENT_PROVIDER=razorpay`.
2. Add a course to the cart and go to checkout.
3. Click **Pay now** — the Razorpay modal opens.
4. Test card `4111 1111 1111 1111`, any future expiry, CVV `123`.
5. Confirm `/checkout/success` and `/my-courses`.
6. Open `/orders/{orderId}/receipt`.
7. In the Razorpay dashboard point the webhook to `/api/payments/webhook` (events `payment.captured`, `payment.failed`).

## Pre-launch checklist
* Remove demo accounts and demo students; set `SEED_DEMO_ACCOUNTS` unset/false.
* Replace seed stat figures (`stats_*`) with verified numbers: **CLIENT MUST SUPPLY VERIFIED FIGURES BEFORE LAUNCH**.
* Replace placeholder legal pages (about, refund, privacy, terms, cookies), GSTIN and invoice prefix (site settings).
* Add real testimonials, client logos, images and videos.
* Live Razorpay keys, webhook secret, strong `NEXTAUTH_SECRET`, `CRON_SECRET`.
* Configure an email provider (the default only logs to the console).
* Switch the CSP from Report-Only to enforcing once violations are reviewed.

## Scheduled cleanup
`GET /api/orders/cleanup` and `GET /api/cart/cleanup` expect `Authorization: Bearer $CRON_SECRET` (this is how Vercel Cron calls them; see `vercel.json`). They use GET to match that behaviour.

## Known limitations
* Coupon `usedCount` is reserved at order creation. A very late `payment.captured` on an order already released by the 24 h cleanup can leave it under by one.
* "Remember me" is UI-only.
* `User.image` is used as the avatar.
* Google sign-in is optional and automatic account linking by email is **not** enabled.
* Admin is a shell only (Phase 2).
* Integration tests do not cover the "other user → 403" verify case at route level (needs a session); it is enforced in the route and worth a manual check.

## Prisma drift workaround
The partial unique index, CHECK constraints, `order_number_seq` and the `CourseStats` view are raw SQL (`prisma/raw/raw_constraints.sql`) that Prisma does not model. `prisma migrate dev` may report drift for them; if it offers to reset, check that the diff is only those objects and keep the raw migration. Never `migrate reset` a database you care about.

## Structure
`src/app` routes · `src/components` UI · `src/lib/data` cached DB reads · `src/lib/orders` + `src/lib/payments` commerce · `src/lib/security` Origin/CSP helpers · `prisma/` schema, raw SQL, seed · `tests/` unit, integration, e2e.

## Enrolment automation, admin login, content (round 3)

- **Automatic enrolment.** Payment success → `completeOrder` creates the enrolment in the same database
  transaction → the course is available immediately. Three independent triggers, none needing an admin:
  1. `/api/payments/verify` (browser, instant), 2. the Razorpay webhook (`payment.captured`), 3. self-healing
  `reconcileOrder` (src/lib/orders/reconcile.ts) which asks the gateway whether a PENDING order was paid; it runs
  while the confirmation page polls and in the nightly `/api/orders/cleanup` cron. The success page shows
  **Start learning** and opens a single-course order automatically after 4 s.
  For real payments set `PAYMENT_PROVIDER=razorpay`, the keys, and register the webhook
  `https://<your-domain>/api/payments/webhook` with event `payment.captured` and `RAZORPAY_WEBHOOK_SECRET`.
- **No course limit.** There is no cap anywhere in the admin or public code; the admin list is a searchable table,
  the public catalogue is paginated, the home page only features the courses flagged "featured".
- **Admin login.** `/admin-login` (also linked in the footer). Only ADMIN accounts get through; anything under
  `/admin` redirects there when not signed in.
- **Content.** `prisma/course-content.ts` holds the full course write-ups; `pnpm seed` (or `pnpm db:seed`) refreshes
  them on an existing database, and replaces the old placeholder address/email/phone only if still unchanged.
  Courses an admin has edited keep their edits only for non-seeded slugs: seeded slugs are overwritten by the seed.

## Real pictures from the existing site (round 4)

`pnpm import:fea` downloads the hero, course posters, client logos and testimonial photos/text from
fea-training.com into `public/imported/**` and writes `prisma/site-content.json`; `pnpm db:seed` then uses them.
Commit `public/imported` and `prisma/site-content.json`. Matching is heuristic: read the printed report and fix
anything unmatched by editing the JSON. The "Fatigue Analysis for Pressure Vessels" block on the home page is the
page `featured-programme`, editable in Admin → Settings → pages.
