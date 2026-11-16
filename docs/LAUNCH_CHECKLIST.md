# Launch checklist

Work through this top to bottom. Items marked **you** need a decision or an asset from the team; the rest are mechanical.
Nothing here has been run against a live Supabase project yet, so treat the first pass as a rehearsal on a staging project.

## 1. Supabase project

- [ ] Create a **fresh** project (do not reuse the old Edutechspace database: its tables clash with the new schema).
- [ ] **Authentication > Providers > Email:** turn **off** "Allow new users to sign up". Accounts come only from invitations.
- [ ] **Authentication > URL Configuration:** set the Site URL to the production domain. Add redirect URLs for `/accept-invite` and `/reset-password` on the production domain, the Vercel preview domain and `http://localhost:5175`.
- [ ] **Authentication > Password:** minimum length 10 or more; enable leaked-password protection if your plan offers it.
- [ ] **Authentication > SMTP:** configure a real sender (the built-in mailer is heavily rate limited and unsuitable for launch). Customise the **Invite user** and **Reset password** templates with the RUNTech Space name.
- [ ] Apply the migrations in order (`supabase db push`, or paste each file into the SQL editor):
  `20261030000001_core`, `20261030000002_seed_stacks`, `20261031000001_content_and_lead_management`, `20261101000001_learning`, `20261102000001_exam_and_certificates`, `20261103000001_privilege_hardening`, `20261115000001_attempt_grants_and_profile_details`.
- [ ] Confirm the three storage buckets exist: `lesson-media` (private), `submissions` (private), `signatures` (public).
- [ ] Create the first admin: add the user in Authentication > Users, then run `supabase/seed/first-admin.sql`.
- [ ] Turn on daily backups / point-in-time recovery (Settings > Database) before real data arrives.

## 2. Edge Functions

- [ ] `supabase functions deploy invite-user review-application send-certificate-email`
- [ ] `supabase secrets set SITE_URL=https://your-domain RESEND_API_KEY=... EMAIL_FROM="RUNTech Space <certificates@your-domain>"` (**you**: choose the email provider; Resend is assumed and isolated in `send-certificate-email`).
- [ ] Verify the sending domain (SPF, DKIM) with the provider so invitations and certificates do not land in spam.
- [ ] Invite a test lead and approve a test application; confirm both emails arrive and the links open `/accept-invite`.
  Unknown until tested live: re-inviting someone whose first invitation is still unaccepted.

## 3. Hosting (Vercel assumed)

- [ ] Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (public values only; never the service-role key).
- [ ] Attach the production domain and force HTTPS. Security headers and the Content Security Policy ship from `vercel.json`.
- [ ] Set absolute `og:image` / `og:url` meta tags in `index.html` once the domain is known (**you**: provide a 1200x630 share image).
- [ ] If the Supabase project URL is not `*.supabase.co` (custom domain), add it to `connect-src`, `img-src` and `frame-src` in `vercel.json`.

## 4. Content and people (you)

- [ ] **Signatories:** names, titles and signature images for the President, Technical Lead and Staff Patron (VC when available), added under Admin > Signatories. Certificates issued before this have no signatures (use Reissue).
- [ ] **Leads:** invite at least one lead per stack that opens at launch.
- [ ] **Each opening stack:** at least one published module with lessons, an assignment per module, and a published final exam. An empty stack should not be opened to applicants.
- [ ] **Photos:** replace the stock hero photo with real photos in `src/assets/photos/originals`, then run `npm run images`.
- [ ] **Legal:** a privacy notice and terms (the join form collects names, emails and phone numbers; leads can see student contact details). Link them from the footer.
- [ ] Decide the pass marks, attempts and cool-down defaults (currently 60%, 3 attempts, 24 hours) and the owner of grading turnaround.

## 5. Rehearsal (about 30 minutes, on staging)

1. Submit the join form as a stranger. 2. As the lead, approve it. 3. Open the invite email, set a password, land on the dashboard.
4. Complete a lesson, pass a quiz, submit a project; as the lead, grade it. 5. Finish every module; take the exam; pass it.
6. Check the certificate page, download the PDF, scan its QR code, open the verification link while signed out.
7. As admin: revoke the certificate and confirm `/verify` shows it revoked; reissue it.
8. Forgot-password flow end to end. 9. Withdraw and re-apply to another stack.
10. Try the forbidden things: open `/admin` as a student, read another student's data via the browser console, fetch a locked lesson by id.

## 6. Operations

- [ ] Error reporting: route errors currently log to the console only (`src/routes/route-error.tsx`). Choose a reporter (Sentry or similar) and wire it there.
- [ ] Decide who watches the applications queue and the review queue, and the target response times.
- [ ] Review the audit log (admin actions, certificate issue/revoke) on a schedule.
- [ ] `npm audit --omit=dev` runs in CI; the remaining advisories are in dev tooling only.

## Known limitations at launch

- Lesson videos cannot carry caption tracks yet (accessibility gap; needs a design decision on caption upload).
- The PDF certificate uses a built-in font covering Latin-1, so diacritics (e.g. Yoruba ọ, ẹ) print as their base letters; the on-screen certificate and verification page are exact.
- A failed invitation email is reported to the reviewer but has no resend button; the person can use "Forgot password" with the invited address to get in.
- Leads are not emailed about new applications; they see them on their overview.
- The hero image is a stock photo; the dark-theme logo is derived from the supplied light logo (the supplied dark file had smudged edges). Vector (SVG) logo files would be better than PNG.
