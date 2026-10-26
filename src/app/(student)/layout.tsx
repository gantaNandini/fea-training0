import { SiteShell } from '@/components/layout/SiteShell'

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>
}
