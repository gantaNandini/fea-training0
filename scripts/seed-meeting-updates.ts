/**
 * Idempotent content seed — MoM Nov 2026 + date update Jan 2027.
 * Safe to re-run: records are matched by kind + start day and updated in place.
 *   pnpm tsx scripts/seed-meeting-updates.ts
 *
 * MoM item 1 & 2 (R1, R2): updated dates
 *   Webinar 1 → Sun 6 Dec 2026, 19:30–21:00 IST
 *   Webinar 2 → Sat 9 Jan 2027, 19:30–21:00 IST
 *   Workshop  → Thu 14 Jan – Mon 18 Jan 2027
 *
 * MoM item 5 (R1): IDs must NOT be date-derived to avoid collisions.
 *   The new Webinar 1 date (6 Dec 2026) equals the old Webinar 2 id prefix,
 *   so non-date ids are used: dba-ffs-webinar-1 / -2 / workshop-jan-2027.
 *
 * Old records (29 Nov / 6 Dec as W2 / 9–13 Dec workshop) are deactivated, not deleted,
 * so existing EventRegistration rows are not orphaned.
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// IST = UTC+5:30 → subtract 5:30 from wall-clock time to get UTC for storage.
// 19:30 IST = 14:00 UTC. 21:00 IST = 15:30 UTC.
// 6 Dec 2026 19:30 IST = 2026-12-06T14:00:00Z
// 9 Jan 2027 19:30 IST = 2027-01-09T14:00:00Z
// 14 Jan 2027 00:00 IST = 2027-01-13T18:30:00Z  (start of day)
// 18 Jan 2027 23:59 IST = 2027-01-18T18:29:00Z  (end of day)

const WORKSHOP_DESCRIPTION = `A 5-day advanced workshop for industry professionals using ANSYS and PY-FFS: FEA with ANSYS, ASME Section VIII Division 2 Part 5 and API 579-1/ASME FFS-1 Part 9 (crack-like flaws) Levels 1, 2 and 3, for pressure vessels, storage tanks, piping and oil and gas equipment.

Format: hybrid. Join in the classroom at Inspire Workspace, Bengaluru (20 seats) or live online. 35 contact hours, 10 hours of labs in ANSYS and PY-FFS, 6 months of free online course access, certificate of participation.

Day 1 (Thu 14 Jan): FEA for pressure equipment with ANSYS. Day 2 (Fri 15 Jan): Part 5, plastic collapse and local failure. Day 3 (Sat 16 Jan): Part 5, buckling, fatigue and ratcheting. Day 4 (Sun 17 Jan): API 579-1 Part 9, Levels 1 and 2. Day 5 (Mon 18 Jan): Level 3, crack growth and remaining life.

Sessions run 08:30–17:30 (Day 1) and 09:00–17:30 (Days 2–5), IST. Bring a Windows laptop: ANSYS Student (free) for Days 1–3, PY-FFS provided for Days 4–5.

Download the brochure for the full programme and fees. Enquiries: info@fea-training.com, +91 70422 43776. Registration closes 10 January 2027.`

const WEBINAR_BLURB = (n: number, workshopDates: string) => `Webinar ${n} of 2: a live online preview of the 5-day workshop "Design by Analysis & Fitness-for-Service" (${workshopDates}), covering ASME VIII-2 Part 5 and API 579-1/ASME FFS-1 Part 9 (crack-like flaws), Levels 1, 2 and 3, for pressure vessels, tanks, piping and oil & gas equipment.

In this webinar:
• The course: who it is for and how the 5 days run.
• What you will learn: from design by analysis to crack assessment.
• Fees and Q&A: classroom and online options, open questions.

Workshop roadmap, 14–18 January 2027:
Day 1 (Thu 14 Jan): FEA for pressure equipment with ANSYS – meshing, nonlinear and thermal analysis, nozzles, Lab 1.
Day 2 (Fri 15 Jan): ASME VIII-2 Part 5, collapse and local failure – stress categories, linearisation, limit-load, Lab 2.
Day 3 (Sat 16 Jan): Part 5, buckling, fatigue and ratcheting – welded joints, shakedown, thermal stress, Lab 3.
Day 4 (Sun 17 Jan): API 579-1 Part 9, Levels 1 and 2 – flaw characterisation, FAD for every crack case, Lab 4 in PY-FFS.
Day 5 (Mon 18 Jan): Level 3, crack growth and remaining life – J-integral, Paris law, inspection intervals, group project, test, certificate.

The workshop is 35 hours with 10 hours of labs and includes 6 months of online course access. Register below and we will email the joining link to the address you provide.`

// --- IDs are NOT date-derived to prevent collision with old event rows ----
const WEBINAR_1_ID = 'dba-ffs-webinar-1'
const WEBINAR_2_ID = 'dba-ffs-webinar-2'
const WORKSHOP_ID = 'dba-ffs-workshop-jan-2027'

// Old ids / dates to deactivate (not delete — registrations reference them)
const OLD_ACTIVE_PATTERNS = [
  // Webinar on 29 Nov 2026 (old W1)
  { kind: 'WEBINAR', datePrefix: '2026-11-29' },
  // Webinar on 6 Dec 2026 (old W2 — same day as new W1; different id)
  // We only deactivate it if it's NOT the row we are about to create/update.
  { kind: 'WEBINAR', datePrefix: '2026-12-06', excludeId: WEBINAR_1_ID },
  // Workshop 9–13 Dec 2026
  { kind: 'WORKSHOP', datePrefix: '2026-12-09' },
]

const items = [
  {
    id: WEBINAR_1_ID,
    kind: 'WEBINAR',
    title: 'Webinar 1: Design by Analysis & Fitness-for-Service',
    summary: '7:30–9:00 PM IST, live online. Agenda: the course and how the 5 days run · what you will learn · fees and Q&A.',
    description: WEBINAR_BLURB(1, '14–18 January 2027'),
    startsAt: new Date('2026-12-06T14:00:00Z'), // 6 Dec 2026 19:30 IST
    endsAt: new Date('2026-12-06T15:30:00Z') as Date | null, // 21:00 IST
    location: 'Online (live)',
    image: '/events/webinar-1-flyer-v2.jpg' as string | null,
    documentUrl: '/documents/webinar-1-6-dec-2026.pdf' as string | null,
    seatLimit: null as number | null,
  },
  {
    id: WEBINAR_2_ID,
    kind: 'WEBINAR',
    title: 'Webinar 2: Design by Analysis & Fitness-for-Service',
    summary: '7:30–9:00 PM IST, live online. Agenda: the course and how the 5 days run · what you will learn · fees and Q&A.',
    description: WEBINAR_BLURB(2, '14–18 January 2027'),
    startsAt: new Date('2027-01-09T14:00:00Z'), // 9 Jan 2027 19:30 IST
    endsAt: new Date('2027-01-09T15:30:00Z'),   // 21:00 IST
    location: 'Online (live)',
    image: '/events/webinar-2-flyer-v2.jpg',
    documentUrl: '/documents/webinar-2-9-jan-2027.pdf',
    seatLimit: null,
  },
  {
    id: WORKSHOP_ID,
    kind: 'WORKSHOP',
    title: 'Design by Analysis & Fitness-for-Service',
    summary: '5-day workshop · ANSYS + PY-FFS · Bengaluru + live online.',
    description: WORKSHOP_DESCRIPTION,
    startsAt: new Date('2027-01-13T18:30:00Z'), // 14 Jan 2027 00:00 IST
    endsAt: new Date('2027-01-18T18:29:00Z'),   // 18 Jan 2027 23:59 IST
    location: 'Bengaluru (Inspire Workspace) + live online',
    image: '/events/ffs-workshop-banner-v2.jpg',
    documentUrl: '/documents/ffs-workshop-brochure.pdf',
    seatLimit: 20,
  },
]

const FULL_NAME = 'Pythagoras Engineering Consultancy and Services'

/**
 * Case studies taken from the workshop brochure (page 8, "3D fracture mechanics case studies"). They are capability
 * examples, not named client projects. Replace or add real projects in Admin > Consultancy projects.
 */
const projects = [
  { category: 'Pressure vessels', title: 'Multilayer pressure vessel: axial crack through the shell', summary: '3D fracture mechanics model of an axial crack grown through the shell, with stress evaluated at both crack tips.', image: '/consultancy/multilayer-pressure-vessel.jpg', order: 1 },
  { category: 'Offshore', title: 'Offshore tubular joint: weld hot-spot flaw under wave loading', summary: 'A flaw at the weld hot spot, grown under wave loading to assess crack growth and remaining life.', image: '/consultancy/offshore-tubular-joint.jpg', order: 2 },
  { category: 'Machinery', title: 'Spur gear tooth: tooth fracture or rim fracture', summary: 'Crack path analysis showing whether failure goes through the tooth or the rim, decided by the rim thickness.', image: '/consultancy/spur-gear-tooth.jpg', order: 3 },
]

async function main() {
  // Brand name: only replace the old short form so any custom value set in admin is kept.
  const setting = await db.siteSetting.findUnique({ where: { key: 'company_name' } })
  if (!setting) await db.siteSetting.create({ data: { key: 'company_name', value: FULL_NAME } })
  else if (/^pythagoras( engineering)?( and)?( consultancy)?$/i.test(setting.value.trim())) {
    await db.siteSetting.update({ where: { key: 'company_name' }, data: { value: FULL_NAME } })
    console.log(`company_name: "${setting.value}" -> "${FULL_NAME}"`)
  }

  for (const p of projects) {
    const exists = await db.consultancyProject.findFirst({ where: { title: p.title } })
    if (exists) { console.log(`skip project: ${p.title}`); continue }
    await db.consultancyProject.create({ data: { ...p, active: true } })
    console.log(`created project: ${p.title}`)
  }

  // Deactivate old event rows (never delete — EventRegistration rows reference them)
  for (const pattern of OLD_ACTIVE_PATTERNS) {
    const dayStart = new Date(`${pattern.datePrefix}T00:00:00Z`)
    const dayEnd = new Date(dayStart.getTime() + 24 * 3600 * 1000)
    const rows = await db.event.findMany({
      where: { kind: pattern.kind, startsAt: { gte: dayStart, lt: dayEnd }, active: true },
      select: { id: true },
    })
    for (const row of rows) {
      if ('excludeId' in pattern && pattern.excludeId === row.id) continue
      await db.event.update({ where: { id: row.id }, data: { active: false } })
      console.log(`deactivated old event: ${row.id}`)
    }
  }

  // Upsert new events by stable id
  for (const it of items) {
    const { id, ...data } = it
    const existing = await db.event.findUnique({ where: { id } })
    if (existing) {
      await db.event.update({ where: { id }, data: { ...data, active: true } })
      console.log(`updated: ${it.title} (id=${id})`)
    } else {
      await db.event.create({ data: { id, ...data, active: true } })
      console.log(`created: ${it.title} (id=${id})`)
    }
  }
}

main().finally(() => db.$disconnect())
