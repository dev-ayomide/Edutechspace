-- Phase 3: final exam (server-graded), certificate eligibility, issuing, revocation and public verification.
-- A certificate can only come into existence through submit_exam() passing, and cannot be edited afterwards.

create type public.attempt_status as enum ('in_progress', 'submitted', 'expired');

-- ---------------------------------------------------------------- tables

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  stack_id uuid not null unique references public.stacks (id) on delete cascade,
  title text not null default 'Final exam' check (char_length(btrim(title)) between 2 and 160),
  instructions text check (instructions is null or char_length(instructions) <= 10000),
  time_limit_minutes integer check (time_limit_minutes is null or time_limit_minutes between 1 and 600),
  pass_mark integer not null default 60 check (pass_mark between 1 and 100),
  max_attempts integer default 3 check (max_attempts is null or max_attempts between 1 and 20),
  cooldown_hours integer not null default 24 check (cooldown_hours between 0 and 720),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger exams_touch_updated_at before update on public.exams
  for each row execute function public.touch_updated_at();

create table public.exam_questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams (id) on delete cascade,
  prompt text not null check (char_length(btrim(prompt)) between 1 and 1000),
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 6),
  points integer not null default 1 check (points between 1 and 100),
  order_index integer not null default 0
);
create index exam_questions_exam_idx on public.exam_questions (exam_id, order_index);

create table public.exam_answer_keys (
  question_id uuid primary key references public.exam_questions (id) on delete cascade,
  correct_index integer not null check (correct_index >= 0)
);

create table public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  attempt integer not null,
  status public.attempt_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  answers jsonb,
  score integer check (score is null or score >= 0),
  max_score integer,
  passed boolean,
  unique (exam_id, user_id, attempt)
);
create unique index exam_attempts_one_open on public.exam_attempts (exam_id, user_id) where status = 'in_progress';
create index exam_attempts_user_idx on public.exam_attempts (user_id);

create table public.certificate_signatories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  title text not null check (char_length(btrim(title)) between 2 and 120),
  signature_path text check (signature_path is null or char_length(signature_path) <= 300),
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  certificate_no text not null unique,
  user_id uuid not null references public.profiles (id) on delete restrict,
  stack_id uuid not null references public.stacks (id) on delete restrict,
  student_name text not null,
  stack_name text not null,
  final_score integer not null,
  issued_at timestamptz not null default now(),
  signatories jsonb not null default '[]'::jsonb, -- snapshot at issue time: [{name, title, signature_path}]
  revoked_at timestamptz,
  revoked_reason text check (revoked_reason is null or char_length(revoked_reason) <= 500),
  replaced_by uuid references public.certificates (id),
  emailed_at timestamptz
);
create unique index certificates_one_active on public.certificates (user_id, stack_id) where revoked_at is null;
create index certificates_user_idx on public.certificates (user_id);

-- ---------------------------------------------------------------- helpers

create function public.exam_stack_id(p_exam_id uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select e.stack_id from public.exams e where e.id = p_exam_id;
$$;

create function public.all_modules_complete(p_user uuid, p_stack_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.modules m where m.stack_id = p_stack_id and m.is_published)
     and not exists (
       select 1 from public.modules m
       where m.stack_id = p_stack_id and m.is_published and not public.module_is_complete(p_user, m.id)
     );
$$;

create function public.exam_passed(p_user uuid, p_stack_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.exam_attempts a join public.exams e on e.id = a.exam_id
    where e.stack_id = p_stack_id and a.user_id = p_user and a.passed
  );
$$;

-- Attempts that ran past their time limit (plus a 2 minute grace) are closed as failed.
create function public.expire_stale_attempts(p_exam_id uuid, p_user uuid) returns void
language sql security definer set search_path = '' as $$
  update public.exam_attempts a
  set status = 'expired', submitted_at = a.started_at + make_interval(mins => e.time_limit_minutes),
      score = 0, max_score = null, passed = false
  from public.exams e
  where a.exam_id = e.id and a.exam_id = p_exam_id and a.user_id = p_user and a.status = 'in_progress'
    and e.time_limit_minutes is not null
    and a.started_at + make_interval(mins => e.time_limit_minutes) + interval '2 minutes' < now();
$$;

-- Students can read the questions only while they hold a running attempt.
create function public.can_read_exam_questions(p_exam_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.exam_attempts a join public.exams e on e.id = a.exam_id
    where a.exam_id = p_exam_id and a.user_id = (select auth.uid()) and a.status = 'in_progress'
      and (e.time_limit_minutes is null
           or a.started_at + make_interval(mins => e.time_limit_minutes) + interval '2 minutes' > now())
  );
$$;

create function public.ensure_exam_has_questions() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.is_published and not exists (select 1 from public.exam_questions where exam_id = new.id) then
    raise exception 'Add at least one question before publishing the exam' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger exams_need_questions before insert or update of is_published on public.exams
  for each row execute function public.ensure_exam_has_questions();

-- ---------------------------------------------------------------- RLS

alter table public.exams enable row level security;
alter table public.exam_questions enable row level security;
alter table public.exam_answer_keys enable row level security;
alter table public.exam_attempts enable row level security;
alter table public.certificate_signatories enable row level security;
alter table public.certificates enable row level security;

create policy "members read published exam details" on public.exams for select to authenticated
  using (is_published and (public.is_member_of(stack_id)));
create policy "leads manage their exam" on public.exams for all to authenticated
  using (public.is_lead_of(stack_id)) with check (public.is_lead_of(stack_id));
create policy "admin manages exams" on public.exams for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "students read questions during an attempt" on public.exam_questions for select to authenticated
  using (public.can_read_exam_questions(exam_id));
create policy "leads manage exam questions" on public.exam_questions for all to authenticated
  using (public.is_lead_of(public.exam_stack_id(exam_id))) with check (public.is_lead_of(public.exam_stack_id(exam_id)));
create policy "admin manages exam questions" on public.exam_questions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "leads read exam keys" on public.exam_answer_keys for select to authenticated
  using (public.is_lead_of(public.exam_stack_id((select q.exam_id from public.exam_questions q where q.id = question_id))));
create policy "admin reads exam keys" on public.exam_answer_keys for select to authenticated using (public.is_admin());

create policy "own attempts" on public.exam_attempts for select to authenticated using (user_id = (select auth.uid()));
create policy "leads read their attempts" on public.exam_attempts for select to authenticated
  using (public.is_lead_of(public.exam_stack_id(exam_id)));
create policy "admin reads attempts" on public.exam_attempts for select to authenticated using (public.is_admin());

create policy "admin manages signatories" on public.certificate_signatories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "own certificates" on public.certificates for select to authenticated using (user_id = (select auth.uid()));
create policy "leads read their certificates" on public.certificates for select to authenticated
  using (public.is_lead_of(stack_id));
create policy "admin reads certificates" on public.certificates for select to authenticated using (public.is_admin());

revoke all on public.exams, public.exam_questions, public.exam_answer_keys, public.exam_attempts,
  public.certificate_signatories, public.certificates from anon;
-- Attempts, answer keys and certificates are only ever written by the functions below.
revoke insert, update, delete on public.exam_attempts, public.exam_answer_keys, public.certificates from authenticated;

-- ---------------------------------------------------------------- exam authoring

create function public.save_exam_questions(p_exam_id uuid, p_questions jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare q jsonb; v_id uuid; v_n integer := 0;
begin
  if not (public.is_admin() or public.is_lead_of(public.exam_stack_id(p_exam_id))) then
    raise exception 'Not allowed to edit this exam' using errcode = 'insufficient_privilege';
  end if;
  if jsonb_typeof(p_questions) <> 'array' then raise exception 'Questions must be a list' using errcode = 'check_violation'; end if;
  if exists (select 1 from public.exams where id = p_exam_id and is_published) and jsonb_array_length(p_questions) = 0 then
    raise exception 'A published exam needs at least one question' using errcode = 'check_violation';
  end if;
  delete from public.exam_questions where exam_id = p_exam_id;
  for q in select * from jsonb_array_elements(p_questions) loop
    v_n := v_n + 1;
    if (q ->> 'correct_index')::integer >= jsonb_array_length(q -> 'options') or (q ->> 'correct_index')::integer < 0 then
      raise exception 'Question % has no valid correct answer', v_n using errcode = 'check_violation';
    end if;
    insert into public.exam_questions (exam_id, prompt, options, points, order_index)
    values (p_exam_id, q ->> 'prompt', q -> 'options', coalesce((q ->> 'points')::integer, 1), v_n)
    returning id into v_id;
    insert into public.exam_answer_keys (question_id, correct_index) values (v_id, (q ->> 'correct_index')::integer);
  end loop;
end $$;

-- ---------------------------------------------------------------- taking the exam

-- The single source of truth for "where is this student with the exam".
create function public.my_exam() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  m public.stack_members; e public.exams; o public.exam_attempts;
  v_used integer; v_best integer; v_passed boolean; v_cert uuid; v_last timestamptz;
  v_state text; v_next timestamptz; v_count integer;
begin
  select * into m from public.stack_members
  where user_id = v_uid and status in ('active', 'completed')
  order by (status = 'active') desc, joined_at desc limit 1;
  if not found then return null; end if;
  select * into e from public.exams where stack_id = m.stack_id and is_published;
  if not found then return null; end if;

  perform public.expire_stale_attempts(e.id, v_uid);
  select count(*) into v_used from public.exam_attempts where exam_id = e.id and user_id = v_uid;
  select max(score * 100 / nullif(max_score, 0)) into v_best from public.exam_attempts
    where exam_id = e.id and user_id = v_uid and status = 'submitted';
  v_passed := exists (select 1 from public.exam_attempts where exam_id = e.id and user_id = v_uid and passed);
  select id into v_cert from public.certificates where user_id = v_uid and stack_id = m.stack_id and revoked_at is null;
  select * into o from public.exam_attempts where exam_id = e.id and user_id = v_uid and status = 'in_progress';
  select max(submitted_at) into v_last from public.exam_attempts where exam_id = e.id and user_id = v_uid and status <> 'in_progress';
  select count(*) into v_count from public.exam_questions where exam_id = e.id;

  if v_passed or v_cert is not null then v_state := 'passed';
  elsif o.id is not null then v_state := 'in_progress';
  elsif m.status <> 'active' or not public.all_modules_complete(v_uid, m.stack_id) then v_state := 'locked';
  elsif e.max_attempts is not null and v_used >= e.max_attempts then v_state := 'exhausted';
  elsif v_last is not null and v_last + make_interval(hours => e.cooldown_hours) > now() then
    v_state := 'cooldown'; v_next := v_last + make_interval(hours => e.cooldown_hours);
  else v_state := 'ready';
  end if;

  return jsonb_build_object(
    'exam_id', e.id, 'title', e.title, 'instructions', e.instructions,
    'time_limit_minutes', e.time_limit_minutes, 'pass_mark', e.pass_mark,
    'max_attempts', e.max_attempts, 'cooldown_hours', e.cooldown_hours, 'question_count', v_count,
    'attempts_used', v_used, 'best_score', v_best, 'passed', v_passed, 'state', v_state,
    'next_available_at', v_next, 'certificate_id', v_cert,
    'attempt_id', o.id, 'started_at', o.started_at,
    'deadline', case when o.id is not null and e.time_limit_minutes is not null
                     then o.started_at + make_interval(mins => e.time_limit_minutes) end
  );
end $$;

create function public.start_exam(p_exam_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare s jsonb; v_uid uuid := (select auth.uid()); v_attempt integer; v_id uuid;
begin
  s := public.my_exam();
  if s is null or (s ->> 'exam_id')::uuid <> p_exam_id then
    raise exception 'This exam is not available to you' using errcode = 'insufficient_privilege';
  end if;
  case s ->> 'state'
    when 'in_progress' then return s;
    when 'ready' then null;
    when 'locked' then raise exception 'Complete every module before taking the final exam' using errcode = 'check_violation';
    when 'cooldown' then raise exception 'You can try again after the waiting period' using errcode = 'check_violation';
    when 'exhausted' then raise exception 'You have used all attempts for this exam' using errcode = 'check_violation';
    else raise exception 'You have already passed this exam' using errcode = 'check_violation';
  end case;
  select coalesce(max(attempt), 0) + 1 into v_attempt from public.exam_attempts where exam_id = p_exam_id and user_id = v_uid;
  insert into public.exam_attempts (exam_id, user_id, attempt) values (p_exam_id, v_uid, v_attempt) returning id into v_id;
  return public.my_exam();
end $$;

-- Grades server-side. Returns {score, max_score, percent, passed, expired, certificate_id}.
create function public.submit_exam(p_attempt_id uuid, p_answers integer[]) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  a public.exam_attempts; e public.exams; v_uid uuid := (select auth.uid());
  v_count integer; v_total integer; v_earned integer; v_pct integer; v_passed boolean; v_cert uuid; v_deadline timestamptz;
begin
  select * into a from public.exam_attempts where id = p_attempt_id and user_id = v_uid for update;
  if not found then raise exception 'Attempt not found' using errcode = 'no_data_found'; end if;
  if a.status <> 'in_progress' then raise exception 'This attempt was already submitted' using errcode = 'check_violation'; end if;
  select * into e from public.exams where id = a.exam_id;

  if e.time_limit_minutes is not null then
    v_deadline := a.started_at + make_interval(mins => e.time_limit_minutes) + interval '2 minutes';
    if now() > v_deadline then
      update public.exam_attempts set status = 'expired', submitted_at = now(), score = 0, passed = false where id = a.id;
      return jsonb_build_object('score', 0, 'max_score', 0, 'percent', 0, 'passed', false, 'expired', true, 'certificate_id', null);
    end if;
  end if;

  select count(*), coalesce(sum(points), 0) into v_count, v_total from public.exam_questions where exam_id = e.id;
  if coalesce(array_length(p_answers, 1), 0) <> v_count then
    raise exception 'Answer every question before submitting' using errcode = 'check_violation';
  end if;
  select coalesce(sum(q.points), 0) into v_earned
  from (select id, points, row_number() over (order by order_index, id) as n from public.exam_questions where exam_id = e.id) q
  join public.exam_answer_keys k on k.question_id = q.id
  where p_answers[q.n] = k.correct_index;
  v_pct := round(v_earned * 100.0 / v_total);
  v_passed := v_pct >= e.pass_mark;

  update public.exam_attempts
  set status = 'submitted', submitted_at = now(), answers = to_jsonb(p_answers), score = v_earned, max_score = v_total, passed = v_passed
  where id = a.id;

  if v_passed then v_cert := public.issue_certificate_for(v_uid, e.stack_id); end if;
  return jsonb_build_object('score', v_earned, 'max_score', v_total, 'percent', v_pct, 'passed', v_passed,
                            'expired', false, 'certificate_id', v_cert);
end $$;

-- ---------------------------------------------------------------- certificates

create function public.new_certificate_no() returns text
language sql volatile set search_path = '' as $$
  select 'RTS-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
$$;

-- Internal: issues a certificate when, and only when, every requirement is met. Not callable by users.
create function public.issue_certificate_for(p_user uuid, p_stack_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_name text; v_stack text; v_best integer; v_sig jsonb;
begin
  if not exists (select 1 from public.stack_members where user_id = p_user and stack_id = p_stack_id and status = 'active')
     or not public.all_modules_complete(p_user, p_stack_id)
     or not public.exam_passed(p_user, p_stack_id) then
    return null;
  end if;
  select id into v_id from public.certificates where user_id = p_user and stack_id = p_stack_id and revoked_at is null;
  if v_id is not null then return v_id; end if;

  select coalesce(nullif(btrim(p.full_name), ''), p.email) into v_name from public.profiles p where p.id = p_user;
  select s.name into v_stack from public.stacks s where s.id = p_stack_id;
  select max(a.score * 100 / nullif(a.max_score, 0)) into v_best
    from public.exam_attempts a join public.exams e on e.id = a.exam_id
    where e.stack_id = p_stack_id and a.user_id = p_user and a.status = 'submitted';
  select coalesce(jsonb_agg(jsonb_build_object('name', g.name, 'title', g.title, 'signature_path', g.signature_path)
                            order by g.display_order, g.created_at), '[]'::jsonb)
    into v_sig from public.certificate_signatories g where g.is_active;

  insert into public.certificates (certificate_no, user_id, stack_id, student_name, stack_name, final_score, signatories)
  values (public.new_certificate_no(), p_user, p_stack_id, v_name, v_stack, coalesce(v_best, 0), v_sig)
  returning id into v_id;
  update public.stack_members set status = 'completed', ended_at = now()
    where user_id = p_user and stack_id = p_stack_id and status = 'active';
  perform public.write_audit('issue_certificate', 'certificate', v_id::text, jsonb_build_object('stack_id', p_stack_id));
  return v_id;
end $$;

create function public.revoke_certificate(p_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = 'insufficient_privilege'; end if;
  update public.certificates set revoked_at = now(), revoked_reason = nullif(btrim(p_reason), '')
    where id = p_id and revoked_at is null;
  if not found then raise exception 'Certificate not found or already revoked' using errcode = 'no_data_found'; end if;
  perform public.write_audit('revoke_certificate', 'certificate', p_id::text, jsonb_build_object('reason', p_reason));
end $$;

-- Replaces a certificate (e.g. after a name correction or once signatories are configured).
create function public.reissue_certificate(p_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare c public.certificates; v_new uuid; v_name text; v_sig jsonb;
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = 'insufficient_privilege'; end if;
  select * into c from public.certificates where id = p_id for update;
  if not found then raise exception 'Certificate not found' using errcode = 'no_data_found'; end if;
  select coalesce(nullif(btrim(p.full_name), ''), p.email) into v_name from public.profiles p where p.id = c.user_id;
  select coalesce(jsonb_agg(jsonb_build_object('name', g.name, 'title', g.title, 'signature_path', g.signature_path)
                            order by g.display_order, g.created_at), '[]'::jsonb)
    into v_sig from public.certificate_signatories g where g.is_active;
  if c.revoked_at is null then
    update public.certificates set revoked_at = now(), revoked_reason = 'Reissued' where id = c.id;
  end if;
  insert into public.certificates (certificate_no, user_id, stack_id, student_name, stack_name, final_score, signatories)
  values (public.new_certificate_no(), c.user_id, c.stack_id, v_name, c.stack_name, c.final_score, v_sig)
  returning id into v_new;
  update public.certificates set replaced_by = v_new where id = c.id;
  perform public.write_audit('reissue_certificate', 'certificate', v_new::text, jsonb_build_object('replaces', c.id));
  return v_new;
end $$;

-- Public verification: reveals only what is printed on the certificate, and only for an exact number.
create function public.verify_certificate(p_number text) returns table (
  certificate_no text, status text, student_name text, stack_name text, issued_at timestamptz, revoked_at timestamptz
)
language sql stable security definer set search_path = '' as $$
  select c.certificate_no, case when c.revoked_at is null then 'valid' else 'revoked' end,
         c.student_name, c.stack_name, c.issued_at, c.revoked_at
  from public.certificates c
  where c.certificate_no = upper(btrim(p_number));
$$;

-- ---------------------------------------------------------------- progress now includes the exam

create or replace function public.progress_for(p_user uuid, p_stack_id uuid) returns public.progress_summary
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

  select coalesce(max(a.score::numeric / nullif(a.max_score, 0)), 0) into r.exam_pct
  from public.exam_attempts a join public.exams e on e.id = a.exam_id
  where e.stack_id = p_stack_id and a.user_id = p_user and a.status = 'submitted';

  r.overall := round(
    40 * case when r.lessons_total = 0 then 0 else r.lessons_done::numeric / r.lessons_total end
    + 30 * r.assignment_pct + 30 * r.exam_pct)::integer;
  -- A certified student has, by definition, met every requirement.
  if exists (select 1 from public.certificates where user_id = p_user and stack_id = p_stack_id and revoked_at is null) then
    r.overall := 100;
  end if;
  return r;
end $$;

-- ---------------------------------------------------------------- signature images (public: they print on certificates)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('signatures', 'signatures', true, 1048576, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "signatures: admin uploads" on storage.objects for insert to authenticated
  with check (bucket_id = 'signatures' and public.is_admin());
create policy "signatures: admin replaces" on storage.objects for update to authenticated
  using (bucket_id = 'signatures' and public.is_admin());
create policy "signatures: admin removes" on storage.objects for delete to authenticated
  using (bucket_id = 'signatures' and public.is_admin());
create policy "signatures: readable by signed-in users" on storage.objects for select to authenticated
  using (bucket_id = 'signatures');

-- ---------------------------------------------------------------- privileges
revoke execute on function
  public.exam_stack_id(uuid), public.all_modules_complete(uuid, uuid), public.exam_passed(uuid, uuid),
  public.expire_stale_attempts(uuid, uuid), public.can_read_exam_questions(uuid), public.save_exam_questions(uuid, jsonb),
  public.my_exam(), public.start_exam(uuid), public.submit_exam(uuid, integer[]), public.new_certificate_no(),
  public.issue_certificate_for(uuid, uuid), public.revoke_certificate(uuid, text), public.reissue_certificate(uuid),
  public.verify_certificate(text)
from public, anon;
grant execute on function
  public.exam_stack_id(uuid), public.all_modules_complete(uuid, uuid), public.exam_passed(uuid, uuid),
  public.can_read_exam_questions(uuid), public.save_exam_questions(uuid, jsonb), public.my_exam(),
  public.start_exam(uuid), public.submit_exam(uuid, integer[]), public.revoke_certificate(uuid, text),
  public.reissue_certificate(uuid)
to authenticated;
grant execute on function public.verify_certificate(text) to anon, authenticated;

-- ---------------------------------------------------------------- hardening: internal functions
-- Supabase grants EXECUTE on new functions to signed-in users by default, so "not granted" is not enough.
-- These helpers take a user id or write privileged data; they run only inside other security-definer
-- functions (which execute as the owner) and must never be callable directly through the API.
revoke execute on function
  public.write_audit(text, text, text, jsonb),
  public.begin_attempt(uuid, public.assignment_type),
  public.progress_for(uuid, uuid),
  public.module_is_complete(uuid, uuid),
  public.module_is_unlocked(uuid, uuid),
  public.assignment_passed(uuid, uuid),
  public.assignment_module_id(uuid),
  public.all_modules_complete(uuid, uuid),
  public.exam_passed(uuid, uuid),
  public.expire_stale_attempts(uuid, uuid),
  public.issue_certificate_for(uuid, uuid),
  public.new_certificate_no()
from authenticated, anon, public;
