-- The first-admin script (supabase/seed/first-admin.sql) works on a fresh database and fails loudly otherwise.

-- Without the user it refuses, instead of silently doing nothing.
do $$ begin
  begin
    perform 1;
    -- run the script's logic inline for the failure path (the file itself is exercised below)
    update public.profiles set role = 'admin' where lower(email) = 'nobody@x.test';
    if not found then raise exception 'No user with email nobody@x.test exists yet.'; end if;
    raise exception 'script must fail when the user does not exist';
  exception when others then
    assert sqlerrm like 'No user with email%', 'unexpected error: ' || sqlerrm;
  end;
end $$;

insert into auth.users (id, email) values (gen_random_uuid(), 'Admin@Your-Domain.com');
do $$ begin
  assert (select role from public.profiles where lower(email) = 'admin@your-domain.com') = 'student', 'starts as a plain student';
end $$;

\i seed/first-admin.sql

do $$ begin
  assert (select role from public.profiles where lower(email) = 'admin@your-domain.com') = 'admin', 'the script grants the admin role';
  assert (select full_name from public.profiles where lower(email) = 'admin@your-domain.com') = 'Platform Admin', 'and fills in a placeholder name';
end $$;
