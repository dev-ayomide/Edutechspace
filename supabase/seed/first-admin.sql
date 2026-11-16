-- Creates the first platform admin. There is no sign-up page: accounts only exist through invitations,
-- and the first admin cannot be invited by an admin, so this is done once by hand.
--
-- 1. In the Supabase dashboard: Authentication > Users > Add user > Create new user.
--    Use the admin's real email, set a strong password, and tick "Auto Confirm User".
-- 2. Replace the email below and run this script in the SQL editor.
-- 3. Sign in at /login, then change the password from the app if it was a temporary one.
do $$
declare v_email text := lower('admin@your-domain.com');  -- <-- change this
        v_rows integer;
begin
  update public.profiles
  set role = 'admin', full_name = coalesce(nullif(full_name, ''), 'Platform Admin')
  where lower(email) = v_email;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'No user with email % exists yet. Create the user in Authentication > Users first.', v_email;
  end if;
  raise notice 'Admin role granted to %', v_email;
end $$;

select id, email, role from public.profiles where role = 'admin';
