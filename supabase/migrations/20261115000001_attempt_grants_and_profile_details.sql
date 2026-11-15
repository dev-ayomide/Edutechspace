-- Functional fixes before launch:
-- 1. Extra attempts. A student who used every attempt on an assignment or the final exam without passing
--    was stuck for good. The stack's leads (and admins) can now grant extra attempts, recorded in the audit log.
-- 2. Applicant details. The name and phone from the approved join application are copied to the new profile,
--    so leads see the student's phone in the roster.

-- ---------------------------------------------------------------- extra attempts

create table public.attempt_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  assignment_id uuid references public.assignments (id) on delete cascade,
  exam_id uuid references public.exams (id) on delete cascade,
  extra integer not null check (extra between 1 and 10),
  reason text check (reason is null or char_length(reason) <= 500),
  granted_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  check ((assignment_id is null) <> (exam_id is null))
);
create index attempt_grants_user_idx on public.attempt_grants (user_id);

alter table public.attempt_grants enable row level security;
create policy "own grants" on public.attempt_grants for select to authenticated using (user_id = (select auth.uid()));
create policy "leads read their grants" on public.attempt_grants for select to authenticated
  using (public.is_lead_of(coalesce(public.assignment_stack_id(assignment_id), public.exam_stack_id(exam_id))));
create policy "admin reads grants" on public.attempt_grants for select to authenticated using (public.is_admin());
revoke all on public.attempt_grants from anon;
revoke insert, update, delete, truncate, references, trigger on public.attempt_grants from authenticated;

-- Internal: extra attempts granted to a user for one assignment or one exam.
create function public.extra_attempts(p_user uuid, p_assignment_id uuid, p_exam_id uuid) returns integer
language sql stable security definer set search_path = '' as $$
  select coalesce(sum(g.extra), 0)::integer from public.attempt_grants g
  where g.user_id = p_user and (g.assignment_id = p_assignment_id or g.exam_id = p_exam_id);
$$;

-- Leads of the stack (or admins) give an active student more attempts at an assignment or the exam.
create function public.grant_extra_attempts(
  p_user_id uuid, p_assignment_id uuid default null, p_exam_id uuid default null,
  p_extra integer default 1, p_reason text default null
) returns void
language plpgsql security definer set search_path = '' as $$
declare v_stack uuid;
begin
  if (p_assignment_id is null) = (p_exam_id is null) then
    raise exception 'Choose one assignment or the exam' using errcode = 'check_violation';
  end if;
  v_stack := coalesce(public.assignment_stack_id(p_assignment_id), public.exam_stack_id(p_exam_id));
  if v_stack is null then raise exception 'Not found' using errcode = 'no_data_found'; end if;
  if not (public.is_admin() or public.is_lead_of(v_stack)) then
    raise exception 'Not allowed to grant attempts in this stack' using errcode = 'insufficient_privilege';
  end if;
  if not exists (select 1 from public.stack_members where user_id = p_user_id and stack_id = v_stack and status = 'active') then
    raise exception 'This student is not active in this stack' using errcode = 'check_violation';
  end if;
  if p_extra is null or p_extra not between 1 and 10 then
    raise exception 'Grant between 1 and 10 attempts' using errcode = 'check_violation';
  end if;
  insert into public.attempt_grants (user_id, assignment_id, exam_id, extra, reason, granted_by)
  values (p_user_id, p_assignment_id, p_exam_id, p_extra, nullif(btrim(p_reason), ''), (select auth.uid()));
  perform public.write_audit('grant_attempts', case when p_exam_id is null then 'assignment' else 'exam' end,
    coalesce(p_assignment_id, p_exam_id)::text,
    jsonb_build_object('user_id', p_user_id, 'stack_id', v_stack, 'extra', p_extra));
end $$;

-- Per-student attempt usage across the stack's assignments and exam, for the lead's student view.
create function public.attempt_overview(p_user_id uuid, p_stack_id uuid) returns table (
  kind text, target_id uuid, title text, module_title text,
  attempts_used integer, attempts_allowed integer, passed boolean
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not (public.is_admin() or public.is_lead_of(p_stack_id)) then
    raise exception 'Not allowed to view this student' using errcode = 'insufficient_privilege';
  end if;
  return query
  select 'assignment'::text, a.id, a.title, m.title,
    (select count(*)::integer from public.assignment_submissions s where s.assignment_id = a.id and s.user_id = p_user_id),
    case when a.max_attempts is null then null else a.max_attempts + public.extra_attempts(p_user_id, a.id, null) end,
    public.assignment_passed(p_user_id, a.id)
  from public.assignments a join public.modules m on m.id = a.module_id
  where m.stack_id = p_stack_id and m.is_published and a.is_published
  union all
  select 'exam'::text, e.id, e.title, null::text,
    (select count(*)::integer from public.exam_attempts t where t.exam_id = e.id and t.user_id = p_user_id),
    case when e.max_attempts is null then null else e.max_attempts + public.extra_attempts(p_user_id, null, e.id) end,
    public.exam_passed(p_user_id, p_stack_id)
  from public.exams e
  where e.stack_id = p_stack_id and e.is_published;
end $$;

-- Assignment attempts now include granted extras.
create or replace function public.begin_attempt(p_assignment_id uuid, p_type public.assignment_type) returns integer
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
  if a.max_attempts is not null and v_used >= a.max_attempts + public.extra_attempts(v_uid, a.id, null) then
    raise exception 'You have used all attempts for this assignment. Ask your stack lead for another attempt.'
      using errcode = 'check_violation';
  end if;
  return v_used + 1;
end $$;

-- The exam's attempt limit now includes granted extras; max_attempts in the result is the student's own limit.
create or replace function public.my_exam() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  m public.stack_members; e public.exams; o public.exam_attempts;
  v_used integer; v_best integer; v_passed boolean; v_cert uuid; v_last timestamptz;
  v_state text; v_next timestamptz; v_count integer; v_allowed integer;
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
  v_allowed := case when e.max_attempts is null then null else e.max_attempts + public.extra_attempts(v_uid, null, e.id) end;

  if v_passed or v_cert is not null then v_state := 'passed';
  elsif o.id is not null then v_state := 'in_progress';
  elsif m.status <> 'active' or not public.all_modules_complete(v_uid, m.stack_id) then v_state := 'locked';
  elsif v_allowed is not null and v_used >= v_allowed then v_state := 'exhausted';
  elsif v_last is not null and v_last + make_interval(hours => e.cooldown_hours) > now() then
    v_state := 'cooldown'; v_next := v_last + make_interval(hours => e.cooldown_hours);
  else v_state := 'ready';
  end if;

  return jsonb_build_object(
    'exam_id', e.id, 'title', e.title, 'instructions', e.instructions,
    'time_limit_minutes', e.time_limit_minutes, 'pass_mark', e.pass_mark,
    'max_attempts', v_allowed, 'cooldown_hours', e.cooldown_hours, 'question_count', v_count,
    'attempts_used', v_used, 'best_score', v_best, 'passed', v_passed, 'state', v_state,
    'next_available_at', v_next, 'certificate_id', v_cert,
    'attempt_id', o.id, 'started_at', o.started_at,
    'deadline', case when o.id is not null and e.time_limit_minutes is not null
                     then o.started_at + make_interval(mins => e.time_limit_minutes) end
  );
end $$;

-- ---------------------------------------------------------------- applicant details on the profile

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(new.email);
  v_role public.user_role;
  v_inv record;
  v_rows integer;
  v_app_name text;
  v_app_phone text;
begin
  select i.role into v_role
  from public.invitations i
  where i.email = v_email and i.status = 'pending' and i.expires_at > now()
  order by (i.role = 'stack_lead') desc, i.created_at
  limit 1;
  v_role := coalesce(v_role, 'student');

  select a.full_name, a.phone into v_app_name, v_app_phone
  from public.stack_applications a
  where a.email = v_email and a.status = 'approved'
  order by a.reviewed_at desc nulls last
  limit 1;

  insert into public.profiles (id, email, full_name, phone, role)
  values (new.id, v_email, coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), v_app_name), v_app_phone, v_role);

  for v_inv in
    select * from public.invitations
    where email = v_email and status = 'pending' and expires_at > now() and role = v_role
    order by created_at
  loop
    if v_inv.role = 'stack_lead' then
      insert into public.stack_leads (user_id, stack_id) values (new.id, v_inv.stack_id) on conflict do nothing;
    else
      insert into public.stack_members (user_id, stack_id) values (new.id, v_inv.stack_id) on conflict do nothing;
    end if;
    get diagnostics v_rows = row_count;
    if v_rows > 0 or v_inv.role = 'stack_lead' then
      update public.invitations set status = 'accepted', accepted_at = now() where id = v_inv.id;
    end if;
  end loop;
  return new;
end $$;

-- Unchanged, except an existing student without a phone gets the one from their new application.
create or replace function public.review_application(p_application_id uuid, p_approve boolean, p_note text default null)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_app public.stack_applications;
  v_profile public.profiles;
  v_inv uuid;
begin
  select * into v_app from public.stack_applications where id = p_application_id for update;
  if not found then raise exception 'Application not found' using errcode = 'no_data_found'; end if;
  if not (public.is_admin() or public.is_lead_of(v_app.stack_id)) then
    raise exception 'Not allowed to review this application' using errcode = 'insufficient_privilege';
  end if;
  if v_app.status <> 'pending' then
    raise exception 'Application was already reviewed' using errcode = 'check_violation';
  end if;

  if p_approve then
    select * into v_profile from public.profiles where lower(email) = v_app.email;
    if found then
      if v_profile.role <> 'student' then
        raise exception 'This email belongs to a % account and cannot join as a student', v_profile.role
          using errcode = 'check_violation';
      end if;
      if exists (select 1 from public.stack_members where user_id = v_profile.id and status = 'active') then
        raise exception 'This student is already in an active stack' using errcode = 'check_violation';
      end if;
      insert into public.stack_members (user_id, stack_id) values (v_profile.id, v_app.stack_id);
      update public.profiles
      set phone = coalesce(nullif(btrim(phone), ''), v_app.phone),
          full_name = coalesce(nullif(btrim(full_name), ''), v_app.full_name)
      where id = v_profile.id;
    else
      insert into public.invitations (email, role, stack_id, invited_by)
      values (v_app.email, 'student', v_app.stack_id, (select auth.uid()))
      on conflict (email, stack_id, role) where status = 'pending' do nothing;
      select id into v_inv from public.invitations
      where email = v_app.email and stack_id = v_app.stack_id and role = 'student' and status = 'pending';
    end if;
  end if;

  update public.stack_applications
  set status = case when p_approve then 'approved'::public.application_status else 'rejected'::public.application_status end,
      reviewed_by = (select auth.uid()), reviewed_at = now(), review_note = p_note
  where id = p_application_id;

  perform public.write_audit(case when p_approve then 'approve_application' else 'reject_application' end,
    'application', p_application_id::text, jsonb_build_object('stack_id', v_app.stack_id));
  return v_inv;
end $$;

-- ---------------------------------------------------------------- privileges
revoke execute on function public.extra_attempts(uuid, uuid, uuid) from public, anon, authenticated;
revoke execute on function
  public.grant_extra_attempts(uuid, uuid, uuid, integer, text), public.attempt_overview(uuid, uuid)
from public, anon;
grant execute on function
  public.grant_extra_attempts(uuid, uuid, uuid, integer, text), public.attempt_overview(uuid, uuid)
to authenticated;
