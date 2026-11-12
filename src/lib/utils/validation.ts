import { z } from 'zod'

export const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email').max(254)
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
export const nameSchema = z.string().trim().min(2, 'Enter your full name').max(100)

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
})

export const signupSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

export const forgotPasswordSchema = z.object({ email: emailSchema })

export const resetPasswordSchema = z.object({
  token: z.string().min(20).max(200),
  password: passwordSchema,
})

export const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  subject: z.string().trim().min(3, 'Enter a subject').max(150),
  message: z.string().trim().min(20, 'Message must be at least 20 characters').max(5000),
})

export const newsletterSchema = z.object({ email: emailSchema })

export const reviewSchema = z.object({
  courseId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10, 'Please write at least 10 characters').max(2000),
})

export const progressSchema = z.object({
  lessonId: z.string().min(1),
  completed: z.boolean().optional(),
})

export const cartAddSchema = z.object({ courseId: z.string().min(1) })

export const couponCodeSchema = z.string().trim().toUpperCase().min(2).max(40)

export const profileSchema = z.object({
  name: nameSchema,
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[0-9+()\-\s]*$/, 'Enter a valid phone number')
    .optional()
    .or(z.literal('')),
  bio: z.string().trim().max(1000).optional().or(z.literal('')),
})

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

export const createOrderSchema = z.object({
  couponCode: z.string().trim().max(40).optional().nullable(),
})

export const verifyPaymentSchema = z.object({
  orderId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
})

export { safeRedirect } from './redirect'

/** Webinar / workshop registration. Email is lower-cased by emailSchema so duplicates are caught reliably. */
export const eventRegistrationSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  phone: z
    .string()
    .trim()
    .min(7, 'Enter a valid phone number')
    .max(20, 'Enter a valid phone number')
    .regex(/^[+\d][\d\s\-()]*$/, 'Use digits only, with an optional leading +'),
  organisation: z.string().trim().min(2, 'Enter your organisation or college').max(150),
  designation: z.string().trim().max(100).optional().or(z.literal('')),
})
export type EventRegistrationInput = z.infer<typeof eventRegistrationSchema>
