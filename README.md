# RUNTech Space (Edutechspace)

A structured, stack-led learning platform. Students join one stack, learn module by module, complete assignments, pass a final exam and receive a signed, verifiable digital certificate. Stack leads publish and grade; admins run the platform.

- Product requirements: [docs/PRD.md](docs/PRD.md)
- Frontend standards: [docs/FRONTEND_STANDARDS.md](docs/FRONTEND_STANDARDS.md)
- Design direction: [docs/DESIGN_DIRECTION.md](docs/DESIGN_DIRECTION.md)
- **Going live?** Follow [docs/GO_LIVE_GUIDE.md](docs/GO_LIVE_GUIDE.md) (Supabase, Resend, hosting), then [docs/LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md)

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

| Command                | What it does                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------- |
| `npm run dev`          | Start the dev server on http://localhost:5173                                       |
| `npm run build`        | Type-check and build for production                                                 |
| `npm run typecheck`    | TypeScript only                                                                     |
| `npm run lint`         | ESLint (includes accessibility rules)                                               |
| `npm test`             | Unit and component tests (includes colour-contrast checks)                          |
| `npm run db:test`      | Applies the migrations to a throwaway Postgres and runs RLS tests                   |
| `npm run setup:sql`    | Regenerates the one-paste database setup file (`supabase/setup/all-migrations.sql`) |
| `npm run setup:verify` | Smoke-tests a live Supabase project using only the public anon key                  |
| `npm run images`       | Builds responsive AVIF/WebP/JPEG photos from `src/assets/photos/originals`          |
| `npm run logos`        | Rebuilds the logo files from the artwork in `design/logos`                          |
| `npm run test:e2e`     | Playwright end-to-end tests                                                         |

## Database

Schema changes live only in `supabase/migrations` and are applied in order. Row Level Security is the real access control; the UI route guards are convenience. `npm run db:test` needs a local PostgreSQL install (no Docker or Supabase CLI required) and proves, among other things, that students cannot change their own role, leads can only see their own stack, and no one can self-enrol.

**Supabase project setup:** disable public sign-ups. Accounts are created only through invitations (admin-invited leads, lead-approved students). Apply the migrations to a fresh project; do not run them against a database that still holds the old Edutechspace tables.

## Inviting stack leads (Edge Function)

Admins invite leads from **Admin > Lead invitations**. The page calls the `invite-user` Edge Function, which asks the database to create the invitation (as the signed-in admin, so the "admins only" rule is enforced by Postgres) and then sends the Supabase Auth invite email.

```bash
supabase functions deploy invite-user
supabase secrets set SITE_URL=https://your-app-domain
```

Also add `https://your-app-domain/accept-invite` (and `http://localhost:5173/accept-invite` for development) to **Authentication > URL Configuration > Redirect URLs**. Invited people land on that page to choose their name and password. The function has not yet been exercised against a live project.

## Admissions (Edge Function)

Students apply on the public **Join a stack** page. The stack's leads (and admins) review applications in the app. Approving one calls the `review-application` Edge Function: it records the decision as the signed-in reviewer (Postgres enforces who may review) and, for a new person, sends the invitation email.

```bash
supabase functions deploy review-application
```

It uses the same `SITE_URL` secret and `/accept-invite` redirect URL as `invite-user`. If the email cannot be sent, the application stays approved and the reviewer is told to follow up. Rejecting sends the applicant a polite email (with the reviewer's reason, if given) when `RESEND_API_KEY` and `EMAIL_FROM` are set.

## Learning rules (enforced in the database)

- Modules unlock in order: every earlier published module must be complete (required lessons done and its assignment passed). Locked lessons are unreadable, not just hidden.
- Quizzes are graded in Postgres; the answer keys live in a table students cannot read. Projects are graded by the stack's leads, with resubmission requests.
- Progress is computed by the database: lessons 40%, assignments 30%, final exam 30% (the exam arrives in Phase 3, so the maximum is 70% until then).

## Final exam and certificates

- **Exam:** each stack has one exam, built by its leads. Students can open it only after every module is complete. Questions are readable only while an attempt is running, grading happens in Postgres, and there is a time limit (with a 2 minute grace), an attempt limit and a waiting period between attempts (defaults: 60% pass mark, 3 attempts, 24 hours).
- **Certificates** exist only because `submit_exam()` passed with every requirement met. They snapshot the student's name, the stack and the active signatories, cannot be edited (there are no direct write privileges), and can be revoked or reissued by an admin. Passing marks the stack membership as completed.
- **Verification:** `/verify/<number>` is public and shows only what is printed on the certificate (name, stack, date, valid or revoked).
- **PDF:** generated in the browser (jsPDF, loaded on demand) with a vector QR code that links to the verification page. The PDF font only covers Latin-1, so diacritics (e.g. Yoruba `ọ`, `ẹ`) are reduced to base letters in the PDF; the on-screen certificate and verification page show the exact name.
- **Signatories:** admins manage them under **Admin > Signatories** (President, Technical Lead, Staff Patron, and the VC when available). Signature images go to the public `signatures` bucket and are never deleted, because issued certificates keep pointing at them. If a certificate is issued before any signatory exists, add them and use **Reissue**.

```bash
supabase functions deploy send-certificate-email
supabase secrets set RESEND_API_KEY=... EMAIL_FROM="RUNTech Space <certificates@your-domain>"
```

The email carries a link to the certificate page and the verification link (not an attachment) and is sent once on issue, plus on request. Resend is assumed as the provider; it is isolated in that one function.

## Security notes

Supabase grants `EXECUTE` on new functions to signed-in users by default, so every migration that adds an internal helper must also revoke it from `authenticated` (see the hardening block at the end of `20261102000001_exam_and_certificates.sql`). The database tests assert that the audit writer, progress probes and the certificate issuer are not callable through the API.

## Lesson files

Uploaded videos and PDFs go to the private `lesson-media` storage bucket (created by the migrations, 100 MB limit, PDF/MP4/WebM). Paths start with the stack id, which is what the storage policies check, so a lead can only touch their own stack's files.

## Project layout

See section 2 of the frontend standards. In short: `src/app` (shells, providers), `src/components/ui` (design system), `src/features/*` (one folder per feature), `src/routes`, `src/lib`, `supabase/migrations`.
