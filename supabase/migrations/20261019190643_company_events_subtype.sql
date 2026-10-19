-- Step 2 of 3 (see 20261019180446_company_subtypes): the events companies get
-- the `events` subtype, and the events logic reads it instead of
-- companies.type.
--
-- The only part of the old classification carried over. An events company
-- organises auditions other companies take part in; without the subtype, the
-- "Also participating in…" banner on those companies and the participants
-- section of its auditions would disappear until someone ticked it again.
-- Every other company stays unclassified.
--
-- From here on companies.type decides nothing about events. The admin form
-- keeps writing it until step 3, but a company marked 'events' there is not an
-- events company unless it also has the subtype.

insert into public.companies_company_subtypes (company_id, company_subtype_id)
select c.id, 'events'
from public.companies c
where c.type = 'events'
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- companies_enriched: same definition, except that `participating_in_events`
-- recognises an events company by its subtype.
-- ---------------------------------------------------------------------------
create or replace view public.companies_enriched with (security_invoker = true) as
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
  c.type,
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
