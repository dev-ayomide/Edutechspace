# End-to-end test and walkthrough videos

`scripts/walkthrough/record.mjs` plays every role through the whole journey on a **local** copy of the backend
(never the live project), checks each step, and records one video per part:

1. Admin sets up: stacks, signatory signatures, invites a stack lead
2. Lead accepts the invite and builds the course: modules, video and written lessons, a quiz, a project, the final exam
3. A visitor browses the site, opens the course page and applies
4. Lead approves the application (the student gets an invitation email)
5. Student sets a password, learns, passes the quiz, submits the project
6. Lead grades the project with feedback
7. Student sees the feedback, passes the exam, opens and downloads the certificate
8. A signed-out visitor verifies the certificate
9. Admin reviews users, revokes and reissues the certificate, reads the audit log

It then opens every screen for every role at desktop and phone width, and runs safety checks (students kept out of
admin and lead areas, students cannot read other people or exam answers, the password reset flow).
Everyone in it is made up; emails are caught locally by Mailpit and never sent.

## Run it

Needs Docker Desktop running and the Supabase CLI (`brew install supabase/tap/supabase`).

```bash
supabase start
supabase functions serve --env-file <file with SITE_URL=http://localhost:5175, RESEND_API_KEY=anything, EMAIL_FROM=...>
```

Start the app against the local backend (in Claude Code: the `dev-local-backend` preview), or:

```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321 VITE_SUPABASE_ANON_KEY=<anon key from `supabase status`> npm run dev -- --port 5175
```

Then:

```bash
LOCAL_SERVICE_ROLE_KEY=<service_role key from `supabase status`> LOCAL_ANON_KEY=<anon key> node scripts/walkthrough/record.mjs
./scripts/walkthrough/encode.sh
```

`FAST=1` skips the pauses (a quick test run). `PACE=1.6` slows the videos down.
Each run clears the previous run's test data in the **local** database, so it always starts clean.

Output (not committed): `walkthrough/runtech-space-walkthrough.mp4`, `walkthrough/parts/*.mp4`,
`walkthrough/sample-certificate.pdf`, and `walkthrough/test-run.log`.
Locally the certificate email shows "could not be sent" because there is no real Resend key; that is expected.

`supabase stop` shuts the local backend down when you are done.
