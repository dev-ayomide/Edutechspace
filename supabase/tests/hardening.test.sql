-- Guards the security model as a whole. These fail when a future migration adds a table without RLS,
-- a SECURITY DEFINER function without a pinned search_path, or exposes a new function through the API.

-- 1. Row Level Security on every table in the public schema.
do $$ declare t text; begin
  select string_agg(c.relname, ', ') into t
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;
  assert t is null, 'Tables without row level security: ' || coalesce(t, '');
end $$;

-- 2. SECURITY DEFINER functions must pin search_path (prevents search-path hijacking).
do $$ declare t text; begin
  select string_agg(p.proname, ', ') into t
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prosecdef
    and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%');
  assert t is null, 'SECURITY DEFINER functions without a pinned search_path: ' || coalesce(t, '');
end $$;

-- 3. Anonymous visitors may call exactly one function: public certificate verification.
do $$ declare t text; begin
  select string_agg(p.proname, ', ') into t
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prorettype <> 'trigger'::regtype
    and has_function_privilege('anon', p.oid, 'execute') and p.proname <> 'verify_certificate';
  assert t is null, 'Functions callable by anonymous visitors: ' || coalesce(t, '');
end $$;

-- 4. Signed-in users may call only the reviewed API surface. Any new function must be added here on purpose.
do $$ declare t text; allowed text[] := array[
  -- RLS helpers (read-only, scoped to the caller)
  'is_admin', 'is_lead_of', 'leads_student', 'is_member_of', 'is_active_member_of', 'module_stack_id',
  'module_visible_to_member', 'module_open_to_me', 'assignment_stack_id', 'exam_stack_id',
  'can_read_exam_questions', 'storage_stack_id',
  -- RPCs, each enforcing its own authorisation
  'create_lead_invitation', 'revoke_invitation', 'review_application', 'withdraw_from_active_stack',
  'admin_set_role', 'remove_lead_from_stack', 'reorder_modules', 'reorder_lessons', 'complete_lesson',
  'submit_quiz', 'submit_assignment', 'grade_submission', 'save_quiz', 'my_progress', 'my_modules',
  'stack_roster', 'save_exam_questions', 'my_exam', 'start_exam', 'submit_exam', 'revoke_certificate',
  'reissue_certificate', 'verify_certificate'];
begin
  select string_agg(p.proname, ', ') into t
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prorettype <> 'trigger'::regtype
    and has_function_privilege('authenticated', p.oid, 'execute') and not (p.proname = any (allowed));
  assert t is null, 'Functions exposed to signed-in users but not reviewed: ' || coalesce(t, '');
end $$;

-- 5. Anonymous visitors cannot write anywhere except to submit a join application.
do $$ declare t text; begin
  select string_agg(table_name || ':' || privilege_type, ', ') into t
  from information_schema.role_table_grants
  where grantee = 'anon' and table_schema = 'public'
    and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')
    and not (table_name = 'stack_applications' and privilege_type = 'INSERT');
  assert t is null, 'Anonymous write privileges: ' || coalesce(t, '');
end $$;

-- 6. Signed-in users never write directly to tables that only functions may change.
do $$ declare t text; begin
  select string_agg(table_name || ':' || privilege_type, ', ') into t
  from information_schema.role_table_grants
  where grantee = 'authenticated' and table_schema = 'public'
    and table_name in ('certificates', 'exam_attempts', 'exam_answer_keys', 'assignment_submissions',
                       'assignment_answer_keys', 'lesson_completions', 'audit_log', 'invitations')
    and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE');
  assert t is null, 'Direct write privileges on function-only tables: ' || coalesce(t, '');
end $$;

-- 6b. No one holds TRUNCATE (it bypasses row level security).
do $$ declare t text; begin
  select string_agg(table_name || ' -> ' || grantee, ', ') into t
  from information_schema.role_table_grants
  where grantee in ('anon', 'authenticated') and table_schema = 'public' and privilege_type = 'TRUNCATE';
  assert t is null, 'TRUNCATE granted on: ' || coalesce(t, '');
end $$;

-- 7. The private buckets stay private; only signatures are public.
do $$ begin
  assert not exists (select 1 from storage.buckets where public and id <> 'signatures'), 'only the signatures bucket may be public';
  assert (select count(*) from storage.buckets where id in ('lesson-media', 'submissions', 'signatures')) = 3, 'expected buckets exist';
end $$;
