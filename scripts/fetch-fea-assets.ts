/**
 * Pulls the real pictures and testimonial text from the client's existing site into this project.
 *
 *   pnpm import:fea              download everything and write prisma/site-content.json
 *   pnpm import:fea --no-download   only analyse (prints what it found, downloads nothing)
 *   pnpm import:fea --html page.html   analyse a saved copy of the page instead of fetching it
 *
 * Images land in public/imported/** (commit them: Vercel serves them from there). Then run `pnpm db:seed`:
 * the seed reads prisma/site-content.json and uses these images for the hero, course posters,
 * testimonials and client logos. Nothing here touches the database directly.
 *
 * The page structure was not visible when this was written, so the matching is heuristic. It prints
 * everything it could not place; fix those by editing prisma/site-content.json by hand.
 */
import fs from 'node:fs'
import path from 'node:path'

const BASE = 'https://www.fea-training.com'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'
const ROOT = process.cwd()
const OUT = path.join(ROOT, 'public', 'imported')
const args = process.argv.slice(2)
const NO_DOWNLOAD = args.includes('--no-download')
const htmlFlag = args.indexOf('--html')

const PEOPLE: Record<string, string> = {
  'rohit.jpg': 'Rohith Pradeep Kongot', 'pra.jpg': 'Prasanna Tale', 'arv.jpg': 'Aravind kumar Gottimukkhala',
  'kp.jpg': 'KP Harishankar', 'deepak.jpg': 'Deepak Verma', 'sahid.jpg': 'Shaheed Hossain', 'visaal.jpg': 'Vishal Sinha',
  'harish.jpg': 'Harish Kolla', 'satish.jpg': 'Satish Kumar A', 'abhilash.jpg': 'Abhilash Gulhane', 'baljeet.jpg': 'Baljeet Singh',
  'navajo.png': 'Navajo Technical University, USA', 'yogesh.jpeg': 'Yogeshwararao J', 'rupesh.jpeg': 'Roopesh Kumar', 'sanju.jpeg': 'Sanju A K',
}

// First matching rule wins, so the specific ones come first.
const COURSE_RULES: [RegExp, string][] = [
  [/ratchet/, 'fatigue-ratchetting-creep-assessment'],
  [/fatigue and fracture/, 'ansys-training-fatigue-and-fracture-mechanics'],
  [/3d fracture/, '3d-fracture-mechanics-simulation'],
  [/local failure/, 'protection-against-local-failure'],
  [/global failure/, 'protection-against-global-failure'],
  [/ahead/, 'basic-fea-ahead-of-pressure-vessel-design'],
  [/vibration/, 'ansys-training-mechanical-vibrations'],
  [/beginner/, 'basic-fea-training-for-beginners'],
  [/rotordynamic|rotor dynamic/, 'rotordynamics-analysis'],
  [/apdl/, 'advanced-fea-ansys-workbench-apdl'],
  [/non-?linear/, 'ansys-training-non-linear-analysis'],
  [/offshore/, 'offshore-wind-turbine-structures-welded-joint-fatigue-dnv'],
  [/full course/, 'full-course-pressure-vessel-design-dba'],
]

const IMG_EXT = /\.(png|jpe?g|webp|gif|svg)(\?|$)/i

interface Found { url: string; at: number }

function collectImages(html: string): Found[] {
  const found: Found[] = []
  const seen = new Set<string>()
  const add = (raw: string, at: number) => {
    const t = raw.trim().replace(/&amp;/g, '&')
    if (!t || t.startsWith('data:')) return
    let abs: string
    try { abs = new URL(t, BASE + '/home').toString() } catch { return }
    if (!IMG_EXT.test(abs) && !/\/uploads\//.test(abs)) return
    if (seen.has(abs)) return
    seen.add(abs)
    found.push({ url: abs, at })
  }
  for (const m of html.matchAll(/(?:src|data-src|data-original|data-lazy|poster|content)\s*=\s*["']([^"']+)["']/gi)) add(m[1], m.index ?? 0)
  for (const m of html.matchAll(/srcset\s*=\s*["']([^"']+)["']/gi)) for (const part of m[1].split(',')) add(part.trim().split(/\s+/)[0], m.index ?? 0)
  for (const m of html.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi)) add(m[1], m.index ?? 0)
  return found.sort((a, b) => a.at - b.at)
}

function textNodes(html: string) {
  const body = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '')
  const out: { text: string; at: number }[] = []
  for (const m of body.matchAll(/>([^<]+)</g)) {
    const text = m[1].replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
    if (text) out.push({ text, at: m.index ?? 0 })
  }
  return out
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9. ]+/g, ' ').replace(/\s+/g, ' ')

async function download(url: string, kind: string, name?: string): Promise<string | null> {
  const file = (name ?? path.basename(new URL(url).pathname)).replace(/[^a-zA-Z0-9._-]/g, '_')
  const rel = kind === '../brand' ? `/brand/${file}` : `/imported/${kind}/${file}`
  if (NO_DOWNLOAD) return rel
  const dest = path.join(OUT, kind, file)
  try {
    if (!fs.existsSync(dest)) {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Referer: BASE + '/' } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
    }
    return rel
  } catch (e) {
    console.warn(`  ! could not download ${url}: ${(e as Error).message}`)
    return null
  }
}

async function main() {
  let html: string
  if (htmlFlag >= 0) html = fs.readFileSync(args[htmlFlag + 1], 'utf8')
  else {
    const res = await fetch(BASE + '/home', { headers: { 'User-Agent': UA } })
    if (!res.ok) throw new Error(`Could not load ${BASE}/home (HTTP ${res.status})`)
    html = await res.text()
  }
  const imgs = collectImages(html)
  console.log(`Found ${imgs.length} image URLs on the page.\n`)
  const content: Record<string, unknown> = {}
  const used = new Set<string>()

  // site logo
  const logo = imgs.find((i) => /\/uploads\/system\//.test(i.url) && /\.png/i.test(i.url))
  if (logo) {
    used.add(logo.url)
    const saved = await download(logo.url, '../brand', 'logo-original.png')
    console.log('Site logo:', saved ?? 'failed', '(send this file to Claude so the header logo can be matched exactly)')
  }

  // client logos
  const logos: { name: string; image: string }[] = []
  for (const i of imgs.filter((x) => /\/img\/brand\//.test(x.url))) {
    used.add(i.url)
    const file = path.basename(new URL(i.url).pathname)
    if (logos.some((l) => l.image.endsWith('/' + file.replace(/[^a-zA-Z0-9._-]/g, '_')))) continue
    const saved = await download(i.url, 'logos')
    if (saved) logos.push({ name: file.replace(/\.[a-z]+$/i, '').replace(/[-_]+/g, ' '), image: saved })
  }
  if (logos.length) content.logos = logos

  // testimonials
  const nodes = textNodes(html)
  const testimonials: { name: string; role: string; company: string; quote: string; photo: string }[] = []
  for (const i of imgs.filter((x) => /\/assets\/frontend\/default\/img\/[^/]+$/.test(x.url))) {
    const file = path.basename(new URL(i.url).pathname)
    const name = PEOPLE[file]
    if (!name) continue
    used.add(i.url)
    const photo = await download(i.url, 'people')
    const idx = nodes.findIndex((n) => n.text.toLowerCase().includes(name.toLowerCase().slice(0, 12)))
    let quote = ''
    let role = ''
    if (idx >= 0) {
      const near = nodes.slice(Math.max(0, idx - 4), idx + 5)
      quote = near.filter((n) => n.text.length >= 50 && !n.text.includes(name)).sort((a, b) => b.text.length - a.text.length)[0]?.text ?? ''
      role = near.find((n) => n.text !== name && n.text.length < 80 && n.text.length > 2 && n.text !== quote)?.text ?? ''
    }
    if (!quote) console.warn(`  ! no testimonial text found for ${name}; fill it in prisma/site-content.json`)
    testimonials.push({ name, role, company: '', quote: quote || 'Add testimonial text.', photo: photo ?? 'placeholder:avatar-testimonial' })
  }
  if (testimonials.length) content.testimonials = testimonials

  // course posters (match by the heading text that follows each poster)
  const courses: Record<string, string> = {}
  const posters = imgs.filter((x) => /course_thumbnail|\/thumbnails?\//i.test(x.url))
  const unmatched: string[] = []
  for (const p of posters) {
    used.add(p.url)
    const after = nodes.filter((n) => n.at >= p.at).slice(0, 3).map((n) => n.text).join(' ')
    const t = norm(after)
    const rule = COURSE_RULES.find(([re]) => re.test(t))
    if (!rule || courses[rule[1]]) { if (!rule) unmatched.push(`${p.url}  (text: "${after.slice(0, 70)}")`); continue }
    const saved = await download(p.url, 'courses')
    if (saved) courses[rule[1]] = saved
  }
  if (Object.keys(courses).length) content.courses = courses

  // hero pictures: anything that looks like a slider/banner picture, in page order
  const rest = imgs.filter((x) => !used.has(x.url))
  const heroLike = rest.filter((x) => /(slider|banner|hero|home[-_]?(page|banner)|cover|carousel)/i.test(x.url) || /\/uploads\/system\//.test(x.url))
  const hero: string[] = []
  for (const h of heroLike.slice(0, 4)) {
    const saved = await download(h.url, 'hero')
    if (saved) hero.push(saved)
  }
  if (hero.length) content.hero = hero
  else console.warn('\n! No hero pictures recognised. Open the page source and look for the slider images, then list them in prisma/site-content.json under "hero".')

  if (unmatched.length) console.log('\nPosters that matched no course:\n  ' + unmatched.join('\n  '))
  console.log('\nOther image URLs not used (check for the hero pictures here):\n  ' + rest.filter((x) => !heroLike.includes(x)).map((x) => x.url).join('\n  '))

  const outFile = path.join(ROOT, 'prisma', 'site-content.json')
  if (!NO_DOWNLOAD) fs.writeFileSync(outFile, JSON.stringify(content, null, 2))
  console.log(`\n${NO_DOWNLOAD ? 'Would write' : 'Wrote'} ${outFile}`)
  console.log(`hero: ${hero.length}/4, courses: ${Object.keys(courses).length}/13, testimonials: ${testimonials.length}, logos: ${logos.length}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
