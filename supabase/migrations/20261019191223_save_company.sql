-- save_company: creates or updates a company together with its subtypes, in
-- one transaction. It replaces the admin form's client-side upsert, which
-- could not also replace the company's subtypes atomically.
--
-- Additive: safe to apply before the app that calls it ships. The legacy
-- columns (type, is_junior, professional_education_level) are not written;
-- they go in the next migration.
--
-- Payload:
-- {
--   "id": uuid | null,                       -- null inserts
--   "name": text,                            -- required
--   "description", "image", "location", "website_url", "instagram_url",
--   "meta_url", "country", "country_iso_code": text | null,  -- always written: omitted or blank = null
--   "verified": boolean,                     -- omitted: keep (update) / true (insert)
--   "subtype_ids"?: [text]                   -- the whole set; omitted: untouched
-- }
-- Runs as the caller, so RLS still applies; the admin check is only for a clear error.
create or replace function public.save_company(p jsonb)
  returns uuid
  language plpgsql
  security invoker
  set search_path = ''
  as $function$
declare
  v_id       uuid := nullif(p->>'id', '')::uuid;
  v_name     text := nullif(btrim(p->>'name'), '');
  v_subtypes text[];
  v_unknown  text;
begin
  if not public.is_admin() then
    raise exception 'save_company: only admins can save companies'
      using errcode = 'insufficient_privilege';
  end if;

  if v_name is null then
    raise exception 'save_company: a company needs a name'
      using errcode = 'check_violation';
  end if;

  if p ? 'subtype_ids' then
    if jsonb_typeof(p->'subtype_ids') is distinct from 'array' then
      raise exception 'save_company: subtype_ids must be an array'
        using errcode = 'invalid_parameter_value';
    end if;

    select coalesce(array_agg(distinct e.value), '{}') into v_subtypes
    from jsonb_array_elements_text(p->'subtype_ids') as e(value);

    -- The foreign key would refuse them too, but without saying which.
    select string_agg(s.id, ', ') into v_unknown
    from unnest(v_subtypes) as s(id)
    where not exists (select 1 from public.company_subtypes cs where cs.id = s.id);

    if v_unknown is not null then
      raise exception 'save_company: unknown subtype: %', v_unknown
        using errcode = 'foreign_key_violation';
    end if;
  end if;

  if v_id is null then
    insert into public.companies (
      name, description, image, location, website_url, instagram_url, meta_url,
      country, country_iso_code, verified
    ) values (
      v_name,
      nullif(btrim(p->>'description'), ''),
      nullif(btrim(p->>'image'), ''),
      nullif(btrim(p->>'location'), ''),
      nullif(btrim(p->>'website_url'), ''),
      nullif(btrim(p->>'instagram_url'), ''),
      nullif(btrim(p->>'meta_url'), ''),
      nullif(btrim(p->>'country'), ''),
      upper(nullif(btrim(p->>'country_iso_code'), '')),
      coalesce((p->>'verified')::boolean, true)
    )
    returning id into v_id;
  else
    update public.companies set
      name             = v_name,
      description      = nullif(btrim(p->>'description'), ''),
      image            = nullif(btrim(p->>'image'), ''),
      location         = nullif(btrim(p->>'location'), ''),
      website_url      = nullif(btrim(p->>'website_url'), ''),
      instagram_url    = nullif(btrim(p->>'instagram_url'), ''),
      meta_url         = nullif(btrim(p->>'meta_url'), ''),
      country          = nullif(btrim(p->>'country'), ''),
      country_iso_code = upper(nullif(btrim(p->>'country_iso_code'), '')),
      verified         = coalesce((p->>'verified')::boolean, verified)
    where id = v_id;

    if not found then
      raise exception 'save_company: company % not found', v_id
        using errcode = 'no_data_found';
    end if;
  end if;

  if v_subtypes is not null then
    delete from public.companies_company_subtypes
    where company_id = v_id and company_subtype_id <> all (v_subtypes);

    insert into public.companies_company_subtypes (company_id, company_subtype_id)
    select v_id, s.id from unnest(v_subtypes) as s(id)
    on conflict do nothing;
  end if;

  return v_id;
end;
$function$;
