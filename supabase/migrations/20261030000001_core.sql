-- Phase 0 foundation: roles, stacks, leads, memberships, admissions, invitations, audit log.
-- All access control lives here (RLS + security-definer functions). The UI guards are UX only.
--
-- Project setup (Supabase dashboard): DISABLE public sign-ups. Accounts are created only through
-- invitations (admin-invited leads, lead-approved students), which the on_auth_user_created trigger honours.
--
-- Convention for every later migration: new tables must enable RLS, and must revoke write privileges
-- from `anon` (see the end of this file) because Supabase grants them by default.

create type public.user_role as enum ('student', 'stack_lead', 'admin');
create type public.member_status as enum ('active', 'completed', 'withdrawn');
create type public.application_status as enum ('pending', 'approved', 'rejected');
create type public.invitation_status as enum ('pending', 'accepted', 'revoked');

-- ---------------------------------------------------------------- tables

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  avatar_url text,
  role public.user_role not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index profiles_email_key on public.profiles (lower(email));

create table public.stacks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.stack_leads (
  user_id uuid not null references public.profiles (id) on delete cascade,
  stack_id uuid not null references public.stacks (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, stack_id)
);
create index stack_leads_stack_id_idx on public.stack_leads (stack_id);

-- History is kept: one row per stay in a stack. A student may have only one ACTIVE row.
create table public.stack_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  stack_id uuid not null references public.stacks (id) on delete cascade,
  status public.member_status not null default 'active',
  joined_at timestamptz not null default now(),
  ended_at timestamptz,
  check ((status = 'active') = (ended_at is null))
);
create unique index stack_members_one_active_per_user on public.stack_members (user_id) where status = 'active';
create index stack_members_stack_id_idx on public.stack_members (stack_id);
create index stack_members_user_id_idx on public.stack_members (user_id);

create table public.stack_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text not null check (email = lower(email) and char_length(email) <= 254 and email like '%_@_%._%'),
  phone text check (phone is null or char_length(phone) <= 30),
  stack_id uuid not null references public.stacks (id) on delete cascade,
  motivation text check (motivation is null or char_length(motivation) <= 1000),
  status public.application_status not null default 'pending',
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  review_note text check (review_note is null or char_length(review_note) <= 500),
  created_at timestamptz not null default now()
);
create unique index stack_applications_one_pending on public.stack_applications (email, stack_id) where status = 'pending';
create index stack_applications_stack_status_idx on public.stack_applications (stack_id, status);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email = lower(email)),
  role public.user_role not null check (role in ('student', 'stack_lead')),
  stack_id uuid not null references public.stacks (id) on delete cascade,
  invited_by uuid references public.profiles (id) on delete set null,
  status public.invitation_status not null default 'pending',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days',
  accepted_at timestamptz
);
create unique index invitations_one_pending on public.invitations (email, stack_id, role) where status = 'pending';
create index invitations_email_idx on public.invitations (email);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- helpers (security definer: bypass RLS safely)

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin');
$$;

create function public.is_lead_of(p_stack_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.stack_leads l where l.user_id = (select auth.uid()) and l.stack_id = p_stack_id
  );
$$;

-- True when the caller leads a stack that the given student is (or was) a member of.
create function public.leads_student(p_student_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.stack_members m
    join public.stack_leads l on l.stack_id = m.stack_id
    where m.user_id = p_student_id and l.user_id = (select auth.uid())
  );
$$;

create function public.write_audit(p_action text, p_entity text, p_entity_id text, p_meta jsonb default '{}'::jsonb)
returns void language sql security definer set search_path = '' as $$
  insert into public.audit_log (actor_id, action, entity, entity_id, meta)
  values ((select auth.uid()), p_action, p_entity, p_entity_id, p_meta);
$$;

-- ---------------------------------------------------------------- triggers

create function public.touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;
create trigger profiles_touch_updated_at before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Only students may be members; only stack leads may lead. A lead can never be a student.
create function public.enforce_member_is_student() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.profiles p where p.id = new.user_id and p.role = 'student') then
    raise exception 'Only students can join a stack' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger stack_members_student_only before insert on public.stack_members
  for each row execute function public.enforce_member_is_student();

create function public.enforce_lead_is_lead() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.profiles p where p.id = new.user_id and p.role = 'stack_lead') then
    raise exception 'Only stack leads can be assigned to lead a stack' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger stack_leads_lead_only before insert on public.stack_leads
  for each row execute function public.enforce_lead_is_lead();

-- Creates the profile for every new auth user and honours pending invitations.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(new.email);
  v_role public.user_role;
  v_inv record;
  v_rows integer;
begin
  select i.role into v_role
  from public.invitations i
  where i.email = v_email and i.status = 'pending' and i.expires_at > now()
  order by (i.role = 'stack_lead') desc, i.created_at
  limit 1;
  v_role := coalesce(v_role, 'student');

  insert into public.profiles (id, email, full_name, role)
  values (new.id, v_email, nullif(new.raw_user_meta_data ->> 'full_name', ''), v_role);

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
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- RPCs (the only write paths for sensitive data)

create function public.create_lead_invitation(p_email text, p_stack_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(trim(p_email));
  v_id uuid;
  v_existing public.user_role;
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = 'insufficient_privilege'; end if;
  if not exists (select 1 from public.stacks where id = p_stack_id and is_active) then
    raise exception 'Unknown or inactive stack' using errcode = 'foreign_key_violation';
  end if;
  select role into v_existing from public.profiles where lower(email) = v_email;
  if v_existing is not null and v_existing <> 'stack_lead' then
    raise exception 'This email already belongs to a % account', v_existing using errcode = 'check_violation';
  end if;
  insert into public.invitations (email, role, stack_id, invited_by)
  values (v_email, 'stack_lead', p_stack_id, (select auth.uid()))
  returning id into v_id;
  perform public.write_audit('invite_lead', 'invitation', v_id::text, jsonb_build_object('email', v_email, 'stack_id', p_stack_id));
  return v_id;
end $$;

create function public.revoke_invitation(p_invitation_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = 'insufficient_privilege'; end if;
  update public.invitations set status = 'revoked' where id = p_invitation_id and status = 'pending';
  perform public.write_audit('revoke_invitation', 'invitation', p_invitation_id::text);
end $$;

-- Approve or reject a join application. Admins and the stack's leads may review.
-- Returns the new invitation id (new users), or null when an existing student was added directly.
create function public.review_application(p_application_id uuid, p_approve boolean, p_note text default null)
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

create function public.withdraw_from_active_stack() returns void
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  update public.stack_members set status = 'withdrawn', ended_at = now()
  where user_id = (select auth.uid()) and status = 'active'
  returning id into v_id;
  if v_id is null then raise exception 'No active stack to withdraw from' using errcode = 'no_data_found'; end if;
  perform public.write_audit('withdraw', 'stack_member', v_id::text);
end $$;

create function public.admin_set_role(p_user_id uuid, p_role public.user_role) returns void
language plpgsql security definer set search_path = '' as $$
declare v_old public.user_role;
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = 'insufficient_privilege'; end if;
  if p_user_id = (select auth.uid()) then
    raise exception 'You cannot change your own role' using errcode = 'check_violation';
  end if;
  select role into v_old from public.profiles where id = p_user_id for update;
  if not found then raise exception 'User not found' using errcode = 'no_data_found'; end if;
  if p_role = 'stack_lead' and exists (select 1 from public.stack_members where user_id = p_user_id and status = 'active') then
    raise exception 'An active student cannot become a lead' using errcode = 'check_violation';
  end if;
  if v_old = 'stack_lead' and p_role <> 'stack_lead' then
    delete from public.stack_leads where user_id = p_user_id;
  end if;
  update public.profiles set role = p_role where id = p_user_id;
  perform public.write_audit('set_role', 'profile', p_user_id::text, jsonb_build_object('from', v_old, 'to', p_role));
end $$;

-- ---------------------------------------------------------------- RLS

alter table public.profiles enable row level security;
alter table public.stacks enable row level security;
alter table public.stack_leads enable row level security;
alter table public.stack_members enable row level security;
alter table public.stack_applications enable row level security;
alter table public.invitations enable row level security;
alter table public.audit_log enable row level security;

-- profiles
create policy "own profile" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "admin reads profiles" on public.profiles for select to authenticated using (public.is_admin());
create policy "leads read their students" on public.profiles for select to authenticated using (public.leads_student(id));
create policy "update own profile" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- stacks
create policy "anyone reads active stacks" on public.stacks for select to anon, authenticated using (is_active);
create policy "admin manages stacks" on public.stacks for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- stack_leads
create policy "own lead rows" on public.stack_leads for select to authenticated using (user_id = (select auth.uid()));
create policy "co-leads see each other" on public.stack_leads for select to authenticated using (public.is_lead_of(stack_id));
create policy "admin manages leads" on public.stack_leads for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- stack_members (writes go through RPCs or admin)
create policy "own memberships" on public.stack_members for select to authenticated using (user_id = (select auth.uid()));
create policy "leads read their roster" on public.stack_members for select to authenticated using (public.is_lead_of(stack_id));
create policy "admin manages memberships" on public.stack_members for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- stack_applications: anyone can apply; only the stack's leads and admins can read; reviews go through review_application()
create policy "anyone can apply" on public.stack_applications for insert to anon, authenticated
  with check (
    status = 'pending' and reviewed_by is null and reviewed_at is null and review_note is null
    and exists (select 1 from public.stacks s where s.id = stack_id and s.is_active)
  );
create policy "leads read their applications" on public.stack_applications for select to authenticated
  using (public.is_lead_of(stack_id));
create policy "admin reads applications" on public.stack_applications for select to authenticated using (public.is_admin());

-- invitations and audit log: admin read only; writes via RPCs
create policy "admin reads invitations" on public.invitations for select to authenticated using (public.is_admin());
create policy "admin reads audit log" on public.audit_log for select to authenticated using (public.is_admin());

-- ---------------------------------------------------------------- privileges

-- Users may edit only their own contact details. role/email can never be changed directly.
revoke update on public.profiles from anon, authenticated;
grant update (full_name, phone, avatar_url) on public.profiles to authenticated;

-- Defence in depth: anon gets nothing it does not need (Supabase grants everything by default).
revoke insert, update, delete, truncate on all tables in schema public from anon;
grant insert on public.stack_applications to anon;

-- Helpers and RPCs: callable by signed-in users only.
revoke execute on all functions in schema public from public, anon;
grant execute on function
  public.is_admin(), public.is_lead_of(uuid), public.leads_student(uuid),
  public.create_lead_invitation(text, uuid), public.revoke_invitation(uuid),
  public.review_application(uuid, boolean, text), public.withdraw_from_active_stack(),
  public.admin_set_role(uuid, public.user_role)
to authenticated;
