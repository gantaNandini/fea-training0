import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db'
import type { SettingsMap } from '@/lib/types'

/** All SiteSetting rows as a key -> value map (REQ-264). Tag: `settings`. */
export const getSettings = unstable_cache(
  async (): Promise<SettingsMap> => {
    const rows = await db.siteSetting.findMany()
    return Object.fromEntries(rows.map((r) => [r.key, r.value]))
  },
  ['site-settings'],
  { tags: ['settings'], revalidate: 3600 },
)

export async function getSetting(key: string, fallback = ''): Promise<string> {
  const all = await getSettings()
  return all[key] ?? fallback
}
