// Records the public-site tour and the intro/outro cards for the feedback video (no sign-in needed).
//   node scripts/walkthrough/tour.mjs   (app on BASE_URL, default http://localhost:5175)
// Output: walkthrough/raw/00-intro.webm, 00-public-site.webm, 99-outro.webm
import { mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'
import { showCard } from './card.mjs'

const BASE = process.env.BASE_URL ?? 'http://localhost:5175'
const OUT = resolve(process.env.OUT_DIR ?? 'walkthrough/raw')
mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.PWCHROME || undefined })

async function record(file, fn) {
  const dir = join(OUT, `${file}.tmp`)
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir, size: { width: 1440, height: 900 } },
  })
  const page = await ctx.newPage()
  page.setDefaultTimeout(20000)
  await fn(page)
  const video = await page.video()?.path()
  await ctx.close()
  if (video) renameSync(video, join(OUT, `${file}.webm`))
  rmSync(dir, { recursive: true, force: true })
  readdirSync(OUT)
  console.log(`recorded ${file}`)
}

const wheel = async (page, total, step = 70, gap = 55) => {
  const dir = Math.sign(total)
  for (let d = 0; d < Math.abs(total); d += step) {
    await page.mouse.wheel(0, dir * step)
    await page.waitForTimeout(gap)
  }
}

await record('00-intro', async (page) => {
  await showCard(page, BASE, {
    dark: true,
    eyebrow: 'RUNTech Space · preview for feedback',
    title: 'Learn tech with the people who do it.',
    subtitle: 'A first look at the new RUNTech Space: the public site, then each role in action.',
  })
  await page.waitForTimeout(4500)
})

await record('00-public-site', async (page) => {
  await showCard(page, BASE, { title: 'The public site', subtitle: 'What students, parents and employers see first.' })
  await page.waitForTimeout(2800)
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.mouse.move(720, 500)
  // let the 3D laptop finish its one-time setup before scrolling (it starts loading as the page opens)
  await page
    .waitForFunction(() => document.getElementById('journey')?.classList.contains('gl-ready'), null, { timeout: 60000 })
    .catch(() => {})
  await page.waitForTimeout(3000)
  for (const [x, y] of [
    [480, 420],
    [960, 380],
    [1000, 620],
    [720, 520],
  ]) {
    await page.mouse.move(x, y, { steps: 25 })
    await page.waitForTimeout(200)
  }
  await wheel(page, 950)
  await page.waitForTimeout(1600)
  await wheel(page, 800, 55, 70) // read-along statement
  await page.waitForTimeout(1200)
  // the laptop: a slow, steady scroll through the pinned section
  const h = await page.evaluate(() => {
    const s = document.getElementById('journey')
    return s ? s.offsetHeight : 0
  })
  await wheel(page, h + 200, 20, 60)
  await page.waitForTimeout(1600)
  // stack cards: hover a few, then filter
  await wheel(page, 500)
  await page.waitForTimeout(1200)
  const cards = page.locator('.sc')
  for (const i of [0, 1, 2]) {
    const bx = await cards.nth(i).boundingBox()
    if (!bx) continue
    await page.mouse.move(bx.x + bx.width * 0.3, bx.y + bx.height * 0.4, { steps: 15 })
    await page.waitForTimeout(250)
    await page.mouse.move(bx.x + bx.width * 0.7, bx.y + bx.height * 0.6, { steps: 20 })
    await page.waitForTimeout(500)
  }
  for (const t of ['Data & AI', 'Design & Product', 'All stacks']) {
    await page.getByRole('tab', { name: t }).click()
    await page.waitForTimeout(1300)
  }
  await page.mouse.move(720, 120)
  await wheel(page, 1500)
  await page.waitForTimeout(1200)
  for (let k = 0; k < 4; k++) {
    await wheel(page, 620, 80, 60) // platform chapters
    await page.waitForTimeout(1600)
  }
  for (const d of [1000, 1000, 1100, 900]) {
    await wheel(page, d)
    await page.waitForTimeout(1700)
  }
  await page.locator('summary').nth(1).click()
  await page.waitForTimeout(1300)
  await wheel(page, 1300)
  await page.waitForTimeout(1500)
  await wheel(page, -500, 80, 60) // the navbar returns on scroll up
  await page.waitForTimeout(1400)
  // the course page for one stack
  await page.goto(`${BASE}/stacks/frontend`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2200)
  await page.getByText('2. Your first web page').click().catch(() => {})
  await page.waitForTimeout(1400)
  await wheel(page, 500)
  await page.waitForTimeout(1600)
})

await record('99-outro', async (page) => {
  await showCard(page, BASE, {
    dark: true,
    eyebrow: 'Your feedback',
    title: 'What do you think?',
    subtitle:
      'First impressions of the site, anything unclear in the student journey, and what your stack needs. Reply with notes or timestamps.',
  })
  await page.waitForTimeout(6500)
})

await browser.close()
