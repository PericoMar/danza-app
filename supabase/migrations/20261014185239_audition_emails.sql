-- Contact emails: the addresses dancers write to about an audition. An audition
-- has zero or more, in the order the admin set, each with an optional label
-- that says what it is for ("Applications", "Questions"…).
--
-- Replaces the single `auditions.email` column. A child table rather than an
-- array column, like `audition_application_links`, so each email gets its own
-- constraints and label.
--
-- One step instead of expand/contract: `auditions.email` is copied here and
-- dropped in this same migration, and `auditions_enriched.email` keeps
-- existing as the first email, so app builds from before this migration
-- (the live web bundle until it redeploys, store builds) keep reading it.
-- `save_audition` still accepts their single "email" key: it replaces the first
-- email, the only one they show, and leaves the rest untouched.

-- ---------------------------------------------------------------------------
-- What gets copied. `auditions.email` was free text, so besides one address it
-- may hold several ("a@x.com, b@x.com", "a@x.com / b@x.com"), a URL or other
-- contact details ("WhatsApp +380…"). Nothing is lost:
--   * each address goes to audition_emails, in the order it was written;
--   * a value that is only a URL is where dancers apply, so it becomes an
--     application link, after the audition's existing ones;
--   * any other text keeps the whole original value at the end of the
--     description, as "Contact: <value>".
-- An "@" piece that isn't a valid address is a typo a person has to fix: the
-- guard below stops the migration and lists them.
-- ---------------------------------------------------------------------------
create temporary table audition_email_values as
select
  a.id as audition_id,
  btrim(a.email) as value,
  btrim(a.email) ~* '^https?://[^[:space:]]+$' as is_url
from public.auditions a
where nullif(btrim(a.email), '') is not null;

-- Each value split on spaces and separators, wrapping punctuation and "mailto:" trimmed.
create temporary table audition_email_tokens as
select
  v.audition_id,
  regexp_replace(btrim(t.value, '<>()[]"''.:'), '^mailto:', '', 'i') as token,
  t.ordinality
from audition_email_values v
cross join lateral regexp_split_to_table(v.value, '[[:space:],;/]+') with ordinality as t(value, ordinality)
where not v.is_url;

do $$
declare
  bad text;
begin
  select string_agg(distinct format('%s (%s)', v.audition_id, v.value), ', ') into bad
  from audition_email_values v
  join audition_email_tokens t on t.audition_id = v.audition_id
  where t.token like '%@%'
    and t.token !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$';

  if bad is not null then
    raise exception 'Audition emails with a mistyped address: %. Fix them before moving emails to audition_emails.', bad;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- The table
-- ---------------------------------------------------------------------------
create table public.audition_emails (
  id          uuid primary key default gen_random_uuid(),
  audition_id uuid not null references public.auditions(id) on delete cascade,
  email       text not null,
  label       text,
  position    integer not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- Same rule as the app's isValidEmail (utils/validation.ts).
  constraint audition_emails_email_format
    check (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint audition_emails_label_not_blank
    check (label is null or btrim(label) <> ''),
  constraint audition_emails_label_length
    check (char_length(label) <= 60),
  constraint audition_emails_position_non_negative
    check (position >= 0),
  -- Also the index for the FK and for reading an audition's emails in order.
  constraint audition_emails_position_unique unique (audition_id, position)
);

-- Addresses are compared without case: A@x.com and a@x.com are the same inbox.
create unique index audition_emails_email_unique on public.audition_emails (audition_id, lower(email));

comment on table public.audition_emails is 'Contact emails of an audition. Zero or more per audition, in order.';
comment on column public.audition_emails.label is 'What the email is for ("Applications", "Questions"). NULL = no label, shown as the address alone.';
comment on column public.audition_emails.position is 'Order in the audition, lowest first. Usually 0, 1, 2…, but gaps are allowed.';

create trigger handle_audition_emails_updated_at
  before update on public.audition_emails
  for each row execute function extensions.moddatetime('updated_at');

-- ---------------------------------------------------------------------------
-- RLS: readable wherever its audition is, written by admins only (in practice
-- through save_audition).
-- ---------------------------------------------------------------------------
alter table public.audition_emails enable row level security;

create policy "audition emails select public" on public.audition_emails
  for select to public
  using (exists (select 1 from public.auditions a where a.id = audition_emails.audition_id));
create policy "audition emails insert admin only" on public.audition_emails
  for insert to authenticated with check (public.is_admin());
create policy "audition emails update admin only" on public.audition_emails
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "audition emails delete admin only" on public.audition_emails
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Copy (rules above)
-- ---------------------------------------------------------------------------

-- Addresses: one row per distinct address, in the order it was written.
insert into public.audition_emails (audition_id, email, position)
select audition_id, token, (row_number() over (partition by audition_id order by ordinality) - 1)::integer
from (
  select distinct on (audition_id, lower(token)) audition_id, token, ordinality
  from audition_email_tokens
  where token like '%@%'
  order by audition_id, lower(token), ordinality
) first_of_each;

-- A URL: an application link, unless the audition already has it.
insert into public.audition_application_links (audition_id, url, position)
select
  v.audition_id,
  v.value,
  coalesce((select max(l.position) + 1 from public.audition_application_links l where l.audition_id = v.audition_id), 0)
from audition_email_values v
where v.is_url
on conflict (audition_id, url) do nothing;

-- Other text (anything but addresses and joining words such as "or"): kept in the description.
update public.auditions a
set description = concat_ws(E'\n\n', nullif(btrim(a.description), ''), 'Contact: ' || v.value)
from audition_email_values v
where v.audition_id = a.id
  and exists (
    select 1
    from audition_email_tokens t
    where t.audition_id = v.audition_id
      and t.token not like '%@%'
      and lower(t.token) not in ('', 'or', 'and', '&', '-', '–', 'y', 'o', 'e', 'ou', 'et', 'und', 'oder')
  );

drop table audition_email_tokens;
drop table audition_email_values;

-- ---------------------------------------------------------------------------
-- auditions_enriched: same definition plus `emails`, a JSON array of
-- { id, email, label } in order. `email` (same name, type and place, so
-- `create or replace` allows it) is now the first of them, for app builds that
-- predate `emails`; drop it once no store build reads it. `companies_enriched`
-- builds each audition with `to_jsonb(ae)`, so it picks both up on its own.
-- ---------------------------------------------------------------------------
create or replace view public.auditions_enriched with (security_invoker = true) as
select
  a.id,
  a.company_id,
  m.emails->0->>'email' as email,
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
  end)::public.audition_status as status,
  a.min_age,
  a.max_age,
  coalesce(l.application_links, '[]'::jsonb) as application_links,
  coalesce(m.emails, '[]'::jsonb) as emails
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
) h on true
left join lateral (
  select jsonb_agg(
    jsonb_build_object(
      'id', al.id,
      'url', al.url,
      'label', al.label
    ) order by al.position
  ) as application_links
  from public.audition_application_links al
  where al.audition_id = a.id
) l on true
left join lateral (
  select jsonb_agg(
    jsonb_build_object(
      'id', ae.id,
      'email', ae.email,
      'label', ae.label
    ) order by ae.position
  ) as emails
  from public.audition_emails ae
  where ae.audition_id = a.id
) m on true;

comment on column public.auditions_enriched.email is 'Legacy: the first of `emails`, for app builds from before audition_emails. Read `emails`.';

-- ---------------------------------------------------------------------------
-- save_audition: same function, with "emails" instead of "email". Like
-- "application_links", an omitted key leaves the stored emails untouched;
-- when present, it replaces them all and the array order becomes `position`.
-- A payload with "email" and no "emails" comes from an app build that predates
-- them: that one email replaces the first (or is added, or removes the first
-- when null), the rest stay.
-- Payload:
-- {
--   "id": uuid | null,                       -- null inserts
--   "company_id": uuid,                      -- used on insert only
--   "summary", "website_url", "description", "schedule_label": text | null,
--   "is_active": boolean,                    -- default true
--   "content_updated_at": timestamptz,       -- omitted: keep (update) / now() (insert)
--   "min_age", "max_age": integer | null,    -- omitted: keep (update) / null (insert)
--   "deadlines": [{ "id"?, "date", "date_label"?, "notes"?,
--     "dates": [{ "id"?, "start_date", "end_date", "format"?, "place"?,
--                 "country_iso_code"?, "date_label"?, "notes"? }] }],
--   "height_requirements"?: [{ "gender", "min_height_cm"?, "max_height_cm"? }],  -- omitted: untouched
--   "participating_company_ids"?: [uuid],                                       -- omitted: untouched
--   "application_links"?: [{ "url", "label"? }],                                -- omitted: untouched
--   "emails"?: [{ "email", "label"? }]                                          -- omitted: untouched
-- }
-- Runs as the caller, so RLS still applies; the admin check is only for a clear error.
-- ---------------------------------------------------------------------------
create or replace function public.save_audition(p jsonb)
  returns uuid
  language plpgsql
  security invoker
  set search_path = ''
  as $function$
declare
  v_id             uuid := nullif(p->>'id', '')::uuid;
  v_deadline       jsonb;
  v_date           jsonb;
  v_deadline_id    uuid;
  v_date_id        uuid;
  v_deadline_ids   uuid[] := '{}';
  v_date_ids       uuid[] := '{}';
  v_legacy_email   text;
  v_first_email_id uuid;
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
      company_id, summary, website_url, description, schedule_label, is_active, content_updated_at,
      min_age, max_age
    ) values (
      (p->>'company_id')::uuid,
      nullif(btrim(p->>'summary'), ''),
      nullif(btrim(p->>'website_url'), ''),
      nullif(btrim(p->>'description'), ''),
      nullif(btrim(p->>'schedule_label'), ''),
      coalesce((p->>'is_active')::boolean, true),
      coalesce((p->>'content_updated_at')::timestamptz, now()),
      nullif(p->>'min_age', '')::integer,
      nullif(p->>'max_age', '')::integer
    )
    returning id into v_id;
  else
    update public.auditions set
      summary            = nullif(btrim(p->>'summary'), ''),
      website_url        = nullif(btrim(p->>'website_url'), ''),
      description        = nullif(btrim(p->>'description'), ''),
      schedule_label     = nullif(btrim(p->>'schedule_label'), ''),
      is_active          = coalesce((p->>'is_active')::boolean, true),
      content_updated_at = case when p ? 'content_updated_at'
                             then (p->>'content_updated_at')::timestamptz
                             else content_updated_at end,
      min_age            = case when p ? 'min_age'
                             then nullif(p->>'min_age', '')::integer
                             else min_age end,
      max_age            = case when p ? 'max_age'
                             then nullif(p->>'max_age', '')::integer
                             else max_age end
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

  if p ? 'application_links' then
    delete from public.audition_application_links where audition_id = v_id;

    insert into public.audition_application_links (audition_id, url, label, position)
    select v_id, btrim(l.value->>'url'), nullif(btrim(l.value->>'label'), ''), (l.ordinality - 1)::integer
    from jsonb_array_elements(coalesce(p->'application_links', '[]'::jsonb)) with ordinality as l(value, ordinality);
  end if;

  if p ? 'emails' then
    delete from public.audition_emails where audition_id = v_id;

    insert into public.audition_emails (audition_id, email, label, position)
    select v_id, btrim(e.value->>'email'), nullif(btrim(e.value->>'label'), ''), (e.ordinality - 1)::integer
    from jsonb_array_elements(coalesce(p->'emails', '[]'::jsonb)) with ordinality as e(value, ordinality);
  elsif p ? 'email' then
    v_legacy_email := nullif(btrim(p->>'email'), '');

    select id into v_first_email_id
    from public.audition_emails
    where audition_id = v_id
    order by position
    limit 1;

    if v_legacy_email is null then
      delete from public.audition_emails where id = v_first_email_id;
    elsif v_first_email_id is null then
      insert into public.audition_emails (audition_id, email, position) values (v_id, v_legacy_email, 0);
    else
      update public.audition_emails set email = v_legacy_email where id = v_first_email_id;
    end if;
  end if;

  return v_id;
end;
$function$;

-- ---------------------------------------------------------------------------
-- Nothing reads the old column any more.
-- ---------------------------------------------------------------------------
alter table public.auditions drop column email;
