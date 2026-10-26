import { db } from '@/lib/db'
import type { CourseState } from '@/components/admin/CourseEditor'

export async function getEditorLookups() {
  const [categories, instructors] = await Promise.all([
    db.category.findMany({ orderBy: [{ order: 'asc' }, { name: 'asc' }], select: { id: true, name: true } }),
    db.user.findMany({ where: { role: { in: ['INSTRUCTOR', 'ADMIN'] } }, orderBy: { name: 'asc' }, select: { id: true, name: true, email: true } }),
  ])
  return { categories, instructors: instructors.map((i) => ({ id: i.id, name: i.name ?? i.email })) }
}

export function emptyCourseState(instructorId: string): CourseState {
  return {
    title: '', slug: '', subtitle: '', shortDescription: '', description: '<p></p>',
    level: 'BEGINNER', language: 'English', status: 'DRAFT',
    price: '', discountPrice: '', isFree: false, featured: false, featuredOrder: '',
    thumbnail: '', previewVideoUrl: '', instructorId,
    categoryIds: [], primaryCategoryId: '',
    requirements: '', outcomes: '', tags: '', seoTitle: '', seoDescription: '',
    sections: [],
  }
}

export async function loadCourseState(id: string): Promise<CourseState | null> {
  const c = await db.course.findUnique({
    where: { id },
    include: { categories: true, sections: { orderBy: { order: 'asc' }, include: { lessons: { orderBy: { order: 'asc' } } } } },
  })
  if (!c) return null
  let n = 0
  const key = () => `s${++n}`
  return {
    id: c.id, title: c.title, slug: c.slug, subtitle: c.subtitle ?? '', shortDescription: c.shortDescription, description: c.description,
    level: c.level, language: c.language, status: c.status,
    price: String(Math.round(c.price / 100)), discountPrice: c.discountPrice != null ? String(Math.round(c.discountPrice / 100)) : '',
    isFree: c.isFree, featured: c.featured, featuredOrder: c.featuredOrder != null ? String(c.featuredOrder) : '',
    thumbnail: c.thumbnail ?? '', previewVideoUrl: c.previewVideoUrl ?? '', instructorId: c.instructorId,
    categoryIds: c.categories.map((x) => x.categoryId), primaryCategoryId: c.categories.find((x) => x.isPrimary)?.categoryId ?? '',
    requirements: c.requirements.join('\n'), outcomes: c.outcomes.join('\n'), tags: c.tags.join(', '),
    seoTitle: c.seoTitle ?? '', seoDescription: c.seoDescription ?? '',
    sections: c.sections.map((s) => ({
      key: key(), id: s.id, title: s.title,
      lessons: s.lessons.map((l) => ({
        key: key(), id: l.id, title: l.title, type: l.type,
        minutes: String(Math.round((l.durationSeconds / 60) * 100) / 100),
        isFreePreview: l.isFreePreview,
        videoUrl: l.videoUrl && !l.videoUrl.startsWith('placeholder:') ? l.videoUrl : '',
        fileUrl: l.fileUrl ?? '',
      })),
    })),
  }
}
