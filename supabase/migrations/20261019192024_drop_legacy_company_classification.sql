-- Step 3 of 3 (see 20261019180446_company_subtypes): the legacy classification
-- goes — companies.type, is_junior, professional_education_level and the
-- company_type enum. Subtypes are the only classification left.
--
-- Apply only once the app that no longer reads them is deployed: the admin
-- form saves through save_company, and SEO and the events logic read subtypes.
--
-- companies_enriched keeps a `type` column, worked out from the subtypes, for
-- the store builds released before subtypes existed. Drop it once no installed
-- build is that old.

-- An events company marked through the old form after step 2 would otherwise
-- lose that with the column.
insert into public.companies_company_subtypes (company_id, company_subtype_id)
select c.id, 'events'
from public.companies c
where c.type = 'events'
on conflict do nothing;

-- The view reads companies.type, and its own `type` turns from the enum into
-- text, which `create or replace` can't do: it is dropped and built again.
drop view public.companies_enriched;

alter table public.companies
  drop column type,
  drop column is_junior,
  drop column professional_education_level;

drop type public.company_type;

-- ---------------------------------------------------------------------------
-- companies_enriched: same columns as before; `type` is now computed.
-- ---------------------------------------------------------------------------
create view public.companies_enriched with (security_invoker = true) as
select
  c.id,
  c.name,
  c.description,
  c.image,
  c.location,
  c.review_count,
  c.rating_count,
  c.average_rating,
  c.website_url,
  c.instagram_url,
  c.meta_url,
  c.country,
  c.verified,
  c.last_reviewed_at,
  c.country_iso_code,
  (fc.user_id is not null) as is_favorite,
  coalesce((
    select jsonb_agg(to_jsonb(ae) order by ae.created_at desc, ae.id)
    from public.auditions_enriched ae
    where ae.company_id = c.id
  ), '[]'::jsonb) as auditions,
  -- Legacy: the old single type, worked out from the subtypes, for store builds
  -- released before subtypes existed (their company filter reads it).
  case
    when exists (
      select 1 from public.companies_company_subtypes ccs
      where ccs.company_id = c.id and ccs.company_subtype_id = 'events'
    ) then 'events'
    when exists (
      select 1 from public.companies_company_subtypes ccs
      where ccs.company_id = c.id
        and ccs.company_subtype_id in ('pre_professional', 'school_pro', 'university')
    ) then 'professional_education'
    else 'company'
  end as type,
  exists (
    select 1
    from public.auditions_enriched ae
    where ae.company_id = c.id and ae.is_active and ae.status <> 'past'
  ) as has_live_audition,
  coalesce((
    select jsonb_agg(jsonb_build_object('id', ev.id, 'name', ev.name) order by ev.name, ev.id)
    from public.companies ev
    where exists (
        select 1
        from public.companies_company_subtypes ccs
        where ccs.company_id = ev.id and ccs.company_subtype_id = 'events'
      )
      and ev.id in (
        select ae.company_id
        from public.audition_participating_companies apc
        join public.auditions_enriched ae on ae.id = apc.audition_id
        where apc.company_id = c.id and ae.is_active and ae.status <> 'past'
      )
  ), '[]'::jsonb) as participating_in_events,
  c.slug,
  coalesce((
    select array_agg(ccs.company_subtype_id order by ct.sort_order, ct.id, cs.sort_order, cs.id)
    from public.companies_company_subtypes ccs
    join public.company_subtypes cs on cs.id = ccs.company_subtype_id
    join public.company_types ct on ct.id = cs.company_type_id
    where ccs.company_id = c.id
  ), '{}'::text[]) as subtypes
from public.companies c
left join public.favorite_companies fc on fc.company_id = c.id and fc.user_id = auth.uid();

-- A new view starts with no privileges of its own.
grant select on public.companies_enriched to anon, authenticated, service_role;
