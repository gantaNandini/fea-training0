import { Activity, Cog, Droplets, Folder, Gauge, GraduationCap, Layers, Video, Wind } from 'lucide-react'
import type { LucideProps } from 'lucide-react'

const ICONS = { Activity, Cog, Droplets, Folder, Gauge, GraduationCap, Layers, Video, Wind } as const

/** Category.icon stores a lucide icon name (content from DB, REQ-001). */
export function CategoryIcon({ name, ...props }: { name: string | null } & Omit<LucideProps, 'name'>) {
  const Icon = (name && (ICONS as Record<string, React.ComponentType<LucideProps>>)[name]) || Folder
  return <Icon aria-hidden="true" {...props} />
}
