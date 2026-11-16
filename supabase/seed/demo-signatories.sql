-- DEMO ONLY. Placeholder certificate signatories so the full flow (including the signed PDF) can be demonstrated
-- before the real President, Technical Lead and Staff Patron details are available.
--
-- 1. Run this script in the SQL editor (adds three clearly fake names).
-- 2. In the app, go to Admin > Signatories, click Edit on each, and upload the matching image from design/demo-signatures.
-- 3. When the real details arrive: edit each row (name, title, new signature image). Certificates already issued keep
--    what they were signed with; use Admin > Certificates > Reissue to refresh any that should show the real signatories.
insert into public.certificate_signatories (name, title, display_order, is_active)
select v.name, v.title, v.display_order, true
from (values
  ('Demo President (placeholder)', 'President', 1),
  ('Demo Technical Lead (placeholder)', 'Technical Lead', 2),
  ('Demo Staff Patron (placeholder)', 'Staff Patron', 3)
) as v (name, title, display_order)
where not exists (select 1 from public.certificate_signatories);

select name, title, display_order, is_active from public.certificate_signatories order by display_order;
