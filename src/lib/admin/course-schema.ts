import { z } from 'zod'

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null))

export const lessonInput = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, 'Every lesson needs a title').max(200),
  type: z.enum(['VIDEO', 'DOCUMENT', 'QUIZ']),
  durationSeconds: z.number().int().min(0).max(86_400),
  isFreePreview: z.boolean(),
  videoUrl: optionalText(500),
  fileUrl: optionalText(500),
})

export const sectionInput = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, 'Every section needs a title').max(200),
  lessons: z.array(lessonInput).max(500),
})

export const courseInput = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(3, 'Title is required').max(200),
  slug: optionalText(120),
  subtitle: optionalText(250),
  shortDescription: z.string().trim().min(10, 'Add a short description (10+ characters)').max(500),
  description: z.string().trim().min(10, 'Add a full description').max(50_000),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  language: z.string().trim().min(2).max(40),
  /** rupees (whole numbers) */
  price: z.number().int().min(0).max(10_000_000),
  discountPrice: z.number().int().min(0).max(10_000_000).nullable(),
  isFree: z.boolean(),
  thumbnail: optionalText(500),
  previewVideoUrl: optionalText(500),
  status: z.enum(['DRAFT', 'PUBLISHED', 'UPCOMING']),
  featured: z.boolean(),
  featuredOrder: z.number().int().min(1).max(99).nullable(),
  instructorId: z.string().min(1, 'Choose an instructor'),
  requirements: z.array(z.string().trim().min(1).max(300)).max(30),
  outcomes: z.array(z.string().trim().min(1).max(300)).max(30),
  tags: z.array(z.string().trim().min(1).max(40)).max(20),
  seoTitle: optionalText(120),
  seoDescription: optionalText(300),
  categoryIds: z.array(z.string()).max(10),
  primaryCategoryId: z.string().nullable(),
  sections: z.array(sectionInput).max(200),
})

export type CourseInput = z.infer<typeof courseInput>
export type CourseInputRaw = z.input<typeof courseInput>
