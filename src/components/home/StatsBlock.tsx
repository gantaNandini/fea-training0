import type { SettingsMap } from '@/lib/types'
import { getPublishedCourseCount } from '@/lib/data/courses'
import { getSettings } from '@/lib/data/settings'
import { StatsSection, type StatItem } from './StatsSection'
import { messages } from '@/lib/messages'

/** Hidden entirely when the stat keys are absent (REQ-070). Course count is computed. */
export async function StatsBlock({
  settings: settingsProp,
  courseCount: courseCountProp,
}: {
  settings?: SettingsMap
  courseCount?: number
}) {
  const [settings, courseCount] = await Promise.all([
    settingsProp ?? getSettings(),
    courseCountProp != null ? Promise.resolve(courseCountProp) : getPublishedCourseCount(),
  ])
  const num = (k: string) => {
    const v = Number(settings[k])
    return settings[k] != null && settings[k] !== '' && Number.isFinite(v) ? v : null
  }
  const students = num('stats_students')
  const years = num('stats_years')
  const placement = num('stats_placement')
  if (students == null && years == null && placement == null) return null

  const stats: StatItem[] = []
  if (students != null) stats.push({ label: messages.home.statStudents, value: students, suffix: '+' })
  stats.push({ label: messages.home.statCourses, value: courseCount })
  if (years != null) stats.push({ label: messages.home.statYears, value: years, suffix: '+' })
  if (placement != null) stats.push({ label: messages.home.statPlacement, value: placement, suffix: '%' })
  return <StatsSection title={messages.home.statsHeading} stats={stats} />
}
