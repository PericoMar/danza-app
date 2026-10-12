-- The events a company is taking part in, for the "Also participating in …"
-- banner on its card and its page.
--
-- An event here is an events company with a live audition (active and not
-- past) that lists this company in `audition_participating_companies`. Past or
-- inactive auditions drop out on their own because liveness comes from
-- `auditions_enriched`. Rows pointing at a company that is no longer of type
-- 'events' are ignored.

-- ---------------------------------------------------------------------------
-- companies_enriched: same definition plus `participating_in_events`, a JSON
-- array of { id, name } sorted by name. `create or replace` can only append
-- columns, so it goes after `has_live_audition`.
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
    where ev.type = 'events'
      and ev.id in (
        select ae.company_id
        from public.audition_participating_companies apc
        join public.auditions_enriched ae on ae.id = apc.audition_id
        where apc.company_id = c.id and ae.is_active and ae.status <> 'past'
      )
  ), '[]'::jsonb) as participating_in_events
from public.companies c
left join public.favorite_companies fc on fc.company_id = c.id and fc.user_id = auth.uid();
