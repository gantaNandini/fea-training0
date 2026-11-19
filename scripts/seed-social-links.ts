/**
 * Seeds placeholder social links into SiteSettings.
 * Replace these with real URLs in Admin → Settings → Website once available.
 *   pnpm exec tsx scripts/seed-social-links.ts
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const links = [
  { key: 'social_linkedin', value: 'https://www.linkedin.com/company/pythagoras-engineering-consultancy' },
  { key: 'social_youtube',  value: 'https://www.youtube.com/@pythagorasengineering' },
  { key: 'social_facebook', value: 'https://www.facebook.com/pythagorasengineering' },
]

async function main() {
  for (const { key, value } of links) {
    await db.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } })
    console.log(`set ${key} = ${value}`)
  }
  console.log('Done. Update real URLs in Admin → Settings → Website.')
}

main().finally(() => db.$disconnect())
