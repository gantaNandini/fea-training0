/**
 * Idempotent content seed for the 11 Nov 2026 review meeting. Safe to re-run: records are matched by kind + start day and updated in place.
 *   pnpm tsx scripts/seed-meeting-updates.ts
 * Webinars come from the two coordinator flyers; the workshop from public/documents/ffs-workshop-brochure.pdf.
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const WORKSHOP_DESCRIPTION = `A 5-day advanced workshop for industry professionals using ANSYS and PY-FFS: FEA with ANSYS, ASME Section VIII Division 2 Part 5 and API 579-1/ASME FFS-1 Part 9 (crack-like flaws) Levels 1, 2 and 3, for pressure vessels, storage tanks, piping and oil and gas equipment.

Format: hybrid. Join in the classroom at Inspire Workspace, Bengaluru (20 seats) or live online. 35 contact hours, 10 hours of labs in ANSYS and PY-FFS, 6 months of free online course access, certificate of participation.

Day 1 (Wed 9 Dec): FEA for pressure equipment with ANSYS. Day 2 (Thu 10 Dec): Part 5, plastic collapse and local failure. Day 3 (Fri 11 Dec): Part 5, buckling, fatigue and ratcheting. Day 4 (Sat 12 Dec): API 579-1 Part 9, Levels 1 and 2. Day 5 (Sun 13 Dec): Level 3, crack growth and remaining life.

Sessions run 08:30–17:30 (Day 1) and 09:00–17:30 (Days 2–5), IST. Bring a Windows laptop: ANSYS Student (free) for Days 1–3, PY-FFS provided for Days 4–5.

Download the brochure for the full programme and fees. Enquiries: info@fea-training.com, +91 70422 43776. Registration closes 4 December 2026.`

const WEBINAR_BLURB = (n: number) => `Webinar ${n} of 2: a live online preview of the 5-day workshop "Design by Analysis & Fitness-for-Service" (9–13 December 2026), covering ASME VIII-2 Part 5 and API 579-1/ASME FFS-1 Part 9 (crack-like flaws), Levels 1, 2 and 3, for pressure vessels, tanks, piping and oil & gas equipment.

In this webinar:
• The course: who it is for and how the 5 days run.
• What you will learn: from design by analysis to crack assessment.
• Fees and Q&A: classroom and online options, open questions.

Workshop roadmap, 9–13 December 2026:
Day 1 (Wed 9 Dec): FEA for pressure equipment with ANSYS – meshing, nonlinear and thermal analysis, nozzles, Lab 1.
Day 2 (Thu 10 Dec): ASME VIII-2 Part 5, collapse and local failure – stress categories, linearisation, limit-load, Lab 2.
Day 3 (Fri 11 Dec): Part 5, buckling, fatigue and ratcheting – welded joints, shakedown, thermal stress, Lab 3.
Day 4 (Sat 12 Dec): API 579-1 Part 9, Levels 1 and 2 – flaw characterisation, FAD for every crack case, Lab 4 in PY-FFS.
Day 5 (Sun 13 Dec): Level 3, crack growth and remaining life – J-integral, Paris law, inspection intervals, group project, test, certificate.

The workshop is 35 hours with 10 hours of labs and includes 6 months of online course access. Register below and we will email the joining link to the address you provide.`

const items = [
  {
    kind: 'WEBINAR',
    title: 'Webinar 1: Design by Analysis & Fitness-for-Service',
    summary: '7:30–9:00 PM IST, live online. Agenda: the course and how the 5 days run · what you will learn · fees and Q&A.',
    description: WEBINAR_BLURB(1),
    // Dates are stored as the wall-clock time in IST (displayed as UTC by the site helpers).
    startsAt: new Date('2026-11-29T19:30:00Z'),
    endsAt: new Date('2026-11-29T21:00:00Z') as Date | null,
    location: 'Online (live)',
    image: '/events/webinar-1-flyer.jpg' as string | null,
    documentUrl: '/documents/webinar-1-29-nov-2026.pdf' as string | null,
  },
  {
    kind: 'WEBINAR',
    title: 'Webinar 2: Design by Analysis & Fitness-for-Service',
    summary: '7:30–9:00 PM IST, live online. Agenda: the course and how the 5 days run · what you will learn · fees and Q&A.',
    description: WEBINAR_BLURB(2),
    startsAt: new Date('2026-12-06T19:30:00Z'),
    endsAt: new Date('2026-12-06T21:00:00Z'),
    location: 'Online (live)',
    image: '/events/webinar-2-flyer.jpg',
    documentUrl: '/documents/webinar-2-6-dec-2026.pdf',
  },
  {
    kind: 'WORKSHOP',
    title: 'Design by Analysis & Fitness-for-Service',
    summary: '5-day advanced workshop: ANSYS, ASME VIII-2 Part 5 and API 579-1 Part 9. Bengaluru + live online.',
    description: WORKSHOP_DESCRIPTION,
    startsAt: new Date('2026-12-09T08:30:00Z'),
    endsAt: new Date('2026-12-13T17:30:00Z'),
    location: 'Bengaluru (Inspire Workspace) + live online',
    image: '/events/ffs-workshop-banner.jpg',
    documentUrl: '/documents/ffs-workshop-brochure.pdf',
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

  for (const it of items) {
    const dayStart = new Date(it.startsAt)
    dayStart.setUTCHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart.getTime() + 24 * 3600 * 1000)
    const existing = await db.event.findFirst({ where: { kind: it.kind, startsAt: { gte: dayStart, lt: dayEnd } } })
    if (existing) {
      await db.event.update({ where: { id: existing.id }, data: { ...it, active: true } })
      console.log(`updated: ${it.title} (${it.startsAt.toISOString().slice(0, 10)})`)
    } else {
      await db.event.create({ data: { ...it, active: true } })
      console.log(`created: ${it.title} (${it.startsAt.toISOString().slice(0, 10)})`)
    }
  }
}

main().finally(() => db.$disconnect())
