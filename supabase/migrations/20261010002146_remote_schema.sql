SET local check_function_bodies = off;

CREATE EXTENSION "moddatetime" SCHEMA "extensions";

CREATE EXTENSION "pgjwt" SCHEMA "extensions";

CREATE TABLE "public"."ads" (
  "id"                uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "title"             text,
  "description"       text,
  "image_url"         text                     NOT NULL,
  "destination_url"   text,
  "active_from"       timestamp with time zone,
  "active_until"      timestamp with time zone,
  "created_at"        timestamp with time zone DEFAULT now(),
  "updated_at"        timestamp with time zone DEFAULT now(),
  "published"         boolean                  NOT NULL DEFAULT false,
  "image_url_desktop" text,
  CONSTRAINT "ads_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."ads"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."ai_summary_events" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"    uuid                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "ai_summary_events_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."ai_summary_events"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."ai_summary_quota" (
  "role"        text    NOT NULL,
  "limit_count" integer NOT NULL,
  "period"      text    NOT NULL,
  "tz"          text    NOT NULL DEFAULT 'Europe/Madrid'::text,
  CONSTRAINT "ai_summary_quota_limit_count_check" CHECK ((limit_count >= 0)),
  CONSTRAINT "ai_summary_quota_period_check" CHECK ((period = ANY (ARRAY['day'::text, 'week'::text, 'month'::text]))),
  CONSTRAINT "ai_summary_quota_pkey" PRIMARY KEY (ROLE)
);

ALTER TABLE "public"."ai_summary_quota"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."audition_height_requirements" (
  "id"            uuid    NOT NULL DEFAULT gen_random_uuid(),
  "audition_id"   uuid    NOT NULL,
  "min_height_cm" integer,
  "max_height_cm" integer,
  CONSTRAINT "audition_height_requirements_pkey" PRIMARY KEY (id),
  CONSTRAINT "ck_bounds_order" CHECK (((min_height_cm IS NULL) OR (max_height_cm IS NULL) OR (min_height_cm <= max_height_cm))),
  CONSTRAINT "ck_heights_positive" CHECK ((((min_height_cm IS NULL) OR (min_height_cm > 0)) AND ((max_height_cm IS NULL) OR (max_height_cm > 0)))),
  CONSTRAINT "ck_some_bound_present" CHECK (((min_height_cm IS NOT NULL) OR (max_height_cm IS NOT NULL)))
);

ALTER TABLE "public"."audition_height_requirements"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."audition_participating_companies" (
  "audition_id" uuid                     NOT NULL,
  "company_id"  uuid                     NOT NULL,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "audition_participating_companies_pkey" PRIMARY KEY (audition_id, company_id)
);

ALTER TABLE "public"."audition_participating_companies"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."auditions" (
  "id"                        uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "company_id"                uuid                     NOT NULL,
  "deadline_date"             date,
  "audition_date"             date,
  "email"                     text,
  "summary"                   text,
  "website_url"               text,
  "location"                  text,
  "created_at"                timestamp with time zone NOT NULL DEFAULT now(),
  "description"               text,
  "deadline_mode"             text                     NOT NULL DEFAULT 'fixed_date'::text,
  "audition_schedule_mode"    text                     NOT NULL DEFAULT 'single_date'::text,
  "audition_schedule_note"    text,
  "audition_schedule_entries" jsonb,
  "content_updated_at"        timestamp with time zone DEFAULT now(),
  "updated_at"                timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "auditions_audition_schedule_mode_check" CHECK ((audition_schedule_mode = ANY (ARRAY['single_date'::text, 'to_be_arranged'::text, 'various_dates'::text]))),
  CONSTRAINT "auditions_deadline_mode_check" CHECK ((deadline_mode = ANY (ARRAY['fixed_date'::text, 'asap'::text, 'always_open'::text]))),
  CONSTRAINT "auditions_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."auditions"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."companies" (
  "id"                           uuid                        NOT NULL DEFAULT gen_random_uuid(),
  "created_at"                   timestamp with time zone    NOT NULL DEFAULT now(),
  "name"                         text,
  "description"                  text,
  "image"                        text,
  "location"                     text,
  "review_count"                 bigint,
  "rating_count"                 bigint,
  "average_rating"               double precision,
  "website_url"                  text,
  "instagram_url"                text,
  "meta_url"                     text,
  "country"                      text,
  "verified"                     boolean                     DEFAULT false,
  "last_reviewed_at"             timestamp without time zone DEFAULT now(),
  "country_iso_code"             text                        DEFAULT 'NULL'::text,
  "current_audition_id"          uuid,
  "is_junior"                    boolean                     NOT NULL DEFAULT false,
  "professional_education_level" text,
  CONSTRAINT "companies_pkey" PRIMARY KEY (id),
  CONSTRAINT "companies_professional_education_level_check" CHECK ((professional_education_level = ANY (ARRAY['pre_pro'::text, 'school_pro'::text, 'university'::text])))
);

ALTER TABLE "public"."companies"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."favorite_companies" (
  "user_id"    uuid                     NOT NULL,
  "company_id" uuid                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "favorite_companies_pkey" PRIMARY KEY (user_id, company_id)
);

ALTER TABLE "public"."favorite_companies"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."newsletter_subscriptions" (
  "id"                 uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "email"              text                     NOT NULL,
  "status"             text                     NOT NULL DEFAULT 'pending'::text,
  "source"             text                     NOT NULL,
  "brevo_contact_id"   text,
  "consent_at"         timestamp with time zone NOT NULL DEFAULT now(),
  "consent_ip"         inet,
  "consent_user_agent" text,
  "unsubscribed_at"    timestamp with time zone,
  "created_at"         timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"         timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "newsletter_subscriptions_email_key" UNIQUE (email),
  CONSTRAINT "newsletter_subscriptions_pkey" PRIMARY KEY (id),
  CONSTRAINT "newsletter_subscriptions_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'subscribed'::text, 'unsubscribed'::text])))
);

ALTER TABLE "public"."newsletter_subscriptions"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."reviews" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  "content"         json                     NOT NULL,
  "rating"          real,
  "user_id"         uuid                     NOT NULL,
  "company_id"      uuid                     NOT NULL,
  "visibility_type" text,
  "hidden"          boolean,
  CONSTRAINT "reviews_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."reviews"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."users" (
  "user_id"            uuid                     NOT NULL,
  "created_at"         timestamp with time zone NOT NULL DEFAULT now(),
  "name"               text                     NOT NULL,
  "profile_img"        text,
  "instagram_url"      text,
  "linkedin_url"       text,
  "website_url"        text,
  "bio"                text,
  "company"            text,
  "location"           text,
  "gender"             text,
  "display_local_time" boolean,
  "role"               character varying        DEFAULT 'user'::character varying,
  CONSTRAINT "users_pkey" PRIMARY KEY (user_id)
);

ALTER TABLE "public"."users"
  ENABLE ROW LEVEL SECURITY;

CREATE TYPE "public"."audition_gender" AS ENUM (
  'male',
  'female',
  'other'
);

ALTER TABLE "public"."audition_height_requirements"
  ADD COLUMN "gender" public.audition_gender NOT NULL;

CREATE TYPE "public"."company_type" AS ENUM (
  'company',
  'professional_education',
  'events'
);

ALTER TABLE "public"."companies"
  ADD COLUMN "type" public.company_type NOT NULL DEFAULT 'company'::public.company_type;

CREATE OR REPLACE FUNCTION public.ai_summary_consume (
  p_user uuid
)
  RETURNS TABLE (
    allowed     boolean,
    used        integer,
    remaining   integer,
    limit_count integer,
    period      text
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_role text;
  v_limit int;
  v_period text;
  v_tz text;
  v_bucket_start timestamptz;
  v_used int;
begin
  -- 1) Resolver role según tu esquema (public.users.user_id)
  select u.role
    into v_role
  from public.users u
  where u.user_id = p_user;

  if v_role is null then
    v_role := 'user';
  end if;

  -- 2) Leer cuota por role
  select q.limit_count, q.period, q.tz
    into v_limit, v_period, v_tz
  from ai_summary_quota q
  where q.role = v_role;

  if v_limit is null then
    v_limit := 0;
    v_period := 'day';
    v_tz := 'Europe/Madrid';
  end if;

  -- 3) Calcular inicio del bucket en la TZ de negocio
  v_bucket_start := (date_trunc(v_period, now() at time zone v_tz) at time zone v_tz);

  -- 4) Contar usos en el bucket
  select count(*)
    into v_used
  from ai_summary_events e
  where e.user_id = p_user
    and e.created_at >= v_bucket_start;

  if v_used < v_limit then
    -- 5) Consumir: insert evento
    insert into ai_summary_events(user_id) values (p_user);
    v_used := v_used + 1;

    return query
      select true, v_used, (v_limit - v_used), v_limit, v_period;
  else
    return query
      select false, v_used, 0, v_limit, v_period;
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.ai_summary_quota_view (
  p_user uuid
)
  RETURNS TABLE (
    used                integer,
    remaining           integer,
    limit_count         integer,
    period              text,
    next_reset          timestamp with time zone,
    seconds_until_reset integer
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
-- 1) Effective config for the user's role, fallback to 'user'
WITH cfg AS (
  SELECT * FROM (
    SELECT q.limit_count, q.period, q.tz
      FROM ai_summary_quota q
      JOIN public.users u ON u.role = q.role
     WHERE u.user_id = p_user
    UNION ALL
    SELECT q2.limit_count, q2.period, q2.tz
      FROM ai_summary_quota q2
     WHERE q2.role = 'user'          -- <-- fallback row must exist
  ) x
  LIMIT 1
),
bucket AS (
  SELECT
    date_trunc(cfg.period, now() AT TIME ZONE cfg.tz) AS start_local,
    CASE cfg.period
      WHEN 'day'   THEN INTERVAL '1 day'
      WHEN 'week'  THEN INTERVAL '1 week'
      WHEN 'month' THEN INTERVAL '1 month'
    END AS len,
    cfg.limit_count,
    cfg.period,
    cfg.tz
  FROM cfg
),
limits AS (
  SELECT
    (start_local AT TIME ZONE tz)             AS start_utc,
    ((start_local + len) AT TIME ZONE tz)     AS end_utc,
    limit_count, period, tz
  FROM bucket
)
SELECT
  (SELECT COUNT(*) FROM ai_summary_events e
    WHERE e.user_id = p_user
      AND e.created_at >= limits.start_utc)           AS used,
  limits.limit_count -
  (SELECT COUNT(*) FROM ai_summary_events e
    WHERE e.user_id = p_user
      AND e.created_at >= limits.start_utc)           AS remaining,
  limits.limit_count,
  limits.period,
  limits.end_utc                                       AS next_reset,
  CEIL(EXTRACT(EPOCH FROM (limits.end_utc - NOW())))::int AS seconds_until_reset
FROM limits;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_registration_dates()
  RETURNS TABLE (
    created_at timestamp with time zone
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  return query
    select u.created_at
    from public.users u
    order by u.created_at asc;
end;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_name text;
begin
  -- Derivamos un nombre provisional del email; si no hay email (p. ej. provider), generamos fallback
  v_name := coalesce(split_part(new.email, '@', 1), 'user_' || substr(new.id::text, 1, 8));

  insert into public.users (user_id, name)  -- role usa el DEFAULT 'user'
  values (new.id, v_name)
  on conflict (user_id) do nothing;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  AS $function$
  select exists (
    select 1
    from public.users as u
    where u.user_id = auth.uid() and u.role = 'admin'
  );
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

ALTER TABLE "public"."ai_summary_events"
  ADD CONSTRAINT "ai_summary_events_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."audition_height_requirements"
  ADD CONSTRAINT "uq_audition_gender" UNIQUE (audition_id, gender);

ALTER TABLE "public"."audition_height_requirements"
  ADD CONSTRAINT "audition_height_requirements_audition_id_fkey" FOREIGN KEY (audition_id) REFERENCES public.auditions(id) ON DELETE CASCADE;

ALTER TABLE "public"."audition_participating_companies"
  ADD CONSTRAINT "audition_participating_companies_audition_id_fkey" FOREIGN KEY (audition_id) REFERENCES public.auditions(id) ON DELETE CASCADE;

ALTER TABLE "public"."companies"
  ADD CONSTRAINT "companies_current_audition_id_fkey" FOREIGN KEY (current_audition_id) REFERENCES public.auditions(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "public"."audition_participating_companies"
  ADD CONSTRAINT "audition_participating_companies_company_id_fkey" FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE "public"."auditions"
  ADD CONSTRAINT "auditions_company_id_fkey" FOREIGN KEY (company_id) REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."favorite_companies"
  ADD CONSTRAINT "favorite_companies_company_id_fkey" FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE "public"."favorite_companies"
  ADD CONSTRAINT "favorite_companies_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."reviews"
  ADD CONSTRAINT "reviews_company_id_fkey" FOREIGN KEY (company_id) REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."reviews"
  ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(user_id);

ALTER TABLE "public"."users"
  ADD CONSTRAINT "users_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id);

CREATE VIEW "public"."companies_enriched" WITH (security_invoker=true) AS  SELECT c.id,
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
    (fc.user_id IS NOT NULL) AS is_favorite,
    COALESCE(( SELECT jsonb_agg(t.a_json ORDER BY t.sort_date) AS jsonb_agg
           FROM ( SELECT
                        CASE
                            WHEN ((a.deadline_mode = 'fixed_date'::text) AND (a.deadline_date IS NOT NULL)) THEN a.deadline_date
                            WHEN ((a.audition_schedule_mode = 'single_date'::text) AND (a.audition_date IS NOT NULL)) THEN a.audition_date
                            ELSE (a.created_at)::date
                        END AS sort_date,
                    jsonb_build_object('id', a.id, 'company_id', a.company_id, 'deadline_date', a.deadline_date, 'audition_date', a.audition_date, 'email', a.email, 'summary', a.summary, 'website_url', a.website_url, 'location', a.location, 'created_at', a.created_at, 'description', a.description, 'deadline_mode', a.deadline_mode, 'audition_schedule_mode', a.audition_schedule_mode, 'audition_schedule_note', a.audition_schedule_note, 'audition_schedule_entries', a.audition_schedule_entries, 'height_requirements', COALESCE(( SELECT jsonb_agg(jsonb_build_object('gender', hr.gender, 'min_height_cm', hr.min_height_cm, 'max_height_cm', hr.max_height_cm) ORDER BY hr.gender) AS jsonb_agg
                           FROM public.audition_height_requirements hr
                          WHERE (hr.audition_id = a.id)), '[]'::jsonb)) AS a_json
                   FROM public.auditions a
                  WHERE (a.company_id = c.id)) t), '[]'::jsonb) AS auditions,
    c.type
   FROM (public.companies c
     LEFT JOIN public.favorite_companies fc ON (((fc.company_id = c.id) AND (fc.user_id = auth.uid()))));

CREATE VIEW "public"."companies_with_is_favorite" WITH (security_invoker=on) AS  SELECT c.id,
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
    c.current_audition_id,
    (EXISTS ( SELECT 1
           FROM public.favorite_companies fc
          WHERE ((fc.company_id = c.id) AND (fc.user_id = auth.uid())))) AS is_favorite
   FROM public.companies c;

CREATE INDEX favorite_companies_company_id_idx ON public.favorite_companies USING btree (company_id);

CREATE INDEX favorite_companies_user_company_idx ON public.favorite_companies USING btree (user_id, company_id);

CREATE INDEX favorite_companies_user_id_idx ON public.favorite_companies USING btree (user_id);

CREATE INDEX idx_ai_summary_events_user_time ON public.ai_summary_events USING btree (user_id, created_at DESC);

CREATE INDEX idx_audition_height_requirements_audition_id ON public.audition_height_requirements USING btree (audition_id);

CREATE INDEX idx_audition_participating_companies_company_id ON public.audition_participating_companies USING btree (company_id);

CREATE INDEX idx_auditions_audition_date ON public.auditions USING btree (audition_date);

CREATE INDEX idx_auditions_company_id ON public.auditions USING btree (company_id);

CREATE INDEX idx_auditions_deadline_date ON public.auditions USING btree (deadline_date);

CREATE UNIQUE INDEX newsletter_subscriptions_email_unique ON public.newsletter_subscriptions USING btree (lower(email));

CREATE INDEX newsletter_subscriptions_source_idx ON public.newsletter_subscriptions USING btree (source);

CREATE INDEX newsletter_subscriptions_status_idx ON public.newsletter_subscriptions USING btree (status);

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

CREATE TRIGGER handle_auditions_updated_at
  BEFORE UPDATE ON public.auditions
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime('updated_at');

CREATE TRIGGER set_newsletter_updated_at
  BEFORE UPDATE ON public.newsletter_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "ads_admin_all" ON "public"."ads"
  FOR ALL
  TO PUBLIC
  USING (public.is_admin());

CREATE POLICY "ads_public_read" ON "public"."ads"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "users can insert own events" ON "public"."ai_summary_events"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "users can read own events" ON "public"."ai_summary_events"
  FOR SELECT
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "height reqs delete admin only" ON "public"."audition_height_requirements"
  FOR DELETE
  TO "authenticated"
  USING (public.is_admin());

CREATE POLICY "height reqs insert admin only" ON "public"."audition_height_requirements"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_admin());

CREATE POLICY "height reqs select public" ON "public"."audition_height_requirements"
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM public.auditions a
  WHERE (a.id = audition_height_requirements.audition_id))));

CREATE POLICY "height reqs update admin only" ON "public"."audition_height_requirements"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "audition_participating_companies_delete" ON "public"."audition_participating_companies"
  FOR DELETE
  TO PUBLIC
  USING (public.is_admin());

CREATE POLICY "audition_participating_companies_insert" ON "public"."audition_participating_companies"
  FOR INSERT
  TO PUBLIC
  WITH CHECK (public.is_admin());

CREATE POLICY "audition_participating_companies_select" ON "public"."audition_participating_companies"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "audition_participating_companies_update" ON "public"."audition_participating_companies"
  FOR UPDATE
  TO PUBLIC
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "auditions delete admin only" ON "public"."auditions"
  FOR DELETE
  TO "authenticated"
  USING (public.is_admin());

CREATE POLICY "auditions insert admin only" ON "public"."auditions"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_admin());

CREATE POLICY "auditions select public" ON "public"."auditions"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "auditions update admin only" ON "public"."auditions"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Enable read access for all users" ON "public"."companies"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "companies delete admin only" ON "public"."companies"
  FOR DELETE
  TO "authenticated"
  USING (public.is_admin());

CREATE POLICY "companies insert admin only" ON "public"."companies"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_admin());

CREATE POLICY "companies update admin only" ON "public"."companies"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "delete_self_favorite" ON "public"."favorite_companies"
  FOR DELETE
  TO "authenticated"
  USING ((user_id = auth.uid()));

CREATE POLICY "insert_self_favorite" ON "public"."favorite_companies"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "read_own_favorites" ON "public"."favorite_companies"
  FOR SELECT
  TO "authenticated"
  USING ((user_id = auth.uid()));

CREATE POLICY "Authenticated can select own by email or admin" ON "public"."newsletter_subscriptions"
  FOR SELECT
  TO "authenticated"
  USING ((public.is_admin() OR (lower(email) = lower((auth.jwt() ->> 'email'::text)))));

CREATE POLICY "Insert from backend only" ON "public"."newsletter_subscriptions"
  FOR INSERT
  TO PUBLIC
  WITH CHECK (true);

CREATE POLICY "No public delete" ON "public"."newsletter_subscriptions"
  FOR DELETE
  TO PUBLIC
  USING (false);

CREATE POLICY "Enable read access for all users" ON "public"."reviews"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "delete own or admin" ON "public"."reviews"
  FOR DELETE
  TO "authenticated"
  USING (((user_id = auth.uid()) OR public.is_admin()));

CREATE POLICY "insert own" ON "public"."reviews"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "update own or admin" ON "public"."reviews"
  FOR UPDATE
  TO "authenticated"
  USING (((user_id = auth.uid()) OR public.is_admin()))
  WITH CHECK (((user_id = auth.uid()) OR public.is_admin()));

CREATE POLICY "users: admin can update any" ON "public"."users"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "users: delete admin only" ON "public"."users"
  FOR DELETE
  TO "authenticated"
  USING (public.is_admin());

CREATE POLICY "users: insert self or admin" ON "public"."users"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((user_id = auth.uid()) OR public.is_admin()));

CREATE POLICY "users: read self" ON "public"."users"
  FOR SELECT
  TO "authenticated"
  USING ((user_id = auth.uid()));

CREATE POLICY "users: update self (no role change)" ON "public"."users"
  FOR UPDATE
  TO "authenticated"
  USING ((user_id = auth.uid()))
  WITH CHECK (((user_id = auth.uid()) AND ((role)::text = (( SELECT users_1.role
   FROM public.users users_1
  WHERE (users_1.user_id = auth.uid())))::text)));

CREATE POLICY "media_admin_delete" ON "storage"."objects"
  FOR DELETE
  TO PUBLIC
  USING (((bucket_id = 'media'::text) AND public.is_admin()));

CREATE POLICY "media_admin_insert" ON "storage"."objects"
  FOR INSERT
  TO PUBLIC
  WITH CHECK (((bucket_id = 'media'::text) AND public.is_admin()));

CREATE POLICY "media_public_read" ON "storage"."objects"
  FOR SELECT
  TO PUBLIC
  USING ((bucket_id = 'media'::text));

COMMENT ON COLUMN "public"."reviews"."hidden" IS 'Describes if the review is hidden for normal all users or not';

COMMENT ON EXTENSION "moddatetime" IS 'functions for tracking last modification time';

COMMENT ON EXTENSION "pgjwt" IS 'JSON Web Token API for Postgresql';

GRANT EXECUTE ON FUNCTION "public"."ai_summary_consume"(uuid) TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."ai_summary_consume"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."ai_summary_consume"(uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."ai_summary_consume"(uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."ai_summary_quota_view"(uuid) TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."ai_summary_quota_view"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."ai_summary_quota_view"(uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."ai_summary_quota_view"(uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."get_user_registration_dates"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."get_user_registration_dates"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_user_registration_dates"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_user_registration_dates"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."handle_new_auth_user"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."handle_new_auth_user"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."handle_new_auth_user"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."handle_new_auth_user"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."is_admin"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."set_updated_at"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."set_updated_at"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."set_updated_at"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."set_updated_at"() TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."ads" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."ads" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."ads" TO "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."ads" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."ai_summary_events" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."ai_summary_events" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."ai_summary_events" TO "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."ai_summary_events" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."ai_summary_quota" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."ai_summary_quota" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."ai_summary_quota" TO "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."ai_summary_quota" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."audition_height_requirements" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."audition_height_requirements" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."audition_height_requirements" TO "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."audition_height_requirements" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."audition_participating_companies" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."audition_participating_companies" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."audition_participating_companies" TO "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."audition_participating_companies" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."auditions" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."auditions" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."auditions" TO "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."auditions" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."companies" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."companies" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."companies" TO "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."companies" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."favorite_companies" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."favorite_companies" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."favorite_companies" TO "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."favorite_companies" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."newsletter_subscriptions" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."newsletter_subscriptions" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."newsletter_subscriptions" TO "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."newsletter_subscriptions" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."reviews" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."reviews" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."reviews" TO "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."reviews" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."users" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."users" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."users" TO "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."users" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."companies_enriched" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."companies_enriched" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."companies_enriched" TO "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."companies_enriched" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."companies_with_is_favorite" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."companies_with_is_favorite" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."companies_with_is_favorite" TO "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."companies_with_is_favorite" TO "service_role";


-- El bucket es una fila de storage.buckets (datos, no esquema), así que
-- db pull no lo exporta. En producción ya existe; esto es para entornos nuevos.
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;
