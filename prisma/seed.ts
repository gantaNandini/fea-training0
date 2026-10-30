/**
 * Seed (REQ-340..354). Idempotent: safe to run repeatedly (upserts by slug / email / code).
 * Demo accounts and demo students are created only when SEED_DEMO_ACCOUNTS=true.
 * REMOVE ALL DEMO ACCOUNTS BEFORE LAUNCH.
 */
import { PrismaClient, type CourseLevel, type CourseStatus, type LessonType } from '@prisma/client'
import { buildDescription } from './course-content'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()
const DAY = 24 * 60 * 60 * 1000

// ───────────────────────── categories (REQ-340) ─────────────────────────
const CATEGORIES = [
  { slug: 'vibration-analysis', name: 'Vibration Analysis', icon: 'Activity' },
  { slug: 'fracture-mechanics', name: '3D Fracture Mechanics', icon: 'Layers' },
  { slug: 'rotor-dynamics', name: 'Rotor Dynamics (Lateral & Torsional)', icon: 'Cog' },
  { slug: 'advanced-training', name: 'Advanced FEA Training', icon: 'GraduationCap' },
  { slug: 'pressure-vessel', name: 'ASME Pressure Vessel Design', icon: 'Gauge' },
  { slug: 'offshore-wind', name: 'Offshore Wind Turbine Structures', icon: 'Wind' },
  { slug: 'pump-design', name: 'Pump Design', icon: 'Droplets' },
  { slug: 'webinars', name: 'Upcoming Webinars', icon: 'Video' },
]

// ───────────────────────── courses (REQ-341 / 341A) ─────────────────────────
interface CourseSeed {
  n: number
  slug: string
  title: string
  subtitle: string
  price: number // rupees
  level: CourseLevel
  lessons: number
  hours: number // approximate total video hours
  status: CourseStatus
  primary: string
  secondary?: string
  topics: string[]
}

const COURSES: CourseSeed[] = [
  { n: 1, slug: 'full-course-pressure-vessel-design-dba', title: 'Full Course: Pressure Vessel Design by Analysis (DBA) as per ASME Section VIII Div 2', subtitle: 'From code fundamentals to complete 3D FEA assessments', price: 99990, level: 'ADVANCED', lessons: 139, hours: 19, status: 'PUBLISHED', primary: 'pressure-vessel', topics: ['Code Overview', 'Material Models', 'Elastic Stress Analysis', 'Plastic Collapse', 'Local Failure', 'Buckling', 'Fatigue', 'Ratcheting', 'Worked Examples'] },
  { n: 2, slug: 'fatigue-ratchetting-creep-assessment', title: 'Fatigue, Ratchetting, Creep Assessment of Pressure Vessels using ANSYS', subtitle: 'ASME VIII Div 2 Part 5 in practice', price: 25000, level: 'ADVANCED', lessons: 38, hours: 7, status: 'PUBLISHED', primary: 'pressure-vessel', topics: [] },
  { n: 3, slug: '3d-fracture-mechanics-simulation', title: '3D Fracture Mechanics Simulation using ANSYS Mechanical', subtitle: 'Crack modelling, SIF and J-integral in 3D', price: 25000, level: 'ADVANCED', lessons: 47, hours: 4.8, status: 'PUBLISHED', primary: 'fracture-mechanics', topics: ['Fracture Fundamentals', 'Crack Meshing', 'SIF Extraction', 'J-Integral', 'Fatigue Crack Growth'] },
  { n: 4, slug: 'protection-against-local-failure', title: '5.3 Protection Against Local Failure', subtitle: 'ASME VIII Div 2 Part 5.3 explained with ANSYS', price: 5000, level: 'INTERMEDIATE', lessons: 17, hours: 2.5, status: 'PUBLISHED', primary: 'pressure-vessel', topics: ['Local Failure Criterion', 'Elastic Method', 'Elastic-Plastic Method'] },
  { n: 5, slug: 'protection-against-global-failure', title: '5.2 Protection Against Global Failure', subtitle: 'Plastic collapse checks per ASME VIII Div 2 Part 5.2', price: 5000, level: 'INTERMEDIATE', lessons: 27, hours: 3.5, status: 'PUBLISHED', primary: 'pressure-vessel', topics: ['Elastic Stress Analysis', 'Limit Load', 'Elastic-Plastic Analysis'] },
  { n: 6, slug: 'basic-fea-ahead-of-pressure-vessel-design', title: 'Basic FEA ahead of Pressure Vessel Design', subtitle: 'The FEA foundation every pressure vessel analyst needs', price: 25000, level: 'BEGINNER', lessons: 109, hours: 14, status: 'PUBLISHED', primary: 'advanced-training', secondary: 'pump-design', topics: ['FEA Basics', 'Element Types', 'Meshing', 'Boundary Conditions', 'Linearisation', 'Post-processing', 'Pump Casing Example'] },
  { n: 7, slug: 'ansys-training-mechanical-vibrations', title: 'ANSYS Training: Mechanical Vibrations', subtitle: 'Modal, harmonic, random vibration and response spectrum', price: 30000, level: 'INTERMEDIATE', lessons: 42, hours: 6.5, status: 'PUBLISHED', primary: 'vibration-analysis', topics: ['Modal Analysis', 'Harmonic Response', 'Random Vibration', 'Response Spectrum'] },
  { n: 8, slug: 'basic-fea-training-for-beginners', title: 'Basic FEA Training for Beginners', subtitle: 'Start your finite element journey', price: 20000, level: 'BEGINNER', lessons: 22, hours: 3, status: 'PUBLISHED', primary: 'advanced-training', topics: ['What is FEA', 'First Static Analysis', 'Meshing Basics', 'Reading Results'] },
  { n: 9, slug: 'rotordynamics-analysis', title: 'Rotordynamics Analysis', subtitle: 'Lateral and torsional rotor dynamics with ANSYS', price: 40000, level: 'ADVANCED', lessons: 74, hours: 10, status: 'PUBLISHED', primary: 'rotor-dynamics', topics: ['Rotor Fundamentals', 'Bearings', 'Campbell Diagram', 'Unbalance Response', 'Torsional Analysis'] },
  { n: 10, slug: 'advanced-fea-ansys-workbench-apdl', title: 'Advanced FEA using ANSYS Workbench and APDL', subtitle: 'Scripting, contacts, nonlinearities and submodelling', price: 100000, level: 'ADVANCED', lessons: 50, hours: 8, status: 'PUBLISHED', primary: 'advanced-training', secondary: 'offshore-wind', topics: ['APDL Basics', 'Contact Modelling', 'Submodelling', 'Automation'] },
  { n: 11, slug: 'ansys-training-fatigue-and-fracture-mechanics', title: 'ANSYS Training: Fatigue and Fracture Mechanics', subtitle: 'Stress-life, strain-life and crack growth in ANSYS', price: 20000, level: 'INTERMEDIATE', lessons: 29, hours: 4.5, status: 'PUBLISHED', primary: 'fracture-mechanics', topics: ['Stress-Life', 'Strain-Life', 'Crack Growth'] },
  { n: 12, slug: 'ansys-training-non-linear-analysis', title: 'ANSYS Training: Non-Linear Analysis', subtitle: 'Material, geometric and contact nonlinearity', price: 20000, level: 'INTERMEDIATE', lessons: 64, hours: 9, status: 'PUBLISHED', primary: 'advanced-training', topics: ['Material Nonlinearity', 'Geometric Nonlinearity', 'Contact', 'Convergence'] },
  { n: 13, slug: 'offshore-wind-turbine-structures-welded-joint-fatigue-dnv', title: 'Offshore Wind Turbine Structures: Welded Joint and Fatigue Assessment (DNV)', subtitle: 'Coming soon', price: 25000, level: 'ADVANCED', lessons: 0, hours: 0, status: 'UPCOMING', primary: 'offshore-wind', topics: [] },
]

// REQ-342: exact curriculum for course 2 (38 lessons)
const COURSE2_SECTIONS: [string, number][] = [
  ['Introduction to Fatigue Calculations', 6],
  ['5.5 Level 1 Screening Methods', 6],
  ['3D FEA Vertical Pressure Vessel', 4],
  ['5.5.4 Level 2 Fatigue Analysis', 9],
  ['5.5.5 Ratcheting Assessment', 3],
  ['Fatigue Material', 6],
  ['5.6 Protection Against Creep Damage', 4],
]

/** Deterministic pseudo-random so reruns produce identical content. */
function mulberry(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function sectionPlan(c: CourseSeed): [string, number][] {
  if (c.n === 2) return COURSE2_SECTIONS
  if (c.lessons === 0) return []
  const topics = c.topics.length ? c.topics : ['Fundamentals']
  const perSection = Math.max(3, Math.ceil(c.lessons / Math.max(topics.length, Math.ceil(c.lessons / 12))))
  const plan: [string, number][] = []
  let left = c.lessons
  let i = 0
  while (left > 0) {
    const take = Math.min(perSection, left)
    const topic = topics[i % topics.length]
    plan.push([i < topics.length ? topic : `${topic} — Part ${Math.floor(i / topics.length) + 1}`, take])
    left -= take
    i++
  }
  return plan
}

function buildLessons(c: CourseSeed) {
  const rand = mulberry(c.n * 7919)
  const plan = sectionPlan(c)
  const total = plan.reduce((s, [, k]) => s + k, 0)
  const docEvery = c.n === 2 ? 6 : 0 // course 2 has DOCUMENT lessons (presentations) at 0 s
  const types: LessonType[] = []
  for (let i = 0; i < total; i++) types.push(docEvery && i % docEvery === docEvery - 1 ? 'DOCUMENT' : 'VIDEO')
  const videoCount = types.filter((t) => t === 'VIDEO').length
  const targetSeconds = Math.round(c.hours * 3600)
  const weights = types.map((t) => (t === 'VIDEO' ? 0.6 + rand() * 0.8 : 0))
  const wSum = weights.reduce((a, b) => a + b, 0) || 1
  const durations = weights.map((w, i) => (types[i] === 'DOCUMENT' ? 0 : Math.max(60, Math.round((w / wSum) * targetSeconds))))
  void videoCount

  let idx = 0
  const previewEvery = Math.max(1, Math.floor(total / 2))
  return plan.map(([title, count], s) => ({
    title,
    order: s + 1,
    lessons: Array.from({ length: count }, (_, k) => {
      const i = idx++
      return {
        title: types[i] === 'DOCUMENT' ? `${title}: Presentation ${k + 1}` : `${title}: Lesson ${k + 1}`,
        type: types[i],
        durationSeconds: durations[i],
        isFreePreview: i === 0 || (total > 8 && i === previewEvery),
        order: k + 1,
        videoUrl: types[i] === 'VIDEO' ? 'placeholder:video' : null,
        fileUrl: types[i] === 'DOCUMENT' ? 'placeholder:document' : null,
      }
    }),
  }))
}

const OUTCOMES = [
  'Set up and solve industry-grade models in ANSYS with confidence',
  'Interpret results against code acceptance criteria',
  'Choose appropriate element types, meshes and boundary conditions',
  'Document your analysis for review and certification',
  'Avoid the common modelling mistakes that invalidate results',
]
const REQUIREMENTS = ['Basic knowledge of strength of materials', 'Access to ANSYS Mechanical (a student or trial licence is fine)']

// ───────────────────────── content ─────────────────────────
const TESTIMONIALS: [string, string, string, string][] = [
  ['Aarav Menon', 'Mechanical Engineer', 'Tata Steel (placeholder)', 'The pressure vessel course finally made Part 5 of ASME VIII Div 2 click. The ANSYS walkthroughs are exactly what I needed on the job.'],
  ['Priya Raghavan', 'Design Engineer', 'L&T (placeholder)', 'Clear, structured and practical. I used the ratcheting lessons on a live project the week after finishing them.'],
  ['Karthik Subramanian', 'Stress Analyst', 'BHEL (placeholder)', 'The fracture mechanics course covers crack meshing better than anything else I have found. The SIF examples were gold.'],
  ['Neha Kulkarni', 'FEA Engineer', 'Thermax (placeholder)', 'Rotordynamics explained without hand-waving. The Campbell diagram section alone was worth the fee.'],
  ['Rohit Sharma', 'Mechanical Engineer', 'Siemens Energy (placeholder)', 'Great pace and real examples. I now check my vessel models against the course checklists.'],
  ['Divya Nair', 'Senior Engineer', 'GE Power (placeholder)', 'The non-linear analysis course helped me fix convergence problems I had struggled with for months.'],
  ['Vikram Iyer', 'Piping Engineer', 'Technip (placeholder)', 'Excellent grounding in FEA fundamentals. The basics course made the advanced material far less intimidating.'],
  ['Ananya Das', 'Graduate Engineer', 'Cairn Oil (placeholder)', 'As a fresher I found the beginner course approachable and very hands-on. Highly recommended.'],
  ['Suresh Babu', 'Lead Engineer', 'KBR (placeholder)', 'The fatigue assessment lessons gave my team a repeatable workflow for Level 2 evaluations.'],
  ['Meera Pillai', 'R&D Engineer', 'Kirloskar (placeholder)', 'The pump design example tied everything together. Lessons are concise and the instructor is clearly experienced.'],
  ['Arjun Reddy', 'CAE Specialist', 'Mahindra (placeholder)', 'Vibration analysis from modal to random vibration, all in one place and all reproducible in ANSYS.'],
  ['Lakshmi Venkat', 'Mechanical Engineer', 'Wood Group (placeholder)', 'Lifetime access means I keep going back to the worked examples whenever a new project needs them.'],
]
const LOGOS = ['Alpha Industries', 'Beta Energy', 'Gamma Engineering', 'Delta Power', 'Epsilon Marine', 'Zeta Systems', 'Eta Fabrication', 'Theta Turbines', 'Iota Offshore', 'Kappa Process', 'Lambda Steel', 'Mu Aerospace']
const HEROES: [string, string, string, string][] = [
  ['Master FEA with industry experts', 'Practical ANSYS training in pressure vessels, fracture mechanics, vibrations and more.', 'Browse courses', '/courses'],
  ['Design pressure vessels by analysis', 'Learn ASME Section VIII Div 2 Part 5 the practical way.', 'View the full course', '/courses/full-course-pressure-vessel-design-dba'],
  ['Understand 3D fracture mechanics', 'Model cracks, extract SIFs and predict growth with confidence.', 'Explore fracture courses', '/courses?category=fracture-mechanics'],
  ['Learn at your own pace, for life', 'Lifetime access to every course you enrol in.', 'Start learning', '/courses'],
]
const PAGES: [string, string, string][] = [
  ['about', 'About us', '<p><strong>[PLACEHOLDER]</strong> PYTHAGORAS Engineering Consultancy provides FEA consultancy and training to engineers worldwide. Final copy to be supplied by the client.</p>'],
  ['refund-policy', 'Refund policy', '<p><strong>[PLACEHOLDER — legal text to be supplied by the client]</strong></p><p>Refund terms for online courses will be described here.</p>'],
  ['privacy-policy', 'Privacy policy', '<p><strong>[PLACEHOLDER — legal text to be supplied by the client]</strong></p><p>How personal data is collected, used and protected will be described here.</p>'],
  ['terms', 'Terms and conditions', '<p><strong>[PLACEHOLDER — legal text to be supplied by the client]</strong></p><p>Terms of use for the platform will be described here.</p>'],
  ['cookie-policy', 'Cookie policy', '<p><strong>[PLACEHOLDER — legal text to be supplied by the client]</strong></p><p>The cookies used by this site will be described here.</p>'],
]

// CLIENT MUST SUPPLY VERIFIED FIGURES BEFORE LAUNCH
const SETTINGS: Record<string, string> = {
  company_name: 'PYTHAGORAS Engineering Consultancy',
  footer_blurb: 'Practical FEA and engineering training from industry experts.',
  address: 'Inspire Workplace, #134 & 135, Karthik Nagar, LRDE Layout, Doddanekundi Post, Bangalore 560037, India',
  email: 'info@fea-training.com',
  phone: '+91 70422 43776',
  social_linkedin: 'https://www.linkedin.com/',
  social_youtube: 'https://www.youtube.com/',
  social_twitter: 'https://x.com/',
  gst_mode: 'INCLUSIVE',
  gst_percent: '18',
  max_order_paise: '100000000',
  gstin: '',
  invoice_prefix: '',
  stats_students: '5000',
  stats_years: '20',
  stats_placement: '90',
}

const REVIEW_TEXT: [number, string][] = [
  [5, 'Excellent course. The ANSYS workflow is explained step by step and the examples are directly usable.'],
  [5, 'Very clear explanations of the code requirements, with models that I could reproduce exactly.'],
  [4, 'Great content. I would have liked a few more practice problems, but the lessons are very well paced.'],
  [5, 'This saved me weeks of trial and error on a live project. Highly recommended for practising engineers.'],
  [4, 'Solid coverage of the theory and good mesh guidance. Some lessons could be a little shorter.'],
  [5, 'The instructor clearly has deep industry experience. The tips on common mistakes were invaluable.'],
  [3, 'Useful material, though it assumes more background than the description suggests.'],
  [5, 'Best FEA training I have taken. The convergence and post-processing sections were especially good.'],
  [4, 'Practical and to the point. The downloadable presentations are a nice touch.'],
  [5, 'Brilliant. I now feel confident running these assessments independently.'],
  [4, 'Well structured. Audio is clear and the screen recordings are easy to follow.'],
  [5, 'Worth every rupee. The worked examples map neatly to real design problems.'],
]

async function main() {
  const demo = process.env.SEED_DEMO_ACCOUNTS === 'true'
  if (process.env.NODE_ENV === 'production' && demo && process.env.ALLOW_DEMO_IN_PRODUCTION !== 'true') {
    console.warn('SEED_DEMO_ACCOUNTS=true with NODE_ENV=production: demo accounts are only for the hosted demo.')
  }

  // categories
  const catId: Record<string, string> = {}
  for (const [i, c] of CATEGORIES.entries()) {
    const row = await db.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, icon: c.icon, order: i },
      create: { ...c, order: i },
    })
    catId[c.slug] = row.id
  }

  // instructor (REQ-343)
  const instructor = await db.user.upsert({
    where: { email: 'joel.daniel@example.com' },
    update: { name: 'Dr. Joel Daniel, M.Tech, Ph.D.' },
    create: {
      email: 'joel.daniel@example.com',
      name: 'Dr. Joel Daniel, M.Tech, Ph.D.',
      role: 'INSTRUCTOR',
      image: 'placeholder:avatar-instructor',
      instructorProfile: {
        create: {
          title: 'Fatigue and Fracture Mechanics / ASME Pressure Vessel Design',
          bio: 'Dr. Joel Daniel has over 20 years of experience in fatigue, fracture mechanics and pressure vessel design, previously with Textron, GE and Siemens. He has trained engineers worldwide in ANSYS-based design-by-analysis. His courses focus on practical, code-compliant workflows.',
          socialLinkedIn: 'https://www.linkedin.com/',
        },
      },
    },
  })

  // courses
  const courseId: Record<number, string> = {}
  for (const c of COURSES) {
    const rich = buildDescription(c.slug, { lessons: c.lessons, hours: c.hours, upcoming: c.status === 'UPCOMING' })
    const data = {
      title: c.title,
      subtitle: c.subtitle,
      shortDescription: rich?.short ?? `${c.subtitle}. Hands-on training with ANSYS taught by an industry expert.`,
      description: rich?.description ?? `<p>${c.title} is a practical, example-driven course. You will work through complete ANSYS models and learn how to interpret results against the relevant code or theory.</p><h3>Who is this for?</h3><p>Mechanical and design engineers, stress analysts and graduate engineers who want dependable analysis workflows.</p>`,
      level: c.level,
      language: 'English',
      price: c.price * 100,
      isFree: false,
      thumbnail: `placeholder:${c.primary}-${String(c.n).padStart(2, '0')}`,
      previewVideoUrl: null,
      status: c.status,
      featured: c.n <= 6,
      featuredOrder: c.n <= 6 ? c.n : null,
      instructorId: instructor.id,
      requirements: rich?.requirements ?? REQUIREMENTS,
      outcomes: rich?.outcomes ?? OUTCOMES,
      tags: c.topics.map((t) => t.toLowerCase()),
      seoTitle: null,
      seoDescription: null,
    }
    const row = await db.course.upsert({ where: { slug: c.slug }, update: data, create: { slug: c.slug, ...data } })
    courseId[c.n] = row.id

    // categories: exactly one primary (REQ-341A)
    await db.courseCategory.deleteMany({ where: { courseId: row.id } })
    await db.courseCategory.create({ data: { courseId: row.id, categoryId: catId[c.primary], isPrimary: true } })
    if (c.secondary) await db.courseCategory.create({ data: { courseId: row.id, categoryId: catId[c.secondary], isPrimary: false } })

    // curriculum: only (re)build when it differs, so user progress rows survive reseeding
    const existing = await db.lesson.count({ where: { section: { courseId: row.id } } })
    if (existing !== c.lessons) {
      await db.section.deleteMany({ where: { courseId: row.id } })
      for (const s of buildLessons(c)) {
        await db.section.create({
          data: { courseId: row.id, title: s.title, order: s.order, lessons: { create: s.lessons } },
        })
      }
    }
  }

  // testimonials, logos, heroes
  await db.testimonial.deleteMany()
  await db.testimonial.createMany({
    data: TESTIMONIALS.map(([name, role, company, quote], i) => ({ name, role, company, quote, photo: 'placeholder:avatar-testimonial', order: i })),
  })
  await db.clientLogo.deleteMany()
  await db.clientLogo.createMany({
    data: LOGOS.map((name, i) => ({ name, image: `placeholder:logo-${String(i + 1).padStart(2, '0')}`, order: i })),
  })
  await db.heroSlide.deleteMany()
  await db.heroSlide.createMany({
    data: HEROES.map(([heading, subheading, ctaLabel, ctaUrl], i) => ({
      heading,
      subheading,
      image: `placeholder:hero-${String(i + 1).padStart(2, '0')}`,
      ctaLabel,
      ctaUrl,
      secondaryCtaLabel: 'Talk to us',
      secondaryCtaUrl: '/contact',
      order: i,
    })),
  })

  // settings, pages
  // Contact details replace the old placeholders on an already-seeded database, but never overwrite
  // anything the admin has since typed into Settings.
  const OLD_PLACEHOLDERS: Record<string, string> = {
    address: 'Placeholder address, City, State, India',
    email: 'info@example.com',
    phone: '+91 00000 00000',
  }
  for (const [key, value] of Object.entries(SETTINGS)) {
    const old = OLD_PLACEHOLDERS[key]
    const existing = old ? await db.siteSetting.findUnique({ where: { key } }) : null
    const replace = !!old && existing?.value === old
    await db.siteSetting.upsert({ where: { key }, update: replace ? { value } : {}, create: { key, value } })
  }
  for (const [slug, title, body] of PAGES) {
    await db.page.upsert({ where: { slug }, update: {}, create: { slug, title, body } })
  }

  // webinar & announcement (REQ-349/350)
  await db.webinar.deleteMany()
  await db.webinar.create({
    data: {
      title: 'Live webinar: Introduction to Design by Analysis',
      date: new Date(Date.now() + 14 * DAY),
      link: '/contact',
      description: 'A free live session on design by analysis with ANSYS. Placeholder details — to be confirmed by the client.',
    },
  })
  await db.announcement.deleteMany()
  await db.announcement.create({
    data: {
      title: 'New courses added',
      body: 'Explore the latest ANSYS training courses.',
      link: '/courses',
      startsAt: new Date(Date.now() - DAY),
      endsAt: new Date(Date.now() + 30 * DAY),
    },
  })

  // coupons (REQ-354) — always seeded
  await db.coupon.upsert({ where: { code: 'WELCOME10' }, update: {}, create: { code: 'WELCOME10', discountType: 'PERCENT', discountValue: 1000, maxUses: 100 } })
  await db.coupon.upsert({ where: { code: 'FLAT1000' }, update: {}, create: { code: 'FLAT1000', discountType: 'FLAT', discountValue: 100000, maxUses: 50 } })

  // reviewers (REQ-351): not loginable (passwordHash null), enrolled in what they review
  const reviewers = await Promise.all(
    Array.from({ length: 12 }, (_, i) =>
      db.user.upsert({
        where: { email: `reviewer${String(i + 1).padStart(2, '0')}@seed.invalid` },
        update: {},
        create: { email: `reviewer${String(i + 1).padStart(2, '0')}@seed.invalid`, name: TESTIMONIALS[i][0], role: 'STUDENT' },
      }),
    ),
  )
  const perCourse: Record<number, number> = { 1: 12, 2: 8, 3: 6, 4: 3 }
  for (const [nStr, count] of Object.entries(perCourse)) {
    const cid = courseId[Number(nStr)]
    for (let i = 0; i < count; i++) {
      const u = reviewers[i]
      const [rating, comment] = REVIEW_TEXT[(i + Number(nStr)) % REVIEW_TEXT.length]
      await db.enrollment.upsert({ where: { userId_courseId: { userId: u.id, courseId: cid } }, update: {}, create: { userId: u.id, courseId: cid } })
      await db.review.upsert({
        where: { userId_courseId: { userId: u.id, courseId: cid } },
        update: {},
        create: { userId: u.id, courseId: cid, rating, comment, approved: true },
      })
    }
  }

  // demo accounts (REQ-352/353)
  if (demo) {
    const studentHash = await bcrypt.hash('Demo1234!', 12)
    const adminHash = await bcrypt.hash('Admin1234!', 12)
    const student = await db.user.upsert({
      where: { email: 'student@demo.test' },
      update: { passwordHash: studentHash },
      create: { email: 'student@demo.test', name: 'Demo Student', passwordHash: studentHash, role: 'STUDENT' },
    })
    await db.user.upsert({
      where: { email: 'admin@demo.test' },
      update: { passwordHash: adminHash },
      create: { email: 'admin@demo.test', name: 'Demo Admin', passwordHash: adminHash, role: 'ADMIN' },
    })
    for (const n of [2, 3]) {
      await db.enrollment.upsert({
        where: { userId_courseId: { userId: student.id, courseId: courseId[n] } },
        update: {},
        create: { userId: student.id, courseId: courseId[n] },
      })
      const lessons = await db.lesson.findMany({ where: { section: { courseId: courseId[n] } }, orderBy: [{ section: { order: 'asc' } }, { order: 'asc' }], take: n === 2 ? 5 : 3 })
      for (const l of lessons) {
        await db.lessonProgress.upsert({
          where: { userId_lessonId: { userId: student.id, lessonId: l.id } },
          update: {},
          create: { userId: student.id, lessonId: l.id, completed: true, completedAt: new Date() },
        })
      }
    }
    await db.review.upsert({
      where: { userId_courseId: { userId: student.id, courseId: courseId[2] } },
      update: {},
      create: { userId: student.id, courseId: courseId[2], rating: 4, comment: 'Pending demo review awaiting approval.', approved: false },
    })

    const demoHash = await bcrypt.hash('Demo1234!', 12)
    const rand = mulberry(42)
    for (let i = 1; i <= 30; i++) {
      const u = await db.user.upsert({
        where: { email: `demo.student${String(i).padStart(2, '0')}@demo.test` },
        update: {},
        create: { email: `demo.student${String(i).padStart(2, '0')}@demo.test`, name: `Demo Student ${String(i).padStart(2, '0')}`, passwordHash: demoHash, role: 'STUDENT' },
      })
      const picks = new Set<number>()
      const k = 1 + Math.floor(rand() * 4)
      while (picks.size < k) picks.add(1 + Math.floor(rand() * 12))
      for (const n of picks) {
        await db.enrollment.upsert({ where: { userId_courseId: { userId: u.id, courseId: courseId[n] } }, update: {}, create: { userId: u.id, courseId: courseId[n] } })
      }
    }
  }

  console.log(`Seed complete (demo accounts: ${demo ? 'yes' : 'no'}).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
