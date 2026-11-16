-- Learning path tests: unlocking, completion, quizzes, submissions, grading, progress, roster, storage.
\set admin '''a0000000-0000-0000-0000-000000000001'''
\set lead_fe '''b0000000-0000-0000-0000-000000000001'''
\set lead_be '''b1000000-0000-0000-0000-000000000001'''
\set s1 '''c0000000-0000-0000-0000-000000000001'''
\set s2 '''c1000000-0000-0000-0000-000000000001'''
\set s_be '''c2000000-0000-0000-0000-000000000001'''
\set s_done '''c3000000-0000-0000-0000-000000000001'''
\set s_wd '''c4000000-0000-0000-0000-000000000001'''

-- ---------------------------------------------------------------- fixtures (superuser)
insert into auth.users (id, email) values
  (:admin, 'admin@x.test'), (:lead_fe, 'lead.fe@x.test'), (:lead_be, 'lead.be@x.test'),
  (:s1, 's1@x.test'), (:s2, 's2@x.test'), (:s_be, 'sbe@x.test'), (:s_done, 'done@x.test'), (:s_wd, 'wd@x.test');
update public.profiles set role = 'admin' where id = :admin;
update public.profiles set role = 'stack_lead' where id in (:lead_fe, :lead_be);
update public.profiles set full_name = 'Alice One', phone = '111' where id = :s1;
update public.profiles set full_name = 'Bob Two', phone = '222' where id = :s2;
select set_config('test.fe', (select id::text from public.stacks where slug = 'frontend'), false);
select set_config('test.be', (select id::text from public.stacks where slug = 'backend'), false);
insert into public.stack_leads (user_id, stack_id) values (:lead_fe, current_setting('test.fe')::uuid), (:lead_be, current_setting('test.be')::uuid);
insert into public.stack_members (user_id, stack_id) values
  (:s1, current_setting('test.fe')::uuid), (:s2, current_setting('test.fe')::uuid), (:s_be, current_setting('test.be')::uuid);
insert into public.stack_members (user_id, stack_id, status, ended_at) values
  (:s_done, current_setting('test.fe')::uuid, 'completed', now()), (:s_wd, current_setting('test.fe')::uuid, 'withdrawn', now());

insert into public.modules (stack_id, title, is_published) values
  (current_setting('test.fe')::uuid, 'M1', true), (current_setting('test.fe')::uuid, 'M2', true), (current_setting('test.fe')::uuid, 'M3', true);
select set_config('test.m1', (select id::text from public.modules where title = 'M1'), false);
select set_config('test.m2', (select id::text from public.modules where title = 'M2'), false);
insert into public.lessons (module_id, title, lesson_type, content_text, is_published, is_required) values
  (current_setting('test.m1')::uuid, 'L1', 'text', 't', true, true),
  (current_setting('test.m1')::uuid, 'L2', 'text', 't', true, true),
  (current_setting('test.m1')::uuid, 'L3 optional', 'text', 't', true, false),
  (current_setting('test.m1')::uuid, 'L4 draft', 'text', 't', false, true),
  (current_setting('test.m2')::uuid, 'L5', 'text', 't', true, true);
select set_config('test.l1', (select id::text from public.lessons where title = 'L1'), false);
select set_config('test.l2', (select id::text from public.lessons where title = 'L2'), false);
select set_config('test.l4', (select id::text from public.lessons where title = 'L4 draft'), false);
select set_config('test.l5', (select id::text from public.lessons where title = 'L5'), false);

-- ---------------------------------------------------------------- leads build assignments
set role authenticated;
select set_config('request.jwt.claim.sub', :lead_fe, false);
do $$ declare qz uuid; sb uuid; begin
  insert into public.assignments (module_id, title, type, max_attempts)
    values (current_setting('test.m1')::uuid, 'Quiz 1', 'quiz', 2) returning id into qz;
  insert into public.assignments (module_id, title, type)
    values (current_setting('test.m2')::uuid, 'Project 2', 'submission') returning id into sb;
  perform set_config('test.qz', qz::text, false);
  perform set_config('test.sb', sb::text, false);

  begin
    update public.assignments set is_published = true where id = qz;
    raise exception 'a quiz without questions must not publish';
  exception when check_violation then null; end;
  begin
    update public.assignments set is_published = true where id = sb;
    raise exception 'a submission without instructions must not publish';
  exception when check_violation then null; end;

  perform public.save_quiz(qz, '[
    {"prompt":"Q1","options":["a","b","c"],"correct_index":1,"points":1},
    {"prompt":"Q2","options":["x","y"],"correct_index":0,"points":1}]'::jsonb);
  assert (select count(*) from public.assignment_questions where assignment_id = qz) = 2, 'quiz saved';
  assert (select count(*) from public.assignment_answer_keys) = 2, 'lead can read answer keys';
  begin
    perform public.save_quiz(qz, '[{"prompt":"Bad","options":["a","b"],"correct_index":5}]'::jsonb);
    raise exception 'invalid correct answer must fail';
  exception when check_violation then null; end;
  assert (select count(*) from public.assignment_questions where assignment_id = qz) = 2, 'a failed save leaves the quiz untouched';

  update public.assignments set is_published = true where id = qz;
  update public.assignments set instructions = 'Build it', is_published = true where id = sb;
end $$;

select set_config('request.jwt.claim.sub', :lead_be, false);
do $$ begin
  begin
    perform public.save_quiz(current_setting('test.qz')::uuid, '[]'::jsonb);
    raise exception 'other lead must not edit the quiz';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.assignments (module_id, title, type) values (current_setting('test.m1')::uuid, 'Hijack', 'quiz');
    raise exception 'other lead must not add assignments';
  exception when insufficient_privilege then null; end;
  assert (select count(*) from public.assignments) = 0, 'other lead sees no assignments';
  assert (select count(*) from public.assignment_answer_keys) = 0, 'other lead sees no keys';
end $$;
reset role;

-- ---------------------------------------------------------------- student 1: the path
set role authenticated;
select set_config('request.jwt.claim.sub', :s1, false);
do $$ declare r record; res jsonb; begin
  assert (select count(*) from public.lessons) = 3, 'sees M1 published lessons only; M2 is locked';
  assert (select count(*) from public.assignments) = 1, 'sees the open quiz, not the locked project';
  assert (select count(*) from public.assignment_questions) = 2, 'sees quiz questions';
  assert (select count(*) from public.assignment_answer_keys) = 0, 'students never see answer keys';
  assert (select count(*) from public.modules) = 3, 'sees all published modules (titles) even when locked';

  begin perform public.complete_lesson(current_setting('test.l5')::uuid);
    raise exception 'locked lesson must not complete';
  exception when check_violation then null; end;
  begin perform public.complete_lesson(current_setting('test.l4')::uuid);
    raise exception 'draft lesson must not complete';
  exception when no_data_found then null; end;

  perform public.complete_lesson(current_setting('test.l1')::uuid);
  perform public.complete_lesson(current_setting('test.l1')::uuid); -- idempotent
  perform public.complete_lesson(current_setting('test.l2')::uuid);
  assert (select count(*) from public.lesson_completions) = 2, 'completions recorded once each';

  select * into r from public.my_modules() where module_id = current_setting('test.m1')::uuid;
  assert r.unlocked and not r.complete and r.lessons_done = 2 and r.lessons_total = 2, 'M1 needs its quiz too';
  assert (select not unlocked from public.my_modules() where module_id = current_setting('test.m2')::uuid), 'M2 still locked';

  begin perform public.submit_quiz(current_setting('test.qz')::uuid, array[1]);
    raise exception 'wrong number of answers must fail';
  exception when check_violation then null; end;

  res := public.submit_quiz(current_setting('test.qz')::uuid, array[0, 1]); -- both wrong
  assert (res ->> 'score')::int = 0 and not (res ->> 'passed')::boolean, 'wrong answers score 0';
  res := public.submit_quiz(current_setting('test.qz')::uuid, array[1, 0]); -- both right
  assert (res ->> 'score')::int = 100 and (res ->> 'passed')::boolean, 'right answers pass';
  begin perform public.submit_quiz(current_setting('test.qz')::uuid, array[1, 0]);
    raise exception 'cannot retake a passed quiz';
  exception when check_violation then null; end;

  select * into r from public.my_modules() where module_id = current_setting('test.m1')::uuid;
  assert r.complete and r.best_score = 100 and r.attempts_used = 2, 'M1 complete after passing the quiz';
  assert (select unlocked from public.my_modules() where module_id = current_setting('test.m2')::uuid), 'M2 unlocked';
  assert (select count(*) from public.lessons) = 4, 'M2 lessons now readable';
  assert (select count(*) from public.assignments) = 2, 'project now visible';

  perform public.complete_lesson(current_setting('test.l5')::uuid);
end $$;

-- direct writes are impossible
do $$ begin
  begin
    insert into public.assignment_submissions (assignment_id, user_id, attempt, status, score)
      values (current_setting('test.qz')::uuid, auth.uid(), 9, 'graded', 100);
    raise exception 'students must not insert submissions';
  exception when insufficient_privilege then null; end;
  begin
    update public.assignment_submissions set score = 100;
    raise exception 'students must not edit scores';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.lesson_completions (user_id, lesson_id) values (auth.uid(), current_setting('test.l4')::uuid);
    raise exception 'students must not insert completions directly';
  exception when insufficient_privilege then null; end;
end $$;

-- ---------------------------------------------------------------- student 1: submission project and grading
do $$ begin
  perform public.submit_assignment(current_setting('test.sb')::uuid, 'first try', null, null);
  begin perform public.submit_assignment(current_setting('test.sb')::uuid, 'again', null, null);
    raise exception 'cannot submit while one is pending';
  exception when check_violation then null; end;
  begin perform public.submit_assignment(current_setting('test.sb')::uuid, ' ', null, null);
    raise exception 'empty submission must fail';
  exception when check_violation then null; end;
  begin perform public.grade_submission((select id from public.assignment_submissions limit 1 offset 0), 90, 'self', false);
    raise exception 'student must not grade';
  exception when insufficient_privilege then null; end;
  -- progress so far: lessons 3/3 -> 40; assignments (quiz 100% + project 0%) / 2 -> 15  => 55
  assert (public.my_progress()).overall = 55, 'progress before grading is 55';
end $$;
reset role;
select set_config('test.sub1', (select id::text from public.assignment_submissions where assignment_id = current_setting('test.sb')::uuid), false);

set role authenticated;
select set_config('request.jwt.claim.sub', :lead_be, false);
do $$ begin
  begin perform public.grade_submission(current_setting('test.sub1')::uuid, 80, 'x', false);
    raise exception 'other lead must not grade';
  exception when insufficient_privilege then null; end;
  assert (select count(*) from public.assignment_submissions) = 0, 'other lead sees no submissions';
end $$;

select set_config('request.jwt.claim.sub', :lead_fe, false);
do $$ begin
  assert (select count(*) from public.assignment_submissions where status = 'submitted') = 1, 'lead sees the pending submission';
  begin perform public.grade_submission(current_setting('test.sub1')::uuid, 500, 'x', false);
    raise exception 'score above max must fail';
  exception when check_violation then null; end;
  perform public.grade_submission(current_setting('test.sub1')::uuid, null, 'Please add tests', true);
  assert (select status from public.assignment_submissions where id = current_setting('test.sub1')::uuid) = 'needs_resubmission', 'resubmission requested';
  begin perform public.grade_submission(current_setting('test.sub1')::uuid, 50, 'x', false);
    raise exception 'cannot grade an already reviewed submission';
  exception when check_violation then null; end;
  assert (select count(*) from public.profiles where id in ('c0000000-0000-0000-0000-000000000001')) = 1, 'lead sees their student profile';
end $$;

select set_config('request.jwt.claim.sub', :s1, false);
do $$ declare v uuid; begin
  assert (select feedback from public.assignment_submissions where status = 'needs_resubmission') = 'Please add tests', 'student sees feedback';
  perform public.submit_assignment(current_setting('test.sb')::uuid, 'second try', null, null);
end $$;
select set_config('request.jwt.claim.sub', :lead_fe, false);
do $$ declare v uuid; begin
  select id into v from public.assignment_submissions where status = 'submitted';
  perform public.grade_submission(v, 40, 'Not there yet', false); -- 40% < 60% pass mark
end $$;
select set_config('request.jwt.claim.sub', :s1, false);
do $$ begin
  assert not (select complete from public.my_modules() where module_id = current_setting('test.m2')::uuid), 'M2 not complete after a failing grade';
  assert (select not assignment_passed from public.my_modules() where module_id = current_setting('test.m2')::uuid), 'not passed';
  perform public.submit_assignment(current_setting('test.sb')::uuid, 'third try', null, null);
end $$;
select set_config('request.jwt.claim.sub', :lead_fe, false);
do $$ declare v uuid; begin
  select id into v from public.assignment_submissions where status = 'submitted';
  perform public.grade_submission(v, 80, 'Great', false);
end $$;
select set_config('request.jwt.claim.sub', :s1, false);
do $$ begin
  assert (select complete from public.my_modules() where module_id = current_setting('test.m2')::uuid), 'M2 complete after passing';
  -- lessons 3/3 -> 40; assignments (1.0 + 0.8)/2 = 0.9 -> 27  => 67 (best score counts, not the latest)
  assert (public.my_progress()).overall = 67, 'progress after grading is 67';
  assert (public.my_progress()).assignments_passed = 2, 'both assignments passed';
  assert (select count(*) from public.assignment_submissions) = 5, 'student keeps their full history (2 quiz + 3 project)';
end $$;
reset role;

-- ---------------------------------------------------------------- student 2: attempt limits, isolation
set role authenticated;
select set_config('request.jwt.claim.sub', :s2, false);
do $$ begin
  assert (select count(*) from public.assignment_submissions) = 0, 'student 2 cannot see student 1''s submissions';
  perform public.submit_quiz(current_setting('test.qz')::uuid, array[0, 1]);
  perform public.submit_quiz(current_setting('test.qz')::uuid, array[0, 1]);
  begin perform public.submit_quiz(current_setting('test.qz')::uuid, array[1, 0]);
    raise exception 'max attempts must be enforced';
  exception when check_violation then null; end;
  assert (public.my_progress()).overall = 0, 'nothing completed yet -> 0';
end $$;

-- extra attempts: only the stack's leads (or admins) can grant them, and they lift the limit
do $$ begin
  begin perform public.grant_extra_attempts(auth.uid(), current_setting('test.qz')::uuid);
    raise exception 'a student must not grant themselves attempts';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub', :lead_be, false);
do $$ begin
  begin perform public.grant_extra_attempts('c1000000-0000-0000-0000-000000000001', current_setting('test.qz')::uuid);
    raise exception 'another stack''s lead must not grant attempts';
  exception when insufficient_privilege then null; end;
  begin perform public.attempt_overview('c1000000-0000-0000-0000-000000000001', current_setting('test.fe')::uuid);
    raise exception 'another stack''s lead must not see attempts';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub', :lead_fe, false);
do $$ declare r record; begin
  begin insert into public.attempt_grants (user_id, assignment_id, extra)
    values ('c1000000-0000-0000-0000-000000000001', current_setting('test.qz')::uuid, 5);
    raise exception 'grants must not be written directly';
  exception when insufficient_privilege then null; end;
  perform public.grant_extra_attempts('c1000000-0000-0000-0000-000000000001', current_setting('test.qz')::uuid, null, 1, 'retry');
  select * into r from public.attempt_overview('c1000000-0000-0000-0000-000000000001', current_setting('test.fe')::uuid)
    where target_id = current_setting('test.qz')::uuid;
  assert r.attempts_used = 2 and r.attempts_allowed = 3 and not r.passed, 'overview shows the extra attempt';
end $$;
select set_config('request.jwt.claim.sub', :s2, false);
do $$ begin
  assert (select sum(extra) from public.attempt_grants) = 1, 'the student sees their own grant';
  perform public.submit_quiz(current_setting('test.qz')::uuid, array[0, 1]);
  begin perform public.submit_quiz(current_setting('test.qz')::uuid, array[0, 1]);
    raise exception 'the limit applies again after the extra attempt is used';
  exception when check_violation then null; end;
end $$;
select set_config('request.jwt.claim.sub', :s_be, false);
do $$ begin
  begin perform public.complete_lesson(current_setting('test.l1')::uuid);
    raise exception 'member of another stack must not complete lessons';
  exception when insufficient_privilege or no_data_found then null; end;
  assert (select count(*) from public.assignments) = 0, 'other stack member sees no assignments';
end $$;
select set_config('request.jwt.claim.sub', :s_wd, false);
do $$ begin
  begin perform public.complete_lesson(current_setting('test.l1')::uuid);
    raise exception 'withdrawn student must not complete lessons';
  exception when insufficient_privilege or no_data_found then null; end;
end $$;
select set_config('request.jwt.claim.sub', :s_done, false);
do $$ begin
  assert (select count(*) from public.lessons) = 4, 'completed student has everything unlocked (read-only)';
  begin perform public.complete_lesson(current_setting('test.l1')::uuid);
    raise exception 'completed student cannot record new progress';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- ---------------------------------------------------------------- roster
set role authenticated;
select set_config('request.jwt.claim.sub', :lead_fe, false);
do $$ declare r record; begin
  assert (select count(*) from public.stack_roster(current_setting('test.fe')::uuid)) = 3, 'roster: s1, s2 and the completed student (withdrawn excluded)';
  select * into r from public.stack_roster(current_setting('test.fe')::uuid) where user_id = 'c0000000-0000-0000-0000-000000000001';
  assert r.full_name = 'Alice One' and r.phone = '111' and r.email = 's1@x.test', 'roster includes contact details';
  assert r.overall = 67 and r.last_activity is not null, 'roster shows progress and activity';
  begin perform public.stack_roster(current_setting('test.be')::uuid);
    raise exception 'lead must not read another stack''s roster';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub', :s1, false);
do $$ begin
  begin perform public.stack_roster(current_setting('test.fe')::uuid);
    raise exception 'student must not read the roster';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub', :admin, false);
do $$ begin
  assert (select count(*) from public.stack_roster(current_setting('test.fe')::uuid)) = 3, 'admin can read any roster';
end $$;
reset role;

-- ---------------------------------------------------------------- submission file storage
set role authenticated;
select set_config('request.jwt.claim.sub', :s1, false);
do $$ begin
  insert into storage.objects (bucket_id, name)
    values ('submissions', current_setting('test.fe') || '/c0000000-0000-0000-0000-000000000001/a/work.pdf');
  begin
    insert into storage.objects (bucket_id, name)
      values ('submissions', current_setting('test.fe') || '/c1000000-0000-0000-0000-000000000001/a/work.pdf');
    raise exception 'must not upload into someone else''s folder';
  exception when insufficient_privilege then null; end;
  begin
    insert into storage.objects (bucket_id, name)
      values ('submissions', current_setting('test.be') || '/c0000000-0000-0000-0000-000000000001/a/work.pdf');
    raise exception 'must not upload into another stack';
  exception when insufficient_privilege then null; end;
  begin perform public.submit_assignment(current_setting('test.sb')::uuid, null, null,
      current_setting('test.fe') || '/c1000000-0000-0000-0000-000000000001/a/work.pdf');
    raise exception 'cannot attach another student''s file';
  exception when insufficient_privilege or check_violation then null; end;
end $$;
select set_config('request.jwt.claim.sub', :s2, false);
do $$ begin
  assert (select count(*) from storage.objects where bucket_id = 'submissions') = 0, 'other students cannot read the file';
end $$;
select set_config('request.jwt.claim.sub', :lead_fe, false);
do $$ begin
  assert (select count(*) from storage.objects where bucket_id = 'submissions') = 1, 'the stack lead can read submission files';
end $$;
select set_config('request.jwt.claim.sub', :lead_be, false);
do $$ begin
  assert (select count(*) from storage.objects where bucket_id = 'submissions') = 0, 'another lead cannot';
end $$;
select set_config('request.jwt.claim.sub', :s_be, false);
do $$ begin
  begin
    insert into storage.objects (bucket_id, name)
      values ('submissions', current_setting('test.fe') || '/c2000000-0000-0000-0000-000000000001/a/x.pdf');
    raise exception 'non-member must not upload to the stack';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
