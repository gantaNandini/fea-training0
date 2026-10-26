import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import { Providers } from '@/components/shared/Providers'
import { SITE_NAME, SITE_URL } from '@/lib/utils/seo'
import { messages } from '@/lib/messages'
import './globals.css'

// REQ-005: exactly two font families.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} Learning Platform`, template: `%s | ${SITE_NAME}` },
  description:
    'Engineering courses on FEA/ANSYS, ASME pressure vessel design, fatigue, fracture mechanics and rotordynamics from PYTHAGORAS Engineering Consultancy.',
  openGraph: { siteName: SITE_NAME, type: 'website', locale: 'en_IN' },
  twitter: { card: 'summary' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jakarta.variable}`}>
      <body>
        {/* REQ-037: first focusable element on every page */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-plum-900 focus:px-4 focus:py-3 focus:font-semibold focus:text-white"
        >
          {messages.common.skipToContent}
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
