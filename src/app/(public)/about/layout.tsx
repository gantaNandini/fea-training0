import { AboutTabs } from '@/components/about/AboutTabs'

/** Shared layout for /about and /about/trainee-details — renders the tab bar above both pages. */
export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-page py-10 md:py-14">
      <AboutTabs />
      {children}
    </div>
  )
}
