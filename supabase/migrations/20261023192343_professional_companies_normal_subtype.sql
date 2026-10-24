-- The `companies` type is shown as "Professional companies" and gets a
-- `normal` subtype, listed before touring. The type id stays `companies` so
-- ?types= links keep working.

update public.company_types
set label = 'Professional companies'
where id = 'companies';

update public.company_subtypes
set sort_order = 1
where id = 'touring';

insert into public.company_subtypes (id, company_type_id, label, sort_order) values
  ('normal', 'companies', 'Normal', 0);
