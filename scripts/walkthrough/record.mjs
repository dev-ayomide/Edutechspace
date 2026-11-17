// End-to-end walkthrough of RUNTech Space against a LOCAL Supabase (never the live project).
// It plays every role through the whole journey, checks each step, and records one video per part.
//
//   supabase start                      (local backend; see docs/WALKTHROUGH.md)
//   node scripts/walkthrough/record.mjs (expects the app on http://localhost:5175 pointed at the local backend)
//
// Output: walkthrough/raw/*.webm, then scripts/walkthrough/encode.sh turns them into shareable MP4s.
import { execFileSync } from 'node:child_process'
import { mkdirSync, renameSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'
import { showCard } from './card.mjs'

const BASE = process.env.BASE_URL ?? 'http://localhost:5175'
const SUPA = process.env.LOCAL_SUPABASE_URL ?? 'http://127.0.0.1:54321'
const SERVICE_KEY = process.env.LOCAL_SERVICE_ROLE_KEY
const MAILPIT = process.env.MAILPIT_URL ?? 'http://127.0.0.1:54324'
const DB_URL = process.env.LOCAL_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
const OUT = resolve(process.env.OUT_DIR ?? 'walkthrough/raw')
const ONLY = process.env.ONLY?.split(',')
const FAST = process.env.FAST === '1' // no pauses, for debugging

if (!SERVICE_KEY)
  throw new Error('Set LOCAL_SERVICE_ROLE_KEY (from `supabase status`). Local only.')
if (!/127\.0\.0\.1|localhost/.test(SUPA + DB_URL))
  throw new Error('This script only runs against a local Supabase.')

// Made-up people. Passwords are throwaway values for the local test database only.
const PW = 'Walkthrough-Local-2026'
const people = {
  admin: { email: 'admin@runtech.test', name: 'Tola Admin' },
  lead: { email: 'lead@runtech.test', name: 'Kemi Adewale' },
  student: { email: 'student@runtech.test', name: 'Ada Obi' },
}

const results = []
let currentPage = null
const step = async (name, fn) => {
  try {
    await fn()
    results.push(['PASS', name])
    console.log(`PASS  ${name}`)
  } catch (e) {
    await currentPage
      ?.screenshot({ path: join(OUT, `FAIL-${name.replace(/\W+/g, '-')}.png`) })
      .catch(() => {})
    results.push(['FAIL', name, e.message.split('\n')[0]])
    console.log(`FAIL  ${name}\n      ${e.message.split('\n').slice(0, 3).join('\n      ')}`)
    throw e
  }
}
const PACE = Number(process.env.PACE ?? 1.3) // stretch pauses so viewers can follow
const beat = (page, ms = 900) => (FAST ? Promise.resolve() : page.waitForTimeout(ms * PACE))
const sql = (q) =>
  execFileSync('psql', [DB_URL, '-v', 'ON_ERROR_STOP=1', '-tAq', '-c', q], {
    encoding: 'utf8',
  }).trim()

// ---------- local backend helpers ----------
async function createConfirmedUser({ email, name }) {
  const res = await fetch(`${SUPA}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password: PW,
      email_confirm: true,
      user_metadata: { full_name: name },
    }),
  })
  if (!res.ok) throw new Error(`create user ${email}: ${res.status} ${await res.text()}`)
}

async function latestMailLink(to, kind) {
  for (let i = 0; i < 40; i++) {
    const r = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`)
    const { messages = [] } = await r.json()
    for (const m of messages) {
      const full = await (await fetch(`${MAILPIT}/api/v1/message/${m.ID}`)).json()
      const body = `${full.HTML ?? ''} ${full.Text ?? ''}`
      const link = body.match(new RegExp(`https?://[^"'\\s<>]*type=${kind}[^"'\\s<>]*`))
      if (link) return link[0].replaceAll('&amp;', '&')
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`no ${kind} email for ${to}`)
}

async function clearMail() {
  await fetch(`${MAILPIT}/api/v1/messages`, { method: 'DELETE' })
}

// ---------- recording helpers ----------
const CURSOR = () => {
  const install = () => {
    if (document.getElementById('__wt_cursor')) return
    const c = document.createElement('div')
    c.id = '__wt_cursor'
    Object.assign(c.style, {
      position: 'fixed',
      zIndex: 2147483647,
      width: '22px',
      height: '22px',
      borderRadius: '50%',
      background: 'rgba(8,241,255,.35)',
      border: '2px solid #0b1a4a',
      pointerEvents: 'none',
      transform: 'translate(-50%,-50%)',
      transition: 'left .18s ease, top .18s ease, width .15s, height .15s',
      left: '-40px',
      top: '-40px',
    })
    document.documentElement.appendChild(c)
    addEventListener(
      'mousemove',
      (e) => {
        c.style.left = `${e.clientX}px`
        c.style.top = `${e.clientY}px`
      },
      true,
    )
    addEventListener(
      'mousedown',
      () => {
        c.style.width = c.style.height = '34px'
      },
      true,
    )
    addEventListener(
      'mouseup',
      () => {
        c.style.width = c.style.height = '22px'
      },
      true,
    )
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', install)
  else install()
}

const browser = await chromium.launch({
  executablePath: process.env.PWCHROME || undefined,
  slowMo: FAST ? 0 : 90,
})
rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

/** One recorded part = one browser context + page. Saved as OUT/<file>.webm. */
async function part(file, title, subtitle, fn, { storage, warm } = {}) {
  if (ONLY && !ONLY.includes(file)) return storage ?? null
  const dir = join(OUT, `${file}.tmp`)
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    recordVideo: { dir, size: { width: 1280, height: 720 } },
    storageState: storage ?? undefined,
    acceptDownloads: true,
  })
  await context.addInitScript(CURSOR)
  if (warm) {
    // Load slow third-party media once off camera, so the recording shows it ready (shared cache per context).
    const w = await context.newPage()
    await warm(w).catch(() => {})
    await w.close()
  }
  const page = await context.newPage()
  currentPage = page
  page.setDefaultTimeout(15000)
  const errors = []
  page.on('pageerror', (e) => {
    errors.push(e.message)
    console.log('      PAGE ERROR: ' + e.stack?.split('\n').slice(0, 4).join(' / '))
  })
  page.on(
    'console',
    (m) =>
      m.type() === 'error' &&
      !/favicon|youtube|ERR_BLOCKED|net::/i.test(m.text()) &&
      (errors.push(m.text()), console.log('      CONSOLE: ' + m.text().slice(0, 600))),
  )
  await showCard(page, BASE, { title, subtitle })
  await beat(page, 2600)
  let state = null
  try {
    state = await fn(page, context)
    if (errors.length)
      console.log(`      console errors in ${file}: ${errors.slice(0, 3).join(' | ')}`)
    results.push([
      errors.length ? 'WARN' : 'PASS',
      `${file}: no browser errors`,
      errors.slice(0, 2).join(' | '),
    ])
  } finally {
    await beat(page, 1200)
    const saved = await context.storageState()
    await context.close()
    const video = await page.video()?.path()
    if (video) renameSync(video, join(OUT, `${file}.webm`))
    rmSync(dir, { recursive: true, force: true })
    state ??= saved
  }
  return state
}

async function signIn(page, who, password = PW) {
  await page.goto(`${BASE}/login`)
  await page.getByLabel('Email').pressSequentially(who.email, { delay: FAST ? 0 : 25 })
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
}

async function signOut(page) {
  await page
    .getByRole('button', { name: /Sign out/ })
    .first()
    .click()
  await page.waitForURL(/\/(login)?$/)
}

async function scrollThrough(page, steps = 4) {
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, 520)
    await beat(page, 700)
  }
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'smooth' }))
  await beat(page, 600)
}

async function acceptInvite(page, email, name) {
  const link = await latestMailLink(email, 'invite')
  await page.goto(link)
  await page.waitForURL(/accept-invite/)
  await page.getByLabel('Full name').fill('')
  await page.getByLabel('Full name').pressSequentially(name, { delay: FAST ? 0 : 30 })
  await page.getByLabel('Password', { exact: true }).fill(PW)
  await page.getByLabel('Confirm password').fill(PW)
  await beat(page)
  await page.getByRole('button', { name: 'Save and continue' }).click()
}

const nav = (page, name) => page.getByRole('link', { name, exact: true }).first().click()

async function fillQuestion(scope, qi, prompt, options, correct) {
  const q = scope.getByRole('group', { name: `Question ${qi + 1}`, exact: true })
  await q.getByLabel('Question', { exact: true }).fill(prompt)
  for (const [oi, text] of options.entries()) {
    if (oi >= 2) await q.getByRole('button', { name: 'Add option' }).click()
    await q.getByLabel(`Option ${oi + 1}`, { exact: true }).fill(text)
  }
  await q.getByLabel(`Option ${correct + 1} is correct`).check()
}

const VIDEO_URL = 'https://www.youtube.com/watch?v=ysEN5RaKOlA'
async function warmVideo(page) {
  await page.goto(BASE)
  await page.evaluate((id) => {
    document.body.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}" referrerpolicy="strict-origin-when-cross-origin" style="width:900px;height:500px"></iframe>`
  }, VIDEO_URL.split('v=')[1])
  await page
    .frameLocator('iframe')
    .locator('.ytp-title-text, .ytp-title-link')
    .first()
    .waitFor({ timeout: 60000 })
  await page.waitForTimeout(3000)
}

const expectText = async (page, text) => page.getByText(text).first().waitFor()

// ================= the journey =================
try {
  await step('Reset local test data', async () => {
    await clearMail()
    // A clean local database every run: all migrations plus the demo signatories seed.
    // Clear the previous run's test data. (Not `supabase db reset`: when the CLI is linked to the live project it
    // tries to download the live Postgres version first.)
    sql(`delete from public.certificates where user_id in (select id from public.profiles where email like '%@runtech.test');
         delete from auth.users where email like '%@runtech.test';
         delete from public.stack_applications where email like '%@runtech.test';
         delete from public.invitations where email like '%@runtech.test';
         delete from public.exams where stack_id = (select id from public.stacks where slug = 'frontend');
         delete from public.modules where stack_id = (select id from public.stacks where slug = 'frontend');`)
    for (let i = 0; i < 60; i++) {
      const ok = await Promise.all(
        [
          `${SUPA}/auth/v1/health`,
          `${SUPA}/storage/v1/bucket`,
          `${SUPA}/rest/v1/stacks?select=id`,
        ].map((u) =>
          fetch(u, {
            headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
          }).then(
            (r) => r.ok,
            () => false,
          ),
        ),
      )
      if (ok.every(Boolean)) break
      await new Promise((r) => setTimeout(r, 1000))
    }
    await createConfirmedUser(people.admin)
    sql(
      `update public.profiles set role = 'admin', full_name = '${people.admin.name}' where email = '${people.admin.email}'`,
    )
  })

  // ---------- 1. Admin sets things up ----------
  await part(
    '01-admin-setup',
    'Admin: set up the platform',
    'Stacks, signatories and inviting a stack lead',
    async (page) => {
      await step('Admin signs in and sees the overview', async () => {
        await signIn(page, people.admin)
        await page.waitForURL(/\/admin/)
        await beat(page, 1500)
      })
      await step('Admin views the stacks', async () => {
        await nav(page, 'Stacks')
        await expectText(page, 'Frontend Development')
        await beat(page, 1500)
      })
      await step('Admin uploads signature images for the certificate signatories', async () => {
        await nav(page, 'Signatories')
        for (const [match, file] of [
          ['Demo President', 'president.png'],
          ['Demo Technical Lead', 'technical-lead.png'],
          ['Demo Staff Patron', 'staff-patron.png'],
        ]) {
          await page.getByRole('button', { name: new RegExp(`Edit ${match}`) }).click()
          await page
            .getByLabel('Signature image')
            .setInputFiles(resolve('design/demo-signatures', file))
          await beat(page, 500)
          await page.getByRole('dialog').getByRole('button', { name: /Save/ }).click()
          await page.getByRole('dialog').waitFor({ state: 'detached' })
        }
        await page.getByAltText(/Signature of Demo President/).waitFor()
        await beat(page, 1500)
      })
      await step('Admin invites a stack lead for Frontend Development', async () => {
        await nav(page, 'Lead invitations')
        await page
          .getByLabel('Email')
          .pressSequentially(people.lead.email, { delay: FAST ? 0 : 25 })
        await page.getByLabel('Stack').selectOption({ label: 'Frontend Development' })
        await beat(page)
        await page.getByRole('button', { name: /Send invitation|Invite/ }).click()
        await page.getByRole('cell', { name: people.lead.email }).waitFor({ timeout: 45000 })
        await beat(page, 1800)
      })
    },
  )

  // ---------- 2. Lead accepts and builds the course ----------
  const leadState = await part(
    '02-lead-builds-course',
    'Stack lead: build the course',
    'Modules, lessons, a quiz, a project and the final exam',
    async (page) => {
      await step('Lead opens the invitation email and sets a password', async () => {
        await acceptInvite(page, people.lead.email, people.lead.name)
        await page.waitForURL(/\/lead/)
        await beat(page, 1500)
      })
      await step('Lead creates module 1 with a video lesson and a written lesson', async () => {
        await nav(page, 'Content')
        await page.getByRole('button', { name: 'New module' }).first().click()
        await page
          .getByLabel('Title')
          .pressSequentially('How the web works', { delay: FAST ? 0 : 20 })
        await page
          .getByLabel('Description')
          .fill('Browsers, servers and what happens when you open a page.')
        await page.getByRole('button', { name: 'Add module' }).click()
        await page.getByRole('dialog').waitFor({ state: 'detached' })

        await page.getByRole('button', { name: 'Add lesson to How the web works' }).click()
        const d = page.getByRole('dialog')
        await d
          .getByLabel('Title')
          .pressSequentially('Welcome to the stack', { delay: FAST ? 0 : 20 })
        await d.getByLabel('Lesson type').selectOption('video')
        await d.getByRole('textbox', { name: 'Link' }).fill(VIDEO_URL)
        await d.getByLabel(/Duration/).fill('12')
        await d.getByLabel(/Published/).check()
        await beat(page)
        await d.getByRole('button', { name: /Add lesson|Save/ }).click()
        await d.waitFor({ state: 'detached' })

        await page.getByRole('button', { name: 'Add lesson to How the web works' }).click()
        await d.getByLabel('Title').fill('Reading: the anatomy of a URL')
        await d.getByLabel('Lesson type').selectOption('text')
        await d
          .getByLabel('Lesson text')
          .fill(
            'A URL has a scheme (https), a host (runtech.example), a path (/stacks/frontend) and sometimes a query (?stack=frontend).\n\nEvery time you press Enter in the address bar, your browser asks a server for that path and renders what comes back.',
          )
        await d.getByLabel(/Duration/).fill('8')
        await d.getByLabel(/Published/).check()
        await d.getByRole('button', { name: /Add lesson|Save/ }).click()
        await d.waitFor({ state: 'detached' })
        await beat(page)
      })
      await step('Lead adds a quiz to module 1', async () => {
        await page.getByRole('button', { name: 'Add assignment to How the web works' }).click()
        const d = page.getByRole('dialog')
        await d.getByLabel('Title').fill('Quiz: how the web works')
        await d.getByLabel('Type').selectOption('quiz')
        const questions = [
          [
            'What does a browser send to a server to get a page?',
            ['A request', 'A spreadsheet', 'An image'],
            0,
          ],
          ['Which part of a URL names the website?', ['The path', 'The host', 'The query'], 1],
        ]
        for (const [qi, [prompt, options, correct]] of questions.entries()) {
          await d.getByRole('button', { name: 'Add question' }).click()
          await fillQuestion(d, qi, prompt, options, correct)
        }
        await d.getByLabel(/Published/).check()
        await beat(page)
        await d.getByRole('button', { name: /Add assignment|Save/ }).click()
        await d.waitFor({ state: 'detached' })
      })
      await step('Lead publishes module 1', async () => {
        await page.getByRole('button', { name: 'Publish module How the web works' }).click()
        await page.getByRole('button', { name: 'Unpublish module How the web works' }).waitFor()
        await beat(page)
      })
      await step('Lead creates module 2 with a lesson and a graded project', async () => {
        await page.getByRole('button', { name: 'New module' }).first().click()
        await page.getByLabel('Title').fill('Your first web page')
        await page.getByRole('button', { name: 'Add module' }).click()
        await page.getByRole('dialog').waitFor({ state: 'detached' })
        const d = page.getByRole('dialog')
        await page.getByRole('button', { name: 'Add lesson to Your first web page' }).click()
        await d.getByLabel('Title').fill('Semantic HTML')
        await d.getByLabel('Lesson type').selectOption('text')
        await d
          .getByLabel('Lesson text')
          .fill(
            'Use headings in order, one <main> per page, and buttons for actions and links for navigation.',
          )
        await d.getByLabel(/Published/).check()
        await d.getByRole('button', { name: /Add lesson|Save/ }).click()
        await d.waitFor({ state: 'detached' })

        await page.getByRole('button', { name: 'Add assignment to Your first web page' }).click()
        await d.getByLabel('Title').fill('Project: an about-me page')
        await d.getByLabel('Type').selectOption('submission')
        await d
          .getByLabel('Instructions')
          .fill(
            'Build a one-page "about me" site with semantic HTML. Share a link to it (GitHub Pages or Netlify is fine).',
          )
        await d.getByLabel(/Published/).check()
        await d.getByRole('button', { name: /Add assignment|Save/ }).click()
        await d.waitFor({ state: 'detached' })
        await page.getByRole('button', { name: 'Publish module Your first web page' }).click()
        await page.getByRole('button', { name: 'Unpublish module Your first web page' }).waitFor()
        await scrollThrough(page, 3)
      })
      await step('Lead builds and publishes the final exam', async () => {
        await page
          .getByRole('link', { name: /Final exam|Exam/ })
          .first()
          .click()
        const create = page.getByRole('button', { name: 'Create the exam' })
        await create.waitFor()
        await beat(page)
        await create.click()
        await page.getByLabel(/Time limit/).fill('20')
        const questions = [
          ['Which tag holds the main content of a page?', ['<main>', '<div>'], 0],
          ['Which is for navigation?', ['A button', 'A link'], 1],
        ]
        for (const [qi, [prompt, options, correct]] of questions.entries()) {
          await page.getByRole('button', { name: 'Add question' }).click()
          await fillQuestion(page, qi, prompt, options, correct)
        }
        await page.getByLabel(/Published/).check()
        await beat(page)
        await page.getByRole('button', { name: 'Save exam' }).click()
        await page
          .getByText(/saved|published/i)
          .first()
          .waitFor()
        await beat(page, 1500)
      })
    },
  )

  // ---------- 3. A visitor finds the stack and applies ----------
  await part(
    '03-visitor-applies',
    'A student finds a stack and applies',
    'The public site: home, stacks, the course page and the application form',
    async (page) => {
      await step('Visitor browses the home page', async () => {
        await page.goto(BASE)
        await page.getByRole('heading', { level: 1 }).waitFor()
        await beat(page, 1500)
        await scrollThrough(page, 6)
      })
      await step('Visitor opens the Frontend course page and sees the curriculum', async () => {
        await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Stacks', exact: true }).click()
        await page.getByRole('heading', { name: 'All stacks' }).waitFor()
        await beat(page, 1200)
        await page
          .getByRole('link', { name: /Frontend Development/ })
          .first()
          .click()
        await page.waitForURL(/\/stacks\/frontend/)
        await expectText(page, 'How the web works')
        await expectText(page, 'Your first web page')
        await beat(page, 1200)
        await page.getByText('How the web works').first().click()
        await beat(page, 1200)
        await scrollThrough(page, 3)
      })
      await step('Visitor applies to the Frontend stack', async () => {
        await page.getByRole('link', { name: 'Apply to this stack' }).first().click()
        await page.waitForURL(/\/join/)
        await page
          .getByLabel('Full name')
          .pressSequentially(people.student.name, { delay: FAST ? 0 : 35 })
        await page
          .getByLabel('Email')
          .pressSequentially(people.student.email, { delay: FAST ? 0 : 25 })
        await page.getByLabel('Phone (optional)').fill('+234 803 000 0000')
        await page
          .getByLabel(/Why do you want to join/)
          .fill('I want to build websites for small businesses in my town.')
        await beat(page)
        await page.getByRole('button', { name: 'Send application' }).click()
        await expectText(page, 'Application received')
        await beat(page, 2000)
      })
    },
  )

  // ---------- 4. Lead approves ----------
  await part(
    '04-lead-approves',
    'Stack lead: review applications',
    'Approving sends the student an invitation email',
    async (page) => {
      await step('Lead sees the new application on the overview', async () => {
        await page.goto(`${BASE}/lead`)
        await page.getByRole('link', { name: /applications? to review/ }).waitFor()
        await beat(page, 1500)
      })
      await step('Lead approves the application', async () => {
        await page.getByRole('link', { name: /applications? to review/ }).click()
        await page.getByRole('button', { name: `Approve ${people.student.name}` }).click()
        const d = page.getByRole('dialog')
        await d.getByLabel(/Note/).fill('Welcome aboard. Start with module 1 this week.')
        await beat(page)
        await d.getByRole('button', { name: 'Approve' }).click()
        await d.waitFor({ state: 'detached' })
        await page
          .getByText(/No applications waiting|approved/i)
          .first()
          .waitFor()
        await beat(page, 1800)
      })
    },
    { storage: leadState },
  )

  // ---------- 5. Student learns ----------
  const studentState = await part(
    '05-student-learns',
    'Student: learn the stack',
    'Dashboard, lessons, a quiz and a project submission',
    async (page) => {
      await step('Student opens the invitation email and sets a password', async () => {
        await acceptInvite(page, people.student.email, people.student.name)
        await page.waitForURL(/\/dashboard/)
        await expectText(page, 'Continue learning')
        await beat(page, 2000)
      })
      await step('Student watches the first lesson and marks it complete', async () => {
        await page.getByRole('link', { name: /Continue learning/ }).click()
        await page.waitForURL(/\/lessons\//)
        // Let the YouTube player draw its thumbnail before moving on (not required for the test).
        await page
          .frameLocator('iframe')
          .first()
          .locator('.ytp-title-text, .ytp-title-link')
          .first()
          .waitFor({ timeout: 8000 })
          .catch(() => console.log('      (video player did not finish loading in time)'))
        await beat(page, 1200)
        await page.getByRole('button', { name: 'Mark as complete' }).click()
        await expectText(page, 'Completed')
        await beat(page)
        await page.getByRole('link', { name: /Next lesson/ }).click()
      })
      await step('Student reads the written lesson and completes it', async () => {
        await expectText(page, 'anatomy of a URL')
        await beat(page, 1800)
        await page.getByRole('button', { name: 'Mark as complete' }).click()
        await expectText(page, 'Completed')
        await beat(page)
      })
      await step('Student takes and passes the module 1 quiz', async () => {
        await page.goto(`${BASE}/dashboard/stack`)
        await page.getByRole('link', { name: /Quiz: how the web works/ }).click()
        await page.getByLabel('A request').check()
        await beat(page, 500)
        await page.getByLabel('The host').check()
        await beat(page)
        await page.getByRole('button', { name: 'Submit answers' }).click()
        await expectText(page, /You passed/)
        await beat(page, 2000)
      })
      await step('Module 2 unlocks; student completes its lesson', async () => {
        await page.goto(`${BASE}/dashboard/stack`)
        await beat(page, 1500)
        await page.getByRole('link', { name: /Semantic HTML/ }).click()
        await page.getByRole('button', { name: 'Mark as complete' }).click()
        await expectText(page, 'Completed')
        await beat(page)
      })
      await step('Student submits the project', async () => {
        await page.goto(`${BASE}/dashboard/stack`)
        await page.getByRole('link', { name: /Project: an about-me page/ }).click()
        await page
          .getByLabel('Your answer')
          .pressSequentially(
            'Here is my about-me page. I used header, main and footer, and every image has alt text.',
            { delay: FAST ? 0 : 12 },
          )
        await page.getByLabel('Link (optional)').fill('https://ada-obi.example.com')
        await beat(page)
        await page.getByRole('button', { name: 'Submit', exact: true }).click()
        await expectText(page, /waiting for your stack lead/)
        await beat(page, 1500)
      })
      await step('Student checks progress', async () => {
        await nav(page, 'Progress')
        await beat(page, 2200)
      })
    },
    { warm: warmVideo },
  )

  // ---------- 6. Lead grades ----------
  await part(
    '06-lead-grades',
    'Stack lead: grade the project',
    'Score and written feedback the student sees',
    async (page) => {
      await step('Lead grades the project with feedback', async () => {
        await page.goto(`${BASE}/lead`)
        await beat(page, 1200)
        await page.getByRole('link', { name: /projects? to grade/ }).click()
        await page
          .getByRole('button', { name: new RegExp(`Review ${people.student.name}`) })
          .click()
        const d = page.getByRole('dialog')
        await beat(page, 1500)
        await d.getByLabel(/Score/).fill('86')
        await d
          .getByLabel(/Feedback/)
          .pressSequentially('Clean, semantic structure. Next time add a skip link at the top.', {
            delay: FAST ? 0 : 12,
          })
        await beat(page)
        await d.getByRole('button', { name: 'Save grade' }).click()
        await d.waitFor({ state: 'detached' })
        await beat(page, 1800)
      })
    },
    { storage: leadState },
  )

  // ---------- 7. Student exam and certificate ----------
  let certNumber = ''
  await part(
    '07-student-exam-certificate',
    'Student: final exam and certificate',
    'Passing the exam issues a certificate anyone can verify',
    async (page) => {
      await step('Student sees the grade and feedback', async () => {
        await page.goto(`${BASE}/dashboard`)
        await beat(page, 1800)
        await page.goto(`${BASE}/dashboard/stack`)
        await page.getByRole('link', { name: /Project: an about-me page/ }).click()
        await expectText(page, /skip link/)
        await beat(page, 2000)
      })
      await step('Student takes and passes the final exam', async () => {
        await page.goto(`${BASE}/dashboard/exam`)
        await page.getByRole('button', { name: 'Start exam' }).click()
        await page.getByRole('timer').waitFor()
        await page.getByLabel('<main>').check()
        await beat(page, 600)
        await page.getByLabel('A link').check()
        await beat(page)
        await page.getByRole('button', { name: 'Submit exam' }).click()
        await page.getByRole('dialog').getByRole('button', { name: 'Submit' }).click()
        await expectText(page, 'You passed!')
        await beat(page, 2000)
      })
      await step('Student opens the certificate and downloads the PDF', async () => {
        await page.getByRole('link', { name: 'View my certificate' }).click()
        await page.waitForURL(/certificate/)
        await expectText(page, people.student.name)
        await beat(page, 2500)
        const [download] = await Promise.all([
          page.waitForEvent('download'),
          page.getByRole('button', { name: /Download PDF/ }).click(),
        ])
        mkdirSync('walkthrough', { recursive: true })
        await download.saveAs(resolve('walkthrough', 'sample-certificate.pdf'))
        certNumber = (
          await page
            .getByText(/RTS-\d{4}-[A-Z0-9]+/)
            .first()
            .textContent()
        ).match(/RTS-\d{4}-[A-Z0-9]+/)[0]
        await scrollThrough(page, 2)
      })
    },
    { storage: studentState },
  )

  // ---------- 8. Anyone verifies ----------
  await part(
    '08-verify-certificate',
    'Anyone: verify a certificate',
    'Employers scan the QR code or type the number',
    async (page) => {
      await step('A signed-out visitor verifies the certificate', async () => {
        await page.goto(`${BASE}/verify`)
        await beat(page, 800)
        await page
          .getByRole('textbox')
          .first()
          .pressSequentially(certNumber, { delay: FAST ? 0 : 40 })
        await page.keyboard.press('Enter')
        await expectText(page, people.student.name)
        await beat(page, 2500)
      })
    },
  )

  // ---------- 9. Admin oversight ----------
  await part(
    '09-admin-oversight',
    'Admin: oversight',
    'People, certificates, revoking and reissuing, and the audit log',
    async (page) => {
      await step('Admin signs in and reviews users', async () => {
        await signIn(page, people.admin)
        await page.waitForURL(/\/admin/)
        await beat(page, 1500)
        await nav(page, 'Users')
        await expectText(page, people.student.name)
        await beat(page, 1500)
      })
      await step('Admin revokes the certificate and verification shows it revoked', async () => {
        await nav(page, 'Certificates')
        await page.getByRole('button', { name: `Revoke ${certNumber}` }).click()
        const d = page.getByRole('dialog')
        await d.getByLabel(/Reason/).fill('Demonstration of revoking.')
        await d.getByRole('button', { name: /Revoke/ }).click()
        await d.waitFor({ state: 'detached' })
        await beat(page, 1200)
        await page.goto(`${BASE}/verify/${certNumber}`)
        await expectText(page, /revoked/i)
        await beat(page, 2000)
      })
      await step('Admin reissues the certificate', async () => {
        await page.goto(`${BASE}/admin/certificates`)
        await page.getByRole('button', { name: `Reissue ${certNumber}` }).click()
        await page.getByRole('dialog').getByRole('button', { name: 'Reissue' }).click()
        await page.getByRole('dialog').waitFor({ state: 'detached' })
        await beat(page, 1500)
      })
      await step('Admin reads the audit log', async () => {
        await page.getByRole('link', { name: /Audit/ }).click()
        await expectText(page, /revoked|reissued/i)
        await beat(page, 2200)
      })
    },
  )

  // ---------- 11. Every screen, every role (test only) ----------
  const sweep = async (page, label, paths) => {
    for (const path of paths) {
      await step(`${label} ${path} loads without an error`, async () => {
        await page.goto(`${BASE}${path}`)
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(400)
        const bad = await page
          .getByText(/Something went wrong|We hit an unexpected problem|Please try again\./)
          .first()
          .isVisible()
          .catch(() => false)
        if (bad) throw new Error(`error shown on ${path}`)
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        )
        if (overflow) throw new Error(`sideways scroll on ${path}`)
      })
    }
  }
  const studentPaths = [
    '/dashboard',
    '/dashboard/stack',
    '/dashboard/progress',
    '/dashboard/exam',
    '/dashboard/certificate',
    '/dashboard/profile',
  ]
  const leadPaths = [
    '/lead',
    '/lead/applications',
    '/lead/reviews',
    '/lead/students',
    '/lead/exam',
    '/lead/content',
    '/lead/profile',
  ]
  const adminPaths = [
    '/admin',
    '/admin/applications',
    '/admin/stacks',
    '/admin/invitations',
    '/admin/signatories',
    '/admin/certificates',
    '/admin/content',
    '/admin/exam',
    '/admin/students',
    '/admin/reviews',
    '/admin/audit',
    '/admin/users',
    '/admin/profile',
  ]
  for (const [label, storage, paths] of [
    ['student', studentState, studentPaths],
    ['lead', leadState, leadPaths],
  ]) {
    for (const vp of [
      { width: 1280, height: 800 },
      { width: 375, height: 800 },
    ]) {
      const ctx = await browser.newContext({ viewport: vp, storageState: storage })
      const page = await ctx.newPage()
      currentPage = page
      await sweep(page, `${label} ${vp.width}px`, paths)
      await ctx.close()
    }
  }
  for (const vp of [
    { width: 1280, height: 800 },
    { width: 375, height: 800 },
  ]) {
    const ctx = await browser.newContext({ viewport: vp })
    const page = await ctx.newPage()
    currentPage = page
    await signIn(page, people.admin)
    await page.waitForURL(/\/admin/)
    await sweep(page, `admin ${vp.width}px`, adminPaths)
    await ctx.close()
  }

  // ---------- 10. Safety checks (not recorded as a showcase) ----------
  await part(
    '10-safety-checks',
    'Safety checks',
    'People only see what their role allows',
    async (page) => {
      await step('A student is kept out of the admin and lead areas', async () => {
        await page.goto(`${BASE}/admin`)
        await page.waitForURL((u) => !/\/admin/.test(u.pathname))
        await page.goto(`${BASE}/lead`)
        await page.waitForURL((u) => !/\/lead/.test(u.pathname))
        await beat(page, 800)
      })
      await step('A student cannot read other people through the API', async () => {
        const probe = await page.evaluate(
          async ({ SUPA, ANON }) => {
            const key = Object.keys(localStorage).find((k) => k.includes('auth-token'))
            const token = JSON.parse(localStorage.getItem(key)).access_token
            const get = async (path) => {
              const r = await fetch(`${SUPA}/rest/v1/${path}`, {
                headers: { Authorization: `Bearer ${token}`, apikey: ANON },
              })
              return r.ok ? r.json() : []
            }
            return {
              profiles: (await get('profiles?select=email')).map((p) => p.email),
              answerKeys: (await get('exam_answer_keys?select=question_id')).length,
              applications: (await get('stack_applications?select=email')).map((a) => a.email),
            }
          },
          { SUPA, ANON: process.env.LOCAL_ANON_KEY },
        )
        const others = [...probe.profiles, ...probe.applications].filter(
          (e) => e !== people.student.email,
        )
        if (others.length) throw new Error(`student could read: ${others.join(', ')}`)
        if (probe.answerKeys) throw new Error('student could read exam answers')
      })
      await step('Certificate "Email me a link" reports its result clearly', async () => {
        await page.goto(`${BASE}/dashboard/certificate`)
        await page.getByRole('button', { name: /Email me a link/ }).click()
        const toast = page.locator('[data-sonner-toast]').first()
        await toast.waitFor({ timeout: 45000 })
        console.log(`      certificate email toast: ${(await toast.textContent())?.trim()}`)
      })
      await step('Forgot-password sends a reset link that works', async () => {
        await signOut(page)
        await clearMail()
        await page.goto(`${BASE}/forgot-password`)
        await page.getByLabel('Email').fill(people.student.email)
        await page.getByRole('button', { name: /Send|reset/i }).click()
        await expectText(page, 'Check your email')
        const link = await latestMailLink(people.student.email, 'recovery')
        await page.goto(link)
        await page.waitForURL(/reset-password/)
        const setPassword = async (pw) => {
          await page.getByLabel('New password', { exact: true }).fill(pw)
          await page.getByLabel('Confirm new password').fill(pw)
          await page.getByRole('button', { name: 'Save password' }).click()
        }
        await setPassword(PW)
        await expectText(page, 'That is your current password')
        await setPassword(`${PW}-new`)
        await page.waitForURL(/dashboard/)
        await signOut(page)
        await signIn(page, people.student, `${PW}-new`)
        await page.waitForURL(/dashboard/)
      })
    },
    { storage: studentState },
  )
} catch {
  // The failing step is already reported; fall through to the summary.
} finally {
  await browser.close()
  const fails = results.filter((r) => r[0] === 'FAIL')
  const warns = results.filter((r) => r[0] === 'WARN')
  console.log(
    `\n${results.length - fails.length - warns.length} passed, ${warns.length} warnings, ${fails.length} failed`,
  )
  for (const w of warns) console.log(`WARN  ${w[1]}  ${w[2]}`)
  process.exitCode = fails.length ? 1 : 0
}
