# RUNTech Space (Edutechspace)

A structured, stack-led learning platform. Students join one stack, learn module by module, complete assignments, pass a final exam and receive a signed, verifiable digital certificate. Stack leads publish and grade; admins run the platform.

- Product requirements: [docs/PRD.md](docs/PRD.md)
- Frontend standards: [docs/FRONTEND_STANDARDS.md](docs/FRONTEND_STANDARDS.md)

## Stack

React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Query, React Router, react-hook-form + zod, Supabase (Postgres, Auth, Storage, Edge Functions).

## Getting started

```bash
nvm use          # Node 24 (see .nvmrc)
npm install
cp .env.example .env   # add your Supabase URL and anon key
npm run dev
```

## Scripts

| Command             | What it does                                                      |
| ------------------- | ----------------------------------------------------------------- |
| `npm run dev`       | Start the dev server on http://localhost:5173                     |
| `npm run build`     | Type-check and build for production                               |
| `npm run typecheck` | TypeScript only                                                   |
| `npm run lint`      | ESLint (includes accessibility rules)                             |
| `npm test`          | Unit and component tests (includes colour-contrast checks)        |
| `npm run db:test`   | Applies the migrations to a throwaway Postgres and runs RLS tests |
| `npm run test:e2e`  | Playwright end-to-end tests                                       |

## Database

Schema changes live only in `supabase/migrations` and are applied in order. Row Level Security is the real access control; the UI route guards are convenience. `npm run db:test` needs a local PostgreSQL install (no Docker or Supabase CLI required) and proves, among other things, that students cannot change their own role, leads can only see their own stack, and no one can self-enrol.

**Supabase project setup:** disable public sign-ups. Accounts are created only through invitations (admin-invited leads, lead-approved students). Apply the migrations to a fresh project; do not run them against a database that still holds the old Edutechspace tables.

## Project layout

See section 2 of the frontend standards. In short: `src/app` (shells, providers), `src/components/ui` (design system), `src/features/*` (one folder per feature), `src/routes`, `src/lib`, `supabase/migrations`.
