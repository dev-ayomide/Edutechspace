-- Defence in depth for table privileges.
-- Supabase grants every privilege on new public tables to anon and authenticated, relying on RLS. TRUNCATE is
-- not subject to RLS, and the REST API does not expose it, but nothing should hold it. Privileges that RLS
-- already denies are removed too, so a policy added by mistake cannot open them.

revoke truncate, references, trigger on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke truncate, references, trigger on tables from anon, authenticated;

-- Written only by security-definer functions.
revoke insert, update, delete on public.invitations, public.audit_log from authenticated;
