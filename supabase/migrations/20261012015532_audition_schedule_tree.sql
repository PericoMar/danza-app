-- Audition schedule redesign, phase 1 of 3 ("expand"). See docs/adr/0001-audition-schedule-tree.md.
--
-- Replaces the mode columns on `auditions` (deadline_mode, audition_schedule_mode,
-- audition_schedule_note, audition_schedule_entries, deadline_date, audition_date)
-- with a tree: auditions 1-N audition_deadlines 1-N audition_dates. Every deadline
-- and every audition date carries a real date so status and filters can be derived
-- from dates alone; "ASAP" / "To be arranged" survive only as display labels.
--
-- This migration is purely additive: the old columns stay and `companies_enriched`
-- keeps every key it had, so the app deployed today keeps working. The data is
-- copied in the next migration; the old columns are dropped in phase 3.

-- ---------------------------------------------------------------------------
-- Countries: reference table for country codes (ISO 3166-1 alpha-2 plus the UK
-- nations companies already use). Names for codes already in `companies` match
-- `companies.country` so both read the same.
-- ---------------------------------------------------------------------------
create table public.countries (
  iso_code   text primary key,
  name       text not null,
  created_at timestamptz not null default now(),
  constraint countries_iso_code_format check (iso_code ~ '^[A-Z]{2}(-[A-Z]{3})?$'),
  constraint countries_name_not_blank check (btrim(name) <> '')
);

alter table public.countries enable row level security;

create policy "countries select public" on public.countries
  for select to public using (true);
create policy "countries insert admin only" on public.countries
  for insert to authenticated with check (public.is_admin());
create policy "countries update admin only" on public.countries
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "countries delete admin only" on public.countries
  for delete to authenticated using (public.is_admin());

insert into public.countries (iso_code, name) values
  ('AD', 'Andorra'),
  ('AE', 'United Arab Emirates'),
  ('AF', 'Afghanistan'),
  ('AG', 'Antigua and Barbuda'),
  ('AI', 'Anguilla'),
  ('AL', 'Albania'),
  ('AM', 'Armenia'),
  ('AO', 'Angola'),
  ('AQ', 'Antarctica'),
  ('AR', 'Argentina'),
  ('AS', 'American Samoa'),
  ('AT', 'Austria'),
  ('AU', 'Australia'),
  ('AW', 'Aruba'),
  ('AX', 'Åland Islands'),
  ('AZ', 'Azerbaijan'),
  ('BA', 'Bosnia and Herzegovina'),
  ('BB', 'Barbados'),
  ('BD', 'Bangladesh'),
  ('BE', 'Belgium'),
  ('BF', 'Burkina Faso'),
  ('BG', 'Bulgaria'),
  ('BH', 'Bahrain'),
  ('BI', 'Burundi'),
  ('BJ', 'Benin'),
  ('BL', 'St. Barthélemy'),
  ('BM', 'Bermuda'),
  ('BN', 'Brunei'),
  ('BO', 'Bolivia'),
  ('BQ', 'Caribbean Netherlands'),
  ('BR', 'Brazil'),
  ('BS', 'Bahamas'),
  ('BT', 'Bhutan'),
  ('BV', 'Bouvet Island'),
  ('BW', 'Botswana'),
  ('BY', 'Belarus'),
  ('BZ', 'Belize'),
  ('CA', 'Canada'),
  ('CC', 'Cocos (Keeling) Islands'),
  ('CD', 'Congo - Kinshasa'),
  ('CF', 'Central African Republic'),
  ('CG', 'Congo - Brazzaville'),
  ('CH', 'Switzerland'),
  ('CI', 'Côte d’Ivoire'),
  ('CK', 'Cook Islands'),
  ('CL', 'Chile'),
  ('CM', 'Cameroon'),
  ('CN', 'China'),
  ('CO', 'Colombia'),
  ('CR', 'Costa Rica'),
  ('CU', 'Cuba'),
  ('CV', 'Cape Verde'),
  ('CW', 'Curaçao'),
  ('CX', 'Christmas Island'),
  ('CY', 'Cyprus'),
  ('CZ', 'Czech Republic'),
  ('DE', 'Germany'),
  ('DJ', 'Djibouti'),
  ('DK', 'Denmark'),
  ('DM', 'Dominica'),
  ('DO', 'Dominican Republic'),
  ('DZ', 'Algeria'),
  ('EC', 'Ecuador'),
  ('EE', 'Estonia'),
  ('EG', 'Egypt'),
  ('EH', 'Western Sahara'),
  ('ER', 'Eritrea'),
  ('ES', 'Spain'),
  ('ET', 'Ethiopia'),
  ('FI', 'Finland'),
  ('FJ', 'Fiji'),
  ('FK', 'Falkland Islands'),
  ('FM', 'Micronesia'),
  ('FO', 'Faroe Islands'),
  ('FR', 'France'),
  ('GA', 'Gabon'),
  ('GB', 'United Kingdom'),
  ('GD', 'Grenada'),
  ('GE', 'Georgia'),
  ('GF', 'French Guiana'),
  ('GG', 'Guernsey'),
  ('GH', 'Ghana'),
  ('GI', 'Gibraltar'),
  ('GL', 'Greenland'),
  ('GM', 'Gambia'),
  ('GN', 'Guinea'),
  ('GP', 'Guadeloupe'),
  ('GQ', 'Equatorial Guinea'),
  ('GR', 'Greece'),
  ('GS', 'South Georgia and South Sandwich Islands'),
  ('GT', 'Guatemala'),
  ('GU', 'Guam'),
  ('GW', 'Guinea-Bissau'),
  ('GY', 'Guyana'),
  ('HK', 'Hong Kong'),
  ('HM', 'Heard and McDonald Islands'),
  ('HN', 'Honduras'),
  ('HR', 'Croatia'),
  ('HT', 'Haiti'),
  ('HU', 'Hungary'),
  ('ID', 'Indonesia'),
  ('IE', 'Ireland'),
  ('IL', 'Israel'),
  ('IM', 'Isle of Man'),
  ('IN', 'India'),
  ('IO', 'British Indian Ocean Territory'),
  ('IQ', 'Iraq'),
  ('IR', 'Iran'),
  ('IS', 'Iceland'),
  ('IT', 'Italy'),
  ('JE', 'Jersey'),
  ('JM', 'Jamaica'),
  ('JO', 'Jordan'),
  ('JP', 'Japan'),
  ('KE', 'Kenya'),
  ('KG', 'Kyrgyzstan'),
  ('KH', 'Cambodia'),
  ('KI', 'Kiribati'),
  ('KM', 'Comoros'),
  ('KN', 'St. Kitts and Nevis'),
  ('KP', 'North Korea'),
  ('KR', 'South Korea'),
  ('KW', 'Kuwait'),
  ('KY', 'Cayman Islands'),
  ('KZ', 'Kazakhstan'),
  ('LA', 'Laos'),
  ('LB', 'Lebanon'),
  ('LC', 'St. Lucia'),
  ('LI', 'Liechtenstein'),
  ('LK', 'Sri Lanka'),
  ('LR', 'Liberia'),
  ('LS', 'Lesotho'),
  ('LT', 'Lithuania'),
  ('LU', 'Luxembourg'),
  ('LV', 'Latvia'),
  ('LY', 'Libya'),
  ('MA', 'Morocco'),
  ('MC', 'Monaco'),
  ('MD', 'Moldova'),
  ('ME', 'Montenegro'),
  ('MF', 'St. Martin'),
  ('MG', 'Madagascar'),
  ('MH', 'Marshall Islands'),
  ('MK', 'North Macedonia'),
  ('ML', 'Mali'),
  ('MM', 'Myanmar (Burma)'),
  ('MN', 'Mongolia'),
  ('MO', 'Macao SAR China'),
  ('MP', 'Northern Mariana Islands'),
  ('MQ', 'Martinique'),
  ('MR', 'Mauritania'),
  ('MS', 'Montserrat'),
  ('MT', 'Malta'),
  ('MU', 'Mauritius'),
  ('MV', 'Maldives'),
  ('MW', 'Malawi'),
  ('MX', 'Mexico'),
  ('MY', 'Malaysia'),
  ('MZ', 'Mozambique'),
  ('NA', 'Namibia'),
  ('NC', 'New Caledonia'),
  ('NE', 'Niger'),
  ('NF', 'Norfolk Island'),
  ('NG', 'Nigeria'),
  ('NI', 'Nicaragua'),
  ('NL', 'Netherlands'),
  ('NO', 'Norway'),
  ('NP', 'Nepal'),
  ('NR', 'Nauru'),
  ('NU', 'Niue'),
  ('NZ', 'New Zealand'),
  ('OM', 'Oman'),
  ('PA', 'Panama'),
  ('PE', 'Perú'),
  ('PF', 'French Polynesia'),
  ('PG', 'Papua New Guinea'),
  ('PH', 'Philippines'),
  ('PK', 'Pakistan'),
  ('PL', 'Poland'),
  ('PM', 'St. Pierre and Miquelon'),
  ('PN', 'Pitcairn Islands'),
  ('PR', 'Puerto Rico'),
  ('PS', 'Palestinian Territories'),
  ('PT', 'Portugal'),
  ('PW', 'Palau'),
  ('PY', 'Paraguay'),
  ('QA', 'Qatar'),
  ('RE', 'Réunion'),
  ('RO', 'Romania'),
  ('RS', 'Serbia'),
  ('RU', 'Russia'),
  ('RW', 'Rwanda'),
  ('SA', 'Saudi Arabia'),
  ('SB', 'Solomon Islands'),
  ('SC', 'Seychelles'),
  ('SD', 'Sudan'),
  ('SE', 'Sweden'),
  ('SG', 'Singapore'),
  ('SH', 'St. Helena'),
  ('SI', 'Slovenia'),
  ('SJ', 'Svalbard and Jan Mayen'),
  ('SK', 'Slovakia'),
  ('SL', 'Sierra Leone'),
  ('SM', 'San Marino'),
  ('SN', 'Senegal'),
  ('SO', 'Somalia'),
  ('SR', 'Suriname'),
  ('SS', 'South Sudan'),
  ('ST', 'São Tomé and Príncipe'),
  ('SV', 'El Salvador'),
  ('SX', 'Sint Maarten'),
  ('SY', 'Syria'),
  ('SZ', 'Eswatini'),
  ('TC', 'Turks and Caicos Islands'),
  ('TD', 'Chad'),
  ('TF', 'French Southern Territories'),
  ('TG', 'Togo'),
  ('TH', 'Thailand'),
  ('TJ', 'Tajikistan'),
  ('TK', 'Tokelau'),
  ('TL', 'Timor-Leste'),
  ('TM', 'Turkmenistan'),
  ('TN', 'Tunisia'),
  ('TO', 'Tonga'),
  ('TR', 'Turkey'),
  ('TT', 'Trinidad and Tobago'),
  ('TV', 'Tuvalu'),
  ('TW', 'Taiwan'),
  ('TZ', 'Tanzania'),
  ('UA', 'Ukraine'),
  ('UG', 'Uganda'),
  ('UM', 'U.S. Outlying Islands'),
  ('US', 'United States'),
  ('UY', 'Uruguay'),
  ('UZ', 'Uzbekistan'),
  ('VA', 'Vatican City'),
  ('VC', 'St. Vincent and Grenadines'),
  ('VE', 'Venezuela'),
  ('VG', 'British Virgin Islands'),
  ('VI', 'U.S. Virgin Islands'),
  ('VN', 'Vietnam'),
  ('VU', 'Vanuatu'),
  ('WF', 'Wallis and Futuna'),
  ('WS', 'Samoa'),
  ('YE', 'Yemen'),
  ('YT', 'Mayotte'),
  ('ZA', 'South Africa'),
  ('ZM', 'Zambia'),
  ('ZW', 'Zimbabwe'),
  ('GB-ENG', 'England'),
  ('GB-NIR', 'Northern Ireland'),
  ('GB-SCT', 'Scotland'),
  ('GB-WLS', 'Wales')
;

-- The column defaulted to the string 'NULL', which the new foreign key would reject.
alter table public.companies alter column country_iso_code drop default;

alter table public.companies
  add constraint companies_country_iso_code_fkey foreign key (country_iso_code)
  references public.countries (iso_code) on update cascade on delete restrict;

create index idx_companies_country_iso_code on public.companies using btree (country_iso_code);

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.audition_date_format as enum ('in_person', 'online');

-- Derived in `auditions_enriched`, never stored. An enum so generated types get a union.
create type public.audition_status as enum ('open_call', 'post_deadline', 'past');

-- ---------------------------------------------------------------------------
-- auditions.schedule_label: optional summary that replaces the list of
-- audition dates on cards ("7 cities · Oct 2026 – Feb 2027").
-- ---------------------------------------------------------------------------
alter table public.auditions
  add column schedule_label text,
  add constraint auditions_schedule_label_not_blank
    check (schedule_label is null or btrim(schedule_label) <> '');

-- ---------------------------------------------------------------------------
-- audition_deadlines: 1-N per audition.
-- `date_label`, when set, is shown instead of the date everywhere ("ASAP").
-- ---------------------------------------------------------------------------
create table public.audition_deadlines (
  id          uuid        primary key default gen_random_uuid(),
  audition_id uuid        not null references public.auditions (id) on delete cascade,
  date        date        not null,
  date_label  text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint audition_deadlines_date_label_not_blank check (date_label is null or btrim(date_label) <> ''),
  constraint audition_deadlines_notes_not_blank check (notes is null or btrim(notes) <> '')
);

create index idx_audition_deadlines_audition_id on public.audition_deadlines using btree (audition_id);
create index idx_audition_deadlines_date on public.audition_deadlines using btree (date);

-- ---------------------------------------------------------------------------
-- audition_dates: 1-N per deadline. A range of 1 to 60 days (start = end for a
-- single day) at one place. `date_label` replaces the dates on display
-- ("To be arranged upon invitation"); `notes` is shown next to them ("Men").
-- In-person dates need a country; online dates have none.
-- ---------------------------------------------------------------------------
create table public.audition_dates (
  id               uuid                         primary key default gen_random_uuid(),
  deadline_id      uuid                         not null references public.audition_deadlines (id) on delete cascade,
  start_date       date                         not null,
  end_date         date                         not null,
  format           public.audition_date_format  not null default 'in_person',
  place            text                         not null,
  country_iso_code text                         references public.countries (iso_code) on update cascade on delete restrict,
  date_label       text,
  notes            text,
  created_at       timestamptz                  not null default now(),
  updated_at       timestamptz                  not null default now(),
  constraint audition_dates_end_after_start check (end_date >= start_date),
  constraint audition_dates_max_60_days check (end_date - start_date <= 59),
  constraint audition_dates_country_matches_format check (
    (format = 'in_person' and country_iso_code is not null)
    or (format = 'online' and country_iso_code is null)
  ),
  constraint audition_dates_place_not_blank check (btrim(place) <> ''),
  constraint audition_dates_date_label_not_blank check (date_label is null or btrim(date_label) <> ''),
  constraint audition_dates_notes_not_blank check (notes is null or btrim(notes) <> '')
);

create index idx_audition_dates_deadline_id on public.audition_dates using btree (deadline_id);
create index idx_audition_dates_start_date on public.audition_dates using btree (start_date);
create index idx_audition_dates_end_date on public.audition_dates using btree (end_date);
create index idx_audition_dates_country_iso_code on public.audition_dates using btree (country_iso_code);

-- An in-person date without place/country takes the company's; an online one is
-- "Online". Copying (not referencing) is intentional: an audition happened where
-- it happened even if the company later moves.
create function public.fill_audition_date_place()
  returns trigger
  language plpgsql
  set search_path = ''
  as $function$
begin
  new.place := nullif(btrim(new.place), '');

  if new.format = 'online' then
    new.place := coalesce(new.place, 'Online');
    return new;
  end if;

  if new.place is null or new.country_iso_code is null then
    select coalesce(new.place, c.location), coalesce(new.country_iso_code, c.country_iso_code)
      into new.place, new.country_iso_code
      from public.audition_deadlines d
      join public.auditions a on a.id = d.audition_id
      join public.companies c on c.id = a.company_id
     where d.id = new.deadline_id;
  end if;

  return new;
end;
$function$;

create trigger fill_audition_date_place
  before insert or update on public.audition_dates
  for each row execute function public.fill_audition_date_place();

create trigger handle_audition_deadlines_updated_at
  before update on public.audition_deadlines
  for each row execute function extensions.moddatetime('updated_at');

create trigger handle_audition_dates_updated_at
  before update on public.audition_dates
  for each row execute function extensions.moddatetime('updated_at');

-- ---------------------------------------------------------------------------
-- RLS: same as `auditions` (public read, admin write).
-- ---------------------------------------------------------------------------
alter table public.audition_deadlines enable row level security;
alter table public.audition_dates enable row level security;

create policy "audition deadlines select public" on public.audition_deadlines
  for select to public using (true);
create policy "audition deadlines insert admin only" on public.audition_deadlines
  for insert to authenticated with check (public.is_admin());
create policy "audition deadlines update admin only" on public.audition_deadlines
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "audition deadlines delete admin only" on public.audition_deadlines
  for delete to authenticated using (public.is_admin());

create policy "audition dates select public" on public.audition_dates
  for select to public using (true);
create policy "audition dates insert admin only" on public.audition_dates
  for insert to authenticated with check (public.is_admin());
create policy "audition dates update admin only" on public.audition_dates
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "audition dates delete admin only" on public.audition_dates
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- auditions_enriched: the read model. One row per audition with its deadlines
-- (each with its dates) nested, plus status and key dates derived from them.
-- "Today" is current_date in the database time zone (UTC).
--   open_call     some deadline is today or later
--   post_deadline every deadline has passed but some date ends today or later
--   past          everything has passed
-- ---------------------------------------------------------------------------
create view public.auditions_enriched with (security_invoker = true) as
select
  a.id,
  a.company_id,
  a.email,
  a.summary,
  a.website_url,
  a.description,
  a.schedule_label,
  a.is_active,
  a.content_updated_at,
  a.created_at,
  a.updated_at,
  coalesce(s.deadlines, '[]'::jsonb) as deadlines,
  coalesce(h.height_requirements, '[]'::jsonb) as height_requirements,
  s.next_deadline_date,
  s.next_audition_date,
  s.last_audition_end_date,
  (case
    when s.next_deadline_date is not null then 'open_call'
    when s.last_audition_end_date >= current_date then 'post_deadline'
    else 'past'
  end)::public.audition_status as status
from public.auditions a
left join lateral (
  select
    jsonb_agg(
      jsonb_build_object(
        'id', d.id,
        'date', d.date,
        'date_label', d.date_label,
        'notes', d.notes,
        'dates', dd.dates
      ) order by d.date, d.id
    ) as deadlines,
    min(d.date) filter (where d.date >= current_date) as next_deadline_date,
    min(dd.next_start_date) as next_audition_date,
    max(dd.last_end_date) as last_audition_end_date
  from public.audition_deadlines d
  cross join lateral (
    select
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', x.id,
            'start_date', x.start_date,
            'end_date', x.end_date,
            'format', x.format,
            'place', x.place,
            'country_iso_code', x.country_iso_code,
            'date_label', x.date_label,
            'notes', x.notes
          ) order by x.start_date, x.id
        ),
        '[]'::jsonb
      ) as dates,
      min(x.start_date) filter (where x.end_date >= current_date) as next_start_date,
      max(x.end_date) as last_end_date
    from public.audition_dates x
    where x.deadline_id = d.id
  ) dd
  where d.audition_id = a.id
) s on true
left join lateral (
  select jsonb_agg(
    jsonb_build_object(
      'gender', hr.gender,
      'min_height_cm', hr.min_height_cm,
      'max_height_cm', hr.max_height_cm
    ) order by hr.gender
  ) as height_requirements
  from public.audition_height_requirements hr
  where hr.audition_id = a.id
) h on true;

-- ---------------------------------------------------------------------------
-- companies_enriched: each audition object keeps all its old keys (the deployed
-- app reads them) and gains every `auditions_enriched` column (deadlines, status,
-- is_active, schedule_label, …). `has_live_audition` backs the "Upcoming
-- auditions" filter: an active audition that is not past.
-- Phase 3 drops the old keys and the old sort.
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
    select jsonb_agg(t.a_json order by t.sort_date)
    from (
      select
        case
          when a.deadline_mode = 'fixed_date' and a.deadline_date is not null then a.deadline_date
          when a.audition_schedule_mode = 'single_date' and a.audition_date is not null then a.audition_date
          else a.created_at::date
        end as sort_date,
        jsonb_build_object(
          'id', a.id,
          'company_id', a.company_id,
          'deadline_date', a.deadline_date,
          'audition_date', a.audition_date,
          'email', a.email,
          'summary', a.summary,
          'website_url', a.website_url,
          'location', a.location,
          'created_at', a.created_at,
          'description', a.description,
          'deadline_mode', a.deadline_mode,
          'audition_schedule_mode', a.audition_schedule_mode,
          'audition_schedule_note', a.audition_schedule_note,
          'audition_schedule_entries', a.audition_schedule_entries
        ) || to_jsonb(ae) as a_json
      from public.auditions a
      join public.auditions_enriched ae on ae.id = a.id
      where a.company_id = c.id
    ) t
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
-- save_audition: the only write path for an audition and everything under it,
-- in one transaction. Children are matched by id (kept ids stay stable), new
-- ones are inserted and any not in the payload are deleted. Blank strings are
-- stored as NULL. Payload:
-- {
--   "id": uuid | null,                       -- null inserts
--   "company_id": uuid,                      -- used on insert only
--   "email", "summary", "website_url", "description", "schedule_label": text | null,
--   "is_active": boolean,                    -- default true
--   "content_updated_at": timestamptz,       -- omitted: keep (update) / now() (insert)
--   "deadlines": [{ "id"?, "date", "date_label"?, "notes"?,
--     "dates": [{ "id"?, "start_date", "end_date", "format"?, "place"?,
--                 "country_iso_code"?, "date_label"?, "notes"? }] }],
--   "height_requirements"?: [{ "gender", "min_height_cm"?, "max_height_cm"? }],  -- omitted: untouched
--   "participating_company_ids"?: [uuid]                                        -- omitted: untouched
-- }
-- Runs as the caller, so RLS still applies; the admin check is only for a clear error.
-- ---------------------------------------------------------------------------
create function public.save_audition(p jsonb)
  returns uuid
  language plpgsql
  security invoker
  set search_path = ''
  as $function$
declare
  v_id           uuid := nullif(p->>'id', '')::uuid;
  v_deadline     jsonb;
  v_date         jsonb;
  v_deadline_id  uuid;
  v_date_id      uuid;
  v_deadline_ids uuid[] := '{}';
  v_date_ids     uuid[] := '{}';
begin
  if not public.is_admin() then
    raise exception 'save_audition: only admins can save auditions'
      using errcode = 'insufficient_privilege';
  end if;

  if jsonb_typeof(p->'deadlines') is distinct from 'array' or jsonb_array_length(p->'deadlines') = 0 then
    raise exception 'save_audition: an audition needs at least one deadline'
      using errcode = 'check_violation';
  end if;

  if v_id is null then
    insert into public.auditions (
      company_id, email, summary, website_url, description, schedule_label, is_active, content_updated_at
    ) values (
      (p->>'company_id')::uuid,
      nullif(btrim(p->>'email'), ''),
      nullif(btrim(p->>'summary'), ''),
      nullif(btrim(p->>'website_url'), ''),
      nullif(btrim(p->>'description'), ''),
      nullif(btrim(p->>'schedule_label'), ''),
      coalesce((p->>'is_active')::boolean, true),
      coalesce((p->>'content_updated_at')::timestamptz, now())
    )
    returning id into v_id;
  else
    update public.auditions set
      email              = nullif(btrim(p->>'email'), ''),
      summary            = nullif(btrim(p->>'summary'), ''),
      website_url        = nullif(btrim(p->>'website_url'), ''),
      description        = nullif(btrim(p->>'description'), ''),
      schedule_label     = nullif(btrim(p->>'schedule_label'), ''),
      is_active          = coalesce((p->>'is_active')::boolean, true),
      content_updated_at = case when p ? 'content_updated_at'
                             then (p->>'content_updated_at')::timestamptz
                             else content_updated_at end
    where id = v_id;

    if not found then
      raise exception 'save_audition: audition % not found', v_id using errcode = 'no_data_found';
    end if;
  end if;

  for v_deadline in select value from jsonb_array_elements(p->'deadlines') loop
    if jsonb_typeof(v_deadline->'dates') is distinct from 'array' or jsonb_array_length(v_deadline->'dates') = 0 then
      raise exception 'save_audition: every deadline needs at least one audition date'
        using errcode = 'check_violation';
    end if;

    v_deadline_id := nullif(v_deadline->>'id', '')::uuid;

    if v_deadline_id is null then
      insert into public.audition_deadlines (audition_id, date, date_label, notes)
      values (
        v_id,
        (v_deadline->>'date')::date,
        nullif(btrim(v_deadline->>'date_label'), ''),
        nullif(btrim(v_deadline->>'notes'), '')
      )
      returning id into v_deadline_id;
    else
      update public.audition_deadlines set
        date       = (v_deadline->>'date')::date,
        date_label = nullif(btrim(v_deadline->>'date_label'), ''),
        notes      = nullif(btrim(v_deadline->>'notes'), '')
      where id = v_deadline_id and audition_id = v_id;

      if not found then
        raise exception 'save_audition: deadline % does not belong to audition %', v_deadline_id, v_id
          using errcode = 'no_data_found';
      end if;
    end if;

    v_deadline_ids := v_deadline_ids || v_deadline_id;

    for v_date in select value from jsonb_array_elements(v_deadline->'dates') loop
      v_date_id := nullif(v_date->>'id', '')::uuid;

      if v_date_id is null then
        insert into public.audition_dates (
          deadline_id, start_date, end_date, format, place, country_iso_code, date_label, notes
        ) values (
          v_deadline_id,
          (v_date->>'start_date')::date,
          (v_date->>'end_date')::date,
          coalesce(nullif(v_date->>'format', '')::public.audition_date_format, 'in_person'),
          v_date->>'place',
          nullif(btrim(v_date->>'country_iso_code'), ''),
          nullif(btrim(v_date->>'date_label'), ''),
          nullif(btrim(v_date->>'notes'), '')
        )
        returning id into v_date_id;
      else
        -- A date may move to another deadline of the same audition.
        update public.audition_dates set
          deadline_id      = v_deadline_id,
          start_date       = (v_date->>'start_date')::date,
          end_date         = (v_date->>'end_date')::date,
          format           = coalesce(nullif(v_date->>'format', '')::public.audition_date_format, 'in_person'),
          place            = v_date->>'place',
          country_iso_code = nullif(btrim(v_date->>'country_iso_code'), ''),
          date_label       = nullif(btrim(v_date->>'date_label'), ''),
          notes            = nullif(btrim(v_date->>'notes'), '')
        where id = v_date_id
          and deadline_id in (select id from public.audition_deadlines where audition_id = v_id);

        if not found then
          raise exception 'save_audition: audition date % does not belong to audition %', v_date_id, v_id
            using errcode = 'no_data_found';
        end if;
      end if;

      v_date_ids := v_date_ids || v_date_id;
    end loop;
  end loop;

  delete from public.audition_dates x
   using public.audition_deadlines d
   where x.deadline_id = d.id and d.audition_id = v_id and x.id <> all (v_date_ids);

  delete from public.audition_deadlines
   where audition_id = v_id and id <> all (v_deadline_ids);

  if exists (
    select 1
    from public.audition_deadlines d
    join public.audition_dates x on x.deadline_id = d.id
    where d.audition_id = v_id and d.date > x.end_date
  ) then
    raise exception 'save_audition: a deadline cannot be later than the end of its audition dates'
      using errcode = 'check_violation';
  end if;

  if p ? 'height_requirements' then
    delete from public.audition_height_requirements where audition_id = v_id;

    insert into public.audition_height_requirements (audition_id, gender, min_height_cm, max_height_cm)
    select v_id, r.gender, r.min_height_cm, r.max_height_cm
    from jsonb_to_recordset(coalesce(p->'height_requirements', '[]'::jsonb))
      as r(gender public.audition_gender, min_height_cm integer, max_height_cm integer);
  end if;

  if p ? 'participating_company_ids' then
    delete from public.audition_participating_companies where audition_id = v_id;

    insert into public.audition_participating_companies (audition_id, company_id)
    select distinct v_id, c::uuid
    from jsonb_array_elements_text(coalesce(p->'participating_company_ids', '[]'::jsonb)) as c;
  end if;

  return v_id;
end;
$function$;
