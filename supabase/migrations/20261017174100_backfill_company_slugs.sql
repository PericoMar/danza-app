-- Gives every company that existed before slugs an address, then makes the
-- column required so none can be created without one.
--
-- Ordered by creation date so the tie-breaking is stable: when two companies
-- share a name, the one that has existed longer keeps the bare slug and the
-- newer one takes the one qualified by country. Re-running this on the same
-- data produces the same slugs.

do $$
declare
  company record;
begin
  for company in
    select id, name, country
    from public.companies
    where slug is null
    order by created_at, id
  loop
    update public.companies
    set slug = public.company_slug(company.name, company.country, company.id)
    where id = company.id;
  end loop;
end;
$$;

alter table public.companies
  alter column slug set not null;

alter table public.companies
  drop constraint companies_slug_format;

alter table public.companies
  add constraint companies_slug_format
  check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
