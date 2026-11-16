# Design Direction: Bold & Energetic

Status: Proposal for approval · Supersedes the visual layer of the Phase 0-3 UI (behaviour, data and tests stay)

## 1. Why the current UI fails

The build is correct and accessible but it has no point of view:

- A default stack: white bordered cards, one grey-blue, Inter everywhere, Lucide icons everywhere, centred symmetric layouts. Any SaaS template looks like this.
- No people. The old site had real faces and the cyan "Grow." underline. The rebuild dropped both.
- Flat hierarchy. Every screen is a title followed by equal-weight boxes. Nothing is big, bold or celebratory, even the moments that matter: finishing a module, passing the exam, receiving a certificate.
- The brand (navy and cyan) appears only as small buttons.

## 2. The idea: momentum

RUNTech Space is about getting somewhere. **Progress is the hero.** Everything is built around forward motion: big numbers, a visible path, unlocks that feel earned, a certificate moment that feels like an arrival. The tagline is already the structure: **Learn. Grow. Build.** Three verbs, three beats, used as a recurring motif (landing sections, dashboard states, certificate).

Personality words: confident, energetic, direct, proud, human. Not: corporate, playful-cartoon, cold, minimal-for-its-own-sake.

## 3. Principles

1. **Big on purpose.** One dominant element per screen (a headline, a number, a photo). Everything else is quiet.
2. **Colour as structure.** Full-width navy and cyan blocks divide pages. Cards are for interactive items only.
3. **People first.** Real photographs carry the identity, treated consistently so they feel like one family.
4. **Show the journey.** The learning path is drawn as a path, not listed as rows. Progress is a large figure, not a thin bar.
5. **Earned moments.** Unlocking, passing and certification get distinct, tasteful motion and layout.
6. **Dense where it is work.** Lead and admin screens inherit the tokens but stay compact and calm. The bold treatment lives on public and student screens.

## 4. Visual system

### Colour (extends today's tokens, same semantic names)
- **Ink navy** (deepest, for text and dark blocks), **brand blue** `#1e3a8a`, **bright blue** for interactive states, white, and pale blue tints.
- **Electric cyan `#08f1ff`** becomes the signature: oversized underlines, progress fills, highlights on dark blocks, key buttons on navy. Never as text on white (contrast tests keep enforcing this).
- **One reserved warm highlight** (gold/amber) used only for achievement: certificate, "passed", completed module. *Proposal: confirm you are happy with a warm accent.*
- Dark mode derived from the same tokens. Every pair stays WCAG AA (the token contrast test remains the gate).

### Typography
- A **display face with character** for headlines, numbers and the certificate; a clean **UI face** for body and controls. Candidates to test side by side in the prototypes: *Bricolage Grotesque* or *Sora* (display) with *Inter* or *Instrument Sans* (UI). Open-source only (Google Fonts), self-hosted and preloaded.
- Oversized fluid scale: hero up to ~7rem on desktop, tight tracking, heavy weight. Big tabular figures for percentages and scores.

### Layout and shape
- Asymmetric grids, full-bleed colour bands, generous whitespace, section numbering (01 Learn, 02 Grow, 03 Build).
- Photos in confident shapes (large radius, one angled cut as a recurring brand shape) with a **duotone navy/cyan treatment** so mixed photos feel unified.
- Fewer borders, more colour fields and spacing. Cards remain for lessons, assignments and form panels.

### Motion
- Purposeful only: progress counts up, a module unlock animates open, the certificate reveals. Page-load staggers kept short. Everything respects `prefers-reduced-motion`.

### Icons and voice
- Lucide stays for function (buttons, nav). Key moments get custom marks and large type instead of icons-in-circles.
- Copy is direct and encouraging, specific to this platform. No filler.

## 5. Screens and what changes

**Public**
- *Landing:* full-bleed navy hero with a huge "Learn. Grow. Build." and cyan underline, a real photo in a shaped frame, live numbers, the 8 stacks as bold tiles with photos, "how it works" as a numbered journey, a strip of student outcomes, strong CTA band.
- *Join a stack:* split layout, photo plus a short friendly form with the chosen stack shown prominently.
- *Verify:* a "seal of authenticity" treatment, big and unambiguous.

**Student (the brand's showcase)**
- *Dashboard:* a hero panel with a giant progress figure and the next action; the journey ahead as a path.
- *My stack:* modules as a vertical journey map (locked, current, done) rather than stacked rows.
- *Lesson:* a focus layout with a calm reading column and a clear "complete" action.
- *Quiz and exam:* focused, one-question-at-a-time option with a visible timer and progress.
- *Certificate:* a celebratory reveal and a certificate that looks like an award, with the gold accent.

**Lead and admin:** same tokens, new navigation shell and typography, tighter tables and clearer empty states. Restyled after the student experience is approved.

## 6. Plan and checkpoints

| Step | What happens | You approve |
|---|---|---|
| **A. Direction prototypes** | Two variations of the bold direction as real browser pages you can click: *A, navy-dominant* and *B, white-dominant with navy and cyan blocks*. Each has the landing page and the student dashboard, with the type pairings compared. Photos are the old stock images as placeholders. | Pick a direction (or mix) |
| **B. Design system** | New tokens, fonts, shapes, motion and rebuilt components, with a dev-only component gallery. Contrast tests still gate every pair. | Look at the gallery |
| **C. Public site** | Landing, join, verify, sign-in, accept-invite. Responsive images (WebP/AVIF), performance budget. | Review |
| **D. Student experience** | Dashboard, journey map, lessons, quiz, exam, certificate (on-screen and PDF restyled to match). | Review |
| **E. Lead and admin** | Restyled shells and screens. | Review |
| **F. Polish** | Accessibility re-audit, performance, empty states and copy pass, remove leftovers. | Sign off |

Each step is its own commit(s); behaviour and the 264 tests stay green throughout (only visuals and structure change).

## 7. What I need from you

1. **Real photos** (the biggest lever): 8 to 12 genuine photos of your students, classes, leads teaching, events or the space. Landscape and portrait, at least 2000px wide, with permission to use. Until then I use the old stock images as placeholders (they are only 1000px wide, so they would look soft full-bleed).
2. **Logo as SVG** if you have it (today it is a 495px PNG, which blurs on large screens).
3. **Two or three sites whose look you like**, and one you dislike. Even rough opinions steer this more than anything I can guess.
4. **Warm accent:** yes or no to a gold/amber used only for achievement moments.
5. **Real numbers** for the landing page (students, stacks, certificates) or permission to hide them until they are real. I will not invent statistics.

## 8. Constraints that do not change

- WCAG AA contrast for every colour pair, keyboard and screen-reader support, 360px responsive, reduced-motion respect.
- Performance: fonts self-hosted and subsetted, photos responsive and modern-format, no layout shift, a main-bundle budget.
- No fabricated testimonials, statistics or logos.
