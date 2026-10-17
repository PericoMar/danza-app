-- Resources: the directory of services, professionals and schools around ballet
-- (dance schools, freelance teachers, photographers, physios, movement studios…).
--
-- Three things make this different from `companies`:
--   * the professional writes their own resource, so this is the first table in
--     the project written by non-admins (RLS on `user_id`, not `is_admin()`);
--   * a resource is built across a stepped onboarding, so almost everything is
--     NULLable and the requirements are only checked when it goes live;
--   * what each type is asked is data (`resource_type_fields`), not `if (type === …)`
--     spread over the form, the validation and the resume logic.
--
-- See docs/adr/0002-resources-directory.md and GLOSSARY.md.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

-- What a signed-up account is here for. Chosen in the sign-up form and read by
-- handle_new_auth_user() from the auth user's metadata.
create type public.account_type as enum ('dancer', 'professional');

create type public.resource_type as enum (
  'dance_school',
  'freelance_teacher',
  'photographer',
  'physiotherapist',
  'movement_studio',
  'personal_trainer',
  'nutritionist',
  'general_wellbeing'
);

-- draft          : being filled in, only its owner sees it
-- pending_review : the owner sent it, waiting for us
-- published      : in the directory
-- hidden         : taken down by us or paused by its owner
create type public.resource_status as enum ('draft', 'pending_review', 'published', 'hidden');

-- How wide a resource reaches, and with it where it ranks. The order of the
-- values is the order of preference: `fixed` outranks `multiple`, which
-- outranks `nationwide` (see `resource_region_placements`).
create type public.resource_region_scope as enum ('fixed', 'multiple', 'nationwide');

create type public.resource_student_goal as enum ('recreational', 'vocational', 'professional');

create type public.resource_photography_work_type as enum (
  'indoor_studio',
  'outdoor_urban',
  'dance_school_location',
  'live_theater'
);

-- Every piece of information the onboarding can ask for. A value here is not
-- always one column: `region` covers `region_scope` + `resource_regions`,
-- `emails` is a child table, `logo` is `logo_url`. The mapping lives in one
-- place only, `public.resource_field_state()`.
create type public.resource_field as enum (
  'name',
  'founded_year',
  'founder_name',
  'country',
  'region',
  'address',
  'emails',
  'website_url',
  'instagram_url',
  'facebook_url',
  'professional_experience',
  'disciplines',
  'teaching_method',
  'student_goals',
  'specialization',
  'relation_to_dance',
  'class_style',
  'photography_work_types',
  'logo',
  'description',
  'images'
);

-- The screens of the onboarding, in order. Declaration order is what sorts
-- them, so `order by step` is the flow. The type picker is not here: it runs
-- before the row exists.
create type public.resource_onboarding_step as enum ('basics', 'reach', 'contact', 'craft', 'showcase');

-- ---------------------------------------------------------------------------
-- users: which flow an account belongs to. A dancer's profile lives in `users`;
-- a professional's lives in their `resources` row, so nothing is duplicated here.
-- ---------------------------------------------------------------------------
alter table public.users
  add column account_type public.account_type not null default 'dancer',
  add column onboarding_completed_at timestamptz;

comment on column public.users.account_type is 'Which sign-up flow this account took. A professional''s profile is their `resources` row.';
comment on column public.users.onboarding_completed_at is 'When the professional finished the onboarding (sent their resource for review). NULL = still in it.';

create index idx_users_account_type on public.users using btree (account_type);

-- Same function, plus the account type from the sign-up metadata. Compared as
-- text and defaulted, so an unknown value can never fail the sign-up.
create or replace function public.handle_new_auth_user()
  returns trigger
  language plpgsql
  security definer
  set search_path to 'public'
  as $function$
declare
  v_name text;
  v_account_type public.account_type;
begin
  v_name := coalesce(split_part(new.email, '@', 1), 'user_' || substr(new.id::text, 1, 8));

  v_account_type := case
    when new.raw_user_meta_data->>'account_type' = 'professional' then 'professional'::public.account_type
    else 'dancer'::public.account_type
  end;

  insert into public.users (user_id, name, account_type)  -- role usa el DEFAULT 'user'
  values (new.id, v_name, v_account_type)
  on conflict (user_id) do nothing;

  return new;
end;
$function$;

-- ---------------------------------------------------------------------------
-- regions: the list of regions of a country, curated by us. A table and not an
-- enum so a country can be added without a migration; `countries` already
-- exists (added with the audition schedule tree) and owns the country names.
--
-- A country with no regions yet is not broken: resources there can still be
-- `nationwide`. Only `fixed` / `multiple` need regions to choose from.
-- ---------------------------------------------------------------------------
create table public.regions (
  id               uuid        primary key default gen_random_uuid(),
  country_iso_code text        not null references public.countries (iso_code) on update cascade on delete restrict,
  name             text        not null,
  slug             text        not null,
  position         integer     not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint regions_name_not_blank check (btrim(name) <> ''),
  constraint regions_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint regions_position_non_negative check (position >= 0),
  -- Also the index for listing a country's regions in order.
  constraint regions_slug_unique unique (country_iso_code, slug)
);

comment on table public.regions is 'Regions of a country, curated by admins. What a resource picks in `resource_regions`.';
comment on column public.regions.slug is 'Stable id for URLs and filters: lowercase, no accents, dash-separated.';
comment on column public.regions.position is 'Order in the picker, 0 first. Ties fall back to name.';

create index idx_regions_country_iso_code on public.regions using btree (country_iso_code, position);

create trigger handle_regions_updated_at
  before update on public.regions
  for each row execute function extensions.moddatetime('updated_at');

alter table public.regions enable row level security;

create policy "regions select public" on public.regions
  for select to public using (true);
create policy "regions insert admin only" on public.regions
  for insert to authenticated with check (public.is_admin());
create policy "regions update admin only" on public.regions
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "regions delete admin only" on public.regions
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- disciplines: what a school or a teacher teaches. A table, not an enum: this
-- list grows and we want to extend it from the admin, not with a migration.
-- ---------------------------------------------------------------------------
create table public.disciplines (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  slug       text        not null,
  position   integer     not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint disciplines_name_not_blank check (btrim(name) <> ''),
  constraint disciplines_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint disciplines_slug_unique unique (slug),
  constraint disciplines_position_non_negative check (position >= 0)
);

comment on table public.disciplines is 'Dance disciplines a school or teacher offers (ballet, pointe, men''s technique…).';

create index idx_disciplines_position on public.disciplines using btree (position, name);

create trigger handle_disciplines_updated_at
  before update on public.disciplines
  for each row execute function extensions.moddatetime('updated_at');

alter table public.disciplines enable row level security;

create policy "disciplines select public" on public.disciplines
  for select to public using (true);
create policy "disciplines insert admin only" on public.disciplines
  for insert to authenticated with check (public.is_admin());
create policy "disciplines update admin only" on public.disciplines
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "disciplines delete admin only" on public.disciplines
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- The first wave of region catalogues. Only the countries that already have a
-- company get theirs, as agreed: a country nobody is in does not need regions
-- yet, and the notice below names the ones still missing so we can complete
-- them without guessing. (`companies.country_iso_code` defaults to the string
-- 'NULL' in old rows, hence the filter.)
-- ---------------------------------------------------------------------------
insert into public.regions (country_iso_code, name, slug, position)
select v.country_iso_code, v.name, v.slug, v.position
from (values
  ('ES', 'Andalucía', 'andalucia', 0),
  ('ES', 'Aragón', 'aragon', 1),
  ('ES', 'Asturias', 'asturias', 2),
  ('ES', 'Islas Baleares', 'islas-baleares', 3),
  ('ES', 'Canarias', 'canarias', 4),
  ('ES', 'Cantabria', 'cantabria', 5),
  ('ES', 'Castilla-La Mancha', 'castilla-la-mancha', 6),
  ('ES', 'Castilla y León', 'castilla-y-leon', 7),
  ('ES', 'Cataluña', 'cataluna', 8),
  ('ES', 'Comunidad Valenciana', 'comunidad-valenciana', 9),
  ('ES', 'Extremadura', 'extremadura', 10),
  ('ES', 'Galicia', 'galicia', 11),
  ('ES', 'La Rioja', 'la-rioja', 12),
  ('ES', 'Madrid', 'madrid', 13),
  ('ES', 'Murcia', 'murcia', 14),
  ('ES', 'Navarra', 'navarra', 15),
  ('ES', 'País Vasco', 'pais-vasco', 16),
  ('ES', 'Ceuta', 'ceuta', 17),
  ('ES', 'Melilla', 'melilla', 18),
  ('PT', 'Norte', 'norte', 0),
  ('PT', 'Centro', 'centro', 1),
  ('PT', 'Lisboa', 'lisboa', 2),
  ('PT', 'Alentejo', 'alentejo', 3),
  ('PT', 'Algarve', 'algarve', 4),
  ('PT', 'Madeira', 'madeira', 5),
  ('PT', 'Açores', 'acores', 6),
  ('FR', 'Auvergne-Rhône-Alpes', 'auvergne-rhone-alpes', 0),
  ('FR', 'Bourgogne-Franche-Comté', 'bourgogne-franche-comte', 1),
  ('FR', 'Bretagne', 'bretagne', 2),
  ('FR', 'Centre-Val de Loire', 'centre-val-de-loire', 3),
  ('FR', 'Corse', 'corse', 4),
  ('FR', 'Grand Est', 'grand-est', 5),
  ('FR', 'Hauts-de-France', 'hauts-de-france', 6),
  ('FR', 'Île-de-France', 'ile-de-france', 7),
  ('FR', 'Normandie', 'normandie', 8),
  ('FR', 'Nouvelle-Aquitaine', 'nouvelle-aquitaine', 9),
  ('FR', 'Occitanie', 'occitanie', 10),
  ('FR', 'Pays de la Loire', 'pays-de-la-loire', 11),
  ('FR', 'Provence-Alpes-Côte d''Azur', 'provence-alpes-cote-d-azur', 12),
  ('IT', 'Abruzzo', 'abruzzo', 0),
  ('IT', 'Basilicata', 'basilicata', 1),
  ('IT', 'Calabria', 'calabria', 2),
  ('IT', 'Campania', 'campania', 3),
  ('IT', 'Emilia-Romagna', 'emilia-romagna', 4),
  ('IT', 'Friuli-Venezia Giulia', 'friuli-venezia-giulia', 5),
  ('IT', 'Lazio', 'lazio', 6),
  ('IT', 'Liguria', 'liguria', 7),
  ('IT', 'Lombardia', 'lombardia', 8),
  ('IT', 'Marche', 'marche', 9),
  ('IT', 'Molise', 'molise', 10),
  ('IT', 'Piemonte', 'piemonte', 11),
  ('IT', 'Puglia', 'puglia', 12),
  ('IT', 'Sardegna', 'sardegna', 13),
  ('IT', 'Sicilia', 'sicilia', 14),
  ('IT', 'Toscana', 'toscana', 15),
  ('IT', 'Trentino-Alto Adige', 'trentino-alto-adige', 16),
  ('IT', 'Umbria', 'umbria', 17),
  ('IT', 'Valle d''Aosta', 'valle-d-aosta', 18),
  ('IT', 'Veneto', 'veneto', 19),
  ('DE', 'Baden-Württemberg', 'baden-wurttemberg', 0),
  ('DE', 'Bayern', 'bayern', 1),
  ('DE', 'Berlin', 'berlin', 2),
  ('DE', 'Brandenburg', 'brandenburg', 3),
  ('DE', 'Bremen', 'bremen', 4),
  ('DE', 'Hamburg', 'hamburg', 5),
  ('DE', 'Hessen', 'hessen', 6),
  ('DE', 'Mecklenburg-Vorpommern', 'mecklenburg-vorpommern', 7),
  ('DE', 'Niedersachsen', 'niedersachsen', 8),
  ('DE', 'Nordrhein-Westfalen', 'nordrhein-westfalen', 9),
  ('DE', 'Rheinland-Pfalz', 'rheinland-pfalz', 10),
  ('DE', 'Saarland', 'saarland', 11),
  ('DE', 'Sachsen', 'sachsen', 12),
  ('DE', 'Sachsen-Anhalt', 'sachsen-anhalt', 13),
  ('DE', 'Schleswig-Holstein', 'schleswig-holstein', 14),
  ('DE', 'Thüringen', 'thuringen', 15),
  ('AT', 'Burgenland', 'burgenland', 0),
  ('AT', 'Kärnten', 'karnten', 1),
  ('AT', 'Niederösterreich', 'niederosterreich', 2),
  ('AT', 'Oberösterreich', 'oberosterreich', 3),
  ('AT', 'Salzburg', 'salzburg', 4),
  ('AT', 'Steiermark', 'steiermark', 5),
  ('AT', 'Tirol', 'tirol', 6),
  ('AT', 'Vorarlberg', 'vorarlberg', 7),
  ('AT', 'Wien', 'wien', 8),
  ('CH', 'Lake Geneva', 'lake-geneva', 0),
  ('CH', 'Espace Mittelland', 'espace-mittelland', 1),
  ('CH', 'Northwestern Switzerland', 'northwestern-switzerland', 2),
  ('CH', 'Zurich', 'zurich', 3),
  ('CH', 'Eastern Switzerland', 'eastern-switzerland', 4),
  ('CH', 'Central Switzerland', 'central-switzerland', 5),
  ('CH', 'Ticino', 'ticino', 6),
  ('NL', 'Drenthe', 'drenthe', 0),
  ('NL', 'Flevoland', 'flevoland', 1),
  ('NL', 'Friesland', 'friesland', 2),
  ('NL', 'Gelderland', 'gelderland', 3),
  ('NL', 'Groningen', 'groningen', 4),
  ('NL', 'Limburg', 'limburg', 5),
  ('NL', 'Noord-Brabant', 'noord-brabant', 6),
  ('NL', 'Noord-Holland', 'noord-holland', 7),
  ('NL', 'Overijssel', 'overijssel', 8),
  ('NL', 'Utrecht', 'utrecht', 9),
  ('NL', 'Zeeland', 'zeeland', 10),
  ('NL', 'Zuid-Holland', 'zuid-holland', 11),
  ('BE', 'Brussels', 'brussels', 0),
  ('BE', 'Flanders', 'flanders', 1),
  ('BE', 'Wallonia', 'wallonia', 2),
  ('GB-ENG', 'Greater London', 'greater-london', 0),
  ('GB-ENG', 'South East', 'south-east', 1),
  ('GB-ENG', 'South West', 'south-west', 2),
  ('GB-ENG', 'East of England', 'east-of-england', 3),
  ('GB-ENG', 'East Midlands', 'east-midlands', 4),
  ('GB-ENG', 'West Midlands', 'west-midlands', 5),
  ('GB-ENG', 'North West', 'north-west', 6),
  ('GB-ENG', 'North East', 'north-east', 7),
  ('GB-ENG', 'Yorkshire and the Humber', 'yorkshire-and-the-humber', 8),
  ('GB-SCT', 'Edinburgh and Lothians', 'edinburgh-and-lothians', 0),
  ('GB-SCT', 'Glasgow and Clyde', 'glasgow-and-clyde', 1),
  ('GB-SCT', 'North East Scotland', 'north-east-scotland', 2),
  ('GB-SCT', 'Highlands and Islands', 'highlands-and-islands', 3),
  ('GB-SCT', 'Southern Scotland', 'southern-scotland', 4),
  ('GB-WLS', 'North Wales', 'north-wales', 0),
  ('GB-WLS', 'Mid and West Wales', 'mid-and-west-wales', 1),
  ('GB-WLS', 'South Wales', 'south-wales', 2),
  ('IE', 'Leinster', 'leinster', 0),
  ('IE', 'Munster', 'munster', 1),
  ('IE', 'Connacht', 'connacht', 2),
  ('IE', 'Ulster', 'ulster', 3),
  ('US', 'Alabama', 'alabama', 0),
  ('US', 'Alaska', 'alaska', 1),
  ('US', 'Arizona', 'arizona', 2),
  ('US', 'Arkansas', 'arkansas', 3),
  ('US', 'California', 'california', 4),
  ('US', 'Colorado', 'colorado', 5),
  ('US', 'Connecticut', 'connecticut', 6),
  ('US', 'Delaware', 'delaware', 7),
  ('US', 'District of Columbia', 'district-of-columbia', 8),
  ('US', 'Florida', 'florida', 9),
  ('US', 'Georgia', 'georgia', 10),
  ('US', 'Hawaii', 'hawaii', 11),
  ('US', 'Idaho', 'idaho', 12),
  ('US', 'Illinois', 'illinois', 13),
  ('US', 'Indiana', 'indiana', 14),
  ('US', 'Iowa', 'iowa', 15),
  ('US', 'Kansas', 'kansas', 16),
  ('US', 'Kentucky', 'kentucky', 17),
  ('US', 'Louisiana', 'louisiana', 18),
  ('US', 'Maine', 'maine', 19),
  ('US', 'Maryland', 'maryland', 20),
  ('US', 'Massachusetts', 'massachusetts', 21),
  ('US', 'Michigan', 'michigan', 22),
  ('US', 'Minnesota', 'minnesota', 23),
  ('US', 'Mississippi', 'mississippi', 24),
  ('US', 'Missouri', 'missouri', 25),
  ('US', 'Montana', 'montana', 26),
  ('US', 'Nebraska', 'nebraska', 27),
  ('US', 'Nevada', 'nevada', 28),
  ('US', 'New Hampshire', 'new-hampshire', 29),
  ('US', 'New Jersey', 'new-jersey', 30),
  ('US', 'New Mexico', 'new-mexico', 31),
  ('US', 'New York', 'new-york', 32),
  ('US', 'North Carolina', 'north-carolina', 33),
  ('US', 'North Dakota', 'north-dakota', 34),
  ('US', 'Ohio', 'ohio', 35),
  ('US', 'Oklahoma', 'oklahoma', 36),
  ('US', 'Oregon', 'oregon', 37),
  ('US', 'Pennsylvania', 'pennsylvania', 38),
  ('US', 'Rhode Island', 'rhode-island', 39),
  ('US', 'South Carolina', 'south-carolina', 40),
  ('US', 'South Dakota', 'south-dakota', 41),
  ('US', 'Tennessee', 'tennessee', 42),
  ('US', 'Texas', 'texas', 43),
  ('US', 'Utah', 'utah', 44),
  ('US', 'Vermont', 'vermont', 45),
  ('US', 'Virginia', 'virginia', 46),
  ('US', 'Washington', 'washington', 47),
  ('US', 'West Virginia', 'west-virginia', 48),
  ('US', 'Wisconsin', 'wisconsin', 49),
  ('US', 'Wyoming', 'wyoming', 50),
  ('CA', 'Alberta', 'alberta', 0),
  ('CA', 'British Columbia', 'british-columbia', 1),
  ('CA', 'Manitoba', 'manitoba', 2),
  ('CA', 'New Brunswick', 'new-brunswick', 3),
  ('CA', 'Newfoundland and Labrador', 'newfoundland-and-labrador', 4),
  ('CA', 'Northwest Territories', 'northwest-territories', 5),
  ('CA', 'Nova Scotia', 'nova-scotia', 6),
  ('CA', 'Nunavut', 'nunavut', 7),
  ('CA', 'Ontario', 'ontario', 8),
  ('CA', 'Prince Edward Island', 'prince-edward-island', 9),
  ('CA', 'Quebec', 'quebec', 10),
  ('CA', 'Saskatchewan', 'saskatchewan', 11),
  ('CA', 'Yukon', 'yukon', 12)
) as v(country_iso_code, name, slug, position)
where exists (
  select 1 from public.companies c where c.country_iso_code = v.country_iso_code
);

do $$
declare
  v_missing text;
begin
  select string_agg(distinct coalesce(co.name, c.country_iso_code), ', ')
    into v_missing
  from public.companies c
  left join public.countries co on co.iso_code = c.country_iso_code
  where c.country_iso_code is not null
    and c.country_iso_code <> 'NULL'
    and not exists (select 1 from public.regions r where r.country_iso_code = c.country_iso_code);

  if v_missing is not null then
    raise notice 'Countries with companies and no regions yet: %. Resources there can only be nationwide until their regions are added.', v_missing;
  end if;
end;
$$;

insert into public.disciplines (name, slug, position) values
  ('Ballet', 'ballet', 0),
  ('Pointe', 'pointe', 1),
  ('Men''s technique', 'men-s-technique', 2),
  ('Repertoire', 'repertoire', 3),
  ('Variations', 'variations', 4),
  ('Pas de deux', 'pas-de-deux', 5),
  ('Character dance', 'character-dance', 6),
  ('Neoclassical', 'neoclassical', 7),
  ('Contemporary', 'contemporary', 8),
  ('Modern', 'modern', 9),
  ('Jazz', 'jazz', 10),
  ('Improvisation', 'improvisation', 11),
  ('Floor-barre', 'floor-barre', 12),
  ('Conditioning', 'conditioning', 13),
  ('Stretching', 'stretching', 14),
  ('Choreography', 'choreography', 15);

-- ---------------------------------------------------------------------------
-- resources: the resource itself.
--
-- `user_id` is the account that signs in; the resource is that account's whole
-- profile, so nothing about a professional is duplicated in `users`. UNIQUE:
-- one account, one resource. NULL is not a way around that — it is for the two
-- real cases: resources we seed ourselves with no account behind them, and
-- accounts that have just signed up and have not reached the end yet.
--
-- Almost every column is NULLable on purpose: the onboarding saves what it has
-- at each step. What a resource needs to go live is declared per type in
-- `resource_type_fields` and checked by `assert_resource_publishable()`.
-- ---------------------------------------------------------------------------
create table public.resources (
  id                      uuid                           primary key default gen_random_uuid(),
  user_id                 uuid                           unique references public.users (user_id) on delete cascade,
  type                    public.resource_type           not null,
  status                  public.resource_status         not null default 'draft',
  name                    text                           not null,
  slug                    text                           not null,
  country_iso_code        text                           references public.countries (iso_code) on update cascade on delete restrict,
  region_scope            public.resource_region_scope,
  address                 text,
  no_fixed_address        boolean                        not null default false,
  website_url             text,
  instagram_url           text,
  facebook_url            text,
  logo_url                text,
  description             text,
  verified                boolean                        not null default false,
  -- Custom fields shared by several types. Which type uses which (and whether
  -- it is required) is `resource_type_fields`, never an `if` in the app.
  founded_year            smallint,
  founder_name            text,
  professional_experience text,
  teaching_method         text,
  specialization          text,
  relation_to_dance       text,
  class_style             text,
  published_at            timestamptz,
  created_at              timestamptz                    not null default now(),
  updated_at              timestamptz                    not null default now(),
  constraint resources_name_not_blank check (btrim(name) <> ''),
  constraint resources_name_length check (char_length(name) <= 120),
  constraint resources_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint resources_slug_unique unique (slug),
  -- "No fixed address" is an answer, not an empty field: the two cannot both hold.
  constraint resources_no_fixed_address_has_no_address
    check (not (no_fixed_address and address is not null)),
  constraint resources_address_not_blank check (address is null or btrim(address) <> ''),
  constraint resources_address_length check (char_length(address) <= 300),
  constraint resources_website_url_http check (website_url is null or website_url ~* '^https?://[^[:space:]]+$'),
  constraint resources_instagram_url_http check (instagram_url is null or instagram_url ~* '^https?://[^[:space:]]+$'),
  constraint resources_facebook_url_http check (facebook_url is null or facebook_url ~* '^https?://[^[:space:]]+$'),
  constraint resources_logo_url_not_blank check (logo_url is null or btrim(logo_url) <> ''),
  -- A CHECK has to be immutable, so it cannot say "not in the future"; the form
  -- caps the picker at the current year and the upper bound here is only a sanity net.
  constraint resources_founded_year_range check (founded_year is null or founded_year between 1800 and 2100),
  constraint resources_founder_name_length check (char_length(founder_name) <= 120),
  constraint resources_description_length check (char_length(description) <= 5000),
  constraint resources_professional_experience_length check (char_length(professional_experience) <= 2000),
  constraint resources_teaching_method_length check (char_length(teaching_method) <= 2000),
  constraint resources_specialization_length check (char_length(specialization) <= 2000),
  constraint resources_relation_to_dance_length check (char_length(relation_to_dance) <= 2000),
  constraint resources_class_style_length check (char_length(class_style) <= 2000),
  -- A published resource is never one nobody can find.
  constraint resources_published_has_country
    check (status <> 'published' or (country_iso_code is not null and region_scope is not null))
);

comment on table public.resources is 'A service, professional or school in the ballet directory. One per account (`user_id`), or none when we seeded it ourselves.';
comment on column public.resources.user_id is 'The account that signs in, and whose profile this resource is. UNIQUE: one account, one resource. NULL = seeded by us, or not claimed yet.';
comment on column public.resources.slug is 'Stable URL id, derived from the name once and then left alone.';
comment on column public.resources.no_fixed_address is 'The "I have no fixed address" button. true = the resource has no address on purpose, not a blank field.';
comment on column public.resources.region_scope is 'NULL = the owner has not chosen yet. Choosing it is what the `region` onboarding field means.';
comment on column public.resources.verified is 'Set by us. Breaks ties inside the same placement rank.';
comment on column public.resources.published_at is 'First time it reached `published`. Set by trigger, never by the client.';

create index idx_resources_status_country on public.resources using btree (status, country_iso_code);
create index idx_resources_type on public.resources using btree (type);
create index idx_resources_user_id on public.resources using btree (user_id);
create index idx_resources_country_iso_code on public.resources using btree (country_iso_code);

create trigger handle_resources_updated_at
  before update on public.resources
  for each row execute function extensions.moddatetime('updated_at');

-- ---------------------------------------------------------------------------
-- resource_regions: where a resource shows up. How many rows are allowed is
-- decided by `region_scope` and enforced at the end of the transaction by
-- `assert_resource_region_scope()`, so a save can write scope and regions in
-- any order.
-- ---------------------------------------------------------------------------
create table public.resource_regions (
  resource_id uuid        not null references public.resources (id) on delete cascade,
  region_id   uuid        not null references public.regions (id) on delete restrict,
  position    integer     not null default 0,
  created_at  timestamptz not null default now(),
  constraint resource_regions_pkey primary key (resource_id, region_id),
  constraint resource_regions_position_non_negative check (position >= 0)
);

comment on table public.resource_regions is 'The regions a resource picked. 1 row for `fixed`, 2-3 for `multiple`, none for `nationwide`.';

create index idx_resource_regions_region_id on public.resource_regions using btree (region_id);

-- ---------------------------------------------------------------------------
-- resource_emails: how dancers reach them. Same shape and rules as
-- `audition_emails`; the first one (position 0) is the preferred address.
-- ---------------------------------------------------------------------------
create table public.resource_emails (
  id          uuid        primary key default gen_random_uuid(),
  resource_id uuid        not null references public.resources (id) on delete cascade,
  email       text        not null,
  label       text,
  position    integer     not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- Same rule as the app's isValidEmail (utils/validation.ts) and audition_emails.
  constraint resource_emails_email_format
    check (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint resource_emails_label_not_blank check (label is null or btrim(label) <> ''),
  constraint resource_emails_label_length check (char_length(label) <= 60),
  constraint resource_emails_position_non_negative check (position >= 0),
  constraint resource_emails_position_unique unique (resource_id, position)
);

create unique index resource_emails_email_unique on public.resource_emails (resource_id, lower(email));

comment on table public.resource_emails is 'Contact emails of a resource, in order. Position 0 is the preferred one.';

create trigger handle_resource_emails_updated_at
  before update on public.resource_emails
  for each row execute function extensions.moddatetime('updated_at');

-- ---------------------------------------------------------------------------
-- resource_images: the gallery. The logo is `resources.logo_url`, not the first
-- image here: they are two different things and a photographer needs both.
-- ---------------------------------------------------------------------------
create table public.resource_images (
  id          uuid        primary key default gen_random_uuid(),
  resource_id uuid        not null references public.resources (id) on delete cascade,
  image_url   text        not null,
  caption     text,
  position    integer     not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint resource_images_image_url_not_blank check (btrim(image_url) <> ''),
  constraint resource_images_caption_not_blank check (caption is null or btrim(caption) <> ''),
  constraint resource_images_caption_length check (char_length(caption) <= 200),
  constraint resource_images_position_non_negative check (position >= 0),
  constraint resource_images_position_unique unique (resource_id, position)
);

comment on table public.resource_images is 'Gallery of a resource, in order. Central for photographers, optional for the rest.';

create trigger handle_resource_images_updated_at
  before update on public.resource_images
  for each row execute function extensions.moddatetime('updated_at');

-- ---------------------------------------------------------------------------
-- Multi-selections. Two shapes on purpose: a junction against a catalogue when
-- the list grows (disciplines), a junction against an enum when it is closed.
-- ---------------------------------------------------------------------------
create table public.resource_disciplines (
  resource_id   uuid        not null references public.resources (id) on delete cascade,
  discipline_id uuid        not null references public.disciplines (id) on delete restrict,
  created_at    timestamptz not null default now(),
  constraint resource_disciplines_pkey primary key (resource_id, discipline_id)
);

create index idx_resource_disciplines_discipline_id on public.resource_disciplines using btree (discipline_id);

create table public.resource_student_goals (
  resource_id uuid                        not null references public.resources (id) on delete cascade,
  goal        public.resource_student_goal not null,
  created_at  timestamptz                 not null default now(),
  constraint resource_student_goals_pkey primary key (resource_id, goal)
);

create table public.resource_photography_work_types (
  resource_id uuid                                    not null references public.resources (id) on delete cascade,
  work_type   public.resource_photography_work_type   not null,
  created_at  timestamptz                             not null default now(),
  constraint resource_photography_work_types_pkey primary key (resource_id, work_type)
);

-- ---------------------------------------------------------------------------
-- resource_skipped_fields: what the owner chose to leave for later. Without
-- this, coming back puts them in front of the very field they just declined.
-- ---------------------------------------------------------------------------
create table public.resource_skipped_fields (
  resource_id uuid                  not null references public.resources (id) on delete cascade,
  field       public.resource_field not null,
  created_at  timestamptz           not null default now(),
  constraint resource_skipped_fields_pkey primary key (resource_id, field)
);

comment on table public.resource_skipped_fields is 'Fields the owner pressed "add later" on. Skipping a required field delays publishing, it does not waive it.';

-- ---------------------------------------------------------------------------
-- resource_type_fields: what each type is asked, in which screen, in which
-- order, and what it needs to go live. One table drives four things that would
-- otherwise drift apart: the onboarding form, the validation at publish time,
-- the resume point, and the completeness percentage.
--
-- Adding a type is inserting rows here. It is never an `if` in the app.
-- ---------------------------------------------------------------------------
create table public.resource_type_fields (
  type        public.resource_type            not null,
  field       public.resource_field           not null,
  step        public.resource_onboarding_step not null,
  position    integer                         not null,
  is_required boolean                         not null default false,
  min_count   smallint,
  created_at  timestamptz                     not null default now(),
  updated_at  timestamptz                     not null default now(),
  constraint resource_type_fields_pkey primary key (type, field),
  constraint resource_type_fields_position_non_negative check (position >= 0),
  constraint resource_type_fields_position_unique unique (type, step, position),
  constraint resource_type_fields_min_count_positive check (min_count is null or min_count >= 1)
);

comment on table public.resource_type_fields is 'Which fields each resource type is asked for, where and whether they are needed to publish. The onboarding reads this table.';
comment on column public.resource_type_fields.is_required is 'Needed to leave `draft`. Nothing is required to save a draft.';
comment on column public.resource_type_fields.min_count is 'For fields that are lists: how many rows are needed (3 photos for a photographer). NULL = 1 when required.';
comment on column public.resource_type_fields.position is 'Order inside its step, 0 first.';

create trigger handle_resource_type_fields_updated_at
  before update on public.resource_type_fields
  for each row execute function extensions.moddatetime('updated_at');

alter table public.resource_type_fields enable row level security;

-- Read by anyone: the first onboarding screens run before there is a session.
create policy "resource type fields select public" on public.resource_type_fields
  for select to public using (true);
create policy "resource type fields insert admin only" on public.resource_type_fields
  for insert to authenticated with check (public.is_admin());
create policy "resource type fields update admin only" on public.resource_type_fields
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "resource type fields delete admin only" on public.resource_type_fields
  for delete to authenticated using (public.is_admin());

insert into public.resource_type_fields (type, field, step, position, is_required, min_count) values
  ('dance_school', 'name', 'basics', 0, true, null),
  ('dance_school', 'founded_year', 'basics', 1, false, null),
  ('dance_school', 'founder_name', 'basics', 2, false, null),
  ('dance_school', 'country', 'reach', 0, true, null),
  ('dance_school', 'region', 'reach', 1, true, null),
  ('dance_school', 'address', 'reach', 2, false, null),
  ('dance_school', 'emails', 'contact', 0, true, null),
  ('dance_school', 'website_url', 'contact', 1, false, null),
  ('dance_school', 'instagram_url', 'contact', 2, false, null),
  ('dance_school', 'facebook_url', 'contact', 3, false, null),
  ('dance_school', 'professional_experience', 'craft', 0, true, null),
  ('dance_school', 'disciplines', 'craft', 1, true, null),
  ('dance_school', 'teaching_method', 'craft', 2, true, null),
  ('dance_school', 'student_goals', 'craft', 3, true, null),
  ('dance_school', 'logo', 'showcase', 0, true, null),
  ('dance_school', 'description', 'showcase', 1, true, null),
  ('dance_school', 'images', 'showcase', 2, false, null),
  ('freelance_teacher', 'name', 'basics', 0, true, null),
  ('freelance_teacher', 'founded_year', 'basics', 1, false, null),
  ('freelance_teacher', 'country', 'reach', 0, true, null),
  ('freelance_teacher', 'region', 'reach', 1, true, null),
  ('freelance_teacher', 'address', 'reach', 2, false, null),
  ('freelance_teacher', 'emails', 'contact', 0, true, null),
  ('freelance_teacher', 'website_url', 'contact', 1, false, null),
  ('freelance_teacher', 'instagram_url', 'contact', 2, false, null),
  ('freelance_teacher', 'facebook_url', 'contact', 3, false, null),
  ('freelance_teacher', 'professional_experience', 'craft', 0, true, null),
  ('freelance_teacher', 'disciplines', 'craft', 1, true, null),
  ('freelance_teacher', 'teaching_method', 'craft', 2, true, null),
  ('freelance_teacher', 'student_goals', 'craft', 3, true, null),
  ('freelance_teacher', 'logo', 'showcase', 0, true, null),
  ('freelance_teacher', 'description', 'showcase', 1, true, null),
  ('freelance_teacher', 'images', 'showcase', 2, false, null),
  ('photographer', 'name', 'basics', 0, true, null),
  ('photographer', 'country', 'reach', 0, true, null),
  ('photographer', 'region', 'reach', 1, true, null),
  ('photographer', 'address', 'reach', 2, false, null),
  ('photographer', 'emails', 'contact', 0, true, null),
  ('photographer', 'website_url', 'contact', 1, false, null),
  ('photographer', 'instagram_url', 'contact', 2, false, null),
  ('photographer', 'facebook_url', 'contact', 3, false, null),
  ('photographer', 'photography_work_types', 'craft', 0, true, null),
  ('photographer', 'professional_experience', 'craft', 1, true, null),
  ('photographer', 'relation_to_dance', 'craft', 2, true, null),
  ('photographer', 'logo', 'showcase', 0, true, null),
  ('photographer', 'description', 'showcase', 1, true, null),
  ('photographer', 'images', 'showcase', 2, true, 3),
  ('physiotherapist', 'name', 'basics', 0, true, null),
  ('physiotherapist', 'founded_year', 'basics', 1, false, null),
  ('physiotherapist', 'founder_name', 'basics', 2, false, null),
  ('physiotherapist', 'country', 'reach', 0, true, null),
  ('physiotherapist', 'region', 'reach', 1, true, null),
  ('physiotherapist', 'address', 'reach', 2, false, null),
  ('physiotherapist', 'emails', 'contact', 0, true, null),
  ('physiotherapist', 'website_url', 'contact', 1, false, null),
  ('physiotherapist', 'instagram_url', 'contact', 2, false, null),
  ('physiotherapist', 'facebook_url', 'contact', 3, false, null),
  ('physiotherapist', 'specialization', 'craft', 0, true, null),
  ('physiotherapist', 'professional_experience', 'craft', 1, true, null),
  ('physiotherapist', 'relation_to_dance', 'craft', 2, true, null),
  ('physiotherapist', 'logo', 'showcase', 0, true, null),
  ('physiotherapist', 'description', 'showcase', 1, true, null),
  ('physiotherapist', 'images', 'showcase', 2, false, null),
  ('movement_studio', 'name', 'basics', 0, true, null),
  ('movement_studio', 'founded_year', 'basics', 1, false, null),
  ('movement_studio', 'founder_name', 'basics', 2, false, null),
  ('movement_studio', 'country', 'reach', 0, true, null),
  ('movement_studio', 'region', 'reach', 1, true, null),
  ('movement_studio', 'address', 'reach', 2, false, null),
  ('movement_studio', 'emails', 'contact', 0, true, null),
  ('movement_studio', 'website_url', 'contact', 1, false, null),
  ('movement_studio', 'instagram_url', 'contact', 2, false, null),
  ('movement_studio', 'facebook_url', 'contact', 3, false, null),
  ('movement_studio', 'specialization', 'craft', 0, true, null),
  ('movement_studio', 'class_style', 'craft', 1, true, null),
  ('movement_studio', 'professional_experience', 'craft', 2, true, null),
  ('movement_studio', 'relation_to_dance', 'craft', 3, true, null),
  ('movement_studio', 'logo', 'showcase', 0, true, null),
  ('movement_studio', 'description', 'showcase', 1, true, null),
  ('movement_studio', 'images', 'showcase', 2, false, null),
  ('personal_trainer', 'name', 'basics', 0, true, null),
  ('personal_trainer', 'founded_year', 'basics', 1, false, null),
  ('personal_trainer', 'country', 'reach', 0, true, null),
  ('personal_trainer', 'region', 'reach', 1, true, null),
  ('personal_trainer', 'address', 'reach', 2, false, null),
  ('personal_trainer', 'emails', 'contact', 0, true, null),
  ('personal_trainer', 'website_url', 'contact', 1, false, null),
  ('personal_trainer', 'instagram_url', 'contact', 2, false, null),
  ('personal_trainer', 'facebook_url', 'contact', 3, false, null),
  ('personal_trainer', 'professional_experience', 'craft', 0, true, null),
  ('personal_trainer', 'specialization', 'craft', 1, false, null),
  ('personal_trainer', 'class_style', 'craft', 2, false, null),
  ('personal_trainer', 'relation_to_dance', 'craft', 3, false, null),
  ('personal_trainer', 'logo', 'showcase', 0, true, null),
  ('personal_trainer', 'description', 'showcase', 1, true, null),
  ('personal_trainer', 'images', 'showcase', 2, false, null),
  ('nutritionist', 'name', 'basics', 0, true, null),
  ('nutritionist', 'founded_year', 'basics', 1, false, null),
  ('nutritionist', 'country', 'reach', 0, true, null),
  ('nutritionist', 'region', 'reach', 1, true, null),
  ('nutritionist', 'address', 'reach', 2, false, null),
  ('nutritionist', 'emails', 'contact', 0, true, null),
  ('nutritionist', 'website_url', 'contact', 1, false, null),
  ('nutritionist', 'instagram_url', 'contact', 2, false, null),
  ('nutritionist', 'facebook_url', 'contact', 3, false, null),
  ('nutritionist', 'professional_experience', 'craft', 0, true, null),
  ('nutritionist', 'specialization', 'craft', 1, false, null),
  ('nutritionist', 'relation_to_dance', 'craft', 2, false, null),
  ('nutritionist', 'logo', 'showcase', 0, true, null),
  ('nutritionist', 'description', 'showcase', 1, true, null),
  ('nutritionist', 'images', 'showcase', 2, false, null),
  ('general_wellbeing', 'name', 'basics', 0, true, null),
  ('general_wellbeing', 'founded_year', 'basics', 1, false, null),
  ('general_wellbeing', 'founder_name', 'basics', 2, false, null),
  ('general_wellbeing', 'country', 'reach', 0, true, null),
  ('general_wellbeing', 'region', 'reach', 1, true, null),
  ('general_wellbeing', 'address', 'reach', 2, false, null),
  ('general_wellbeing', 'emails', 'contact', 0, true, null),
  ('general_wellbeing', 'website_url', 'contact', 1, false, null),
  ('general_wellbeing', 'instagram_url', 'contact', 2, false, null),
  ('general_wellbeing', 'facebook_url', 'contact', 3, false, null),
  ('general_wellbeing', 'professional_experience', 'craft', 0, true, null),
  ('general_wellbeing', 'specialization', 'craft', 1, false, null),
  ('general_wellbeing', 'relation_to_dance', 'craft', 2, false, null),
  ('general_wellbeing', 'logo', 'showcase', 0, true, null),
  ('general_wellbeing', 'description', 'showcase', 1, true, null),
  ('general_wellbeing', 'images', 'showcase', 2, false, null);

-- ---------------------------------------------------------------------------
-- resource_field_state: the one place that knows how to look at a resource and
-- say, field by field, whether it has been answered. The onboarding form, the
-- publish check, the completeness percentage and the resume point all read it,
-- so none of them can disagree with the others.
--
-- An unhandled field counts as not answered on purpose: adding a value to
-- `resource_field` without teaching this function about it blocks publishing
-- loudly instead of passing silently.
-- ---------------------------------------------------------------------------
create function public.resource_field_state(p_resource_id uuid)
  returns table (
    field       public.resource_field,
    step        public.resource_onboarding_step,
    ordinal     integer,
    is_required boolean,
    min_count   smallint,
    is_filled   boolean,
    is_skipped  boolean
  )
  language sql
  stable
  security invoker
  set search_path = ''
  as $function$
  select
    f.field,
    f.step,
    f.position,
    f.is_required,
    f.min_count,
    coalesce(
      case f.field
        when 'name'                    then nullif(btrim(r.name), '') is not null
        when 'founded_year'            then r.founded_year is not null
        when 'founder_name'            then nullif(btrim(r.founder_name), '') is not null
        when 'country'                 then r.country_iso_code is not null
        when 'region'                  then r.region_scope is not null
        -- "I have no fixed address" is an answer, so the field counts as done.
        when 'address'                 then r.no_fixed_address or nullif(btrim(r.address), '') is not null
        when 'emails'                  then c.n_emails >= greatest(coalesce(f.min_count, 1), 1)
        when 'website_url'             then r.website_url is not null
        when 'instagram_url'           then r.instagram_url is not null
        when 'facebook_url'            then r.facebook_url is not null
        when 'professional_experience' then nullif(btrim(r.professional_experience), '') is not null
        when 'disciplines'             then c.n_disciplines >= greatest(coalesce(f.min_count, 1), 1)
        when 'teaching_method'         then nullif(btrim(r.teaching_method), '') is not null
        when 'student_goals'           then c.n_student_goals >= greatest(coalesce(f.min_count, 1), 1)
        when 'specialization'          then nullif(btrim(r.specialization), '') is not null
        when 'relation_to_dance'       then nullif(btrim(r.relation_to_dance), '') is not null
        when 'class_style'             then nullif(btrim(r.class_style), '') is not null
        when 'photography_work_types'  then c.n_work_types >= greatest(coalesce(f.min_count, 1), 1)
        when 'logo'                    then nullif(btrim(r.logo_url), '') is not null
        when 'description'             then nullif(btrim(r.description), '') is not null
        when 'images'                  then c.n_images >= greatest(coalesce(f.min_count, 1), 1)
      end,
      false
    ),
    s.resource_id is not null
  from public.resources r
  join public.resource_type_fields f on f.type = r.type
  left join public.resource_skipped_fields s on s.resource_id = r.id and s.field = f.field
  cross join lateral (
    select
      (select count(*) from public.resource_emails e where e.resource_id = r.id)                  as n_emails,
      (select count(*) from public.resource_images i where i.resource_id = r.id)                  as n_images,
      (select count(*) from public.resource_disciplines d where d.resource_id = r.id)             as n_disciplines,
      (select count(*) from public.resource_student_goals g where g.resource_id = r.id)           as n_student_goals,
      (select count(*) from public.resource_photography_work_types w where w.resource_id = r.id)  as n_work_types
  ) c
  where r.id = p_resource_id
  order by f.step, f.position;
$function$;

comment on function public.resource_field_state(uuid) is 'Per field of a resource''s type: which step it belongs to, whether it is required, answered and skipped. Single source of truth for the onboarding.';

-- ---------------------------------------------------------------------------
-- A resource that is not a draft has to be complete. Checked at the end of the
-- transaction (deferred), so one save can fill the last field and send it for
-- review in any order.
-- ---------------------------------------------------------------------------
create function public.assert_resource_publishable(p_resource_id uuid)
  returns void
  language plpgsql
  security invoker
  set search_path = ''
  as $function$
declare
  v_status  public.resource_status;
  v_missing text;
begin
  select status into v_status from public.resources where id = p_resource_id;

  -- Deleted before commit, or still private: nothing to require.
  if v_status is null or v_status in ('draft', 'hidden') then
    return;
  end if;

  select string_agg(field::text, ', ' order by step, ordinal)
    into v_missing
  from public.resource_field_state(p_resource_id)
  where is_required and not is_filled;

  if v_missing is not null then
    raise exception 'resources: the resource still needs % before it can be reviewed or published', v_missing
      using errcode = 'check_violation';
  end if;
end;
$function$;

-- ---------------------------------------------------------------------------
-- How many regions a scope allows, and that they are in the resource's country.
-- Deferred too: a save writes the scope and the regions in whatever order.
-- ---------------------------------------------------------------------------
create function public.assert_resource_region_scope(p_resource_id uuid)
  returns void
  language plpgsql
  security invoker
  set search_path = ''
  as $function$
declare
  v_scope    public.resource_region_scope;
  v_country  text;
  v_count    integer;
  v_mismatch integer;
begin
  select region_scope, country_iso_code into v_scope, v_country
  from public.resources where id = p_resource_id;

  if not found then
    return;  -- deleted before commit
  end if;

  select count(*) into v_count from public.resource_regions where resource_id = p_resource_id;

  if v_scope is null then
    if v_count > 0 then
      raise exception 'resources: choose a region scope before choosing regions'
        using errcode = 'check_violation';
    end if;
    return;
  end if;

  if v_scope = 'fixed' and v_count <> 1 then
    raise exception 'resources: a fixed scope is exactly one region (got %)', v_count
      using errcode = 'check_violation';
  elsif v_scope = 'multiple' and (v_count < 2 or v_count > 3) then
    raise exception 'resources: a multiple scope is 2 or 3 regions (got %)', v_count
      using errcode = 'check_violation';
  elsif v_scope = 'nationwide' and v_count > 0 then
    raise exception 'resources: a nationwide resource covers its whole country and takes no regions (got %)', v_count
      using errcode = 'check_violation';
  end if;

  select count(*) into v_mismatch
  from public.resource_regions rr
  join public.regions g on g.id = rr.region_id
  where rr.resource_id = p_resource_id
    and g.country_iso_code is distinct from v_country;

  if v_mismatch > 0 then
    raise exception 'resources: % of the chosen regions are not in the resource''s country', v_mismatch
      using errcode = 'check_violation';
  end if;
end;
$function$;

-- Trigger wrappers. Two of them because the row carries the resource id in a
-- different column on the parent and on the children.
create function public.resource_assert_trigger()
  returns trigger
  language plpgsql
  set search_path = ''
  as $function$
begin
  perform public.assert_resource_region_scope(new.id);
  perform public.assert_resource_publishable(new.id);
  return null;
end;
$function$;

create function public.resource_child_assert_trigger()
  returns trigger
  language plpgsql
  set search_path = ''
  as $function$
declare
  v_resource_id uuid;
begin
  if tg_op = 'DELETE' then
    v_resource_id := old.resource_id;
  else
    v_resource_id := new.resource_id;
  end if;

  if tg_table_name = 'resource_regions' then
    perform public.assert_resource_region_scope(v_resource_id);
  end if;

  perform public.assert_resource_publishable(v_resource_id);
  return null;
end;
$function$;

create constraint trigger resources_assert
  after insert or update on public.resources
  deferrable initially deferred
  for each row execute function public.resource_assert_trigger();

create constraint trigger resource_regions_assert
  after insert or update or delete on public.resource_regions
  deferrable initially deferred
  for each row execute function public.resource_child_assert_trigger();

create constraint trigger resource_emails_assert
  after insert or update or delete on public.resource_emails
  deferrable initially deferred
  for each row execute function public.resource_child_assert_trigger();

create constraint trigger resource_images_assert
  after insert or update or delete on public.resource_images
  deferrable initially deferred
  for each row execute function public.resource_child_assert_trigger();

create constraint trigger resource_disciplines_assert
  after insert or update or delete on public.resource_disciplines
  deferrable initially deferred
  for each row execute function public.resource_child_assert_trigger();

create constraint trigger resource_student_goals_assert
  after insert or update or delete on public.resource_student_goals
  deferrable initially deferred
  for each row execute function public.resource_child_assert_trigger();

create constraint trigger resource_photography_work_types_assert
  after insert or update or delete on public.resource_photography_work_types
  deferrable initially deferred
  for each row execute function public.resource_child_assert_trigger();

-- ---------------------------------------------------------------------------
-- What the client is not allowed to decide: publishing, verifying, who owns a
-- resource, and the slug once it exists. Policed here and not in the app so it
-- holds for every caller.
-- ---------------------------------------------------------------------------
create function public.resources_guard()
  returns trigger
  language plpgsql
  security invoker
  set search_path = ''
  as $function$
declare
  v_is_admin boolean := public.is_admin();
begin
  if tg_op = 'INSERT' then
    if not v_is_admin then
      -- A resource is born a draft, unverified, whoever asks for it.
      new.status := 'draft';
      new.verified := false;
    end if;
  else
    if not v_is_admin then
      if new.status = 'published' and old.status <> 'published' then
        raise exception 'resources: only an admin publishes a resource. Send it for review instead'
          using errcode = 'insufficient_privilege';
      end if;
      if new.verified is distinct from old.verified then
        raise exception 'resources: only an admin verifies a resource'
          using errcode = 'insufficient_privilege';
      end if;
      if new.user_id is distinct from old.user_id then
        raise exception 'resources: a resource cannot change hands'
          using errcode = 'insufficient_privilege';
      end if;
      if new.type is distinct from old.type and old.status <> 'draft' then
        raise exception 'resources: the type can only change while the resource is a draft'
          using errcode = 'check_violation';
      end if;
      -- The slug is the public URL: derived once from the name, then left alone.
      new.slug := old.slug;
    end if;
  end if;

  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;

  return new;
end;
$function$;

create trigger resources_guard
  before insert or update on public.resources
  for each row execute function public.resources_guard();

-- ---------------------------------------------------------------------------
-- Slugs. `resource_unique_slug` is security definer on purpose: as the caller
-- it would only see the resources RLS lets it read, pick a slug that looks free and
-- hit the unique index. It returns a slug and nothing else.
-- ---------------------------------------------------------------------------
create function public.resource_slugify(p_text text)
  returns text
  language sql
  immutable
  set search_path = ''
  as $function$
  select nullif(
    btrim(
      regexp_replace(
        lower(translate(
          p_text,
          'áàäâãéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
          'aaaaaeeeeiiiiooooouuuuncAAAAAEEEEIIIIOOOOOUUUUNC'
        )),
        '[^a-z0-9]+', '-', 'g'
      ),
      '-'
    ),
    ''
  );
$function$;

create function public.resource_unique_slug(p_name text)
  returns text
  language plpgsql
  stable
  security definer
  set search_path = ''
  as $function$
declare
  v_base text;
  v_slug text;
  v_n    integer := 1;
begin
  v_base := coalesce(public.resource_slugify(p_name), 'resource');
  v_slug := v_base;

  while exists (select 1 from public.resources where slug = v_slug) loop
    v_n := v_n + 1;
    v_slug := v_base || '-' || v_n;
  end loop;

  return v_slug;
end;
$function$;

-- ---------------------------------------------------------------------------
-- RLS. This is the first part of the project written by ordinary users, so the
-- rules are about owning a row and not about being an admin:
--   * anybody reads a published resource;
--   * its owner reads and writes their own, published or not;
--   * admins do everything (and are the only ones who publish or verify,
--     which `resources_guard()` enforces on top of these policies).
-- The two helpers keep the children's policies readable and identical. Being
-- `security invoker`, `can_read_resource` inherits the policy below, so a child
-- row is visible exactly when its resource is.
-- ---------------------------------------------------------------------------
alter table public.resources enable row level security;

create policy "resources select published or own" on public.resources
  for select to public
  using (status = 'published' or user_id = auth.uid() or public.is_admin());
create policy "resources insert own or admin" on public.resources
  for insert to authenticated
  with check (user_id = auth.uid() or public.is_admin());
create policy "resources update own or admin" on public.resources
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
create policy "resources delete own or admin" on public.resources
  for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

create function public.can_read_resource(p_resource_id uuid)
  returns boolean
  language sql
  stable
  security invoker
  set search_path = ''
  as $function$
  select exists (select 1 from public.resources r where r.id = p_resource_id);
$function$;

create function public.can_write_resource(p_resource_id uuid)
  returns boolean
  language sql
  stable
  security invoker
  set search_path = ''
  as $function$
  select exists (
    select 1 from public.resources r
    where r.id = p_resource_id and (r.user_id = auth.uid() or public.is_admin())
  );
$function$;

comment on function public.can_read_resource(uuid) is 'Whether the caller can see that resource at all. Used by the children''s SELECT policies so visibility is defined once.';
comment on function public.can_write_resource(uuid) is 'Whether that resource belongs to the caller (or the caller is an admin). Used by the children''s write policies.';

alter table public.resource_regions enable row level security;
create policy "resource regions select visible" on public.resource_regions
  for select to public using (public.can_read_resource(resource_id));
create policy "resource regions insert owner" on public.resource_regions
  for insert to authenticated with check (public.can_write_resource(resource_id));
create policy "resource regions update owner" on public.resource_regions
  for update to authenticated using (public.can_write_resource(resource_id)) with check (public.can_write_resource(resource_id));
create policy "resource regions delete owner" on public.resource_regions
  for delete to authenticated using (public.can_write_resource(resource_id));

alter table public.resource_emails enable row level security;
create policy "resource emails select visible" on public.resource_emails
  for select to public using (public.can_read_resource(resource_id));
create policy "resource emails insert owner" on public.resource_emails
  for insert to authenticated with check (public.can_write_resource(resource_id));
create policy "resource emails update owner" on public.resource_emails
  for update to authenticated using (public.can_write_resource(resource_id)) with check (public.can_write_resource(resource_id));
create policy "resource emails delete owner" on public.resource_emails
  for delete to authenticated using (public.can_write_resource(resource_id));

alter table public.resource_images enable row level security;
create policy "resource images select visible" on public.resource_images
  for select to public using (public.can_read_resource(resource_id));
create policy "resource images insert owner" on public.resource_images
  for insert to authenticated with check (public.can_write_resource(resource_id));
create policy "resource images update owner" on public.resource_images
  for update to authenticated using (public.can_write_resource(resource_id)) with check (public.can_write_resource(resource_id));
create policy "resource images delete owner" on public.resource_images
  for delete to authenticated using (public.can_write_resource(resource_id));

alter table public.resource_disciplines enable row level security;
create policy "resource disciplines select visible" on public.resource_disciplines
  for select to public using (public.can_read_resource(resource_id));
create policy "resource disciplines insert owner" on public.resource_disciplines
  for insert to authenticated with check (public.can_write_resource(resource_id));
create policy "resource disciplines delete owner" on public.resource_disciplines
  for delete to authenticated using (public.can_write_resource(resource_id));

alter table public.resource_student_goals enable row level security;
create policy "resource student goals select visible" on public.resource_student_goals
  for select to public using (public.can_read_resource(resource_id));
create policy "resource student goals insert owner" on public.resource_student_goals
  for insert to authenticated with check (public.can_write_resource(resource_id));
create policy "resource student goals delete owner" on public.resource_student_goals
  for delete to authenticated using (public.can_write_resource(resource_id));

alter table public.resource_photography_work_types enable row level security;
create policy "resource work types select visible" on public.resource_photography_work_types
  for select to public using (public.can_read_resource(resource_id));
create policy "resource work types insert owner" on public.resource_photography_work_types
  for insert to authenticated with check (public.can_write_resource(resource_id));
create policy "resource work types delete owner" on public.resource_photography_work_types
  for delete to authenticated using (public.can_write_resource(resource_id));

-- Only its owner: what someone left for later is not public information.
alter table public.resource_skipped_fields enable row level security;
create policy "resource skipped fields select owner" on public.resource_skipped_fields
  for select to authenticated using (public.can_write_resource(resource_id));
create policy "resource skipped fields insert owner" on public.resource_skipped_fields
  for insert to authenticated with check (public.can_write_resource(resource_id));
create policy "resource skipped fields delete owner" on public.resource_skipped_fields
  for delete to authenticated using (public.can_write_resource(resource_id));

-- ---------------------------------------------------------------------------
-- resources_enriched: one row per resource with everything a screen needs, so
-- no screen has to join or fetch N+1 times. Same contract as
-- `auditions_enriched`: `security_invoker`, children as ordered JSON arrays,
-- derived columns last.
--
-- The derived block is what the onboarding runs on: `completeness_pct` for the
-- progress bar, `missing_fields` for "what is left to publish", and
-- `next_field` / `next_step` for "carry on where you left off" — the first
-- field that is neither answered nor skipped. Deriving it means there is no
-- stored step counter to drift out of sync.
-- ---------------------------------------------------------------------------
create view public.resources_enriched with (security_invoker = true) as
select
  r.id,
  r.user_id,
  r.type,
  r.status,
  r.name,
  r.slug,
  r.country_iso_code,
  co.name as country_name,
  r.region_scope,
  r.address,
  r.no_fixed_address,
  r.website_url,
  r.instagram_url,
  r.facebook_url,
  r.logo_url,
  r.description,
  r.verified,
  r.founded_year,
  r.founder_name,
  r.professional_experience,
  r.teaching_method,
  r.specialization,
  r.relation_to_dance,
  r.class_style,
  r.published_at,
  r.created_at,
  r.updated_at,
  coalesce(g.regions, '[]'::jsonb) as regions,
  coalesce(m.emails, '[]'::jsonb) as emails,
  coalesce(i.images, '[]'::jsonb) as images,
  coalesce(d.disciplines, '[]'::jsonb) as disciplines,
  coalesce(sg.student_goals, '[]'::jsonb) as student_goals,
  coalesce(wt.photography_work_types, '[]'::jsonb) as photography_work_types,
  -- Placement: derived from the scope, never written. `fixed` first, then
  -- `multiple`, then `nationwide`; NULL while the owner has not chosen.
  (case r.region_scope
    when 'fixed' then 0
    when 'multiple' then 1
    when 'nationwide' then 2
  end)::smallint as placement_rank,
  coalesce(fs.missing_fields, '[]'::jsonb) as missing_fields,
  coalesce(fs.skipped_fields, '[]'::jsonb) as skipped_fields,
  coalesce(fs.completeness_pct, 0)::smallint as completeness_pct,
  fs.next_field,
  fs.next_step
from public.resources r
left join public.countries co on co.iso_code = r.country_iso_code
left join lateral (
  select jsonb_agg(
    jsonb_build_object('id', x.id, 'name', x.name, 'slug', x.slug, 'country_iso_code', x.country_iso_code)
    order by rr.position, x.name
  ) as regions
  from public.resource_regions rr
  join public.regions x on x.id = rr.region_id
  where rr.resource_id = r.id
) g on true
left join lateral (
  select jsonb_agg(
    jsonb_build_object('id', e.id, 'email', e.email, 'label', e.label) order by e.position
  ) as emails
  from public.resource_emails e
  where e.resource_id = r.id
) m on true
left join lateral (
  select jsonb_agg(
    jsonb_build_object('id', im.id, 'image_url', im.image_url, 'caption', im.caption) order by im.position
  ) as images
  from public.resource_images im
  where im.resource_id = r.id
) i on true
left join lateral (
  select jsonb_agg(
    jsonb_build_object('id', x.id, 'name', x.name, 'slug', x.slug) order by x.position, x.name
  ) as disciplines
  from public.resource_disciplines rd
  join public.disciplines x on x.id = rd.discipline_id
  where rd.resource_id = r.id
) d on true
left join lateral (
  select jsonb_agg(to_jsonb(x.goal::text) order by x.goal) as student_goals
  from public.resource_student_goals x
  where x.resource_id = r.id
) sg on true
left join lateral (
  select jsonb_agg(to_jsonb(x.work_type::text) order by x.work_type) as photography_work_types
  from public.resource_photography_work_types x
  where x.resource_id = r.id
) wt on true
left join lateral (
  select
    jsonb_agg(to_jsonb(st.field::text) order by st.step, st.ordinal) filter (where st.is_required and not st.is_filled) as missing_fields,
    jsonb_agg(to_jsonb(st.field::text) order by st.step, st.ordinal) filter (where st.is_skipped) as skipped_fields,
    round(100.0 * count(*) filter (where st.is_filled) / nullif(count(*), 0)) as completeness_pct,
    (array_agg(st.field order by st.step, st.ordinal) filter (where not st.is_filled and not st.is_skipped))[1] as next_field,
    (array_agg(st.step  order by st.step, st.ordinal) filter (where not st.is_filled and not st.is_skipped))[1] as next_step
  from public.resource_field_state(r.id) st
) fs on true;

comment on view public.resources_enriched is 'Read model of a resource: its columns, its children as ordered JSON, and the derived onboarding state (completeness, what is missing, where to carry on).';
comment on column public.resources_enriched.placement_rank is 'Derived from region_scope: 0 fixed, 1 multiple, 2 nationwide. Lower shows first.';
comment on column public.resources_enriched.next_field is 'First field of its type that is neither answered nor skipped: where the onboarding resumes. NULL = nothing left to ask.';

-- ---------------------------------------------------------------------------
-- resource_region_placements: one row per (region, published resource that must
-- appear in it), already carrying the rank. A `nationwide` resource gets a row
-- for every region of its country, which is what "appears in every search of
-- its country" means — so the directory screen is a join and an ORDER BY instead
-- of an OR across two shapes.
-- ---------------------------------------------------------------------------
create view public.resource_region_placements with (security_invoker = true) as
select
  rr.region_id,
  r.id as resource_id,
  r.country_iso_code,
  (case r.region_scope when 'fixed' then 0 else 1 end)::smallint as placement_rank
from public.resources r
join public.resource_regions rr on rr.resource_id = r.id
where r.status = 'published'
  and r.region_scope in ('fixed', 'multiple')
union all
select
  x.id as region_id,
  r.id as resource_id,
  r.country_iso_code,
  2::smallint as placement_rank
from public.resources r
join public.regions x on x.country_iso_code = r.country_iso_code
where r.status = 'published'
  and r.region_scope = 'nationwide';

comment on view public.resource_region_placements is 'Published resources by region, with their rank. Nationwide resources appear in every region of their country.';

-- ---------------------------------------------------------------------------
-- save_resource: the resource and all of its children in one transaction, with
-- the same contract as `save_audition`:
--   * a key that is absent leaves what is stored untouched;
--   * a key that is present replaces it, and for a list the order of the array
--     becomes `position`.
-- That is what lets the onboarding send one step at a time without wiping the
-- rest, and the edit screen send everything.
--
-- Payload:
-- {
--   "id": uuid | null,              -- null inserts (needs "type" and "name")
--   "user_id": uuid | null,         -- admins only, to seed a resource with no account
--   "type": resource_type,          -- only changeable while the resource is a draft
--   "status": resource_status,      -- the client can reach pending_review / hidden, never published
--   "name", "country_iso_code", "region_scope", "address", "website_url",
--   "instagram_url", "facebook_url", "logo_url", "description", "founder_name",
--   "professional_experience", "teaching_method", "specialization",
--   "relation_to_dance", "class_style": text | null,
--   "no_fixed_address": boolean,    -- true forces "address" to null
--   "founded_year": integer | null,
--   "region_ids": [uuid],           -- how many are allowed depends on region_scope
--   "emails": [{ "email", "label"? }],
--   "images": [{ "image_url", "caption"? }],
--   "discipline_ids": [uuid],
--   "student_goals": [resource_student_goal],
--   "photography_work_types": [resource_photography_work_type],
--   "skipped_fields": [resource_field]
-- }
--
-- Moving a resource from one country to another without sending "region_ids" in
-- the same payload clears its regions and its scope: a region belongs to a
-- country, so the move invalidates them and the onboarding asks again (the
-- `region` field goes back to unanswered). Setting the country for the first
-- time is not a move and clears nothing.
--
-- Runs as the caller, so RLS still decides; the checks here are for clear errors.
-- ---------------------------------------------------------------------------
create function public.save_resource(p jsonb)
  returns uuid
  language plpgsql
  security invoker
  set search_path = ''
  as $function$
declare
  v_id          uuid := nullif(p->>'id', '')::uuid;
  v_is_admin    boolean := public.is_admin();
  v_user_id     uuid;
  v_name        text;
  v_type        public.resource_type;
  v_old_country text;
  v_new_country text;
begin
  if auth.uid() is null then
    raise exception 'save_resource: you have to be signed in to save a resource'
      using errcode = 'insufficient_privilege';
  end if;

  if v_id is null then
    v_name := nullif(btrim(p->>'name'), '');
    v_type := nullif(p->>'type', '')::public.resource_type;

    if v_name is null then
      raise exception 'save_resource: a new resource needs a name' using errcode = 'check_violation';
    end if;
    if v_type is null then
      raise exception 'save_resource: a new resource needs a type' using errcode = 'check_violation';
    end if;

    -- Only an admin can seed a resource for somebody else (or for nobody).
    v_user_id := case
      when v_is_admin and p ? 'user_id' then nullif(p->>'user_id', '')::uuid
      else auth.uid()
    end;

    if v_user_id is not null and exists (select 1 from public.resources where user_id = v_user_id) then
      raise exception 'save_resource: that account already has a resource'
        using errcode = 'unique_violation';
    end if;

    insert into public.resources (user_id, type, name, slug)
    values (v_user_id, v_type, v_name, public.resource_unique_slug(v_name))
    returning id into v_id;
  end if;

  select country_iso_code into v_old_country from public.resources where id = v_id;

  if not found then
    raise exception 'save_resource: resource % not found', v_id using errcode = 'no_data_found';
  end if;

  update public.resources set
    type = case when p ? 'type'
             then coalesce(nullif(p->>'type', '')::public.resource_type, type) else type end,
    status = case when p ? 'status'
               then coalesce(nullif(p->>'status', '')::public.resource_status, status) else status end,
    name = case when p ? 'name'
             then coalesce(nullif(btrim(p->>'name'), ''), name) else name end,
    country_iso_code = case when p ? 'country_iso_code'
                         then nullif(btrim(upper(p->>'country_iso_code')), '') else country_iso_code end,
    region_scope = case when p ? 'region_scope'
                     then nullif(p->>'region_scope', '')::public.resource_region_scope else region_scope end,
    no_fixed_address = case when p ? 'no_fixed_address'
                         then coalesce((p->>'no_fixed_address')::boolean, false) else no_fixed_address end,
    -- "No fixed address" wins over any address in the same payload: the CHECK
    -- does not let both stand, and the button is the more explicit answer.
    address = case
                when coalesce(
                       case when p ? 'no_fixed_address' then (p->>'no_fixed_address')::boolean else no_fixed_address end,
                       false
                     ) then null
                when p ? 'address' then nullif(btrim(p->>'address'), '')
                else address
              end,
    website_url = case when p ? 'website_url'
                    then nullif(btrim(p->>'website_url'), '') else website_url end,
    instagram_url = case when p ? 'instagram_url'
                      then nullif(btrim(p->>'instagram_url'), '') else instagram_url end,
    facebook_url = case when p ? 'facebook_url'
                     then nullif(btrim(p->>'facebook_url'), '') else facebook_url end,
    logo_url = case when p ? 'logo_url'
                 then nullif(btrim(p->>'logo_url'), '') else logo_url end,
    description = case when p ? 'description'
                    then nullif(btrim(p->>'description'), '') else description end,
    founded_year = case when p ? 'founded_year'
                     then nullif(p->>'founded_year', '')::smallint else founded_year end,
    founder_name = case when p ? 'founder_name'
                     then nullif(btrim(p->>'founder_name'), '') else founder_name end,
    professional_experience = case when p ? 'professional_experience'
                                then nullif(btrim(p->>'professional_experience'), '') else professional_experience end,
    teaching_method = case when p ? 'teaching_method'
                        then nullif(btrim(p->>'teaching_method'), '') else teaching_method end,
    specialization = case when p ? 'specialization'
                       then nullif(btrim(p->>'specialization'), '') else specialization end,
    relation_to_dance = case when p ? 'relation_to_dance'
                         then nullif(btrim(p->>'relation_to_dance'), '') else relation_to_dance end,
    class_style = case when p ? 'class_style'
                    then nullif(btrim(p->>'class_style'), '') else class_style end
  where id = v_id;

  if not found then
    raise exception 'save_resource: you cannot write resource %', v_id
      using errcode = 'insufficient_privilege';
  end if;

  select country_iso_code into v_new_country from public.resources where id = v_id;

  -- Moved from one country to another without saying which regions: the ones it
  -- had belong to the old country, so they and the scope go and the onboarding
  -- asks again. Setting the country for the first time is not a move, and a
  -- resource with no regions (nationwide, or still empty) has nothing to lose.
  if v_old_country is not null
     and v_new_country is distinct from v_old_country
     and not (p ? 'region_ids')
     and exists (select 1 from public.resource_regions where resource_id = v_id)
  then
    delete from public.resource_regions where resource_id = v_id;
    update public.resources set region_scope = null where id = v_id;
  end if;

  if p ? 'region_ids' then
    delete from public.resource_regions where resource_id = v_id;

    insert into public.resource_regions (resource_id, region_id, position)
    select v_id, u.region_id, (u.ord - 1)::integer
    from (
      select distinct on (x.value::uuid) x.value::uuid as region_id, x.ordinality as ord
      from jsonb_array_elements_text(coalesce(p->'region_ids', '[]'::jsonb)) with ordinality as x(value, ordinality)
      order by x.value::uuid, x.ordinality
    ) u;
  end if;

  if p ? 'emails' then
    delete from public.resource_emails where resource_id = v_id;

    insert into public.resource_emails (resource_id, email, label, position)
    select v_id, btrim(e.value->>'email'), nullif(btrim(e.value->>'label'), ''), (e.ordinality - 1)::integer
    from jsonb_array_elements(coalesce(p->'emails', '[]'::jsonb)) with ordinality as e(value, ordinality);
  end if;

  if p ? 'images' then
    delete from public.resource_images where resource_id = v_id;

    insert into public.resource_images (resource_id, image_url, caption, position)
    select v_id, btrim(im.value->>'image_url'), nullif(btrim(im.value->>'caption'), ''), (im.ordinality - 1)::integer
    from jsonb_array_elements(coalesce(p->'images', '[]'::jsonb)) with ordinality as im(value, ordinality);
  end if;

  if p ? 'discipline_ids' then
    delete from public.resource_disciplines where resource_id = v_id;

    insert into public.resource_disciplines (resource_id, discipline_id)
    select distinct v_id, x.value::uuid
    from jsonb_array_elements_text(coalesce(p->'discipline_ids', '[]'::jsonb)) as x(value);
  end if;

  if p ? 'student_goals' then
    delete from public.resource_student_goals where resource_id = v_id;

    insert into public.resource_student_goals (resource_id, goal)
    select distinct v_id, x.value::public.resource_student_goal
    from jsonb_array_elements_text(coalesce(p->'student_goals', '[]'::jsonb)) as x(value);
  end if;

  if p ? 'photography_work_types' then
    delete from public.resource_photography_work_types where resource_id = v_id;

    insert into public.resource_photography_work_types (resource_id, work_type)
    select distinct v_id, x.value::public.resource_photography_work_type
    from jsonb_array_elements_text(coalesce(p->'photography_work_types', '[]'::jsonb)) as x(value);
  end if;

  if p ? 'skipped_fields' then
    delete from public.resource_skipped_fields where resource_id = v_id;

    insert into public.resource_skipped_fields (resource_id, field)
    select distinct v_id, x.value::public.resource_field
    from jsonb_array_elements_text(coalesce(p->'skipped_fields', '[]'::jsonb)) as x(value);
  end if;

  return v_id;
end;
$function$;

-- ---------------------------------------------------------------------------
-- Storage: until now only admins could upload to the `media` bucket. A
-- professional uploads their own logo and gallery, under `resources/<id>/`,
-- and nothing else. The uuid shape is checked before the cast so a stray path
-- cannot error the policy.
-- ---------------------------------------------------------------------------
create policy "media_resource_owner_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = 'resources'
    and (storage.foldername(name))[2] ~ '^[0-9a-fA-F-]{36}$'
    and public.can_write_resource(((storage.foldername(name))[2])::uuid)
  );

create policy "media_resource_owner_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = 'resources'
    and (storage.foldername(name))[2] ~ '^[0-9a-fA-F-]{36}$'
    and public.can_write_resource(((storage.foldername(name))[2])::uuid)
  );

create policy "media_resource_owner_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = 'resources'
    and (storage.foldername(name))[2] ~ '^[0-9a-fA-F-]{36}$'
    and public.can_write_resource(((storage.foldername(name))[2])::uuid)
  );

-- ---------------------------------------------------------------------------
-- resources_in_region: the directory screen. Filtering by region cannot be a
-- plain `where` because a `nationwide` resource has no row in resource_regions
-- yet has to show up, so the filter goes through `resource_region_placements`
-- and the order through `placement_rank` (fixed, then multiple, then
-- nationwide; `verified` and the name break ties).
--
-- A function and not a view so PostgREST can take the region as an argument
-- and the ordering stays in SQL instead of being re-implemented per client.
-- ---------------------------------------------------------------------------
create function public.resources_in_region(
  p_region_id uuid,
  p_type public.resource_type default null
)
  returns setof public.resources_enriched
  language sql
  stable
  security invoker
  set search_path = ''
  as $function$
  select e.*
  from public.resources_enriched e
  where e.id in (
      select p.resource_id
      from public.resource_region_placements p
      where p.region_id = p_region_id
    )
    and (p_type is null or e.type = p_type)
  order by e.placement_rank, e.verified desc, e.name;
$function$;

comment on function public.resources_in_region(uuid, public.resource_type) is 'Published resources that must appear in a region, in directory order. Nationwide ones are included.';
