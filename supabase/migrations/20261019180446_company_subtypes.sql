-- What kind of organisation a company is: touring, junior, a professional
-- school, an event… A company has any number of subtypes — none, one or all of
-- them. A type only groups subtypes under a heading (in the admin form and the
-- public filter); it is never assigned to a company.
--
-- A catalogue in tables rather than an enum, because the list is editorial and
-- keeps changing (this one replaces the previous classification wholesale).
-- Adding, renaming or regrouping a subtype is an INSERT or UPDATE: no enum to
-- rebuild, and store builds already installed pick it up because they read the
-- catalogue instead of carrying a copy of it.
--
-- First of three steps, and purely additive:
--   1. this one: the catalogue, the junction table and
--      `companies_enriched.subtypes`. companies.type, is_junior and
--      professional_education_level stay — the admin form, the SEO and the
--      events logic still read `type`;
--   2. the events companies get the `events` subtype, and the events logic
--      reads it instead of `type`;
--   3. the legacy columns go.
-- Apart from the events companies, the old classification is deliberately not
-- carried over: every other company starts with no subtype and is classified
-- again by hand.

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------
create table public.company_types (
  id         text primary key,
  label      text not null,
  sort_order smallint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_types_id_format check (id ~ '^[a-z][a-z0-9_]*$'),
  constraint company_types_label_not_blank check (btrim(label) <> '')
);

comment on table public.company_types is 'Headings that group company subtypes in the admin form and the public filter. Never assigned to a company.';
comment on column public.company_types.id is 'Stable identifier, readable in SQL. The name shown is `label`.';

create table public.company_subtypes (
  id              text primary key,
  company_type_id text not null
    references public.company_types(id) on update cascade on delete restrict,
  label           text not null,
  sort_order      smallint not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint company_subtypes_id_format check (id ~ '^[a-z][a-z0-9_]*$'),
  constraint company_subtypes_label_not_blank check (btrim(label) <> '')
);

create index company_subtypes_company_type_id_idx on public.company_subtypes (company_type_id);

comment on table public.company_subtypes is 'What can be ticked on a company (touring, junior, school_pro…). Each one sits under one type.';
comment on column public.company_subtypes.id is 'Stable identifier, also what the ?types= filter of /companies carries. The app treats ''events'' specially; keep it.';
comment on column public.company_subtypes.sort_order is 'Order inside its type, lowest first.';

create trigger handle_company_types_updated_at
  before update on public.company_types
  for each row execute function extensions.moddatetime('updated_at');

create trigger handle_company_subtypes_updated_at
  before update on public.company_subtypes
  for each row execute function extensions.moddatetime('updated_at');

-- ---------------------------------------------------------------------------
-- Which subtypes each company has
-- ---------------------------------------------------------------------------
create table public.companies_company_subtypes (
  company_id         uuid not null
    references public.companies(id) on delete cascade,
  company_subtype_id text not null
    references public.company_subtypes(id) on update cascade on delete restrict,
  created_at         timestamptz not null default now(),
  -- Also the index for reading one company's subtypes.
  primary key (company_id, company_subtype_id)
);

create index companies_company_subtypes_company_subtype_id_idx
  on public.companies_company_subtypes (company_subtype_id);

comment on table public.companies_company_subtypes is 'The subtypes ticked on each company. None = not classified yet.';

-- ---------------------------------------------------------------------------
-- RLS: everyone reads, admins write.
-- ---------------------------------------------------------------------------
alter table public.company_types enable row level security;
alter table public.company_subtypes enable row level security;
alter table public.companies_company_subtypes enable row level security;

create policy "company types select public" on public.company_types
  for select to public using (true);
create policy "company types insert admin only" on public.company_types
  for insert to authenticated with check (public.is_admin());
create policy "company types update admin only" on public.company_types
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "company types delete admin only" on public.company_types
  for delete to authenticated using (public.is_admin());

create policy "company subtypes select public" on public.company_subtypes
  for select to public using (true);
create policy "company subtypes insert admin only" on public.company_subtypes
  for insert to authenticated with check (public.is_admin());
create policy "company subtypes update admin only" on public.company_subtypes
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "company subtypes delete admin only" on public.company_subtypes
  for delete to authenticated using (public.is_admin());

create policy "companies company subtypes select public" on public.companies_company_subtypes
  for select to public using (true);
create policy "companies company subtypes insert admin only" on public.companies_company_subtypes
  for insert to authenticated with check (public.is_admin());
create policy "companies company subtypes delete admin only" on public.companies_company_subtypes
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- The catalogue as agreed on 2026-10-19
-- ---------------------------------------------------------------------------
insert into public.company_types (id, label, sort_order) values
  ('companies',               'Companies',                  0),
  ('junior_pre_professional', 'Junior and pre-professional', 1),
  ('professional_education',  'Professional education',     2),
  ('events',                  'Events',                     3);

insert into public.company_subtypes (id, company_type_id, label, sort_order) values
  ('touring',          'companies',               'Touring',          0),
  ('junior',           'junior_pre_professional', 'Junior',           0),
  ('pre_professional', 'junior_pre_professional', 'Pre-professional', 1),
  ('school_pro',       'professional_education',  'School pro',       0),
  ('university',       'professional_education',  'University',       1),
  ('events',           'events',                  'Events',           0);

-- ---------------------------------------------------------------------------
-- companies_enriched: same definition plus `subtypes`, the ids of the company's
-- subtypes in catalogue order ('{}' when it has none). `create or replace` can
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
