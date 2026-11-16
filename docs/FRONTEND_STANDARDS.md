# Frontend Standards

Status: Proposed, to be adopted with PRD v3 · Applies to the rebuilt Edutechspace front end (clean scaffold, no legacy code ported).

The goal is one consistent way of doing everything, so any contributor can open any screen and know where things are and how they behave.

## 1. Stack

| Concern | Standard |
|---|---|
| Language | **TypeScript**, `strict: true`. No `any` without a comment explaining why |
| Framework | React 19 + Vite |
| Routing | React Router (data-router API), routes grouped by role: public, `/dashboard` (student), `/lead`, `/admin` |
| Styling | **Tailwind CSS v4** (single version, CSS-first config with design tokens as CSS variables) |
| Components | Radix UI primitives with our own styled wrappers (shadcn/ui pattern), living in `src/components/ui` |
| Icons | `lucide-react` only (remove heroicons, react-icons and duplicates) |
| Server state | **TanStack Query** for all Supabase reads and writes. No fetching inside `useEffect` |
| Client state | Local `useState`/`useReducer` first, then context for auth only. No global store unless a need is proven |
| Forms | `react-hook-form` + **zod** schemas, shared with API input types |
| Backend access | `@supabase/supabase-js` behind a typed data layer (generated DB types via `supabase gen types`) |
| Motion | `framer-motion` sparingly (page and modal transitions), respect `prefers-reduced-motion` |
| Dates, utilities | `date-fns`; `clsx` + `tailwind-merge` via a `cn()` helper |
| Notifications | One toast library (Sonner), one `toast` wrapper |
| Testing | **Vitest** + React Testing Library (unit and component), **Playwright** (end to end for critical flows), plus database tests for RLS |
| Quality | ESLint (typescript-eslint, react-hooks, jsx-a11y), Prettier, `tsc --noEmit` in CI |
| Package manager | npm with a committed lockfile; Node version pinned in `.nvmrc` |

Dependencies we will not carry over: `toastify`, `heroicons`, `react-icons`, `jwt-decode`, `js-cookie`, `axios` (Supabase client covers data access), the Tailwind v3 and v4 mix.

## 2. Project structure

Feature-based, with shared code kept separate:

```
src/
  app/                 # providers, router, app shells (PublicShell, StudentShell, LeadShell, AdminShell)
  components/ui/       # design-system primitives (Button, Input, Dialog, Table, Tabs, Progress, Badge...)
  components/          # shared composed components (PageHeader, EmptyState, StatCard, DataTable...)
  features/
    auth/              # login, invite acceptance, session, role guards
    admissions/        # join-a-stack form, application review
    stacks/            # stack catalogue and stack pages
    learning/          # student path, lesson player, progress tracker
    assignments/       # submit, auto-grade results, review queue
    exams/             # exam taker, exam builder, results
    certificates/      # certificate view, PDF, verify page
    lead/              # lead dashboard, content manager, roster
    admin/             # users, leads, invitations, signatories, audit log
  lib/                 # supabase client, query client, cn(), formatters
  styles/              # tokens.css, global styles
  types/               # generated DB types, shared domain types
  routes/              # route definitions per role
```

Rules:
- A feature folder contains its own `components/`, `hooks/`, `api/` (query and mutation functions), `schemas/` and tests.
- Features import from `components/ui`, `lib` and `types`, never from another feature's internals. Cross-feature needs go through that feature's `index.ts`.
- One component per file, PascalCase file names for components, camelCase for hooks (`useStackProgress.ts`), kebab-case for everything else.
- No per-stack pages. Every stack renders from data with the same components.

## 3. Design system

- Tokens in `styles/tokens.css` as CSS variables, mapped into Tailwind v4 theme: colour, type scale, spacing, radius, shadow, z-index, motion.
- **Brand**: blue and white. Primary navy/blue scale (`blue-950`, `blue-900 #1e3a8a`, `blue-800 #1e40af`, `blue-600`), white and light blue tints for surfaces, cyan accent `#08f1ff` for highlights only (never as text on white). Font: Inter. Dark mode derived from the same tokens.
- Use semantic token names in components (`bg-surface`, `text-muted`, `border-default`, `bg-primary`), not raw colour classes. No hardcoded hex values in components.
- Every primitive is documented in a lightweight component gallery route (dev only) showing all variants and states.
- Required states for every data-driven view: **loading (skeleton), empty, error (with retry), success**. A screen is not done until all four exist.

## 4. Accessibility and responsiveness

- WCAG 2.1 AA: contrast checked for every token pair, visible focus rings, full keyboard operation, labelled form controls, error text tied to inputs with `aria-describedby`, `aria-live` for toasts.
- Dialogs and menus use Radix (focus trap and restore built in).
- Responsive from 360px wide. Mobile-first classes. Tables collapse to cards or scroll within their container on small screens.
- Respect `prefers-reduced-motion` and `prefers-color-scheme`.
- Touch targets at least 44px.
- Images have `alt`; decorative images use empty `alt`.

## 5. Data and security rules for the front end

- All data goes through the typed API layer in `features/*/api`. Components never call `supabase` directly.
- Query keys are defined in one place per feature (`keys.ts`).
- Mutations invalidate or update the relevant keys. Optimistic updates only for low-risk actions (e.g. marking a lesson complete).
- **The client is not trusted.** Role guards in routes are UX only; real enforcement is RLS and server functions. Never ship answer keys, service-role keys or admin logic to the browser.
- Exam grading, certificate issuing, role changes and invitations happen only through RPCs and Edge Functions.
- Environment variables are limited to the public Supabase URL and anon key. Secrets live in Supabase and Vercel settings, never in the repo (`.env` stays git-ignored; `.env.example` is committed).
- File uploads validate type and size on the client and again in storage policies.

## 6. Code conventions

- Functional components and hooks only. Props typed with an `interface`/`type` next to the component.
- Prefer composition over configuration flags. Keep components under about 200 lines; split when larger.
- No business logic in JSX; extract to hooks or pure functions that are unit tested (progress calculation display, unlock rules, formatters).
- Derive state instead of duplicating it. Server-computed values (progress percentage, eligibility) are displayed, never recomputed on the client.
- Errors: use a typed error helper that maps Supabase errors to user-friendly messages; log unexpected errors to the console in development and to an error reporter in production (Sentry or equivalent, to be chosen).
- No `console.log` in committed code (lint rule). No commented-out code.
- Absolute imports via `@/` alias.
- Copy and labels live in the components for now; keep strings plain and consistent (British or American English, to be chosen once).

## 7. Testing expectations

- **Unit**: pure logic (unlock rules, formatters, schema validation).
- **Component**: forms, role-based navigation, empty/error states, submission flows.
- **E2E (Playwright)**, one per critical journey: apply to join a stack, admin approves, student completes a lesson and submits an assignment, lead grades it, student takes the exam, certificate is issued and verified publicly, lead invitation accepted.
- **Database**: automated RLS tests proving a student cannot read others' data, a lead cannot touch another stack, and no one can self-assign a role.
- CI runs lint, type-check, unit/component tests and build on every pull request. E2E runs on pull requests against a Supabase test project or local Supabase.

## 8. Workflow

- Trunk-based with short-lived branches and pull requests; conventional commit messages (`feat:`, `fix:`, `chore:`).
- Database changes only via migration files in `supabase/migrations`, reviewed like code.
- Each phase from the PRD ships behind complete states (no half-built screens on main).
- Deploy: Vercel preview per PR, production from main (to be confirmed in the PRD open questions).

## 9. Definition of done for a screen

1. Matches the Figma design and uses only design-system components and tokens.
2. Loading, empty, error and success states implemented.
3. Keyboard and screen-reader pass, AA contrast, works at 360px.
4. Typed end to end, no `any`, lint and type-check clean.
5. Tests per section 7 where applicable.
6. No direct Supabase calls in components; access control verified at the database level.
