-- Exam + certificate tests: access, timing, attempts, grading, issuing, immutability, verification.
\set admin '''a0000000-0000-0000-0000-000000000001'''
\set lead_fe '''b0000000-0000-0000-0000-000000000001'''
\set lead_be '''b1000000-0000-0000-0000-000000000001'''
\set s1 '''c0000000-0000-0000-0000-000000000001'''
\set s2 '''c1000000-0000-0000-0000-000000000001'''
\set s_be '''c2000000-0000-0000-0000-000000000001'''
\set s_wd '''c3000000-0000-0000-0000-000000000001'''

-- ---------------------------------------------------------------- fixtures
insert into auth.users (id, email) values
  (:admin, 'admin@x.test'), (:lead_fe, 'lead.fe@x.test'), (:lead_be, 'lead.be@x.test'),
  (:s1, 's1@x.test'), (:s2, 's2@x.test'), (:s_be, 'sbe@x.test'), (:s_wd, 'wd@x.test');
update public.profiles set role = 'admin' where id = :admin;
update public.profiles set role = 'stack_lead' where id in (:lead_fe, :lead_be);
update public.profiles set full_name = 'Alice One' where id = :s1;
select set_config('test.fe', (select id::text from public.stacks where slug = 'frontend'), false);
select set_config('test.be', (select id::text from public.stacks where slug = 'backend'), false);
insert into public.stack_leads (user_id, stack_id) values (:lead_fe, current_setting('test.fe')::uuid), (:lead_be, current_setting('test.be')::uuid);
insert into public.stack_members (user_id, stack_id) values
  (:s1, current_setting('test.fe')::uuid), (:s2, current_setting('test.fe')::uuid), (:s_be, current_setting('test.be')::uuid);
insert into public.stack_members (user_id, stack_id, status, ended_at) values (:s_wd, current_setting('test.fe')::uuid, 'withdrawn', now());
insert into public.modules (stack_id, title, is_published) values (current_setting('test.fe')::uuid, 'M1', true);
insert into public.lessons (module_id, title, lesson_type, content_text, is_published)
  select id, 'L1', 'text', 't', true from public.modules where title = 'M1';
select set_config('test.l1', (select id::text from public.lessons where title = 'L1'), false);

-- ---------------------------------------------------------------- the lead builds the exam
set role authenticated;
select set_config('request.jwt.claim.sub', :lead_fe, false);
do $$ declare ex uuid; begin
  insert into public.exams (stack_id, title, time_limit_minutes, max_attempts, cooldown_hours)
    values (current_setting('test.fe')::uuid, 'Frontend final', 30, 2, 24) returning id into ex;
  perform set_config('test.exam', ex::text, false);
  begin update public.exams set is_published = true where id = ex;
    raise exception 'an exam without questions must not publish';
  exception when check_violation then null; end;
  perform public.save_exam_questions(ex, '[
    {"prompt":"Q1","options":["a","b","c"],"correct_index":1,"points":1},
    {"prompt":"Q2","options":["x","y"],"correct_index":0,"points":1}]'::jsonb);
  update public.exams set is_published = true where id = ex;
  assert (select count(*) from public.exam_answer_keys) = 2, 'lead sees the keys';
  begin insert into public.exams (stack_id) values (current_setting('test.be')::uuid);
    raise exception 'lead must not create an exam for another stack';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub', :lead_be, false);
do $$ begin
  assert (select count(*) from public.exams) = 0, 'other lead sees no exam';
  begin perform public.save_exam_questions(current_setting('test.exam')::uuid, '[]'::jsonb);
    raise exception 'other lead must not edit the exam';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- ---------------------------------------------------------------- signatories (admin only)
set role authenticated;
select set_config('request.jwt.claim.sub', :lead_fe, false);
do $$ begin
  assert (select count(*) from public.certificate_signatories) = 0, 'leads see no signatories';
  begin insert into public.certificate_signatories (name, title) values ('Evil Lead', 'President');
    raise exception 'lead must not add signatories';
  exception when insufficient_privilege then null; end;
  begin insert into storage.objects (bucket_id, name) values ('signatures', 'x.png');
    raise exception 'lead must not upload signatures';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub', :admin, false);
do $$ begin
  insert into public.certificate_signatories (name, title, signature_path, display_order) values
    ('Dr. Ngozi Okafor', 'President', 'president.png', 1),
    ('Tolu Adeyemi', 'Technical Lead', 'tech.png', 2),
    ('Retired Person', 'Staff Patron', null, 3);
  update public.certificate_signatories set is_active = false where name = 'Retired Person';
  insert into storage.objects (bucket_id, name) values ('signatures', 'president.png');
end $$;
reset role;

-- ---------------------------------------------------------------- student 1: the exam is locked until modules are done
set role authenticated;
select set_config('request.jwt.claim.sub', :s1, false);
do $$ declare s jsonb; begin
  s := public.my_exam();
  assert s ->> 'state' = 'locked', 'locked before the modules are complete';
  assert (s ->> 'question_count')::int = 2, 'question count is visible without the questions';
  begin perform public.start_exam(current_setting('test.exam')::uuid);
    raise exception 'locked exam must not start';
  exception when check_violation then null; end;
  assert (select count(*) from public.exam_questions) = 0, 'questions hidden without an attempt';
  assert (select count(*) from public.exam_answer_keys) = 0, 'keys hidden';
  perform public.complete_lesson(current_setting('test.l1')::uuid);
  assert public.my_exam() ->> 'state' = 'ready', 'ready once every module is complete';
end $$;

-- start, resume, read questions (never keys)
do $$ declare s jsonb; begin
  s := public.start_exam(current_setting('test.exam')::uuid);
  assert s ->> 'state' = 'in_progress' and s ->> 'deadline' is not null, 'attempt running with a deadline';
  perform set_config('test.att1', s ->> 'attempt_id', false);
  assert (public.start_exam(current_setting('test.exam')::uuid) ->> 'attempt_id') = s ->> 'attempt_id', 'starting again resumes the same attempt';
  assert (select count(*) from public.exam_questions) = 2, 'questions readable during the attempt';
  assert (select count(*) from public.exam_answer_keys) = 0, 'keys still hidden';
  begin perform public.submit_exam(current_setting('test.att1')::uuid, array[1]);
    raise exception 'wrong answer count must fail';
  exception when check_violation then null; end;
end $$;

-- a failing attempt: wrong answers, then cooldown
do $$ declare r jsonb; begin
  r := public.submit_exam(current_setting('test.att1')::uuid, array[0, 1]);
  assert (r ->> 'percent')::int = 0 and not (r ->> 'passed')::boolean and r ->> 'certificate_id' is null, 'failed attempt';
  assert (select count(*) from public.exam_questions) = 0, 'questions hidden again after submitting';
  assert public.my_exam() ->> 'state' = 'cooldown', 'cooldown after a failed attempt';
  begin perform public.start_exam(current_setting('test.exam')::uuid);
    raise exception 'cooldown must block a new attempt';
  exception when check_violation then null; end;
  begin perform public.submit_exam(current_setting('test.att1')::uuid, array[1, 0]);
    raise exception 'cannot submit twice';
  exception when check_violation then null; end;
  assert (public.my_progress()).overall < 100, 'not certified yet';
end $$;
reset role;

-- 25 hours later the cooldown is over
update public.exam_attempts set submitted_at = now() - interval '25 hours' where user_id = :s1;
set role authenticated;
select set_config('request.jwt.claim.sub', :s1, false);
do $$ declare r jsonb; s jsonb; cert uuid; begin
  assert public.my_exam() ->> 'state' = 'ready', 'ready after the cooldown';
  s := public.start_exam(current_setting('test.exam')::uuid);
  r := public.submit_exam((s ->> 'attempt_id')::uuid, array[1, 0]); -- both right
  assert (r ->> 'passed')::boolean and (r ->> 'percent')::int = 100, 'passing attempt';
  cert := (r ->> 'certificate_id')::uuid;
  assert cert is not null, 'a certificate is issued automatically';
  perform set_config('test.cert1', cert::text, false);
  assert (select status from public.stack_members where user_id = auth.uid() and stack_id = current_setting('test.fe')::uuid) = 'completed', 'stack marked completed';
  assert public.my_exam() ->> 'state' = 'passed', 'exam state is passed';
  assert (public.my_progress()).overall = 100, 'certified students show 100% progress';
  begin perform public.start_exam(current_setting('test.exam')::uuid);
    raise exception 'cannot retake a passed exam';
  exception when check_violation then null; end;
end $$;

-- the certificate
do $$ declare c public.certificates; begin
  select * into c from public.certificates;
  assert c.student_name = 'Alice One' and c.stack_name = 'Frontend Development', 'snapshot of name and stack';
  assert c.certificate_no ~ '^RTS-[0-9]{4}-[0-9A-F]{10}$', 'certificate number format';
  assert jsonb_array_length(c.signatories) = 2, 'only active signatories are snapshotted';
  assert c.signatories -> 0 ->> 'title' = 'President' and c.signatories -> 1 ->> 'title' = 'Technical Lead', 'signatory order kept';
  assert c.final_score = 100, 'final score stored';
  perform set_config('test.no1', c.certificate_no, false);
  begin update public.certificates set student_name = 'Forged';
    raise exception 'students must not edit certificates';
  exception when insufficient_privilege then null; end;
  begin delete from public.certificates;
    raise exception 'students must not delete certificates';
  exception when insufficient_privilege then null; end;
  begin insert into public.certificates (certificate_no, user_id, stack_id, student_name, stack_name, final_score)
      values ('RTS-FAKE', auth.uid(), current_setting('test.fe')::uuid, 'x', 'y', 100);
    raise exception 'students must not mint certificates';
  exception when insufficient_privilege then null; end;
  begin perform public.issue_certificate_for(auth.uid(), current_setting('test.fe')::uuid);
    raise exception 'the internal issuer must not be callable';
  exception when insufficient_privilege then null; end;
  begin perform public.revoke_certificate(c.id, 'x');
    raise exception 'students must not revoke';
  exception when insufficient_privilege then null; end;
  -- internal helpers are not part of the API surface
  begin perform public.write_audit('forged', 'x', 'y');
    raise exception 'users must not write the audit log';
  exception when insufficient_privilege then null; end;
  begin perform public.progress_for('c1000000-0000-0000-0000-000000000001', current_setting('test.fe')::uuid);
    raise exception 'users must not read other people''s progress through the helper';
  exception when insufficient_privilege then null; end;
  begin perform public.module_is_complete('c1000000-0000-0000-0000-000000000001', gen_random_uuid());
    raise exception 'users must not probe other people''s completion';
  exception when insufficient_privilege then null; end;
end $$;

-- completed students can still read content but cannot record progress
do $$ begin
  begin perform public.complete_lesson(current_setting('test.l1')::uuid);
    raise exception 'completed students cannot record new progress';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- ---------------------------------------------------------------- student 2: timing and attempt limits
set role authenticated;
select set_config('request.jwt.claim.sub', :s2, false);
do $$ declare s jsonb; begin
  perform public.complete_lesson(current_setting('test.l1')::uuid);
  assert (select count(*) from public.exam_attempts) = 0, 'student 2 sees no one else''s attempts';
  s := public.start_exam(current_setting('test.exam')::uuid);
  perform set_config('test.att2', s ->> 'attempt_id', false);
end $$;
reset role;
-- the 30 minute limit (plus 2 minute grace) has long passed
update public.exam_attempts set started_at = now() - interval '3 hours' where id = current_setting('test.att2')::uuid;
set role authenticated;
select set_config('request.jwt.claim.sub', :s2, false);
do $$ declare r jsonb; begin
  r := public.submit_exam(current_setting('test.att2')::uuid, array[1, 0]); -- correct answers, but too late
  assert (r ->> 'expired')::boolean and not (r ->> 'passed')::boolean and r ->> 'certificate_id' is null, 'late submissions expire';
  assert (select status from public.exam_attempts where id = current_setting('test.att2')::uuid) = 'expired', 'attempt recorded as expired';
  assert not exists (select 1 from public.certificates where user_id = auth.uid()), 'no certificate for a late submission';
  assert public.my_exam() ->> 'state' in ('cooldown', 'exhausted'), 'the expired attempt counted';
end $$;
reset role;
update public.exam_attempts set submitted_at = now() - interval '25 hours' where user_id = :s2;

-- an abandoned attempt is closed automatically and counts as used
set role authenticated;
select set_config('request.jwt.claim.sub', :s2, false);
do $$ declare s jsonb; begin
  s := public.start_exam(current_setting('test.exam')::uuid);
  perform set_config('test.att3', s ->> 'attempt_id', false);
end $$;
reset role;
update public.exam_attempts set started_at = now() - interval '5 hours' where id = current_setting('test.att3')::uuid;
set role authenticated;
select set_config('request.jwt.claim.sub', :s2, false);
do $$ begin
  assert public.my_exam() ->> 'state' = 'exhausted', 'two attempts used (one late, one abandoned) -> exhausted';
  assert (public.my_exam() ->> 'attempts_used')::int = 2, 'attempts counted';
  begin perform public.start_exam(current_setting('test.exam')::uuid);
    raise exception 'exhausted attempts must block';
  exception when check_violation then null; end;
end $$;
reset role;

-- ---------------------------------------------------------------- other students cannot take or read this exam
set role authenticated;
select set_config('request.jwt.claim.sub', :s_be, false);
do $$ begin
  assert public.my_exam() is null, 'other stack has no exam';
  begin perform public.start_exam(current_setting('test.exam')::uuid);
    raise exception 'other stack must not start this exam';
  exception when insufficient_privilege then null; end;
  assert (select count(*) from public.exams) = 0 and (select count(*) from public.exam_questions) = 0, 'cannot read it';
end $$;
select set_config('request.jwt.claim.sub', :s_wd, false);
do $$ begin
  assert public.my_exam() is null, 'withdrawn student has no exam';
end $$;
reset role;

-- ---------------------------------------------------------------- visibility of certificates and attempts
set role authenticated;
select set_config('request.jwt.claim.sub', :s2, false);
do $$ begin assert (select count(*) from public.certificates) = 0, 'other students cannot see certificates'; end $$;
select set_config('request.jwt.claim.sub', :lead_fe, false);
do $$ begin
  assert (select count(*) from public.certificates) = 1, 'the stack lead sees their stack''s certificates';
  assert (select count(*) from public.exam_attempts) >= 4, 'the lead sees their students'' attempts';
end $$;
select set_config('request.jwt.claim.sub', :lead_be, false);
do $$ begin
  assert (select count(*) from public.certificates) = 0 and (select count(*) from public.exam_attempts) = 0, 'other leads see neither';
end $$;
reset role;

-- ---------------------------------------------------------------- public verification
set role anon;
do $$ declare r record; begin
  select * into r from public.verify_certificate(current_setting('test.no1'));
  assert r.status = 'valid' and r.student_name = 'Alice One' and r.stack_name = 'Frontend Development', 'anyone can verify a number';
  assert (select count(*) from public.verify_certificate(lower(' ' || current_setting('test.no1') || ' '))) = 1, 'case and whitespace tolerant';
  assert (select count(*) from public.verify_certificate('RTS-2026-NOPE000000')) = 0, 'unknown numbers return nothing';
  assert (select count(*) from public.verify_certificate('%')) = 0, 'no wildcard enumeration';
  begin perform 1 from public.certificates; raise exception 'anon must not read the table';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- ---------------------------------------------------------------- admin: revoke and reissue
set role authenticated;
select set_config('request.jwt.claim.sub', :admin, false);
do $$ declare v_new uuid; begin
  assert (select count(*) from public.certificates) = 1, 'admin sees certificates';
  begin perform public.revoke_certificate(gen_random_uuid(), 'x');
    raise exception 'unknown certificate';
  exception when no_data_found then null; end;
  v_new := public.reissue_certificate(current_setting('test.cert1')::uuid);
  assert v_new is not null, 'reissue creates a new certificate';
  assert (select count(*) from public.certificates where revoked_at is null) = 1, 'exactly one active certificate remains';
  assert (select revoked_reason from public.certificates where id = current_setting('test.cert1')::uuid) = 'Reissued', 'old one is revoked as reissued';
  assert (select replaced_by from public.certificates where id = current_setting('test.cert1')::uuid) = v_new, 'old one points to its replacement';
  assert (select certificate_no from public.certificates where id = v_new) <> current_setting('test.no1'), 'new number';
  perform public.revoke_certificate(v_new, 'Issued in error');
  assert (select count(*) from public.audit_log where action in ('issue_certificate', 'reissue_certificate', 'revoke_certificate')) >= 3, 'audited';
end $$;
reset role;
set role anon;
do $$ begin
  assert (select status from public.verify_certificate(current_setting('test.no1'))) = 'revoked', 'a revoked certificate verifies as revoked';
end $$;
reset role;
