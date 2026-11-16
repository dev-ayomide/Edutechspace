-- Phase 1: stack content (modules, lessons), lesson file storage, reordering, lead assignment.

-- ---------------------------------------------------------------- helpers

-- Students keep access to a stack's content while active and after completing it (not after withdrawing).
create function public.is_member_of(p_stack_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.stack_members m
    where m.user_id = (select auth.uid()) and m.stack_id = p_stack_id and m.status in ('active', 'completed')
  );
$$;

-- ---------------------------------------------------------------- tables

create type public.lesson_type as enum ('video', 'pdf', 'text');

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  stack_id uuid not null references public.stacks (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 2 and 160),
  description text check (description is null or char_length(description) <= 2000),
  order_index integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index modules_stack_order_idx on public.modules (stack_id, order_index);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 2 and 160),
  description text check (description is null or char_length(description) <= 2000),
  lesson_type public.lesson_type not null,
  content_url text check (content_url is null or content_url ~* '^https?://\S+$'),
  content_path text check (content_path is null or char_length(content_path) <= 500),
  content_text text check (content_text is null or char_length(content_text) <= 50000),
  duration_minutes integer check (duration_minutes is null or duration_minutes between 1 and 1000),
  order_index integer not null default 0,
  is_required boolean not null default true,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- text lessons carry text; video and pdf lessons carry exactly one of an external link or an uploaded file
  constraint lesson_shape_matches_type check (
    (lesson_type = 'text' and content_url is null and content_path is null)
    or (lesson_type <> 'text' and content_text is null and not (content_url is not null and content_path is not null))
  ),
  -- drafts may be incomplete; a published lesson must have its content
  constraint published_lesson_has_content check (
    not is_published or (
      case when lesson_type = 'text' then content_text is not null and btrim(content_text) <> ''
           else content_url is not null or content_path is not null end
    )
  )
);
create index lessons_module_order_idx on public.lessons (module_id, order_index);

create trigger modules_touch_updated_at before update on public.modules
  for each row execute function public.touch_updated_at();
create trigger lessons_touch_updated_at before update on public.lessons
  for each row execute function public.touch_updated_at();

-- New rows go to the end unless an explicit position is given.
create function public.set_module_order() returns trigger language plpgsql as $$
begin
  if new.order_index = 0 then
    select coalesce(max(order_index), 0) + 1 into new.order_index from public.modules where stack_id = new.stack_id;
  end if;
  return new;
end $$;
create trigger modules_set_order before insert on public.modules
  for each row execute function public.set_module_order();

create function public.set_lesson_order() returns trigger language plpgsql as $$
begin
  if new.order_index = 0 then
    select coalesce(max(order_index), 0) + 1 into new.order_index from public.lessons where module_id = new.module_id;
  end if;
  return new;
end $$;
create trigger lessons_set_order before insert on public.lessons
  for each row execute function public.set_lesson_order();

-- ---------------------------------------------------------------- more helpers (need the tables above)

create function public.module_stack_id(p_module_id uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select m.stack_id from public.modules m where m.id = p_module_id;
$$;

create function public.module_visible_to_member(p_module_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.modules m
    where m.id = p_module_id and m.is_published and public.is_member_of(m.stack_id)
  );
$$;

-- ---------------------------------------------------------------- RLS

alter table public.modules enable row level security;
alter table public.lessons enable row level security;

create policy "members read published modules" on public.modules for select to authenticated
  using (is_published and public.is_member_of(stack_id));
create policy "leads manage their modules" on public.modules for all to authenticated
  using (public.is_lead_of(stack_id)) with check (public.is_lead_of(stack_id));
create policy "admin manages modules" on public.modules for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "members read published lessons" on public.lessons for select to authenticated
  using (is_published and public.module_visible_to_member(module_id));
create policy "leads manage their lessons" on public.lessons for all to authenticated
  using (public.is_lead_of(public.module_stack_id(module_id)))
  with check (public.is_lead_of(public.module_stack_id(module_id)));
create policy "admin manages lessons" on public.lessons for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

revoke all on public.modules, public.lessons from anon;

-- ---------------------------------------------------------------- reordering

create function public.reorder_modules(p_stack_id uuid, p_ids uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not (public.is_admin() or public.is_lead_of(p_stack_id)) then
    raise exception 'Not allowed to reorder this stack' using errcode = 'insufficient_privilege';
  end if;
  if coalesce(array_length(p_ids, 1), 0) <> (select count(*) from public.modules where stack_id = p_stack_id)
     or (select count(distinct x) from unnest(p_ids) x) <> coalesce(array_length(p_ids, 1), 0)
     or exists (select 1 from unnest(p_ids) x where not exists (
          select 1 from public.modules m where m.id = x and m.stack_id = p_stack_id)) then
    raise exception 'The list must contain every module of the stack exactly once' using errcode = 'check_violation';
  end if;
  update public.modules m set order_index = o.ord
  from unnest(p_ids) with ordinality as o (id, ord)
  where m.id = o.id;
end $$;

create function public.reorder_lessons(p_module_id uuid, p_ids uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
declare v_stack uuid := public.module_stack_id(p_module_id);
begin
  if v_stack is null or not (public.is_admin() or public.is_lead_of(v_stack)) then
    raise exception 'Not allowed to reorder this module' using errcode = 'insufficient_privilege';
  end if;
  if coalesce(array_length(p_ids, 1), 0) <> (select count(*) from public.lessons where module_id = p_module_id)
     or (select count(distinct x) from unnest(p_ids) x) <> coalesce(array_length(p_ids, 1), 0)
     or exists (select 1 from unnest(p_ids) x where not exists (
          select 1 from public.lessons l where l.id = x and l.module_id = p_module_id)) then
    raise exception 'The list must contain every lesson of the module exactly once' using errcode = 'check_violation';
  end if;
  update public.lessons l set order_index = o.ord
  from unnest(p_ids) with ordinality as o (id, ord)
  where l.id = o.id;
end $$;

-- ---------------------------------------------------------------- lead assignment

-- An email that already belongs to a lead is assigned directly (returns null: no invitation email needed).
create or replace function public.create_lead_invitation(p_email text, p_stack_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(trim(p_email));
  v_id uuid;
  v_user uuid;
  v_existing public.user_role;
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = 'insufficient_privilege'; end if;
  if not exists (select 1 from public.stacks where id = p_stack_id and is_active) then
    raise exception 'Unknown or inactive stack' using errcode = 'foreign_key_violation';
  end if;
  select id, role into v_user, v_existing from public.profiles where lower(email) = v_email;
  if v_existing is not null and v_existing <> 'stack_lead' then
    raise exception 'This email already belongs to a % account', v_existing using errcode = 'check_violation';
  end if;
  if v_existing = 'stack_lead' then
    insert into public.stack_leads (user_id, stack_id) values (v_user, p_stack_id) on conflict do nothing;
    perform public.write_audit('assign_lead', 'stack_lead', v_user::text, jsonb_build_object('stack_id', p_stack_id));
    return null;
  end if;
  insert into public.invitations (email, role, stack_id, invited_by)
  values (v_email, 'stack_lead', p_stack_id, (select auth.uid()))
  returning id into v_id;
  perform public.write_audit('invite_lead', 'invitation', v_id::text, jsonb_build_object('email', v_email, 'stack_id', p_stack_id));
  return v_id;
end $$;

create function public.remove_lead_from_stack(p_user_id uuid, p_stack_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = 'insufficient_privilege'; end if;
  delete from public.stack_leads where user_id = p_user_id and stack_id = p_stack_id;
  perform public.write_audit('remove_lead', 'stack_lead', p_user_id::text, jsonb_build_object('stack_id', p_stack_id));
end $$;

-- ---------------------------------------------------------------- lesson file storage
-- Path convention: <stack_id>/<module_id>/<file>. The first folder decides who may read and write.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lesson-media', 'lesson-media', false, 104857600, array['application/pdf', 'video/mp4', 'video/webm'])
on conflict (id) do nothing;

create function public.storage_stack_id(p_name text) returns uuid
language sql immutable set search_path = '' as $$
  select case
    when split_part(p_name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then split_part(p_name, '/', 1)::uuid
  end;
$$;

create policy "lesson media: read" on storage.objects for select to authenticated
  using (bucket_id = 'lesson-media' and (
    public.is_admin() or public.is_lead_of(public.storage_stack_id(name)) or public.is_member_of(public.storage_stack_id(name))
  ));
create policy "lesson media: upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'lesson-media' and (public.is_admin() or public.is_lead_of(public.storage_stack_id(name))));
create policy "lesson media: replace" on storage.objects for update to authenticated
  using (bucket_id = 'lesson-media' and (public.is_admin() or public.is_lead_of(public.storage_stack_id(name))));
create policy "lesson media: delete" on storage.objects for delete to authenticated
  using (bucket_id = 'lesson-media' and (public.is_admin() or public.is_lead_of(public.storage_stack_id(name))));

-- ---------------------------------------------------------------- privileges for the new functions
revoke execute on function
  public.is_member_of(uuid), public.module_stack_id(uuid), public.module_visible_to_member(uuid),
  public.reorder_modules(uuid, uuid[]), public.reorder_lessons(uuid, uuid[]),
  public.create_lead_invitation(text, uuid), public.remove_lead_from_stack(uuid, uuid), public.storage_stack_id(text)
from public, anon;
grant execute on function
  public.is_member_of(uuid), public.module_stack_id(uuid), public.module_visible_to_member(uuid),
  public.reorder_modules(uuid, uuid[]), public.reorder_lessons(uuid, uuid[]),
  public.create_lead_invitation(text, uuid), public.remove_lead_from_stack(uuid, uuid), public.storage_stack_id(text)
to authenticated;
