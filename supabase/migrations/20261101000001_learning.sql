-- Phase 2: the student learning path.
-- Lesson completion, assignments (auto-graded quizzes and lead-graded submissions), module unlocking,
-- server-computed progress, class roster. Quiz answer keys and grading never reach the browser.

create type public.assignment_type as enum ('quiz', 'submission');
create type public.submission_status as enum ('submitted', 'graded', 'needs_resubmission');

-- ---------------------------------------------------------------- tables

create table public.lesson_completions (
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
create index lesson_completions_lesson_idx on public.lesson_completions (lesson_id);

-- One assignment per module.
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null unique references public.modules (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 2 and 160),
  type public.assignment_type not null,
  instructions text check (instructions is null or char_length(instructions) <= 10000),
  max_score integer not null default 100 check (max_score between 1 and 1000),
  pass_mark integer not null default 60 check (pass_mark between 1 and 100), -- percent of max_score
  max_attempts integer check (max_attempts is null or max_attempts between 1 and 20), -- null = unlimited
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint published_submission_has_instructions check (
    not is_published or type = 'quiz' or (instructions is not null and btrim(instructions) <> '')
  )
);
create trigger assignments_touch_updated_at before update on public.assignments
  for each row execute function public.touch_updated_at();

create table public.assignment_questions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  prompt text not null check (char_length(btrim(prompt)) between 1 and 1000),
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 6),
  points integer not null default 1 check (points between 1 and 100),
  order_index integer not null default 0
);
create index assignment_questions_assignment_idx on public.assignment_questions (assignment_id, order_index);

-- Kept apart from the questions so students can never read the correct answers.
create table public.assignment_answer_keys (
  question_id uuid primary key references public.assignment_questions (id) on delete cascade,
  correct_index integer not null check (correct_index >= 0)
);

create table public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  attempt integer not null,
  content_text text check (content_text is null or char_length(content_text) <= 20000),
  content_url text check (content_url is null or content_url ~* '^https?://\S+$'),
  file_path text check (file_path is null or char_length(file_path) <= 500),
  answers jsonb,
  status public.submission_status not null default 'submitted',
  score integer check (score is null or score >= 0),
  feedback text check (feedback is null or char_length(feedback) <= 5000),
  graded_by uuid references public.profiles (id) on delete set null,
  graded_at timestamptz,
  submitted_at timestamptz not null default now(),
  unique (assignment_id, user_id, attempt)
);
create index assignment_submissions_user_idx on public.assignment_submissions (user_id);
create index assignment_submissions_status_idx on public.assignment_submissions (assignment_id, status);

-- ---------------------------------------------------------------- helpers (security definer)

create function public.is_active_member_of(p_stack_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.stack_members m
    where m.user_id = (select auth.uid()) and m.stack_id = p_stack_id and m.status = 'active'
  );
$$;

create function public.assignment_module_id(p_assignment_id uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select a.module_id from public.assignments a where a.id = p_assignment_id;
$$;

create function public.assignment_stack_id(p_assignment_id uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select m.stack_id from public.assignments a join public.modules m on m.id = a.module_id where a.id = p_assignment_id;
$$;

create function public.assignment_passed(p_user uuid, p_assignment_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.assignments a
    join public.assignment_submissions s on s.assignment_id = a.id
    where a.id = p_assignment_id and s.user_id = p_user and s.status = 'graded'
      and s.score is not null and s.score * 100 >= a.pass_mark * a.max_score
  );
$$;

-- A module is complete when every required published lesson is done and its published assignment is passed.
create function public.module_is_complete(p_user uuid, p_module_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select
    not exists (
      select 1 from public.lessons l
      where l.module_id = p_module_id and l.is_published and l.is_required
        and not exists (select 1 from public.lesson_completions c where c.user_id = p_user and c.lesson_id = l.id)
    )
    and not exists (
      select 1 from public.assignments a
      where a.module_id = p_module_id and a.is_published and not public.assignment_passed(p_user, a.id)
    );
$$;

-- Modules unlock in order: every earlier published module of the stack must be complete.
-- Students who completed the stack keep everything unlocked.
create function public.module_is_unlocked(p_user uuid, p_module_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select
    exists (
      select 1 from public.modules cur
      join public.stack_members sm on sm.stack_id = cur.stack_id and sm.user_id = p_user and sm.status = 'completed'
      where cur.id = p_module_id
    )
    or not exists (
      select 1 from public.modules cur
      join public.modules prev on prev.stack_id = cur.stack_id and prev.is_published and prev.order_index < cur.order_index
      where cur.id = p_module_id and not public.module_is_complete(p_user, prev.id)
    );
$$;

create function public.module_open_to_me(p_module_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.module_visible_to_member(p_module_id) and public.module_is_unlocked((select auth.uid()), p_module_id);
$$;

-- ---------------------------------------------------------------- RLS

alter table public.lesson_completions enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_questions enable row level security;
alter table public.assignment_answer_keys enable row level security;
alter table public.assignment_submissions enable row level security;

-- Locked modules really are locked: their lessons are not even readable until unlocked.
drop policy "members read published lessons" on public.lessons;
create policy "members read unlocked published lessons" on public.lessons for select to authenticated
  using (is_published and public.module_open_to_me(module_id));

create policy "own completions" on public.lesson_completions for select to authenticated using (user_id = (select auth.uid()));
create policy "leads read their students' completions" on public.lesson_completions for select to authenticated
  using (public.leads_student(user_id));
create policy "admin reads completions" on public.lesson_completions for select to authenticated using (public.is_admin());

create policy "members read open published assignments" on public.assignments for select to authenticated
  using (is_published and public.module_open_to_me(module_id));
create policy "leads manage their assignments" on public.assignments for all to authenticated
  using (public.is_lead_of(public.module_stack_id(module_id))) with check (public.is_lead_of(public.module_stack_id(module_id)));
create policy "admin manages assignments" on public.assignments for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "members read questions" on public.assignment_questions for select to authenticated
  using (exists (select 1 from public.assignments a where a.id = assignment_id));
create policy "leads manage their questions" on public.assignment_questions for all to authenticated
  using (public.is_lead_of(public.assignment_stack_id(assignment_id))) with check (public.is_lead_of(public.assignment_stack_id(assignment_id)));
create policy "admin manages questions" on public.assignment_questions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "leads read answer keys" on public.assignment_answer_keys for select to authenticated
  using (public.is_lead_of(public.assignment_stack_id((select q.assignment_id from public.assignment_questions q where q.id = question_id))));
create policy "admin reads answer keys" on public.assignment_answer_keys for select to authenticated using (public.is_admin());

create policy "own submissions" on public.assignment_submissions for select to authenticated using (user_id = (select auth.uid()));
create policy "leads read their submissions" on public.assignment_submissions for select to authenticated
  using (public.is_lead_of(public.assignment_stack_id(assignment_id)));
create policy "admin reads submissions" on public.assignment_submissions for select to authenticated using (public.is_admin());

revoke all on public.lesson_completions, public.assignments, public.assignment_questions,
  public.assignment_answer_keys, public.assignment_submissions from anon;
-- Keys and submissions are written only through the functions below.
revoke insert, update, delete on public.assignment_answer_keys, public.assignment_submissions, public.lesson_completions from authenticated;

-- ---------------------------------------------------------------- student actions

create function public.complete_lesson(p_lesson_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_module uuid; v_stack uuid; v_uid uuid := (select auth.uid());
begin
  select l.module_id, m.stack_id into v_module, v_stack
  from public.lessons l join public.modules m on m.id = l.module_id
  where l.id = p_lesson_id and l.is_published and m.is_published;
  if v_module is null then raise exception 'This lesson is not available' using errcode = 'no_data_found'; end if;
  if not public.is_active_member_of(v_stack) then
    raise exception 'You are not an active member of this stack' using errcode = 'insufficient_privilege';
  end if;
  if not public.module_is_unlocked(v_uid, v_module) then
    raise exception 'Complete the previous module first' using errcode = 'check_violation';
  end if;
  insert into public.lesson_completions (user_id, lesson_id) values (v_uid, p_lesson_id) on conflict do nothing;
end $$;

-- Shared checks for both assignment types. Returns the next attempt number.
create function public.begin_attempt(p_assignment_id uuid, p_type public.assignment_type) returns integer
language plpgsql security definer set search_path = '' as $$
declare a public.assignments; v_uid uuid := (select auth.uid()); v_used integer;
begin
  select * into a from public.assignments where id = p_assignment_id and is_published and type = p_type;
  if not found then raise exception 'This assignment is not available' using errcode = 'no_data_found'; end if;
  if not public.is_active_member_of(public.assignment_stack_id(a.id)) then
    raise exception 'You are not an active member of this stack' using errcode = 'insufficient_privilege';
  end if;
  if not public.module_is_unlocked(v_uid, a.module_id) then
    raise exception 'Complete the previous module first' using errcode = 'check_violation';
  end if;
  if public.assignment_passed(v_uid, a.id) then
    raise exception 'You have already passed this assignment' using errcode = 'check_violation';
  end if;
  if exists (select 1 from public.assignment_submissions s where s.assignment_id = a.id and s.user_id = v_uid and s.status = 'submitted') then
    raise exception 'Your previous submission is still waiting to be reviewed' using errcode = 'check_violation';
  end if;
  select count(*) into v_used from public.assignment_submissions where assignment_id = a.id and user_id = v_uid;
  if a.max_attempts is not null and v_used >= a.max_attempts then
    raise exception 'You have used all attempts for this assignment' using errcode = 'check_violation';
  end if;
  return v_used + 1;
end $$;

-- Grades a quiz on the server. Returns {score, max_score, passed}; correct answers are never exposed.
create function public.submit_quiz(p_assignment_id uuid, p_answers integer[]) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  a public.assignments; v_attempt integer; v_total integer; v_earned integer; v_score integer; v_count integer;
begin
  v_attempt := public.begin_attempt(p_assignment_id, 'quiz');
  select * into a from public.assignments where id = p_assignment_id;
  select count(*), coalesce(sum(points), 0) into v_count, v_total from public.assignment_questions where assignment_id = a.id;
  if v_count = 0 then raise exception 'This quiz has no questions' using errcode = 'check_violation'; end if;
  if coalesce(array_length(p_answers, 1), 0) <> v_count then
    raise exception 'Answer every question before submitting' using errcode = 'check_violation';
  end if;
  select coalesce(sum(q.points), 0) into v_earned
  from (select id, points, row_number() over (order by order_index, id) as n from public.assignment_questions where assignment_id = a.id) q
  join public.assignment_answer_keys k on k.question_id = q.id
  where p_answers[q.n] = k.correct_index;
  v_score := round(v_earned::numeric * a.max_score / v_total);
  insert into public.assignment_submissions (assignment_id, user_id, attempt, answers, status, score, graded_at)
  values (a.id, (select auth.uid()), v_attempt, to_jsonb(p_answers), 'graded', v_score, now());
  return jsonb_build_object('score', v_score, 'max_score', a.max_score, 'passed', v_score * 100 >= a.pass_mark * a.max_score);
end $$;

create function public.submit_assignment(p_assignment_id uuid, p_text text, p_url text, p_file_path text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_attempt integer; v_id uuid; v_uid uuid := (select auth.uid());
begin
  if coalesce(btrim(p_text), '') = '' and coalesce(btrim(p_url), '') = '' and coalesce(p_file_path, '') = '' then
    raise exception 'Add your answer, a link or a file' using errcode = 'check_violation';
  end if;
  v_attempt := public.begin_attempt(p_assignment_id, 'submission');
  if p_file_path is not null and p_file_path not like public.assignment_stack_id(p_assignment_id)::text || '/' || v_uid::text || '/%' then
    raise exception 'That file does not belong to you' using errcode = 'insufficient_privilege';
  end if;
  insert into public.assignment_submissions (assignment_id, user_id, attempt, content_text, content_url, file_path)
  values (p_assignment_id, v_uid, v_attempt, nullif(btrim(p_text), ''), nullif(btrim(p_url), ''), p_file_path)
  returning id into v_id;
  return v_id;
end $$;

-- ---------------------------------------------------------------- lead actions

create function public.grade_submission(p_submission_id uuid, p_score integer, p_feedback text, p_request_resubmission boolean default false)
returns void
language plpgsql security definer set search_path = '' as $$
declare s public.assignment_submissions; a public.assignments;
begin
  select * into s from public.assignment_submissions where id = p_submission_id for update;
  if not found then raise exception 'Submission not found' using errcode = 'no_data_found'; end if;
  select * into a from public.assignments where id = s.assignment_id;
  if not (public.is_admin() or public.is_lead_of(public.assignment_stack_id(a.id))) then
    raise exception 'Not allowed to grade this submission' using errcode = 'insufficient_privilege';
  end if;
  if a.type <> 'submission' then raise exception 'Quizzes are graded automatically' using errcode = 'check_violation'; end if;
  if s.status <> 'submitted' then raise exception 'This submission was already reviewed' using errcode = 'check_violation'; end if;
  if p_request_resubmission then
    update public.assignment_submissions
    set status = 'needs_resubmission', feedback = nullif(btrim(p_feedback), ''), graded_by = (select auth.uid()), graded_at = now()
    where id = s.id;
  else
    if p_score is null or p_score < 0 or p_score > a.max_score then
      raise exception 'The score must be between 0 and %', a.max_score using errcode = 'check_violation';
    end if;
    update public.assignment_submissions
    set status = 'graded', score = p_score, feedback = nullif(btrim(p_feedback), ''), graded_by = (select auth.uid()), graded_at = now()
    where id = s.id;
  end if;
end $$;

-- Replaces a quiz's questions and answer keys atomically. p_questions: [{prompt, options[], correct_index, points}]
create function public.save_quiz(p_assignment_id uuid, p_questions jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare q jsonb; v_id uuid; v_n integer := 0;
begin
  if not (public.is_admin() or public.is_lead_of(public.assignment_stack_id(p_assignment_id))) then
    raise exception 'Not allowed to edit this quiz' using errcode = 'insufficient_privilege';
  end if;
  if not exists (select 1 from public.assignments where id = p_assignment_id and type = 'quiz') then
    raise exception 'This assignment is not a quiz' using errcode = 'check_violation';
  end if;
  if jsonb_typeof(p_questions) <> 'array' then raise exception 'Questions must be a list' using errcode = 'check_violation'; end if;
  if exists (select 1 from public.assignments where id = p_assignment_id and is_published) and jsonb_array_length(p_questions) = 0 then
    raise exception 'A published quiz needs at least one question' using errcode = 'check_violation';
  end if;
  delete from public.assignment_questions where assignment_id = p_assignment_id;
  for q in select * from jsonb_array_elements(p_questions) loop
    v_n := v_n + 1;
    if (q ->> 'correct_index')::integer >= jsonb_array_length(q -> 'options') or (q ->> 'correct_index')::integer < 0 then
      raise exception 'Question % has no valid correct answer', v_n using errcode = 'check_violation';
    end if;
    insert into public.assignment_questions (assignment_id, prompt, options, points, order_index)
    values (p_assignment_id, q ->> 'prompt', q -> 'options', coalesce((q ->> 'points')::integer, 1), v_n)
    returning id into v_id;
    insert into public.assignment_answer_keys (question_id, correct_index) values (v_id, (q ->> 'correct_index')::integer);
  end loop;
end $$;

create function public.ensure_quiz_has_questions() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.is_published and new.type = 'quiz'
     and not exists (select 1 from public.assignment_questions where assignment_id = new.id) then
    raise exception 'Add at least one question before publishing the quiz' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger assignments_quiz_needs_questions before insert or update of is_published, type on public.assignments
  for each row execute function public.ensure_quiz_has_questions();

-- ---------------------------------------------------------------- progress

create type public.progress_summary as (
  lessons_total integer, lessons_done integer,
  assignments_total integer, assignments_passed integer,
  assignment_pct numeric, exam_pct numeric, overall integer
);

-- Weighting (PRD): lessons 40%, assignments 30%, final exam 30%. The exam arrives in Phase 3 (0 until then).
create function public.progress_for(p_user uuid, p_stack_id uuid) returns public.progress_summary
language plpgsql stable security definer set search_path = '' as $$
declare r public.progress_summary;
begin
  select count(*), count(c.lesson_id) into r.lessons_total, r.lessons_done
  from public.lessons l
  join public.modules m on m.id = l.module_id and m.stack_id = p_stack_id and m.is_published
  left join public.lesson_completions c on c.lesson_id = l.id and c.user_id = p_user
  where l.is_published and l.is_required;

  select count(*), count(*) filter (where public.assignment_passed(p_user, a.id)),
         coalesce(avg(coalesce((
           select max(s.score) from public.assignment_submissions s
           where s.assignment_id = a.id and s.user_id = p_user and s.status = 'graded'), 0)::numeric / a.max_score), 0)
  into r.assignments_total, r.assignments_passed, r.assignment_pct
  from public.assignments a
  join public.modules m on m.id = a.module_id and m.stack_id = p_stack_id and m.is_published
  where a.is_published;

  r.exam_pct := 0;
  r.overall := round(
    40 * case when r.lessons_total = 0 then 0 else r.lessons_done::numeric / r.lessons_total end
    + 30 * r.assignment_pct + 30 * r.exam_pct)::integer;
  return r;
end $$;

-- The signed-in student's progress in their current (or most recent completed) stack.
create function public.my_progress() returns public.progress_summary
language sql stable security definer set search_path = '' as $$
  select public.progress_for((select auth.uid()), m.stack_id)
  from public.stack_members m
  where m.user_id = (select auth.uid()) and m.status in ('active', 'completed')
  order by (m.status = 'active') desc, m.joined_at desc
  limit 1;
$$;

-- Per-module state for the signed-in student (the server decides what is locked or complete).
create function public.my_modules() returns table (
  module_id uuid, unlocked boolean, complete boolean,
  lessons_total integer, lessons_done integer,
  assignment_id uuid, assignment_passed boolean, attempts_used integer, best_score integer
)
language sql stable security definer set search_path = '' as $$
  with me as (
    select m.stack_id from public.stack_members m
    where m.user_id = (select auth.uid()) and m.status in ('active', 'completed')
    order by (m.status = 'active') desc, m.joined_at desc limit 1
  )
  select md.id,
    public.module_is_unlocked((select auth.uid()), md.id),
    public.module_is_complete((select auth.uid()), md.id),
    (select count(*)::integer from public.lessons l where l.module_id = md.id and l.is_published and l.is_required),
    (select count(*)::integer from public.lessons l join public.lesson_completions c on c.lesson_id = l.id and c.user_id = (select auth.uid())
       where l.module_id = md.id and l.is_published and l.is_required),
    a.id,
    case when a.id is null then null else public.assignment_passed((select auth.uid()), a.id) end,
    (select count(*)::integer from public.assignment_submissions s where s.assignment_id = a.id and s.user_id = (select auth.uid())),
    (select max(s.score) from public.assignment_submissions s where s.assignment_id = a.id and s.user_id = (select auth.uid()) and s.status = 'graded')
  from public.modules md
  join me on me.stack_id = md.stack_id
  left join public.assignments a on a.module_id = md.id and a.is_published
  where md.is_published
  order by md.order_index;
$$;

-- Class roster with progress, for the stack's leads and admins.
create function public.stack_roster(p_stack_id uuid) returns table (
  user_id uuid, full_name text, email text, phone text, status public.member_status, joined_at timestamptz,
  lessons_done integer, lessons_total integer, assignments_passed integer, assignments_total integer,
  overall integer, last_activity timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not (public.is_admin() or public.is_lead_of(p_stack_id)) then
    raise exception 'Not allowed to view this roster' using errcode = 'insufficient_privilege';
  end if;
  return query
  select p.id, p.full_name, p.email, p.phone, m.status, m.joined_at,
         pr.lessons_done, pr.lessons_total, pr.assignments_passed, pr.assignments_total, pr.overall,
         greatest(
           (select max(c.completed_at) from public.lesson_completions c where c.user_id = p.id),
           (select max(s.submitted_at) from public.assignment_submissions s where s.user_id = p.id)
         )
  from public.stack_members m
  join public.profiles p on p.id = m.user_id
  cross join lateral public.progress_for(p.id, m.stack_id) pr
  where m.stack_id = p_stack_id and m.status in ('active', 'completed')
  order by p.full_name nulls last, p.email;
end $$;

-- ---------------------------------------------------------------- storage

-- Students may only read files of lessons they can currently open (the subquery obeys the lessons RLS).
drop policy "lesson media: read" on storage.objects;
create policy "lesson media: read" on storage.objects for select to authenticated
  using (bucket_id = 'lesson-media' and (
    public.is_admin() or public.is_lead_of(public.storage_stack_id(name))
    or exists (select 1 from public.lessons l where l.content_path = name)
  ));

-- Submission files live at <stack_id>/<student_id>/<assignment_id>/<file>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('submissions', 'submissions', false, 26214400,
  array['application/pdf', 'application/zip', 'image/png', 'image/jpeg', 'text/plain'])
on conflict (id) do nothing;

create policy "submissions: students upload to their own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'submissions'
    and split_part(name, '/', 2) = (select auth.uid())::text
    and public.is_active_member_of(public.storage_stack_id(name)));
create policy "submissions: read" on storage.objects for select to authenticated
  using (bucket_id = 'submissions' and (
    split_part(name, '/', 2) = (select auth.uid())::text
    or public.is_admin() or public.is_lead_of(public.storage_stack_id(name))));
create policy "submissions: students remove their own files" on storage.objects for delete to authenticated
  using (bucket_id = 'submissions' and split_part(name, '/', 2) = (select auth.uid())::text);

-- ---------------------------------------------------------------- privileges
revoke execute on function
  public.is_active_member_of(uuid), public.assignment_module_id(uuid), public.assignment_stack_id(uuid),
  public.assignment_passed(uuid, uuid), public.module_is_complete(uuid, uuid), public.module_is_unlocked(uuid, uuid),
  public.module_open_to_me(uuid), public.complete_lesson(uuid), public.begin_attempt(uuid, public.assignment_type),
  public.submit_quiz(uuid, integer[]), public.submit_assignment(uuid, text, text, text),
  public.grade_submission(uuid, integer, text, boolean), public.save_quiz(uuid, jsonb),
  public.progress_for(uuid, uuid), public.my_progress(), public.my_modules(), public.stack_roster(uuid)
from public, anon;
grant execute on function
  public.is_active_member_of(uuid), public.assignment_module_id(uuid), public.assignment_stack_id(uuid),
  public.assignment_passed(uuid, uuid), public.module_is_complete(uuid, uuid), public.module_is_unlocked(uuid, uuid),
  public.module_open_to_me(uuid), public.complete_lesson(uuid),
  public.submit_quiz(uuid, integer[]), public.submit_assignment(uuid, text, text, text),
  public.grade_submission(uuid, integer, text, boolean), public.save_quiz(uuid, jsonb),
  public.my_progress(), public.my_modules(), public.stack_roster(uuid)
to authenticated;
