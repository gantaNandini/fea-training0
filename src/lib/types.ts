/** Plain, JSON-serialisable DTOs returned by the data layer (dates are ISO strings, money is paise). */

export type Paise = number
export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'UPCOMING'
export type LessonType = 'VIDEO' | 'DOCUMENT' | 'QUIZ'

export interface CourseCardDTO {
  id: string
  slug: string
  title: string
  subtitle: string | null
  shortDescription: string
  level: CourseLevel
  language: string
  price: Paise
  discountPrice: Paise | null
  isFree: boolean
  thumbnail: string | null
  status: CourseStatus
  featured: boolean
  instructorId: string
  instructorName: string
  primaryCategoryName: string | null
  primaryCategorySlug: string | null
  lessonCount: number
  totalSeconds: number
  avgRating: number | null
  reviewCount: number
  studentCount: number
  /** first 4 outcomes, for the hover popover */
  outcomes: string[]
  updatedAt: string
}

export interface LessonDTO {
  id: string
  title: string
  type: LessonType
  durationSeconds: number
  isFreePreview: boolean
  order: number
}

export interface SectionDTO {
  id: string
  title: string
  order: number
  lessons: LessonDTO[]
}

export interface InstructorDTO {
  id: string
  name: string
  image: string | null
  title: string | null
  bio: string | null
  linkedin: string | null
  twitter: string | null
  website: string | null
  students: number
  reviews: number
  courses: number
  avgRating: number | null
}

export interface CourseCategoryDTO {
  id: string
  name: string
  slug: string
  isPrimary: boolean
}

export interface CourseDetailDTO extends CourseCardDTO {
  description: string
  requirements: string[]
  allOutcomes: string[]
  sections: SectionDTO[]
  instructor: InstructorDTO
  categories: CourseCategoryDTO[]
  previewVideoUrl: string | null
  seoTitle: string | null
  seoDescription: string | null
  createdAt: string
}

export interface CategoryDTO {
  id: string
  name: string
  slug: string
  icon: string | null
  parentId: string | null
  order: number
  courseCount: number
  children: CategoryDTO[]
}

export interface ReviewDTO {
  id: string
  rating: number
  comment: string
  createdAt: string
  userName: string
}

export interface RatingBreakdownDTO {
  /** index 0 = 1 star ... index 4 = 5 stars */
  counts: [number, number, number, number, number]
  total: number
  average: number | null
}

export interface TestimonialDTO {
  id: string
  name: string
  role: string
  company: string | null
  quote: string
  photo: string | null
}

export interface ClientLogoDTO {
  id: string
  name: string
  image: string
  url: string | null
}

export interface HeroSlideDTO {
  id: string
  heading: string
  subheading: string
  image: string
  ctaLabel: string
  ctaUrl: string
  secondaryCtaLabel: string | null
  secondaryCtaUrl: string | null
}

export interface WebinarDTO {
  id: string
  title: string
  date: string
  link: string
  description: string | null
}

export interface AnnouncementDTO {
  id: string
  title: string
  body: string
  link: string | null
}

export interface PageDTO {
  slug: string
  title: string
  body: string
}

export type SettingsMap = Record<string, string>

export interface CourseFilters {
  category?: string
  q?: string
  levels?: string[]
  languages?: string[]
  price?: 'all' | 'free' | 'paid'
  /** paise */
  minPrice?: number
  /** paise */
  maxPrice?: number
  minRating?: number
  sort?: 'newest' | 'price-asc' | 'price-desc' | 'rating' | 'popular'
  page?: number
  pageSize?: number
}

export interface CourseListResult {
  items: CourseCardDTO[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface MeState {
  wishlistIds: string[]
  cartIds: string[]
  enrolledIds: string[]
  user: { name: string | null; image: string | null; role: string } | null
}

export interface CartResponse {
  items: CourseCardDTO[]
  totals: {
    subtotal: Paise
    discount: Paise
    taxable: Paise
    gst: Paise
    total: Paise
    gstMode: 'INCLUSIVE' | 'EXCLUSIVE'
    gstPercent: number
  }
  coupon: { code: string; valid: boolean; message?: string } | null
}

export interface EnrolledCourseDTO {
  course: CourseCardDTO
  progressPercent: number
  completedLessons: number
  totalLessons: number
  resumeLessonId: string | null
  resumeLabel: 'start' | 'resume'
}

export interface CompareCourseDTO extends CourseCardDTO {
  categoryNames: string[]
  topOutcomes: string[]
}

export interface SearchSuggestionsDTO {
  courses: { slug: string; title: string }[]
  categories: { slug: string; name: string }[]
}

export interface PlayerLessonDTO {
  id: string
  title: string
  type: LessonType
  durationSeconds: number
  isFreePreview: boolean
  completed: boolean
  /** true when the viewer may not open it (never true for enrolled students) */
  locked: boolean
}

export interface PlayerSectionDTO {
  id: string
  title: string
  lessons: PlayerLessonDTO[]
}

export interface OrderSummaryDTO {
  id: string
  orderNumber: string
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  subtotal: Paise
  discount: Paise
  gst: Paise
  total: Paise
  gstMode: 'INCLUSIVE' | 'EXCLUSIVE'
  couponCode: string | null
  billingName: string | null
  billingEmail: string | null
  createdAt: string
  items: { courseId: string; title: string; price: Paise; slug: string | null }[]
}
