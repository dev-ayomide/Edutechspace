-- Access-control tests. Each block fails loudly (non-zero exit) if a rule is broken.
-- Fixture users (fixed ids so we can impersonate them):
--   admin  a0000000-...  | lead_fe (frontend) b0000000-... | lead_be (backend) b1000000-...
--   student_fe c0000000-... (active in frontend)  | student_be c1000000-... (active in backend)

\set admin '''a0000000-0000-0000-0000-000000000001'''
\set lead_fe '''b0000000-0000-0000-0000-000000000001'''
\set lead_be '''b1000000-0000-0000-0000-000000000001'''
\set student_fe '''c0000000-0000-0000-0000-000000000001'''
\set student_be '''c1000000-0000-0000-0000-000000000001'''

-- ---------------------------------------------------------------- fixtures (as superuser)
insert into auth.users (id, email) values
  (:admin, 'admin@x.test'), (:lead_fe, 'lead.fe@x.test'), (:lead_be, 'lead.be@x.test'),
  (:student_fe, 'student.fe@x.test'), (:student_be, 'student.be@x.test');
update public.profiles set role = 'admin' where id = :admin;
update public.profiles set role = 'stack_lead' where id in (:lead_fe, :lead_be);
insert into public.stack_leads (user_id, stack_id)
  select :lead_fe, id from public.stacks where slug = 'frontend';
insert into public.stack_leads (user_id, stack_id)
  select :lead_be, id from public.stacks where slug = 'backend';
insert into public.stack_members (user_id, stack_id)
  select :student_fe, id from public.stacks where slug = 'frontend';
insert into public.stack_members (user_id, stack_id)
  select :student_be, id from public.stacks where slug = 'backend';

do $$ begin
  assert (select count(*) from public.stacks) = 8, 'seed should create 8 stacks';
end $$;

-- ---------------------------------------------------------------- anonymous visitors
set role anon;
do $$ begin
  assert (select count(*) from public.stacks) = 8, 'anon can browse stacks';
  assert (select count(*) from public.profiles) = 0, 'anon sees no profiles';
  assert (select count(*) from public.stack_members) = 0, 'anon sees no memberships';
  assert (select count(*) from public.invitations) = 0, 'anon sees no invitations';
end $$;

-- anon can apply, but only as a pending application
insert into public.stack_applications (full_name, email, stack_id, motivation, phone)
  select 'Ada Applicant', 'ada@x.test', id, 'I want to learn', '0800' from public.stacks where slug = 'frontend';
do $$ begin
  begin
    insert into public.stack_applications (full_name, email, stack_id, status)
      select 'Eve Hacker', 'eve@x.test', id, 'approved' from public.stacks where slug = 'frontend';
    raise exception 'anon must not self-approve';
  exception when insufficient_privilege then null; end;
  begin
    perform 1 from public.stack_applications;
    assert (select count(*) from public.stack_applications) = 0, 'anon cannot read applications';
  end;
  begin
    update public.stack_applications set status = 'approved';
    raise exception 'anon must not update applications';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- ---------------------------------------------------------------- students
set role authenticated;
select set_config('request.jwt.claim.sub', :student_fe, false);
do $$ declare n int; begin
  assert (select count(*) from public.profiles) = 1, 'student sees only their own profile';
  assert (select count(*) from public.stack_members) = 1, 'student sees only their own membership';
  assert (select count(*) from public.stack_applications) = 0, 'student cannot read applications';
  assert (select count(*) from public.audit_log) = 0, 'student cannot read audit log';

  begin
    update public.profiles set role = 'admin' where id = auth.uid();
    raise exception 'student must not change their own role';
  exception when insufficient_privilege then null; end;
  begin
    update public.profiles set email = 'hijack@x.test' where id = auth.uid();
    raise exception 'student must not change their email';
  exception when insufficient_privilege then null; end;

  update public.profiles set full_name = 'Fe Student', phone = '123' where id = auth.uid();
  assert (select full_name from public.profiles where id = auth.uid()) = 'Fe Student', 'student can edit contact details';

  update public.profiles set full_name = 'Hacked' where id = 'c1000000-0000-0000-0000-000000000001';
  get diagnostics n = row_count;
  assert n = 0, 'student cannot edit another profile';

  begin
    insert into public.stack_members (user_id, stack_id) select auth.uid(), id from public.stacks where slug = 'backend';
    raise exception 'student must not self-enrol';
  exception when insufficient_privilege then null; end;
  begin
    perform public.admin_set_role(auth.uid(), 'admin');
    raise exception 'student must not call admin_set_role';
  exception when insufficient_privilege then null; end;
  begin
    perform public.create_lead_invitation('x@x.test', (select id from public.stacks where slug = 'frontend'));
    raise exception 'student must not invite leads';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- ---------------------------------------------------------------- leads
set role authenticated;
select set_config('request.jwt.claim.sub', :lead_fe, false);
do $$ declare n int; v_app uuid; begin
  assert (select count(*) from public.stack_members) = 1, 'lead sees only their own stack roster';
  assert exists (select 1 from public.profiles where id = 'c0000000-0000-0000-0000-000000000001'), 'lead sees their student contact details';
  assert not exists (select 1 from public.profiles where id = 'c1000000-0000-0000-0000-000000000001'), 'lead cannot see another stack''s student';

  assert (select count(*) from public.stack_applications) = 1, 'lead sees their stack''s applications';

  update public.stacks set name = 'Hijacked' where slug = 'frontend';
  get diagnostics n = row_count;
  assert n = 0, 'lead cannot edit stacks';

  begin
    insert into public.stack_leads (user_id, stack_id) select auth.uid(), id from public.stacks where slug = 'backend';
    raise exception 'lead must not assign themselves to another stack';
  exception when insufficient_privilege then null; end;

  -- review: approving creates an invitation for a brand new person
  select id into v_app from public.stack_applications where email = 'ada@x.test';
  perform public.review_application(v_app, true, 'Welcome');
  assert (select status from public.stack_applications where id = v_app) = 'approved', 'application approved';
  begin
    perform public.review_application(v_app, false);
    raise exception 'double review must fail';
  exception when check_violation then null; end;
end $$;
reset role;

-- the invitation exists and is hidden from the lead; signing up as Ada joins her to frontend
do $$ begin
  assert (select count(*) from public.invitations where email = 'ada@x.test' and role = 'student' and status = 'pending') = 1, 'student invitation created';
end $$;
insert into auth.users (id, email) values ('c2000000-0000-0000-0000-000000000001', 'Ada@X.test');
do $$ begin
  assert (select role from public.profiles where email = 'ada@x.test') = 'student', 'invited student gets student role';
  assert exists (
    select 1 from public.stack_members m join public.stacks s on s.id = m.stack_id
    where m.user_id = 'c2000000-0000-0000-0000-000000000001' and s.slug = 'frontend' and m.status = 'active'
  ), 'invited student is joined to the stack';
  assert (select status from public.invitations where email = 'ada@x.test') = 'accepted', 'invitation accepted';
  assert (select full_name from public.profiles where email = 'ada@x.test') = 'Ada Applicant', 'name copied from the application';
  assert (select phone from public.profiles where email = 'ada@x.test') = '0800', 'phone copied from the application';
end $$;

-- a lead of another stack cannot see or review this stack's applications
insert into public.stack_applications (full_name, email, stack_id)
  select 'Bob Applicant', 'bob@x.test', id from public.stacks where slug = 'frontend';
select set_config('test.bob_app', id::text, false) from public.stack_applications where email = 'bob@x.test';
set role authenticated;
select set_config('request.jwt.claim.sub', :lead_be, false);
do $$ begin
  assert (select count(*) from public.stack_applications) = 0, 'other stack lead sees no foreign applications';
  begin
    perform public.review_application(current_setting('test.bob_app')::uuid, true);
    raise exception 'foreign lead must not review';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- ---------------------------------------------------------------- invariants
do $$ begin
  -- one active stack per student
  begin
    insert into public.stack_members (user_id, stack_id)
      select 'c0000000-0000-0000-0000-000000000001', id from public.stacks where slug = 'backend';
    raise exception 'second active stack must fail';
  exception when unique_violation then null; end;
  -- a lead can never be a student
  begin
    insert into public.stack_members (user_id, stack_id)
      select 'b0000000-0000-0000-0000-000000000001', id from public.stacks where slug = 'backend';
    raise exception 'lead as student must fail';
  exception when check_violation then null; end;
  -- a student can never lead
  begin
    insert into public.stack_leads (user_id, stack_id)
      select 'c0000000-0000-0000-0000-000000000001', id from public.stacks where slug = 'backend';
    raise exception 'student as lead must fail';
  exception when check_violation then null; end;
end $$;

-- ---------------------------------------------------------------- withdraw and switch
set role authenticated;
select set_config('request.jwt.claim.sub', :student_fe, false);
select public.withdraw_from_active_stack();
do $$ begin
  assert (select status from public.stack_members where user_id = auth.uid()) = 'withdrawn', 'withdrawn status recorded';
  begin
    perform public.withdraw_from_active_stack();
    raise exception 'nothing left to withdraw';
  exception when no_data_found then null; end;
end $$;
reset role;
-- history is kept and a new stack can now be joined
insert into public.stack_members (user_id, stack_id)
  select 'c0000000-0000-0000-0000-000000000001', id from public.stacks where slug = 'backend';
do $$ begin
  assert (select count(*) from public.stack_members where user_id = 'c0000000-0000-0000-0000-000000000001') = 2, 'membership history kept';
end $$;

-- ---------------------------------------------------------------- admin and lead invitations
set role authenticated;
select set_config('request.jwt.claim.sub', :admin, false);
do $$ declare v_inv uuid; begin
  assert (select count(*) from public.profiles) >= 6, 'admin sees all profiles';
  v_inv := public.create_lead_invitation('New.Lead@x.test', (select id from public.stacks where slug = 'ui-ux'));
  assert v_inv is not null, 'lead invitation created';
  begin
    perform public.create_lead_invitation('student.be@x.test', (select id from public.stacks where slug = 'ui-ux'));
    raise exception 'cannot invite an existing student as lead';
  exception when check_violation then null; end;
  begin
    perform public.admin_set_role(auth.uid(), 'student');
    raise exception 'admin must not change own role';
  exception when check_violation then null; end;
  assert (select count(*) from public.audit_log) >= 2, 'actions are audited';
end $$;
reset role;

insert into auth.users (id, email) values ('b2000000-0000-0000-0000-000000000001', 'new.lead@x.test');
do $$ begin
  assert (select role from public.profiles where email = 'new.lead@x.test') = 'stack_lead', 'invited lead gets lead role';
  assert exists (
    select 1 from public.stack_leads l join public.stacks s on s.id = l.stack_id
    where l.user_id = 'b2000000-0000-0000-0000-000000000001' and s.slug = 'ui-ux'
  ), 'invited lead is assigned to the stack';
end $$;

-- an uninvited sign-up is just a student with no stack, never an elevated role
insert into auth.users (id, email) values ('c3000000-0000-0000-0000-000000000001', 'random@x.test');
do $$ begin
  assert (select role from public.profiles where email = 'random@x.test') = 'student', 'uninvited user is a plain student';
  assert not exists (select 1 from public.stack_members where user_id = 'c3000000-0000-0000-0000-000000000001'), 'uninvited user has no stack';
end $$;

select 'rls tests ok' as result;
