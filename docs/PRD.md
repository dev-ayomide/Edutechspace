# PRD: Edutechspace Learning Platform Revamp (v3 draft)

Status: Draft for discussion · Owner: Ayomide · Last updated: 2026-10-30
Changes from v2: existing stacks dropped (clean start), students may switch stacks after completing or withdrawing, provisional pass-mark defaults accepted, brand colours recorded, admin-invited leads, approval-based student admissions, frontend standards split into [FRONTEND_STANDARDS.md](FRONTEND_STANDARDS.md).

## 1. Summary

Edutechspace is being rebuilt as a structured learning platform for a fresh launch. There are three roles:

- **Stack Leads** (several per stack) build and publish their stack's modules, lessons, assignments and exam from their own dashboard, grade submissions, and see their students.
- **Students** join one stack, work through it module by module, submit assignments, take the final exam, see how close they are to certification, and receive a signed digital certificate (PDF, plus email).
- **Admins** manage stacks, leads, people and platform settings (including certificate signatories).

The whole UI and flow is being redesigned to a consistent, standard design system rather than patched.

## 2. Stacks (launch catalogue)

1. Data Analysis
2. Frontend
3. Backend
4. Cloud Computing / DevOps
5. Game Development
6. UI/UX
7. Product Management
8. Machine Learning (ML)

A stack is one curriculum ("stack" is the term used in the UI). **Decided: start afresh.** The 7 existing courses (AI, Cybersecurity, Data Science, Frontend, UI/UX, Backend, ML) and all their hardcoded pages, exam files and data are dropped. The 8 stacks above are seeded as the only stacks at launch; new stacks can be added later by an admin.

## 3. Problem with the current system

- Only two roles exist (`user`, `admin`, a `role` column on `users`). Content is created by admins or hardcoded in seven stack pages, seven exam files and eight video modals.
- Progress counts lessons only. Assignments and exams do not feed into it.
- Exam scoring runs in the browser (`ExamPage.jsx`), so results can be tampered with and cannot back a certificate.
- RLS policies let any logged-in user edit modules and lessons.
- `database/schema.sql` starts with `DROP TABLE ... CASCADE` and omits the `exams`, `exam_questions`, `exam_results` and `users` tables the app depends on.
- No certificate, verification or lead workflow.
- UI is inconsistent: per-course duplicated pages and modals, a Tailwind v3 config alongside a Tailwind v4 PostCSS plugin in `package.json`, no shared component library.

## 4. Goals

1. Leads can independently build and publish a complete stack without admin involvement.
2. Students get a clear ordered path with one trustworthy percentage showing how close they are to certification.
3. Certificates are issued only when requirements are provably met, and anyone can verify one.
4. Security enforced in the database (RLS), not just the UI.
5. A consistent, standard, accessible UI across every role and screen.

## 5. Non-goals (v1)

- Cohorts, deadlines, live classes (the data model must not block adding them later).
- Payments, subscriptions.
- Mobile apps, forums, real-time chat.
- Proctoring or code-execution sandboxes.
- Migrating existing users, enrolments or exam results.
- VC signature on certificates (supported by design, not required at launch).

## 6. Users and roles

| Role | Can do |
|---|---|
| **Student** | Join **one** stack, take lessons in order, submit assignments, take the exam, view own progress and certificate |
| **Stack Lead** | For **their assigned stack(s) only**: manage modules, lessons, assignments, exam; review and grade submissions; view the student roster including contact details (name, email, phone) and progress |
| **Admin** | Create stacks, assign/remove leads, manage roles, override or unpublish content, revoke certificates, configure signatories |

Rules (decided):
- A stack has **multiple leads**; all leads of a stack have equal content rights over it.
- A lead **cannot be a student** in any stack.
- A student has **one active stack at a time**. After **completing** or **withdrawing** from a stack they may join another (subject to the admissions flow in 8.9). Membership history is kept; each stack membership has its own progress and certificate.

## 7. Core concepts

- **Stack**: a learning track with its own curriculum and leads.
- **Module**: ordered unit in a stack, containing lessons and one assignment.
- **Lesson**: video, PDF, text or quiz, tracked per student.
- **Assignment**: one per module. Types: quiz (auto-graded) or submission (text, link or file, graded by a lead).
- **Final exam**: one per stack, graded server-side.
- **Certificate**: issued automatically on eligibility.

## 8. Functional requirements

### 8.1 Access and roles
- R1. Add roles `student | stack_lead | admin` and a `stack_leads (user_id, stack_id)` mapping (many leads per stack). Admin assigns leads.
- R2. Route groups: `/lead/*`, `/dashboard` (student), `/admin/*`, all role-guarded.
- R3. All access control is enforced by Supabase RLS policies and security-definer functions. UI checks are convenience only.
- R4. Leads can only read student data for students enrolled in their stack.

### 8.2 Stack Lead dashboard
- R5. Overview: enrolled students, average progress, submissions awaiting review, stalled students (no activity for N days).
- R6. Content manager: create, reorder, edit, publish/unpublish modules, lessons, assignments, exam (draft vs published).
- R7. Review queue: ungraded submissions with score, written feedback, and request-resubmission. A second queue lists pending join applications for the stack, with approve and reject (see 8.9).
- R8. Student roster with contact details and per-student progress breakdown.

### 8.3 Student dashboard
- R9. Once approved (see 8.9) the student lands on their stack dashboard. A completed or withdrawn student can apply to a new stack from their dashboard. A student can withdraw from their active stack (progress retained).
- R10. Stack view: ordered modules with status (locked, in progress, complete), lessons, assignment status and score.
- R11. Progress tracker (see 9): breakdown by lessons, assignments, exam, and what is still needed for certification.
- R12. Certificate page: download PDF, share verification link, resend email.
- R13. Self-paced: modules unlock in order. A module is complete when all required lessons are done and its assignment is passed.

### 8.4 Assignments
- R14. Quiz assignments are auto-graded server-side. Answer keys are never sent to the client.
- R15. Submission assignments accept text, link or file upload (type and size limits), with instructions and a rubric.
- R16. Statuses: `not_started`, `submitted`, `graded`, `needs_resubmission`. Resubmission allowed until passed (attempt limit configurable).
- R17. Each assignment has a max score and pass mark (configurable per assignment, **default 60%**).

### 8.5 Final exam
- R18. Per-stack question bank (MCQ in v1), configurable time limit, pass mark, attempts and retake cool-down. **Provisional defaults (adjustable per exam): 60% pass mark, 3 attempts, 24-hour cool-down.**
- R19. Unlocks only after all modules are complete.
- R20. Graded server-side. The client never receives correct answers.
- R21. Every attempt stored with timestamps and per-question answers.

### 8.6 Progress and eligibility
- R22. One server-computed progress percentage per student, shown identically everywhere.
- R23. Weighting (decided, keep for now): **Lessons 40%, Assignments 30%, Final exam 30%**.
- R24. Certificate eligibility: all required lessons complete **and** every assignment at or above its pass mark **and** final exam passed.

### 8.7 Digital certificate
- R25. Auto-issued when R24 is met. Contains: unique certificate number, student name, stack, issue date, final score, and the signatures of the **platform signatories**: **President, Technical Lead, Staff Patron**, plus **VC** when available.
- R26. Signatories are managed by admin in a `certificate_signatories` list (name, title, signature image, display order, active flag), so adding the VC later is configuration, not code. A certificate snapshots the signatories at issue time.
- R27. Delivery: PDF download plus an email with the PDF or link sent on issue.
- R28. Public page `/verify/:certificate_no` shows validity (student name, stack, date, status) without login. Revoked certificates show as revoked.
- R29. Issued certificates are immutable. Reissue and revocation are admin actions recorded in the audit log.

### 8.8 Admin
- R30. Manage stacks, leads, roles, signatories.
- R31. View and revoke certificates, unpublish any content, view audit log.

### 8.9 Admissions and invitations
- R32. **Student admissions are approval-based.** Prospective students fill a public "Join a stack" form (name, email, phone, chosen stack, short motivation). Applications are stored with status `pending | approved | rejected`.
- R33. Approving an application sends the applicant an invite email to set up their account; on acceptance they become an active member of that stack. Rejection sends a polite email (optional reason).
- R34. Applicants cannot access learning content before approval. An existing student applying for a second stack goes through the same flow once their current stack is completed or withdrawn.
- R35. **Leads are invited by an admin.** The admin enters an email and the stack(s); the system sends an invite (Supabase Auth invite via an Edge Function using the service role). Accepting sets the `stack_lead` role and the stack assignment. Pending invites can be revoked or resent.
- R36. No self-service role elevation: roles and stack assignments can only be set by admin-only functions.
- R37. **Stack leads approve student applications** for their own stack. Any lead of that stack may approve or reject (first decision wins, recorded with who and when). Admins can also review and override any application. Leads see only applications for their stack.

## 9. Progress formula (worked example)

Student in a stack with 20 lessons, 4 modules (4 assignments) and one exam:
- Lessons done 15/20 = 75% x 40 = 30
- Assignments average 80% x 30 = 24
- Exam not taken = 0
- **Progress = 54%**. The tracker also lists blockers, e.g. "Module 3 assignment below pass mark", "Final exam not taken".

## 10. UI/UX revamp

The entire front end is redesigned and rebuilt, not reskinned. New role screens are built directly in the new system; legacy pages are deleted, not ported.

- **Design system first**: tokens (colour, type, spacing, radius, elevation, light/dark), a shared component library (buttons, inputs, tables, modals, tabs, toasts, empty and loading and error states, progress bars, badges, stepper), documented and reused everywhere.
- **Information architecture**: three clearly separated experiences (public site, student app, lead app, plus admin), each with its own navigation shell and breadcrumbs.
- **Key screens to design**: landing and stack catalogue, auth and onboarding (stack choice), student dashboard, module/lesson player, assignment submission, exam taking and result, certificate and verify page, lead dashboard, content manager, review queue, roster, admin screens.
- **Standards**: WCAG AA contrast, keyboard navigation and focus states, responsive from 360px, consistent form validation and error messaging, skeleton loading states, no hardcoded per-stack pages (everything data-driven).
- **Brand (carried over)**: RUNTech Space blue and white. Deep navy and blues for primary surfaces and text (currently Tailwind `blue-950` / `blue-900` `#1e3a8a` / `blue-800` `#1e40af` / `blue-600`), white and light blue tints (`blue-50`, `blue-100`) for backgrounds, and a bright cyan accent (`#08f1ff`) for highlights and key actions. Font: Inter. These become named design tokens (primary, accent, surface, text, etc.) with a derived dark mode and AA-checked contrast pairs. The cyan accent must not be used for text on white.
- **Frontend tech standards**: decided in [FRONTEND_STANDARDS.md](FRONTEND_STANDARDS.md) (TypeScript, Tailwind v4, Radix-based components, TanStack Query, react-hook-form + zod, Vitest and Playwright).
- **Design process**: wireframes and visual design in Figma (a Figma connection is available in this workspace), then implemented from the design.

## 11. Data model (new or changed)

Fresh schema via ordered migrations (no `DROP TABLE` scripts):
- `users.role` extended: `student | stack_lead | admin`
- `stacks` (fresh table, seeded with the 8 stacks), `stack_leads (user_id, stack_id)`
- `stack_members (id, user_id, stack_id, status active|completed|withdrawn, joined_at, ended_at)` with a **partial unique index allowing one `active` row per user**, so history is kept and a second stack is only possible after completing or withdrawing
- `stack_applications (id, name, email, phone, stack_id, motivation, status, reviewed_by, reviewed_at)` and `invitations (id, email, role, stack_id, invited_by, token/status, expires_at)`
- `modules`, `lessons`, `lesson_completions` (kept and extended)
- `assignments (id, module_id, type, instructions, rubric, max_score, pass_mark, max_attempts, is_published)`, `assignment_questions`, `assignment_submissions (assignment_id, user_id, content, file_url, status, score, feedback, graded_by, graded_at, attempt)`
- `exams`, `exam_questions`, `exam_attempts (user_id, exam_id, score, passed, answers, started_at, submitted_at)`
- `certificates (certificate_no, user_id, stack_id, final_score, issued_at, revoked_at, pdf_url, signatories_snapshot)`
- `certificate_signatories (name, title, signature_url, display_order, is_active)`
- `audit_log`
- Views/functions: `student_progress`, `is_certificate_eligible`, `issue_certificate`
- Storage buckets: lesson media, submissions, signatures, certificate PDFs (role-scoped)

## 12. Non-functional requirements

- **Security**: RLS role-based on every table, replacing the "authenticated users can manage" policies. Storage policies by role. No answer keys in client payloads. Privacy: students see only their own data; leads see only their stack's students.
- **Integrity**: certificates only issued by a database function that re-checks eligibility, with unique constraints against duplicates.
- **Backend**: Supabase (Postgres, RLS, Auth, Storage) plus Edge Functions for exam grading, certificate PDF generation and email. No separate backend.
- **Stability**: migrations in the repo, seed data for the 8 stacks, error boundaries and loading and empty states on every screen, automated tests for RLS and eligibility rules.
- **Performance**: dashboards load in under 2s for stacks of 500 students (progress via views or RPC, not client aggregation).
- **Email**: transactional provider (e.g. Resend) via Edge Function; deliverability and templates required.

## 13. Phasing

| Phase | Scope | Outcome |
|---|---|---|
| **0. Foundation** | Clean project scaffold per FRONTEND_STANDARDS, migrations baseline and 8-stack seed, role model and RLS, design tokens and app shells in Figma and code, test setup | Safe, consistent base |
| **1. Admin, invites + lead content** | Admin console, lead invitations, lead dashboard, content manager for modules and lessons | Leads can be onboarded and publish a stack |
| **2. Admissions + student path + assignments** | Join-a-stack form and approval flow, unlock-in-order modules, lesson player, assignments (quiz and submission), review queue, progress tracker, withdraw and switch stack | Students are admitted and progress with a real percentage |
| **3. Exams + certificates** | Exam builder and taker with server grading, eligibility, signatories, certificate PDF, email, verify page | End-to-end certification |
| **4. Launch hardening** | Public site revamp, accessibility and performance pass, security review, delete legacy pages, seed real content | Launch-ready |

## 14. Success metrics

- % of enrolled students completing a module and a stack.
- Median time from submission to lead grading.
- Certificates issued and verification page visits.
- Zero cross-stack write access (verified by RLS tests).

## 15. Risks

- **Scope**: a full revamp plus a new role system in one go. Mitigated by phasing and building new screens directly in the new design system.
- **Auth fragility**: `AuthProvider.jsx` (569 lines) has recent OAuth fixes and will be touched by roles.
- **Lead workload**: manual grading can bottleneck; mitigated by auto-graded quizzes and the review queue.
- **Content readiness**: leads must produce content for 8 stacks; an empty stack must still look acceptable at launch.
- **Signatory availability**: the VC signature may arrive late; handled by configuration.

## 16. Open questions

Resolved so far: stack list and clean start, one active stack with switching, provisional pass-mark defaults, platform-level signatories (assumed), brand direction (blue and white), frontend standards, admin-invited leads, approval-based admissions approved by the stack's leads.

1. **Application handling details**: should the "Join a stack" form also be reachable from a shareable link per stack? Should leads be notified by email of new applications? If an application sits unreviewed, should it escalate to admin after N days?
2. **Signatories**: confirm they are platform-wide (same on every certificate) and that "Technical Lead" is the platform's technical lead, not the stack lead. Names, titles and signature image files for President, Technical Lead and Staff Patron are needed before Phase 3.
3. **Certificate email provider** and sender domain (e.g. Resend with a domain like runtechspace.com).
4. **Logo and brand assets**: is the current RUNTech Space logo staying as is, and are there original files (SVG) available? Anything beyond blue and white to carry over?
5. **Withdrawal rules**: can a withdrawn student later re-join the same stack and resume their old progress, or start fresh?
6. **Application volume and abuse**: any limits needed on the public join form (rate limiting, email verification before the application is reviewed)?
7. **Domain and hosting**: current deploy is Vercel (`vercel.json`). Staying on Vercel plus Supabase?
