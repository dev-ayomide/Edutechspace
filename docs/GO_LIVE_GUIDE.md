# Go-live guide: Supabase, Resend, hosting

Follow top to bottom. Steps marked **YOU** need your accounts (account creation, passwords and API keys must be entered by you, never shared in chat). Everything else is prepared in this repo. Button labels in the dashboards change now and then; the names below are close enough to find.

Use **a fresh Supabase project** (the old Edutechspace project is left completely untouched; its tables would clash with the new schema).

---

## Part A: Supabase (about 20 minutes)

### A1. Create the project (YOU)
1. Go to https://supabase.com/dashboard and sign in (or sign up) with **techspace@run.edu.ng**.
2. Create an organization if asked (name: `RUNTech Space`), then **New project**:
   - Name: `runtech-space`
   - Database password: click **Generate a password**, save it in your password manager. You will rarely need it. Never paste it into chat.
   - Region: the closest to Nigerian users that is offered (London, Frankfurt or Cape Town).
   - Plan: the **Free** plan is fine for the rehearsal. For real students use **Pro** (about US$25 a month): Free projects are paused after a week without activity and have no daily backups.
3. Wait about 2 minutes for it to finish setting up.

### A2. Copy the two public values (YOU, then tell me)
**Project Settings > API**: copy the **Project URL** and the **anon public** key. These two are safe to paste in chat. Do **not** copy the `service_role` key anywhere.
Tell me both and I will put them in `.env` and run the live checks. (Or paste them into `.env` yourself: `VITE_SUPABASE_URL=...` and `VITE_SUPABASE_ANON_KEY=...`.)

### A3. Install the database (YOU, one paste)
1. In a terminal, put the setup file on your clipboard:
   ```bash
   cd /Users/devayomide/Edutechspace && pbcopy < supabase/setup/all-migrations.sql
   ```
2. In Supabase: **SQL Editor > New query**, paste (Cmd+V), click **Run**.
3. Expect **Success. No rows returned.** It runs in one transaction: if anything fails, nothing is applied, so you can fix and re-run. Run it **once**.
4. Check **Table Editor**: you should see about 20 tables and, in `stacks`, the 8 stacks.
5. **Already ran it before 15 Nov 2026?** Do not run the whole file again. Instead paste only `supabase/migrations/20261115000001_attempt_grants_and_profile_details.sql` and run it once (it adds extra attempts and copies applicant phone numbers to profiles). `npm run setup:verify` tells you whether it is applied.

### A4. Sign-in settings (YOU)
**Authentication**:
1. **Sign In / Providers > Email**: switch **off** "Allow new users to sign up" (accounts only come from invitations). Leave "Confirm email" on.
2. **URL Configuration**: Site URL = your final website address (use `http://localhost:5175` for the rehearsal, change it when the site is live). **Redirect URLs**, add each of: `http://localhost:5175/accept-invite`, `http://localhost:5175/reset-password`, and the same two paths on your live address (add these once you know it).
3. **Emails > Templates**: open **Invite user** and replace the body with the contents of `supabase/email-templates/invite.html` (subject: `You are invited to RUNTech Space`). Do the same for **Reset password** with `supabase/email-templates/recovery.html` (subject: `Reset your RUNTech Space password`). Leave `{{ .ConfirmationURL }}` exactly as it is.
4. **Password**: set the minimum length to 10 or more.
Then run the check (I can do this for you): `npm run setup:verify`. The sign-up and database checks should pass.

### A5. Create the first admin (YOU)
1. **Authentication > Users > Add user > Create new user**. Email `techspace@run.edu.ng`, a strong password, tick **Auto Confirm User**.
2. **SQL Editor > New query**, run:
   ```sql
   update public.profiles set role = 'admin', full_name = 'RUNTech Space Admin' where lower(email) = 'techspace@run.edu.ng';
   select email, role from public.profiles where role = 'admin';
   ```
   You should see one row with role `admin`.

### A6. Demo signatories (optional, for the demo)
Run `supabase/seed/demo-signatories.sql` in the SQL Editor. It adds three clearly fake names (President, Technical Lead, Staff Patron). Then, once the site is running, open **Admin > Signatories**, click **Edit** on each and upload the matching picture from `design/demo-signatures/`. When the real people are confirmed, edit those rows; then **Reissue** any certificate that should show them.

### A7. Deploy the three functions (YOU, copy-paste, no tools to install)
**Edge Functions > Deploy a new function > Via Editor**, once for each (name exactly as shown, then paste the file's whole contents and click **Deploy**):

| Function name | Paste from |
|---|---|
| `invite-user` | `supabase/functions/invite-user/index.ts` |
| `review-application` | `supabase/functions/review-application/index.ts` |
| `send-certificate-email` | `supabase/functions/send-certificate-email/index.ts` |

Leave "Verify JWT" **on**. Then **Edge Functions > Secrets** (add after Part B): `SITE_URL`, `RESEND_API_KEY`, `EMAIL_FROM` (details below).

(Alternative if you prefer: I can install the Supabase command-line tool with Homebrew and deploy all three in one go, after you approve the download. You would approve a browser sign-in once.)

---

## Part B: Resend (about 15 minutes of your time, plus DNS wait)

### B1. Account (YOU)
Sign up at https://resend.com with **techspace@run.edu.ng**.

### B2. Rehearse right away, no domain needed
Until your domain is verified, Resend lets you send **from `onboarding@resend.dev`, but only to techspace@run.edu.ng** (the account email). That is enough to rehearse invitations and certificates end to end using that one address.

### B3. Verify your sending domain (needed before real students get emails)
1. **Domains > Add Domain**. Use a subdomain such as **`mail.run.edu.ng`** (recommended by Resend so it does not interfere with the university's normal mail).
2. Resend shows a short list of DNS records (typically SPF, DKIM, and optionally DMARC). **Whoever manages DNS for `run.edu.ng` (probably the university's IT) must add them.** Send them the list from the Resend page.
3. Click **Verify** in Resend. This can take minutes to a few hours. Wait for a green "Verified".

### B4. Make an API key (YOU)
**API Keys > Create API Key**: name `runtech-space`, permission **Sending access**, restricted to your domain once verified. Copy it immediately (shown once) into your password manager.

### B5. Connect Supabase's own emails (invitations, password resets) to Resend (YOU)
Supabase **Authentication > Emails > SMTP Settings** (or Project Settings > Authentication): enable **Custom SMTP** and enter:
- Sender email: `no-reply@mail.run.edu.ng` (for the rehearsal: `onboarding@resend.dev`)
- Sender name: `RUNTech Space`
- Host: `smtp.resend.com`   Port: `465`
- Username: `resend`   Password: **your API key**
Save, then raise the email rate limit under **Authentication > Rate Limits** (the default is very low).

### B6. Function secrets (YOU)
**Edge Functions > Secrets**, add:
- `SITE_URL` = your site address (`http://localhost:5175` for the rehearsal)
- `RESEND_API_KEY` = the key from B4
- `EMAIL_FROM` = `RUNTech Space <certificates@mail.run.edu.ng>` (rehearsal: `RUNTech Space <onboarding@resend.dev>`)

Resend's free plan allows about 100 emails a day and 3,000 a month. That covers a launch cohort; upgrade if you invite hundreds of people in one day.

---

## Part C: Put the site online

1. **Merge the code (needs your OK, I will do it):** open a pull request from the work branches into `master` and merge it, so hosting can deploy from `master`.
2. **Hosting (YOU), Vercel assumed:** https://vercel.com, sign in with GitHub, **Add New > Project**, import `dev-ayomide/Edutechspace`. Framework: Vite (auto-detected). Add two Environment Variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (the public values from A2). Deploy. Security headers come from `vercel.json` automatically.
3. **Address:** use the `*.vercel.app` address first. For a nicer address (for example `learn.run.edu.ng`) add it under the Vercel project's **Domains**; the university's DNS must add the record Vercel shows.
4. **Tell Supabase the real address:** update Site URL and the two Redirect URLs (A4), and the `SITE_URL` secret (B6) to the live address. Without this, invitation and reset links point to the wrong place.

---

## Part D: Rehearse, then open the doors

1. Run `npm run setup:verify` (I can run it): everything should say PASS.
2. Do the 30-minute rehearsal in `docs/LAUNCH_CHECKLIST.md` section 5 using techspace@run.edu.ng for the test accounts.
3. Invite the first real leads (**Admin > Lead invitations**), have them publish content, then share the site link so students can apply.

## Still open after all of the above
- Real signatory names and signature images (demo data is in until then).
- Real photos (the landing page uses a stock photo) and a privacy notice and terms page.
- A verified sending domain (until then, email only reaches techspace@run.edu.ng).
- Error monitoring (errors are only logged in the browser for now).
