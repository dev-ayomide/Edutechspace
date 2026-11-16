-- Content access tests: modules, lessons, reordering, lead assignment and lesson file storage.
\set admin '''a0000000-0000-0000-0000-000000000001'''
\set lead_fe '''b0000000-0000-0000-0000-000000000001'''
\set lead_be '''b1000000-0000-0000-0000-000000000001'''
\set s_fe '''c0000000-0000-0000-0000-000000000001'''
\set s_be '''c1000000-0000-0000-0000-000000000001'''
\set s_none '''c2000000-0000-0000-0000-000000000001'''
\set s_withdrawn '''c3000000-0000-0000-0000-000000000001'''
\set s_done '''c4000000-0000-0000-0000-000000000001'''

-- ---------------------------------------------------------------- fixtures (superuser)
insert into auth.users (id, email) values
  (:admin, 'admin@x.test'), (:lead_fe, 'lead.fe@x.test'), (:lead_be, 'lead.be@x.test'),
  (:s_fe, 's.fe@x.test'), (:s_be, 's.be@x.test'), (:s_none, 's.none@x.test'),
  (:s_withdrawn, 's.wd@x.test'), (:s_done, 's.done@x.test');
update public.profiles set role = 'admin' where id = :admin;
update public.profiles set role = 'stack_lead' where id in (:lead_fe, :lead_be);
insert into public.stack_leads (user_id, stack_id) select :lead_fe, id from public.stacks where slug = 'frontend';
insert into public.stack_leads (user_id, stack_id) select :lead_be, id from public.stacks where slug = 'backend';
insert into public.stack_members (user_id, stack_id) select :s_fe, id from public.stacks where slug = 'frontend';
insert into public.stack_members (user_id, stack_id) select :s_be, id from public.stacks where slug = 'backend';
insert into public.stack_members (user_id, stack_id, status, ended_at)
  select :s_withdrawn, id, 'withdrawn', now() from public.stacks where slug = 'frontend';
insert into public.stack_members (user_id, stack_id, status, ended_at)
  select :s_done, id, 'completed', now() from public.stacks where slug = 'frontend';
select set_config('test.fe', (select id::text from public.stacks where slug = 'frontend'), false);
select set_config('test.be', (select id::text from public.stacks where slug = 'backend'), false);

-- ---------------------------------------------------------------- leads build content
set role authenticated;
select set_config('request.jwt.claim.sub', :lead_fe, false);
do $$ declare
  fe uuid := current_setting('test.fe')::uuid;
  be uuid := current_setting('test.be')::uuid;
  m1 uuid; m2 uuid; m3 uuid; l1 uuid; l2 uuid; l3 uuid;
begin
  insert into public.modules (stack_id, title, is_published) values (fe, 'HTML basics', true) returning id into m1;
  insert into public.modules (stack_id, title) values (fe, 'CSS basics') returning id into m2;
  insert into public.modules (stack_id, title) values (fe, 'JavaScript') returning id into m3;
  assert (select array_agg(order_index order by order_index) from public.modules where stack_id = fe) = array[1, 2, 3],
    'modules get sequential order automatically';
  perform set_config('test.m1', m1::text, false);
  perform set_config('test.m2', m2::text, false);
  perform set_config('test.m3', m3::text, false);

  begin
    insert into public.modules (stack_id, title) values (be, 'Hijack');
    raise exception 'lead must not add modules to another stack';
  exception when insufficient_privilege then null; end;

  -- lessons: a draft may be empty, a published one may not
  insert into public.lessons (module_id, title, lesson_type) values (m1, 'Intro video', 'video') returning id into l1;
  begin
    update public.lessons set is_published = true where id = l1;
    raise exception 'published lesson without content must fail';
  exception when check_violation then null; end;
  update public.lessons set content_url = 'https://example.com/v.mp4', is_published = true where id = l1;

  insert into public.lessons (module_id, title, lesson_type, content_text, is_published)
    values (m1, 'Reading', 'text', '# Tags', true) returning id into l2;
  insert into public.lessons (module_id, title, lesson_type) values (m1, 'Draft lesson', 'pdf') returning id into l3;
  assert (select array_agg(order_index order by order_index) from public.lessons where module_id = m1) = array[1, 2, 3],
    'lessons get sequential order automatically';
  perform set_config('test.l1', l1::text, false);
  perform set_config('test.l2', l2::text, false);
  perform set_config('test.l3', l3::text, false);

  begin
    update public.lessons set content_path = 'x/y.pdf', content_url = 'https://a.b' where id = l3;
    raise exception 'both a link and a file must fail';
  exception when check_violation then null; end;
  begin
    insert into public.lessons (module_id, title, lesson_type, content_url) values (m1, 'Bad text', 'text', 'https://a.b');
    raise exception 'text lesson with a link must fail';
  exception when check_violation then null; end;
  begin
    insert into public.lessons (module_id, title, lesson_type, content_url) values (m1, 'Bad url', 'video', 'javascript:alert(1)');
    raise exception 'non-http link must fail';
  exception when check_violation then null; end;

  -- lead cannot move a lesson into another stack's module
  begin
    insert into public.modules (stack_id, title) values (be, 'x');
  exception when insufficient_privilege then null; end;
end $$;

-- reordering
do $$ declare
  fe uuid := current_setting('test.fe')::uuid;
  m1 uuid := current_setting('test.m1')::uuid; m2 uuid := current_setting('test.m2')::uuid; m3 uuid := current_setting('test.m3')::uuid;
  l1 uuid := current_setting('test.l1')::uuid; l2 uuid := current_setting('test.l2')::uuid; l3 uuid := current_setting('test.l3')::uuid;
begin
  perform public.reorder_modules(fe, array[m3, m1, m2]);
  assert (select array_agg(id order by order_index) from public.modules where stack_id = fe) = array[m3, m1, m2], 'modules reordered';
  perform public.reorder_lessons(m1, array[l3, l2, l1]);
  assert (select array_agg(id order by order_index) from public.lessons where module_id = m1) = array[l3, l2, l1], 'lessons reordered';
  begin
    perform public.reorder_modules(fe, array[m1, m2]);
    raise exception 'incomplete list must fail';
  exception when check_violation then null; end;
  begin
    perform public.reorder_modules(fe, array[m1, m1, m2]);
    raise exception 'duplicate ids must fail';
  exception when check_violation then null; end;
end $$;

-- storage: leads upload into their own stack folder only
insert into storage.objects (bucket_id, name) values
  ('lesson-media', current_setting('test.fe') || '/' || current_setting('test.m1') || '/intro.pdf');
do $$ begin
  begin
    insert into storage.objects (bucket_id, name) values ('lesson-media', current_setting('test.be') || '/x/evil.pdf');
    raise exception 'lead must not upload into another stack folder';
  exception when insufficient_privilege then null; end;
  begin
    insert into storage.objects (bucket_id, name) values ('lesson-media', 'not-a-uuid/x.pdf');
    raise exception 'malformed path must be rejected';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
-- a backend object exists (seeded by superuser) for the read checks below
insert into storage.objects (bucket_id, name) values ('lesson-media', current_setting('test.be') || '/m/b.pdf');

-- ---------------------------------------------------------------- other leads
set role authenticated;
select set_config('request.jwt.claim.sub', :lead_be, false);
do $$ declare n int; begin
  assert (select count(*) from public.modules) = 0, 'other stack lead sees none of frontend''s modules (incl. drafts)';
  assert (select count(*) from public.lessons) = 0, 'other stack lead sees none of frontend''s lessons';
  update public.modules set title = 'Hacked' where id = current_setting('test.m1')::uuid;
  get diagnostics n = row_count;
  assert n = 0, 'other lead cannot edit modules';
  delete from public.lessons where id = current_setting('test.l1')::uuid;
  get diagnostics n = row_count;
  assert n = 0, 'other lead cannot delete lessons';
  begin
    perform public.reorder_modules(current_setting('test.fe')::uuid, array[]::uuid[]);
    raise exception 'foreign lead must not reorder';
  exception when insufficient_privilege then null; end;
  begin
    perform public.reorder_lessons(current_setting('test.m1')::uuid, array[]::uuid[]);
    raise exception 'foreign lead must not reorder lessons';
  exception when insufficient_privilege then null; end;
  assert (select count(*) from storage.objects) = 1, 'lead only sees their own stack''s files';
end $$;
reset role;

-- ---------------------------------------------------------------- students
-- a stored file is readable by members only once a lesson they can open points at it
insert into public.lessons (module_id, title, lesson_type, content_path, is_published)
  values (current_setting('test.m1')::uuid, 'PDF lesson', 'pdf',
          current_setting('test.fe') || '/' || current_setting('test.m1') || '/intro.pdf', true);
-- visible to members: published module m1 -> published lessons l1, l2 only
set role authenticated;
select set_config('request.jwt.claim.sub', :s_fe, false);
do $$ declare n int; begin
  assert (select count(*) from public.modules) = 1, 'member sees only published modules';
  assert (select count(*) from public.lessons) = 3, 'member sees only published lessons';
  assert (select count(*) from storage.objects) = 1, 'member can read their stack''s files';
  update public.lessons set title = 'x';
  get diagnostics n = row_count;
  assert n = 0, 'student cannot edit lessons';
  begin
    insert into public.modules (stack_id, title) values (current_setting('test.fe')::uuid, 'sneaky');
    raise exception 'student must not create modules';
  exception when insufficient_privilege then null; end;
  begin
    insert into storage.objects (bucket_id, name) values ('lesson-media', current_setting('test.fe') || '/x/s.pdf');
    raise exception 'student must not upload';
  exception when insufficient_privilege then null; end;
  begin
    perform public.reorder_modules(current_setting('test.fe')::uuid, array[]::uuid[]);
    raise exception 'student must not reorder';
  exception when insufficient_privilege then null; end;
end $$;

-- an unpublished lesson inside a published module stays hidden; publishing the module reveals only published lessons
reset role;
update public.modules set is_published = true where id = current_setting('test.m2')::uuid;
set role authenticated;
select set_config('request.jwt.claim.sub', :s_fe, false);
do $$ begin
  assert (select count(*) from public.modules) = 2, 'newly published module appears';
  assert (select count(*) from public.lessons) = 3, 'no lessons leak from the newly published empty module';
end $$;

-- other students
select set_config('request.jwt.claim.sub', :s_be, false);
do $$ begin
  assert (select count(*) from public.modules) = 0, 'member of another stack sees nothing';
  assert (select count(*) from storage.objects) = 0, 'member sees no files that no open lesson links to';
end $$;
select set_config('request.jwt.claim.sub', :s_none, false);
do $$ begin
  assert (select count(*) from public.modules) = 0 and (select count(*) from public.lessons) = 0, 'non-member sees nothing';
  assert (select count(*) from storage.objects) = 0, 'non-member sees no files';
end $$;
select set_config('request.jwt.claim.sub', :s_withdrawn, false);
do $$ begin
  assert (select count(*) from public.modules) = 0, 'withdrawn student loses access';
end $$;
select set_config('request.jwt.claim.sub', :s_done, false);
do $$ begin
  assert (select count(*) from public.modules) = 2, 'completed student keeps access';
end $$;
reset role;

-- anonymous visitors
set role anon;
do $$ begin
  begin
    perform 1 from public.modules;
    raise exception 'anon must not read modules';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- ---------------------------------------------------------------- admin and lead assignment
set role authenticated;
select set_config('request.jwt.claim.sub', :admin, false);
do $$ declare v uuid; begin
  assert (select count(*) from public.modules) = 3 and (select count(*) from public.lessons) = 4, 'admin sees all content incl. drafts';
  update public.modules set title = 'Admin edit' where id = current_setting('test.m1')::uuid;
  assert (select title from public.modules where id = current_setting('test.m1')::uuid) = 'Admin edit', 'admin can edit content';

  -- an existing lead is assigned to a second stack directly, without an invitation
  v := public.create_lead_invitation('lead.be@x.test', current_setting('test.fe')::uuid);
  assert v is null, 'existing lead is assigned directly';
  assert exists (select 1 from public.stack_leads where user_id = 'b1000000-0000-0000-0000-000000000001' and stack_id = current_setting('test.fe')::uuid), 'second stack assigned';
  assert not exists (select 1 from public.invitations where email = 'lead.be@x.test'), 'no invitation row for existing lead';
  begin
    perform public.create_lead_invitation('s.fe@x.test', current_setting('test.be')::uuid);
    raise exception 'a student cannot be invited as a lead';
  exception when check_violation then null; end;
end $$;
reset role;

-- the newly assigned co-lead now sees frontend drafts
set role authenticated;
select set_config('request.jwt.claim.sub', :lead_be, false);
do $$ begin
  assert (select count(*) from public.modules where stack_id = current_setting('test.fe')::uuid) = 3, 'new co-lead sees the stack''s drafts';
end $$;
reset role;

-- removing the assignment takes the access away again
set role authenticated;
select set_config('request.jwt.claim.sub', :admin, false);
select public.remove_lead_from_stack('b1000000-0000-0000-0000-000000000001', current_setting('test.fe')::uuid);
select set_config('request.jwt.claim.sub', :lead_be, false);
do $$ begin
  assert (select count(*) from public.modules where stack_id = current_setting('test.fe')::uuid) = 0, 'removed lead loses access';
end $$;
reset role;

-- deleting a module removes its lessons
delete from public.modules where id = current_setting('test.m1')::uuid;
do $$ begin
  assert (select count(*) from public.lessons) = 0, 'lessons cascade with their module';
end $$;
