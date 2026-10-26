/** Field definitions for the generic admin record manager (shared by server and client). */

export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'datetime' | 'image'

export interface Field {
  name: string
  label: string
  type: FieldType
  required?: boolean
  help?: string
  placeholder?: string
  options?: { value: string; label: string }[]
}

export type ModelKey = 'category' | 'coupon' | 'heroSlide' | 'testimonial' | 'clientLogo' | 'webinar' | 'announcement'

export interface ModelDef {
  key: ModelKey
  singular: string
  plural: string
  fields: Field[]
  /** field names shown as table columns (plus any extra columns the server supplies) */
  columns: string[]
}

export const ICON_OPTIONS = ['Activity', 'Cog', 'Droplets', 'Folder', 'Gauge', 'GraduationCap', 'Layers', 'Video', 'Wind'].map(
  (v) => ({ value: v, label: v }),
)

export const MODELS: Record<ModelKey, ModelDef> = {
  category: {
    key: 'category',
    singular: 'category',
    plural: 'Course categories',
    columns: ['name', 'slug', 'icon', 'order'],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'text', help: 'Leave empty to generate from the name.' },
      { name: 'icon', label: 'Icon', type: 'select', options: ICON_OPTIONS },
      { name: 'order', label: 'Display order', type: 'number' },
    ],
  },
  coupon: {
    key: 'coupon',
    singular: 'coupon',
    plural: 'Coupons',
    columns: ['code', 'discountType', 'value', 'usedCount', 'maxUses', 'active'],
    fields: [
      { name: 'code', label: 'Code', type: 'text', required: true, help: 'Stored in upper case.' },
      {
        name: 'discountType',
        label: 'Type',
        type: 'select',
        required: true,
        options: [
          { value: 'PERCENT', label: 'Percentage (%)' },
          { value: 'FLAT', label: 'Flat amount (₹)' },
        ],
      },
      { name: 'value', label: 'Value', type: 'number', required: true, help: '10 means 10 % or ₹10, depending on the type.' },
      { name: 'maxUses', label: 'Maximum uses', type: 'number', help: 'Empty = unlimited.' },
      { name: 'expiresAt', label: 'Expires at', type: 'datetime' },
      { name: 'active', label: 'Active', type: 'checkbox' },
    ],
  },
  heroSlide: {
    key: 'heroSlide',
    singular: 'hero slide',
    plural: 'Home page hero slides',
    columns: ['heading', 'ctaLabel', 'order', 'active'],
    fields: [
      { name: 'heading', label: 'Heading', type: 'text', required: true },
      { name: 'subheading', label: 'Sub-heading', type: 'textarea', required: true },
      { name: 'image', label: 'Background image', type: 'image', required: true, help: 'Upload, or type placeholder:hero-01.' },
      { name: 'ctaLabel', label: 'Button label', type: 'text', required: true },
      { name: 'ctaUrl', label: 'Button link', type: 'text', required: true },
      { name: 'secondaryCtaLabel', label: 'Second button label', type: 'text' },
      { name: 'secondaryCtaUrl', label: 'Second button link', type: 'text' },
      { name: 'order', label: 'Display order', type: 'number' },
      { name: 'active', label: 'Active', type: 'checkbox' },
    ],
  },
  testimonial: {
    key: 'testimonial',
    singular: 'testimonial',
    plural: 'Testimonials',
    columns: ['name', 'role', 'company', 'order', 'active'],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'role', label: 'Role', type: 'text', required: true },
      { name: 'company', label: 'Company', type: 'text' },
      { name: 'quote', label: 'Quote', type: 'textarea', required: true },
      { name: 'photo', label: 'Photo', type: 'image' },
      { name: 'order', label: 'Display order', type: 'number' },
      { name: 'active', label: 'Active', type: 'checkbox' },
    ],
  },
  clientLogo: {
    key: 'clientLogo',
    singular: 'client logo',
    plural: 'Client logos',
    columns: ['name', 'url', 'order', 'active'],
    fields: [
      { name: 'name', label: 'Company name', type: 'text', required: true },
      { name: 'image', label: 'Logo', type: 'image', required: true },
      { name: 'url', label: 'Website', type: 'text' },
      { name: 'order', label: 'Display order', type: 'number' },
      { name: 'active', label: 'Active', type: 'checkbox' },
    ],
  },
  webinar: {
    key: 'webinar',
    singular: 'webinar',
    plural: 'Upcoming webinars',
    columns: ['title', 'date', 'active'],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'date', label: 'Date and time', type: 'datetime', required: true },
      { name: 'link', label: 'Registration link', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'active', label: 'Active', type: 'checkbox' },
    ],
  },
  announcement: {
    key: 'announcement',
    singular: 'announcement',
    plural: 'Announcement bar',
    columns: ['title', 'startsAt', 'endsAt', 'active'],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'body', label: 'Message', type: 'textarea', required: true },
      { name: 'link', label: 'Link', type: 'text' },
      { name: 'startsAt', label: 'Starts at', type: 'datetime', required: true },
      { name: 'endsAt', label: 'Ends at', type: 'datetime', required: true },
      { name: 'active', label: 'Active', type: 'checkbox' },
    ],
  },
}
