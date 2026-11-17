# Experience plan: from "clean" to "who built this?"

The site is live and works. This plan is about how it **feels**. The bar: a visitor, a stack lead or an exec opens the
link and assumes a well-funded product team built it.

## The direction, in one line
**Udemy's clarity, Stripe/Apple's storytelling on the public site, Brilliant/Duolingo's sense of reward inside the
learning.** Calm where people read and work; cinematic where people decide; joyful where people make progress.

| Where | Feel | Borrowed from |
|---|---|---|
| Public site (home, stacks, course pages, verify) | Confident, editorial, scroll-driven; the product itself is the hero | Stripe, Apple |
| Learning (dashboard, lesson, quiz, exam, certificate) | Focused and calm, with real celebration at the moments that matter | Brilliant, Duolingo |
| Lead and admin tools | Fast, precise, quiet; motion only to explain change | Linear |

## Rules that keep it "excellent" and not "AI-ish"
- **Motion explains, never decorates.** Every animation answers: what changed, where did it go, what can I do now.
- **One motion language**: same easing curves and durations everywhere (tokens, like colours).
- **Fast on a mid-range Android on a slow network.** Most students are on phones and data plans. Budgets: first view
  under 2.5 s on 4G, no layout shift, 60 fps scrolling, the motion library loaded lazily and kept small.
- **Respect "reduce motion".** Every effect has a still version; nothing important depends on animation.
- **No invented numbers or testimonials.** Counts come from the database; quotes only from real people.
- **Accessibility stays AA** (contrast tests, focus rings, keyboard, screen readers) through every change.
- **Prototype first, then roll out.** Nothing visual ships before you have seen it running.

## 1. Foundations (the "feel" system)
**Typography: a distinctive pairing.** A characterful display face for headings and big numbers, and a highly readable
text face for lessons and forms, both self-hosted (no Google Fonts calls, works with the security policy).
Three pairings to compare side by side in the prototype:
- **A. Bricolage Grotesque + Source Sans 3**: expressive, warm, a little playful; text stays as it is today.
- **B. Geist + Instrument Serif (italic accents)**: Stripe/Apple editorial; sleek with elegant serif moments.
- **C. Schibsted Grotesk + Hanken Grotesk**: news-grade confidence, very crisp numbers.

A proper type scale (fluid sizes, tight display tracking, tabular numbers for scores and progress), plus line lengths
tuned for reading lessons.

**Motion tokens.** Durations (instant, quick, standard, slow), three easings (enter, exit, spring), stagger rules.
Built with the Motion library (lazy-loaded, about 15 KB) for shared-element and layout animation, the browser's View
Transitions for page changes, and plain CSS for small interactions.

**Detail layer.** Skeletons shaped like the real content, instant (optimistic) updates on clicks, redesigned toasts,
crafted empty states using each stack's motif, a better 404, polished dark mode, consistent icon weight.

## 2. Public site (first focus)
- **Hero: the product is the hero.** Instead of a stock photo, a live, animated miniature of the real app: a lesson
  completes, a quiz answer lands, progress fills, a certificate is issued and "verified". Real photos of students and
  leads sit beside it once we have them.
- **"How a stack works" as a scroll story.** Apply, learn, get feedback, get certified: pinned while you scroll, each
  step animating the real UI, Apple-style.
- **Stacks catalogue.** Covers whose motifs come alive on hover; smooth filtering between categories; the card expands
  into the course page (shared-element transition).
- **Course page.** Curriculum that unfolds with rhythm, a sticky apply panel that responds as you scroll, real counts
  from the published content.
- **Certificate section and /verify.** A tactile certificate (light tilt, foil sheen on the seal) and a satisfying
  "this certificate is valid" verification moment.
- **Apply form.** Step-by-step feel, inline validation that is kind, a success moment worth screenshotting.

## 3. Learning moments (next)
- **Lesson complete:** a crisp check animation, the sidebar item ticks, progress moves; next lesson slides in.
- **Quiz:** answers lock in with a tap, correct gets a short celebratory pulse, wrong gets a gentle nudge and the
  explanation; the score counts up.
- **Module unlocked:** the journey track animates the lock opening and the next module lighting up.
- **Exam:** a calm, distraction-free mode with a quiet timer; results revealed with weight.
- **Certificate earned:** the big one. A full-screen reveal: the certificate assembles, the seal stamps, confetti in
  brand colours, then "Share" and "Download". This is the moment people post.
- **Momentum (later, needs a small data change):** learning streaks and weekly goals, Duolingo-style but restrained.

## 4. Lead and admin polish (after)
Same type and tokens; faster-feeling tables, smooth dialogs, instant feedback on grading and publishing.

## 5. Proof it is excellent
- Re-run the end-to-end walkthrough (`docs/WALKTHROUGH.md`) and re-record the videos with the new design.
- Lighthouse on mobile: Performance 90+, Accessibility 100, no layout shift.
- Test on a throttled mid-range Android profile, with "reduce motion" on, and in dark mode.

## What would lift it the most from your side
- **Real photos** (8 to 12, 2000 px or larger): students learning, leads teaching, the space. Nothing beats real people.
- **Logo as SVG** (vector), so the brand mark stays sharp and can animate.
- Optional: a 20 to 40 second clip of a real class for the home page.

## How we will work
1. **Feel lab** (dev-only page): the three type pairings and the motion tokens on real components. You pick one.
2. **Public site prototype** with the chosen pairing, running in the browser. You review, we adjust.
3. Roll out the public site behind a branch and PR, re-test end to end, ship.
4. Repeat for learning moments, then lead and admin.
