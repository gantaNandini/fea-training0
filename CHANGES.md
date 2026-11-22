# Lesson locks + quiz form – 22 Nov 2026

Students now go through Part 9 one video at a time, enforced on the server.

- A lesson opens only after the previous video is watched (90% of the playing time; skipping ahead does not count) and, where the video has a quiz, the quiz is passed (80%). Typing a locked lesson's address sends the student back to the video they still have to finish. Slides never block anything. Admins and instructors skip all locks.
- Course content list shows a lock on locked lessons and they cannot be clicked. The Next lesson button works only once the next lesson is unlocked.
- The quiz is no longer shown under the video. After the video is complete a "Take quiz" button opens the quiz as a form (`/learn/<course>/<lesson>/quiz`) with all questions on one page. Nothing is marked until Submit; then the student sees the score, which answers were wrong and the correct answers. 80% or more passes and unlocks the next video; below that the quiz can be retaken.
- Closed loopholes: the signed video/file URL of a locked lesson is refused, a student cannot mark a video complete by hand (`/api/progress`), and the one-question `/quiz/check` endpoint (which gave instant right/wrong) is removed.
- `scripts/quizzes.part9.json`: the four Part 9 quizzes (8, 5, 4 and 8 questions). Load with
  `pnpm exec tsx scripts/import-quizzes.ts scripts/quizzes.part9.json` (dry run), then add `--apply`.
  Note: this replaces the 25-question quiz currently on "Branched & Multiple Flaws – Part 2" with the 8-question Section D quiz.
- `.gitignore`: `storage/` also hid `src/lib/storage/`, so that folder was never in git and a build from GitHub fails ("Cannot find module '@/lib/storage'"). The rule is now `/storage/`. Run `git add src/lib/storage` and commit it.
- Tests: `tests/unit/part9-rules.test.ts` (lock sequence, 90% rule, pass marks) and `tests/integration/part9-student-flow.test.ts` (the same rules against a real database).

# Website updates – 12 Nov 2026 (overlay on pythagoras-lms)

Copy these files over the project (paths preserved), then:
1. `pnpm install && pnpm prisma migrate deploy`   (adds EventRegistration table)
2. `pnpm tsx scripts/seed-meeting-updates.ts`     (2 webinars + Dec workshop; safe to re-run)
3. `pnpm typecheck && pnpm build`                 (NOT run in my sandbox – no node_modules/network)

## Done
- Webinar/Workshop registration: form (name, email, phone, organisation, designation), zod validation, duplicate email per event blocked (DB unique + 409), rate-limited, success state.
- Admin: Events & batches > Registrations (per-event list), CSV export (UTF-8 BOM, opens in Excel, formula-injection safe), "Emails" comma list for sending meeting links. Admin-only; nothing public.
- /events now has Conferences | Workshops | Webinars tabs; "Online" label on webinars.
- Homepage: Upcoming webinars (Register now), Upcoming events (workshops/conferences), Newly launched courses (courses tagged `new-launch`, "View course").
- Workshop 9–13 Dec 2026 created from the brochure PDF (brochure downloadable, cover banner, hybrid details, no invented times).
- "Fees & syllabus" -> "Syllabus" (nav, footer, tile, page); fee column removed entirely from the syllabus table.
- ALL-CAPS syllabus headings -> title case; API/ASME/FSS etc. stay upper case; mixed-case left untouched.
- Certificate restyled to the temporary WhatsApp template (teal frame, navy serif, logo, signatory). Interim only.
- Carousel reviewed: already autoplays at 5 s with play/pause, arrows, dots, reduced-motion support. No change needed.

## Pending / needs input
- Webinars: real flyers, titles, 7:30–9:00 PM IST and banners now seeded (public/events, public/documents).
- The new course: see questions in chat. Add via admin, tag it `new-launch`, give it the lowest featuredOrder to list first.
- Remove "Full Course Pressure Vessel Design DBA": which section?
- Curriculum/PDF sync from fea-training.com, videos, policies, corporate training, consultancy: need network/access.

## Round 2 (12 Nov)
- Webinars: real flyers (full flyer on the event page; top crop on cards), 7:30–9:00 PM IST, short agenda. Run the seed to overwrite the old "(Details to be confirmed)" records.
- Stats: server HTML now contains the real numbers (the 0s came from the count-up starting at 0 in SSR). Numbers themselves are set in Admin > Settings > Website.
- Brand: "Pythagoras Engineering Consultancy and Services" in metadata, seed and the company_name setting (seed updates the old short value).
- Consultancy: Services | Projects tabs (+ category tabs), homepage block with services and up to 3 projects, Admin > Consultancy projects. New table ConsultancyProject (migration 20261112120000).
- Seeded 3 case studies from the brochure (page 8). They are examples, not client projects.
