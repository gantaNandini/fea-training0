/** Site settings groups edited in Admin → Settings. Only these keys can be written. */
export interface SettingField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'number'
  help?: string
  options?: { value: string; label: string }[]
  placeholder?: string
}
export interface SettingGroup {
  id: string
  title: string
  intro?: string
  fields: SettingField[]
}

export const SETTING_GROUPS: SettingGroup[] = [
  {
    id: 'system',
    title: 'System settings',
    intro: 'Company details, tax and order limits. These appear in the footer, contact page and receipts.',
    fields: [
      { key: 'company_name', label: 'Company name', type: 'text' },
      { key: 'email', label: 'Contact email', type: 'text' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'address', label: 'Address', type: 'textarea' },
      { key: 'gstin', label: 'GSTIN', type: 'text', help: 'Shown on receipts.' },
      { key: 'invoice_prefix', label: 'Invoice prefix', type: 'text', placeholder: 'PYT-INV' },
      {
        key: 'gst_mode',
        label: 'GST mode',
        type: 'select',
        options: [
          { value: 'INCLUSIVE', label: 'Inclusive (price already contains GST)' },
          { value: 'EXCLUSIVE', label: 'Exclusive (GST added at checkout)' },
        ],
      },
      { key: 'gst_percent', label: 'GST %', type: 'number' },
      { key: 'upi_id', label: 'UPI ID for the static QR option', type: 'text', placeholder: 'name@bank', help: 'Shown next to the QR on the manual UPI QR option. Leave blank to hide that option.' },
      { key: 'upi_payee', label: 'Payee name shown with the QR', type: 'text' },
      {
        key: 'payment_tiles',
        label: 'Payment options shown on the checkout page',
        type: 'text',
        placeholder: 'razorpay',
        help: 'Comma-separated. Available: razorpay, debit, credit, netbanking, wallet, upiqr. Start with "razorpay" and add the others one by one, for example "razorpay,debit,credit".',
      },
      {
        key: 'payment_methods',
        label: 'Payment methods policy (legacy, no longer used)',
        type: 'select',
        options: [
          { value: 'standard', label: 'Cards, Net Banking and Wallets (no UPI)' },
          { value: 'cards', label: 'Credit card + Debit card only' },
          { value: 'cards_upi', label: 'Credit card + Debit card + UPI' },
          { value: 'all', label: 'All methods enabled in Razorpay (cards, UPI, netbanking, wallets)' },
        ],
        help: 'No longer limits the Razorpay option, which now shows every method enabled in the Razorpay dashboard (Account & Settings > Payment Methods).',
      },
      { key: 'max_order_paise', label: 'Maximum order value (paise)', type: 'number', help: '100000000 = ₹10,00,000' },
    ],
  },
  {
    id: 'website',
    title: 'Website settings',
    intro: 'Footer text, social links and the figures shown on the home page statistics band.',
    fields: [
      { key: 'footer_blurb', label: 'Footer description', type: 'textarea' },
      { key: 'social_linkedin', label: 'LinkedIn URL', type: 'text' },
      { key: 'social_youtube', label: 'YouTube URL', type: 'text' },
      { key: 'social_twitter', label: 'X (Twitter) URL', type: 'text' },
      { key: 'stats_students', label: 'Statistic: students', type: 'number', help: 'Must be a verified figure.' },
      { key: 'stats_years', label: 'Statistic: years of experience', type: 'number' },
      { key: 'stats_placement', label: 'Statistic: satisfaction / placement %', type: 'number' },
      { key: 'show_fee_column', label: 'Show the Fee column in the home page fees table', type: 'select', options: [{ value: 'false', label: 'No (hide prices)' }, { value: 'true', label: 'Yes (show prices)' }] },
      { key: 'consultancy_enabled', label: 'Show the consultancy section on the home page', type: 'select', options: [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }] },
      { key: 'consultancy_title', label: 'Consultancy heading', type: 'text', placeholder: 'Engineering consultancy' },
      { key: 'consultancy_body', label: 'Consultancy paragraph', type: 'textarea' },
      { key: 'consultancy_points', label: 'Consultancy services (one per line)', type: 'textarea' },
      { key: 'consultancy_cta_label', label: 'Consultancy button text', type: 'text', placeholder: 'Discuss your project' },
      { key: 'consultancy_cta_href', label: 'Consultancy button link', type: 'text', placeholder: '/contact' },
      { key: 'value_strip_item2_sub', label: 'Highlight 2 sub-text', type: 'text' },
      { key: 'value_strip_item3_sub', label: 'Highlight 3 sub-text', type: 'text' },
    ],
  },
  {
    id: 'instructor',
    title: 'Instructor settings',
    intro: 'Revenue sharing used by the revenue reports.',
    fields: [
      {
        key: 'instructor_revenue_percent',
        label: 'Instructor revenue share (%)',
        type: 'number',
        help: 'The rest is admin revenue. Applies to all instructors.',
      },
    ],
  },
  {
    id: 'smtp',
    title: 'SMTP settings',
    intro: 'Outgoing email (password resets, contact replies). Leave the host empty to only log emails to the server console.',
    fields: [
      { key: 'smtp_host', label: 'SMTP host', type: 'text', placeholder: 'smtp.gmail.com' },
      { key: 'smtp_port', label: 'SMTP port', type: 'number', placeholder: '587' },
      { key: 'smtp_user', label: 'SMTP username', type: 'text' },
      { key: 'smtp_password', label: 'SMTP password', type: 'text', help: 'Stored in the database. Use an app password.' },
      { key: 'smtp_from', label: 'From address', type: 'text', placeholder: 'PYTHAGORAS <no-reply@yourdomain.com>' },
    ],
  },
]

export const WRITABLE_SETTING_KEYS = new Set(SETTING_GROUPS.flatMap((g) => g.fields.map((f) => f.key)))
export const DEFAULT_INSTRUCTOR_PERCENT = 70
