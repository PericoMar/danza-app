-- Audition schedule tree, phase 3 (contract). See docs/adr/0001-audition-schedule-tree.md.
--
-- Since phase 2 the app reads auditions only through `auditions_enriched` /
-- `companies_enriched` and writes them only through `save_audition`, so the old
-- schedule columns (modes, note, JSONB entries, single dates, free-text location)
-- and `companies.current_audition_id` have no readers left. This drops them and
-- the legacy keys `companies_enriched` still carried for the pre-phase-2 app.
--
-- Not reversible from the data alone: the dropped values only survive in the
-- backfill (20261012015533) and in backups.

-- ---------------------------------------------------------------------------
-- Guard: the old columns are the only schedule an audition without deadlines
-- has. Abort before touching anything if one exists (fix it in the form first).
-- ---------------------------------------------------------------------------
do $$
declare
  missing text;
begin
  select string_agg(a.id::text, ', ')
  into missing
  from public.auditions a
  where not exists (select 1 from public.audition_deadlines d where d.audition_id = a.id);

  if missing is not null then
    raise exception 'Auditions without deadlines: %. Add their schedule before dropping the old columns.', missing;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- companies_enriched: each audition is now exactly a row of `auditions_enriched`
-- (no legacy keys, no legacy sort). The app orders them by relevance itself.
-- Same output columns, so `create or replace` keeps grants and dependants.
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
  ) as has_live_audition
from public.companies c
left join public.favorite_companies fc on fc.company_id = c.id and fc.user_id = auth.uid();

-- ---------------------------------------------------------------------------
-- companies_with_is_favorite exposes `current_audition_id`; a view can't lose a
-- column with `create or replace`, so drop and recreate it without it.
-- ---------------------------------------------------------------------------
drop view public.companies_with_is_favorite;

create view public.companies_with_is_favorite with (security_invoker = true) as
select
  c.id,
  c.created_at,
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
  exists (
    select 1
    from public.favorite_companies fc
    where fc.company_id = c.id and fc.user_id = auth.uid()
  ) as is_favorite
from public.companies c;

-- ---------------------------------------------------------------------------
-- Old columns. No CASCADE: anything still depending on them must fail loudly.
-- Their CHECKs, defaults, FK and indexes go with them.
-- ---------------------------------------------------------------------------
alter table public.companies drop column current_audition_id;

alter table public.auditions
  drop column deadline_date,
  drop column audition_date,
  drop column deadline_mode,
  drop column audition_schedule_mode,
  drop column audition_schedule_note,
  drop column audition_schedule_entries,
  drop column location;
