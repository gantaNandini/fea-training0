const BASE = 'https://pythagoras-lms.vercel.app'

const text = (h) => h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ')

let fails = 0
const check = (ok, l) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${l}`); if (!ok) fails++ }

const home = await (await fetch(BASE + '/')).text()
const homeT = text(home)

// Home: 12 cards
const cards = (home.match(/data-testid="home-course-card"/g) || []).length
check(cards === 12, `Home renders 12 course cards: ${cards}`)

// Events: no Conferences tab
const evT = text(await (await fetch(BASE + '/events')).text())
check(!/Conferences?/i.test(evT.replace(/Conferences, workshops/i, '')), 'Events: no Conferences tab')

// About tabs
const about = await (await fetch(BASE + '/about')).text()
check(about.includes('Trainee Details'), '/about shows Trainee Details tab')

// Trainee-details page
const tr = await fetch(BASE + '/about/trainee-details')
check(tr.status === 200, `/about/trainee-details exists: ${tr.status}`)

// Part 9 course is DRAFT (not on home page)
check(!home.includes('api-579-1-asme-ffs-1-part-9'), 'Part 9 course is DRAFT (not on home page)')

// Footer social links
const fb = home.match(/<footer[\s\S]*href="https:\/\/[^"]*facebook[^"]*"/i)
const li = home.match(/<footer[\s\S]*href="https:\/\/[^"]*linkedin[^"]*"/i)
const yt = home.match(/<footer[\s\S]*href="https:\/\/[^"]*youtube[^"]*"/i)
check(!!fb, 'Footer links to Facebook')
check(!!li, 'Footer links to LinkedIn')
check(!!yt, 'Footer links to YouTube')

console.log(`\n${fails ? fails + ' check(s) failed' : 'All checks passed'}`)
process.exit(fails)
