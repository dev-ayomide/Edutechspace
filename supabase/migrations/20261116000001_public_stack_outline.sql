-- Public curriculum outline for a stack's page (the "course page" anyone can see before applying).
-- Returns only titles and counts of PUBLISHED content in an ACTIVE stack: no lesson content, links, answers
-- or anything about people. Visitors are not signed in, so this is the second function anon may call
-- (after verify_certificate); hardening.test.sql allows it on purpose.

create or replace function public.public_stack_outline(p_slug text)
returns table (
  kind text,              -- 'module' or 'exam'
  module_number integer,  -- 1-based order of the module; null for the exam
  title text,
  description text,
  lesson_count integer,
  video_count integer,
  reading_count integer,
  total_minutes integer,  -- sum of lesson durations the lead entered (may undercount)
  has_assignment boolean,
  question_count integer, -- exam only
  time_limit_minutes integer -- exam only
)
language sql
stable
security definer
set search_path = public
as $$
  with s as (
    select id from public.stacks where slug = p_slug and is_active
  ),
  m as (
    select mo.*, row_number() over (order by mo.order_index, mo.created_at)::int as pos
    from public.modules mo join s on s.id = mo.stack_id
    where mo.is_published
  )
  select 'module', m.pos, m.title, m.description,
         count(l.id)::int,
         count(l.id) filter (where l.lesson_type = 'video')::int,
         count(l.id) filter (where l.lesson_type in ('pdf', 'text'))::int,
         coalesce(sum(l.duration_minutes), 0)::int,
         exists (select 1 from public.assignments a where a.module_id = m.id and a.is_published),
         null::int, null::int
  from m left join public.lessons l on l.module_id = m.id and l.is_published
  group by m.id, m.pos, m.title, m.description
  union all
  select 'exam', null, e.title, null, null, null, null, null, null,
         (select count(*)::int from public.exam_questions q where q.exam_id = e.id),
         e.time_limit_minutes
  from public.exams e join s on s.id = e.stack_id
  where e.is_published
  order by 1 desc, 2;
$$;

revoke all on function public.public_stack_outline(text) from public;
grant execute on function public.public_stack_outline(text) to anon, authenticated;
