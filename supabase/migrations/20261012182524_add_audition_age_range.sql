-- Optional age range on an audition ("18–25", "18+", "up to 25").
--
-- Two nullable columns on `auditions` rather than a table: one range per
-- audition (heights live in their own table because they vary by gender).
-- Ages are whole years, both bounds inclusive; NULL means no bound, so an
-- audition with both NULL has no age limit.

alter table public.auditions
  add column min_age integer,
  add column max_age integer,
  add constraint auditions_age_positive
    check ((min_age is null or min_age > 0) and (max_age is null or max_age > 0)),
  add constraint auditions_age_order
    check (min_age is null or max_age is null or min_age <= max_age);

comment on column public.auditions.min_age is 'Minimum age in years, inclusive. NULL = no minimum.';
comment on column public.auditions.max_age is 'Maximum age in years, inclusive. NULL = no maximum.';

-- ---------------------------------------------------------------------------
-- auditions_enriched: same definition plus the two columns. `create or replace`
-- can only append columns, so they go after `status`. `companies_enriched`
-- builds each audition with `to_jsonb(ae)`, so it picks them up on its own.
-- ---------------------------------------------------------------------------
create or replace view public.auditions_enriched with (security_invoker = true) as
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
  end)::public.audition_status as status,
  a.min_age,
  a.max_age
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
-- save_audition: same function plus "min_age" / "max_age". Like
-- "content_updated_at", an omitted key leaves the stored value untouched on
-- update, so a client that predates the field can't wipe it. Payload:
-- {
--   "id": uuid | null,                       -- null inserts
--   "company_id": uuid,                      -- used on insert only
--   "email", "summary", "website_url", "description", "schedule_label": text | null,
--   "is_active": boolean,                    -- default true
--   "content_updated_at": timestamptz,       -- omitted: keep (update) / now() (insert)
--   "min_age", "max_age": integer | null,    -- omitted: keep (update) / null (insert)
--   "deadlines": [{ "id"?, "date", "date_label"?, "notes"?,
--     "dates": [{ "id"?, "start_date", "end_date", "format"?, "place"?,
--                 "country_iso_code"?, "date_label"?, "notes"? }] }],
--   "height_requirements"?: [{ "gender", "min_height_cm"?, "max_height_cm"? }],  -- omitted: untouched
--   "participating_company_ids"?: [uuid]                                        -- omitted: untouched
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
      company_id, email, summary, website_url, description, schedule_label, is_active, content_updated_at,
      min_age, max_age
    ) values (
      (p->>'company_id')::uuid,
      nullif(btrim(p->>'email'), ''),
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
      email              = nullif(btrim(p->>'email'), ''),
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

  return v_id;
end;
$function$;
