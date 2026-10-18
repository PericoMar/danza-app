-- A company is reachable at a readable address — /companies/ballet-de-lorraine
-- instead of a uuid nobody can read, repeat or recognise in a search result.
--
-- The slug is assigned once, when the company is created, and is never
-- recomputed afterwards. Renaming a company must not move its page: the old
-- address is the one search engines indexed and the one people pasted into
-- messages. Changing a slug is a deliberate act, done with a redirect.

-- ---------------------------------------------------------------------------
-- slugify: text -> the ascii, lowercase, hyphenated form of it.
--
-- Accents are dropped rather than transliterated, which is what readers of
-- every language the catalogue covers expect of a URL: Skånes -> skanes,
-- Compañía -> compania. NFD splits a letter from its accent so the accent can
-- be deleted; the letters that have no decomposition (ø, ł, æ…) are spelled
-- out by hand. Apostrophes close up rather than break the word.
-- ---------------------------------------------------------------------------
create or replace function public.slugify(value text)
returns text
language sql
immutable
strict
as $$
  select btrim(
    regexp_replace(
      regexp_replace(
        translate(
          regexp_replace(
            normalize(
              replace(replace(replace(replace(lower(value),
                'æ', 'ae'), 'œ', 'oe'), 'ß', 'ss'), '''', ''),
              nfd
            ),
            '[̀-ͯ]', '', 'g'
          ),
          'øłđŧ’',
          'oldt'
        ),
        '[^a-z0-9]+', '-', 'g'
      ),
      '-+', '-', 'g'
    ),
    '-'
  );
$$;

comment on function public.slugify(text) is
  'Lowercase ascii hyphenated form of a text, for use in URLs.';

alter table public.companies
  add column slug text;

-- Nullable for now: the backfill in the next migration fills the existing rows
-- and then makes it required.
alter table public.companies
  add constraint companies_slug_format
  check (slug is null or slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

create unique index companies_slug_key on public.companies (slug);

comment on column public.companies.slug is
  'Permanent URL segment for the company page. Assigned on insert, never recomputed on rename.';

-- ---------------------------------------------------------------------------
-- company_slug: a free slug for a company, given its name and country.
--
-- Two real companies can carry the same name in different places — Compañía
-- Nacional de Danza exists in Spain and in Mexico — so the country is the
-- first tie-breaker. It reads better than a number and tells the reader
-- something true. A counter is the last resort.
-- ---------------------------------------------------------------------------
create or replace function public.company_slug(
  company_name text,
  company_country text default null,
  exclude_id uuid default null
)
returns text
language plpgsql
stable
as $$
declare
  base text := public.slugify(company_name);
  country_part text := public.slugify(coalesce(company_country, ''));
  candidate text;
  suffix integer := 2;
begin
  -- A name of only punctuation would slugify to nothing, and every address
  -- still has to exist.
  if base is null or base = '' then
    base := 'company';
  end if;

  candidate := base;

  if country_part <> '' and exists (
    select 1 from public.companies
    where slug = candidate and (exclude_id is null or id <> exclude_id)
  ) then
    candidate := base || '-' || country_part;
  end if;

  while exists (
    select 1 from public.companies
    where slug = candidate and (exclude_id is null or id <> exclude_id)
  ) loop
    candidate := base || '-' || suffix;
    suffix := suffix + 1;
  end loop;

  return candidate;
end;
$$;

-- ---------------------------------------------------------------------------
-- Assigned by the database, not by whoever is inserting: a company without an
-- address is not a state the app should be able to create.
-- ---------------------------------------------------------------------------
create or replace function public.companies_set_slug()
returns trigger
language plpgsql
as $$
begin
  if new.slug is null or btrim(new.slug) = '' then
    new.slug := public.company_slug(new.name, new.country, new.id);
  end if;
  return new;
end;
$$;

create trigger companies_set_slug
  before insert on public.companies
  for each row
  execute function public.companies_set_slug();

-- ---------------------------------------------------------------------------
-- companies_enriched: same definition plus `slug`. `create or replace` can
-- only append columns, so it goes last.
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
  ), '[]'::jsonb) as participating_in_events,
  c.slug
from public.companies c
left join public.favorite_companies fc on fc.company_id = c.id and fc.user_id = auth.uid();
