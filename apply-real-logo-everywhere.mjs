// Run from the project root:  node apply-real-logo-everywhere.mjs
// Uses the client's real logo picture (public/brand/pecs-logo-mark.png) in 3 more places:
//  1) the browser-tab icon (favicon): src/app/icon.png replaces the hand-drawn src/app/icon.svg
//  2) the Admin header logo
//  3) the logo on certificates
// Put icon.png (from me) in the project folder first. Safe to run twice.
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const P = (...p) => path.join(root, ...p)
if (!fs.existsSync(P('package.json')) || !fs.existsSync(P('src'))) {
  console.error('STOP: run this from the pythagoras-lms project folder (the one with package.json).')
  process.exit(1)
}
let problems = 0
const report = (ok, msg) => { console.log((ok ? 'OK    ' : 'MISS  ') + msg); if (!ok) problems++ }

if (!fs.existsSync(P('public', 'brand', 'pecs-logo-mark.png'))) {
  console.error('STOP: public/brand/pecs-logo-mark.png is missing. Put the logo picture there first.')
  process.exit(1)
}

// 1) favicon
if (fs.existsSync(P('icon.png'))) {
  fs.copyFileSync(P('icon.png'), P('src', 'app', 'icon.png'))
  fs.unlinkSync(P('icon.png'))
  report(true, 'src/app/icon.png in place')
} else {
  report(fs.existsSync(P('src', 'app', 'icon.png')), 'src/app/icon.png (put icon.png in the project folder first if this says MISS)')
}
if (fs.existsSync(P('src', 'app', 'icon.svg'))) {
  fs.unlinkSync(P('src', 'app', 'icon.svg'))
  report(true, 'removed the hand-drawn src/app/icon.svg')
}

// helper
function edit(file, steps) {
  const full = P(...file.split('/'))
  if (!fs.existsSync(full)) { report(false, `${file} not found`); return }
  let text = fs.readFileSync(full, 'utf8')
  const before = text
  for (const s of steps) {
    if (s.done(text)) { report(true, `${file}: ${s.name} (already done)`); continue }
    const next = s.run(text)
    if (next === text) { report(false, `${file}: ${s.name} - text not found, change it by hand`); continue }
    text = next
    report(true, `${file}: ${s.name}`)
  }
  if (text !== before) fs.writeFileSync(full, text, 'utf8')
}

// 2) admin header
const IMG = '<Image src="/brand/pecs-logo-mark.png" alt="" width={414} height={360} className="h-9 w-auto" />'
edit('src/components/admin/AdminShell.tsx', [
  {
    name: 'use the real logo picture in the admin header',
    done: (t) => t.includes('/brand/pecs-logo-mark.png'),
    run: (t) => t.replace('<LogoMark className="h-9" />', IMG),
  },
  {
    name: "import Image (replaces the unused LogoMark import)",
    done: (t) => /import Image from 'next\/image'/.test(t),
    run: (t) => t.replace("import { LogoMark } from '@/components/layout/Logo'", "import Image from 'next/image'"),
  },
])

// 3) certificates
edit('src/components/certificate/CertificateView.tsx', [
  {
    name: 'use the real logo picture on certificates',
    done: (t) => !t.includes('/brand/logo-mark.svg'),
    run: (t) => t.split('/brand/logo-mark.svg').join('/brand/pecs-logo-mark.png'),
  },
])

console.log(problems ? `\n${problems} item(s) need attention - see MISS lines above.` : '\nAll done. Now run: pnpm typecheck, pnpm lint, pnpm build, pnpm dev. Hard-refresh the browser (Ctrl+Shift+R) to see the new tab icon.')
process.exit(problems ? 2 : 0)
