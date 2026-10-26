'use server'

import bcrypt from 'bcryptjs'
import { revalidatePath, revalidateTag } from 'next/cache'
import { db } from '@/lib/db'
import { assertAdmin, errorResult, type ActionResult } from '@/lib/admin/guard'
import { MODELS, type ModelKey } from '@/lib/admin/models'
import { MODEL_TAGS, buildData, createRecord, deleteRecord, updateRecord, slugify, type FormValues } from '@/lib/admin/records.server'
import { WRITABLE_SETTING_KEYS } from '@/lib/admin/settings-def'
import { courseInput, type CourseInputRaw } from '@/lib/admin/course-schema'
import { sanitizeRichText } from '@/lib/utils/sanitize'
import { emailProvider } from '@/lib/email'
import { emailSchema, passwordSchema, nameSchema } from '@/lib/utils/validation'

function bust(tags: string[], paths: string[] = ['/']) {
  for (const t of tags) revalidateTag(t)
  for (const p of paths) revalidatePath(p)
}

// ───────────────────────── generic records ─────────────────────────

export async function saveRecord(model: ModelKey, id: string | null, values: FormValues): Promise<ActionResult> {
  try {
    await assertAdmin()
    if (!(model in MODELS)) return { ok: false, error: 'Unknown record type.' }
    const built = buildData(model, values)
    if (!built.ok) return built
    if (id) await updateRecord(model, id, built.data)
    else await createRecord(model, built.data)
    bust(MODEL_TAGS[model])
    return { ok: true, message: id ? 'Saved.' : 'Created.' }
  } catch (e) {
    if (e instanceof Error && 'code' in e && (e as { code?: string }).code === 'P2002') {
      return { ok: false, error: 'That value already exists (it must be unique).' }
    }
    return errorResult(e)
  }
}

export async function removeRecord(model: ModelKey, id: string): Promise<ActionResult> {
  try {
    await assertAdmin()
    if (!(model in MODELS)) return { ok: false, error: 'Unknown record type.' }
    await deleteRecord(model, id)
    bust(MODEL_TAGS[model])
    return { ok: true, message: 'Deleted.' }
  } catch (e) {
    return errorResult(e)
  }
}

// ───────────────────────── settings & pages ─────────────────────────

export async function saveSettings(values: Record<string, string>): Promise<ActionResult> {
  try {
    await assertAdmin()
    const entries = Object.entries(values).filter(([k]) => WRITABLE_SETTING_KEYS.has(k))
    if (values.gst_percent !== undefined) {
      const g = Number(values.gst_percent)
      if (!Number.isFinite(g) || g < 0 || g > 100) return { ok: false, error: 'GST % must be between 0 and 100.' }
    }
    if (values.instructor_revenue_percent !== undefined) {
      const g = Number(values.instructor_revenue_percent)
      if (!Number.isFinite(g) || g < 0 || g > 100) return { ok: false, error: 'Revenue share must be between 0 and 100.' }
    }
    await db.$transaction(
      entries.map(([key, value]) =>
        db.siteSetting.upsert({ where: { key }, update: { value: value.trim() }, create: { key, value: value.trim() } }),
      ),
    )
    bust(['settings'], ['/', '/contact'])
    return { ok: true, message: 'Settings saved.' }
  } catch (e) {
    return errorResult(e)
  }
}

export async function savePage(slug: string, title: string, body: string): Promise<ActionResult> {
  try {
    await assertAdmin()
    if (!/^[a-z0-9-]{2,60}$/.test(slug) || title.trim().length < 2) return { ok: false, error: 'Title is required.' }
    const clean = sanitizeRichText(body)
    await db.page.upsert({
      where: { slug },
      update: { title: title.trim(), body: clean },
      create: { slug, title: title.trim(), body: clean },
    })
    bust([`page-${slug}`], [`/${slug}`])
    return { ok: true, message: 'Page saved.' }
  } catch (e) {
    return errorResult(e)
  }
}

// ───────────────────────── courses ─────────────────────────

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || 'course'
  let candidate = root
  for (let i = 2; i < 200; i++) {
    const hit = await db.course.findUnique({ where: { slug: candidate }, select: { id: true } })
    if (!hit || hit.id === excludeId) return candidate
    candidate = `${root}-${i}`
  }
  return `${root}-${Date.now()}`
}

export async function saveCourse(raw: CourseInputRaw): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    await assertAdmin()
    const parsed = courseInput.safeParse(raw)
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Please check the form.' }
    const c = parsed.data

    if (!c.isFree && c.status !== 'DRAFT' && c.price <= 0) return { ok: false, error: 'Enter a price, or tick "This course is free".' }
    if (c.discountPrice != null && c.discountPrice >= c.price && !c.isFree) {
      return { ok: false, error: 'The discount price must be lower than the price.' }
    }
    if (c.primaryCategoryId && !c.categoryIds.includes(c.primaryCategoryId)) c.categoryIds.push(c.primaryCategoryId)
    const instructor = await db.user.findUnique({ where: { id: c.instructorId }, select: { role: true } })
    if (!instructor || instructor.role === 'STUDENT') return { ok: false, error: 'Choose a valid instructor.' }

    const existing = c.id ? await db.course.findUnique({ where: { id: c.id }, select: { id: true, slug: true } }) : null
    if (c.id && !existing) return { ok: false, error: 'Course not found.' }
    const slug = await uniqueSlug(c.slug || c.title, existing?.id)

    const data = {
      slug,
      title: c.title,
      subtitle: c.subtitle,
      shortDescription: c.shortDescription,
      description: sanitizeRichText(c.description),
      level: c.level,
      language: c.language,
      price: c.isFree ? 0 : c.price * 100,
      discountPrice: c.isFree || c.discountPrice == null ? null : c.discountPrice * 100,
      isFree: c.isFree,
      thumbnail: c.thumbnail,
      previewVideoUrl: c.previewVideoUrl,
      status: c.status,
      featured: c.featured,
      featuredOrder: c.featured ? c.featuredOrder : null,
      instructorId: c.instructorId,
      requirements: c.requirements,
      outcomes: c.outcomes,
      tags: c.tags,
      seoTitle: c.seoTitle,
      seoDescription: c.seoDescription,
    }

    const saved = await db.$transaction(async (tx) => {
      const course = existing
        ? await tx.course.update({ where: { id: existing.id }, data })
        : await tx.course.create({ data })

      await tx.courseCategory.deleteMany({ where: { courseId: course.id } })
      if (c.categoryIds.length) {
        await tx.courseCategory.createMany({
          data: c.categoryIds.map((categoryId) => ({
            courseId: course.id,
            categoryId,
            isPrimary: categoryId === (c.primaryCategoryId ?? c.categoryIds[0]),
          })),
        })
      }

      // curriculum: update in place so learner progress on kept lessons survives
      const keptSectionIds = c.sections.map((s) => s.id).filter((x): x is string => !!x)
      const keptLessonIds = c.sections.flatMap((s) => s.lessons.map((l) => l.id)).filter((x): x is string => !!x)
      await tx.lesson.deleteMany({ where: { section: { courseId: course.id }, id: { notIn: keptLessonIds } } })
      await tx.section.deleteMany({ where: { courseId: course.id, id: { notIn: keptSectionIds } } })

      const ownSections = new Set((await tx.section.findMany({ where: { courseId: course.id }, select: { id: true } })).map((s) => s.id))
      const ownLessons = new Set(
        (await tx.lesson.findMany({ where: { section: { courseId: course.id } }, select: { id: true } })).map((l) => l.id),
      )

      for (const [si, s] of c.sections.entries()) {
        const sectionId =
          s.id && ownSections.has(s.id)
            ? (await tx.section.update({ where: { id: s.id }, data: { title: s.title, order: si + 1 } })).id
            : (await tx.section.create({ data: { courseId: course.id, title: s.title, order: si + 1 } })).id
        for (const [li, l] of s.lessons.entries()) {
          const ld = {
            sectionId,
            title: l.title,
            type: l.type,
            durationSeconds: l.type === 'DOCUMENT' ? l.durationSeconds : Math.max(l.durationSeconds, 0),
            isFreePreview: l.isFreePreview,
            videoUrl: l.type === 'VIDEO' ? l.videoUrl ?? 'placeholder:video' : null,
            fileUrl: l.type === 'DOCUMENT' ? l.fileUrl ?? 'placeholder:document' : null,
            order: li + 1,
          }
          if (l.id && ownLessons.has(l.id)) await tx.lesson.update({ where: { id: l.id }, data: ld })
          else await tx.lesson.create({ data: ld })
        }
      }
      return course
    }, { timeout: 60_000, maxWait: 10_000 })

    bust(['courses', `course-${saved.slug}`, ...(existing && existing.slug !== saved.slug ? [`course-${existing.slug}`] : [])], ['/', '/courses'])
    return { ok: true, message: 'Course saved.', id: saved.id, slug: saved.slug }
  } catch (e) {
    return errorResult(e)
  }
}

export async function setCourseStatus(id: string, status: 'DRAFT' | 'PUBLISHED' | 'UPCOMING'): Promise<ActionResult> {
  try {
    await assertAdmin()
    const c = await db.course.update({ where: { id }, data: { status } })
    bust(['courses', `course-${c.slug}`], ['/', '/courses'])
    return { ok: true, message: `Course is now ${status.toLowerCase()}.` }
  } catch (e) {
    return errorResult(e)
  }
}

export async function deleteCourse(id: string): Promise<ActionResult> {
  try {
    await assertAdmin()
    const orders = await db.orderItem.count({ where: { courseId: id } })
    if (orders > 0) {
      return { ok: false, error: 'This course has orders, so it cannot be deleted. Set it to Draft to hide it instead.' }
    }
    const c = await db.course.delete({ where: { id } })
    bust(['courses', `course-${c.slug}`], ['/', '/courses'])
    return { ok: true, message: 'Course deleted.' }
  } catch (e) {
    return errorResult(e)
  }
}

// ───────────────────────── enrolment ─────────────────────────

export async function enrolStudent(userId: string, courseId: string): Promise<ActionResult> {
  try {
    await assertAdmin()
    if (!userId || !courseId) return { ok: false, error: 'Choose a user and a course.' }
    const exists = await db.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } })
    if (exists) return { ok: false, error: 'This student is already enrolled in that course.' }
    await db.enrollment.create({ data: { userId, courseId } })
    await db.cartItem.deleteMany({ where: { userId, courseId } })
    bust(['courses'], ['/my-courses'])
    return { ok: true, message: 'Student enrolled.' }
  } catch (e) {
    return errorResult(e)
  }
}

export async function removeEnrolment(id: string): Promise<ActionResult> {
  try {
    await assertAdmin()
    await db.enrollment.delete({ where: { id } })
    bust(['courses'])
    return { ok: true, message: 'Enrolment removed.' }
  } catch (e) {
    return errorResult(e)
  }
}

// ───────────────────────── users ─────────────────────────

export async function createUser(input: {
  name: string
  email: string
  password: string
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN'
  title?: string
  bio?: string
}): Promise<ActionResult<{ id: string }>> {
  try {
    await assertAdmin()
    const name = nameSchema.safeParse(input.name)
    const email = emailSchema.safeParse(input.email)
    const password = passwordSchema.safeParse(input.password)
    if (!name.success) return { ok: false, error: name.error.issues[0].message }
    if (!email.success) return { ok: false, error: email.error.issues[0].message }
    if (!password.success) return { ok: false, error: password.error.issues[0].message }
    if (!['STUDENT', 'INSTRUCTOR', 'ADMIN'].includes(input.role)) return { ok: false, error: 'Invalid role.' }
    if (await db.user.findUnique({ where: { email: email.data }, select: { id: true } })) {
      return { ok: false, error: 'A user with this email already exists.' }
    }
    const user = await db.user.create({
      data: {
        name: name.data,
        email: email.data,
        passwordHash: await bcrypt.hash(password.data, 12),
        role: input.role,
        emailVerified: new Date(),
        ...(input.role === 'INSTRUCTOR'
          ? { instructorProfile: { create: { title: input.title?.trim() || null, bio: input.bio?.trim() || null } } }
          : {}),
      },
    })
    bust(['courses'], [])
    return { ok: true, message: 'User created.', id: user.id }
  } catch (e) {
    return errorResult(e)
  }
}

export async function setUserRole(id: string, role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN'): Promise<ActionResult> {
  try {
    const me = await assertAdmin()
    if (me.id === id) return { ok: false, error: 'You cannot change your own role.' }
    if (!['STUDENT', 'INSTRUCTOR', 'ADMIN'].includes(role)) return { ok: false, error: 'Invalid role.' }
    await db.user.update({ where: { id }, data: { role, sessionVersion: { increment: 1 } } })
    bust(['courses'], [])
    return { ok: true, message: 'Role updated.' }
  } catch (e) {
    return errorResult(e)
  }
}

export async function deleteUser(id: string): Promise<ActionResult> {
  try {
    const me = await assertAdmin()
    if (me.id === id) return { ok: false, error: 'You cannot delete your own account.' }
    const taught = await db.course.count({ where: { instructorId: id } })
    if (taught > 0) return { ok: false, error: 'This user is the instructor of courses. Reassign those courses first.' }
    const orders = await db.order.count({ where: { userId: id } })
    if (orders > 0) return { ok: false, error: 'This user has orders (kept for accounting) and cannot be deleted.' }
    await db.user.delete({ where: { id } })
    return { ok: true, message: 'User deleted.' }
  } catch (e) {
    return errorResult(e)
  }
}

export async function saveInstructorProfile(input: {
  title: string
  bio: string
  linkedin: string
  twitter: string
  website: string
}): Promise<ActionResult> {
  try {
    const me = await assertAdmin()
    const v = (s: string) => (s.trim() ? s.trim().slice(0, 500) : null)
    await db.instructorProfile.upsert({
      where: { userId: me.id },
      update: { title: v(input.title), bio: v(input.bio), socialLinkedIn: v(input.linkedin), socialTwitter: v(input.twitter), socialWebsite: v(input.website) },
      create: { userId: me.id, title: v(input.title), bio: v(input.bio), socialLinkedIn: v(input.linkedin), socialTwitter: v(input.twitter), socialWebsite: v(input.website) },
    })
    bust(['courses', `instructor-${me.id}`], [])
    return { ok: true, message: 'Profile saved.' }
  } catch (e) {
    return errorResult(e)
  }
}

// ───────────────────────── messages ─────────────────────────

export async function setMessageRead(id: string, read: boolean): Promise<ActionResult> {
  try {
    await assertAdmin()
    await db.contactMessage.update({ where: { id }, data: { read } })
    revalidatePath('/admin/message')
    return { ok: true }
  } catch (e) {
    return errorResult(e)
  }
}

export async function deleteMessage(id: string): Promise<ActionResult> {
  try {
    await assertAdmin()
    await db.contactMessage.delete({ where: { id } })
    revalidatePath('/admin/message')
    return { ok: true, message: 'Message deleted.' }
  } catch (e) {
    return errorResult(e)
  }
}

export async function sendMessage(to: string, subject: string, body: string): Promise<ActionResult> {
  try {
    await assertAdmin()
    const email = emailSchema.safeParse(to)
    if (!email.success) return { ok: false, error: 'Enter a valid email address.' }
    if (subject.trim().length < 2 || body.trim().length < 2) return { ok: false, error: 'Subject and message are required.' }
    await emailProvider.send({ to: email.data, subject: subject.trim().slice(0, 200), text: body.trim().slice(0, 10_000) })
    return { ok: true, message: 'Message sent.' }
  } catch (e) {
    return errorResult(e)
  }
}
