# RUNTech Space (repo: Edutechspace)

Stack-led tech learning platform for Redeemer's University. Students apply to one of 8 "stacks" (Frontend, Backend,
Data Analysis, Cloud/DevOps, UI/UX, Product Management, Machine Learning, Game Development). A stack lead admits them,
they work through modules (lessons, then a quiz or a graded project), pass a final exam, and receive a certificate with
a public verification page. Roles: student, stack_lead, admin. Spec: `docs/PRD.md`.

**Live:** https://learn.runtechspace.com.ng (Vercel, deploys from `master`). Owner: GitHub `dev-ayomide`.

## Stack and commands

React 19 + TypeScript + Vite, Tailwind v4 (tokens in `src/styles/index.css`), TanStack Query, React Router 7 (lazy routes in
`src/routes/router.tsx`), Supabase (Postgres + RLS + Edge Functions), Vitest + Testing Library + axe, Playwright.

```bash
npm run dev            # Vite; this project uses port 5175 (5173 belongs to another project on this Mac)
npm test               # 360+ unit tests (Vitest, jsdom)
npm run typecheck && npm run lint && npm run build
npm run db:test        # every migration + RLS tests on a throwaway local Postgres (no Docker needed)
npm run setup:sql      # regenerate supabase/setup/all-migrations.sql (a test checks it is current)
npm run setup:verify   # 13 live checks against the Supabase project in .env (all should PASS)
```

End-to-end test + walkthrough videos against a LOCAL Supabase: `docs/WALKTHROUGH.md` (`scripts/walkthrough/record.mjs`).

## Layout

- `src/features/<area>/`: pages, `api.ts` (Supabase calls), tests. Areas: auth, admissions, learning, assignments, quiz,
  exams, certificates, content, reviews, roster, lead, admin, stacks, home, profile, design (dev-only pages).
- `src/components/` shared UI (`ui/` primitives). `src/lib/` helpers (`errors.ts` friendly messages, `embed.ts`).
- `supabase/migrations/` (apply in order), `supabase/functions/` (invite-user, review-application, send-certificate-email),
  `supabase/tests/*.test.sql`, `supabase/config.toml` (LOCAL stack settings only).
- Dev-only routes (excluded from production builds): `/_preview/*` (student screens with sample data), `/_design`, `/_lab`.

## Live setup (done, 2026-11-17)

- Supabase project ref `cedrstahndkuzsxfedgf`: all migrations through `20261116000001` applied; 3 Edge Functions deployed;
  secrets SITE_URL / RESEND_API_KEY / EMAIL_FROM set; Site URL + redirect URLs + custom SMTP (Resend) configured.
  The Supabase CLI in this folder is **linked to the live project**.
- Email: Resend, sending domain `send.runtechspace.com.ng` (verified). DNS at Whogohost. `VITE_SITE_URL` set on Vercel.
- `docs/GO_LIVE_GUIDE.md`, `docs/CONNECT_SUBDOMAIN.md`, `docs/LAUNCH_CHECKLIST.md` describe the setup.

## Rules and gotchas

- **Never** run `supabase config push` or `supabase db reset --linked`: config.toml holds localhost settings and a reset
  would wipe live data. Plain `supabase db reset` / `supabase start` only touch the local Docker stack.
- New SQL: add a migration, update `supabase/tests/hardening.test.sql` allowlists for any new function callable by
  anon/authenticated, run `npm run db:test` and `npm run setup:sql`. Security-definer functions pin `search_path`.
- PostgREST returns a one-to-one embed (unique FK, e.g. `modules -> assignments`) as an object or null, not an array:
  normalise with `asList` (`src/lib/embed.ts`). Tables with two FKs to `profiles` need the FK named in the embed.
  Unit tests mock data and will not catch these: run the walkthrough after changing queries.
- Never invent statistics or testimonials on the site. Keep WCAG AA (axe tests). Respect reduced motion.
- Commit only when asked; branch from `master`; PR into `master`. Auto-merge is disabled on the repo.

## Design direction (current work)

History: three looks were rejected as generic/"AI-ish" (Direction B, Direction C, a Geist + serif-accent version).
Avoid: serif-italic single accent words, glowing gradient blobs, word-by-word headline reveals, bouncy stamps, floating
badges on stock photos, green-tick lists, generic text-left/photo-right heroes.

**Chosen (2026-11-17): "Paper"**, prototype at `prototypes/d/paper.html` (serve with `python3 -m http.server 5180
--directory prototypes`, open `/d/paper.html`). Inspired by the user's references Craft Docs and Awesomic:

- Cool paper canvas `#f3f6fc`, ink `#0b1230`, navy `#1e3a8a` pill buttons, cyan `#08f1ff` accents, pastel torn-paper shapes
  (ice / periwinkle / sky; pale gold only behind the certificate), deep soft shadows, large radii.
- Type: **Newsreader** (serif) for headlines, **DM Sans** for body/UI. The user dislikes Inter.
- Motion: Lenis smooth scroll; nav condenses, hides on scroll down, shows on scroll up, sliding pill on the active section;
  headlines reveal line by line; read-along statement; pinned "platform" chapters; photo stack cards (cursor spotlight,
  hover reveal, View Transition filters); and a **three.js 3D laptop** scroll scene (`prototypes/d/laptop3d.js`) whose lid
  opens, screen plays the student journey, then the camera dives into the certificate. Progress is smoothed per frame.
- Photos: Unsplash (free licence), hotlinked in the prototype; download and optimise them into the app before launch
  (ask the user first). Real photos of their students and leads are still wanted.

**In progress (branch `feat/paper-design`, committed locally, not pushed):** Paper rolled into the app: tokens, Newsreader + DM Sans, public shell (real logo, condensing nav, Lenis), home page (all sections, three.js MacBook in `src/features/home/laptop-3d.ts`), photo stack cards, Stacks page. Still to do: retake product screenshots from the new look (`src/assets/screens`), polish lesson/quiz/exam screens, run the walkthrough e2e, phone + Lighthouse checks, PR. Previously: rolling Paper into the React app (public site first, then student/lead/admin screens, then retake the
product screenshots). Branch `feat/feel-lab` holds UNCOMMITTED src changes from the rejected Geist version plus a dev
`/_lab` page and `src/lib/motion.ts`; start the rollout from `master` and reuse only what fits.
Other open items: real signatory names/signatures (demo placeholders live), privacy notice + terms, Supabase Pro plan and
backups, delete the duplicate Vercel project (`edutechspace-g6l8`), error monitoring, lead email on new applications.
