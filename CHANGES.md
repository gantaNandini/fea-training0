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
