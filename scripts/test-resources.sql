\set ON_ERROR_STOP on
set client_min_messages = notice;

-- Real auth users, so the sign-up trigger is what creates the public.users rows
-- and account_type travels in the metadata, like the register screen will send it.
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at) values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pro@x.com',     '{"account_type":"professional"}'::jsonb, now(), now()),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'otro@x.com',    '{"account_type":"professional"}'::jsonb, now(), now()),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mudanza@x.com', '{"account_type":"professional"}'::jsonb, now(), now()),
  ('99999999-9999-9999-9999-999999999999', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@x.com',   '{}'::jsonb, now(), now());

update public.users set role = 'admin' where user_id = '99999999-9999-9999-9999-999999999999';

insert into public.regions (country_iso_code, name, slug, position) values
  ('ES', 'Madrid', 'madrid', 0),
  ('ES', 'Cataluna', 'cataluna', 1),
  ('ES', 'Galicia', 'galicia', 2),
  ('ES', 'Andalucia', 'andalucia', 3),
  ('FR', 'Ile-de-France', 'ile-de-france', 0);

create or replace function test_expect_error(p_sql text, p_label text) returns void
  language plpgsql as $$
begin
  execute p_sql;
  set constraints all immediate;
  raise exception 'FAIL (%): expected an error and none happened', p_label;
exception
  when others then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'OK  %  ->  %', rpad(p_label, 40), left(sqlerrm, 90);
end;
$$;

\echo ''
\echo '=== 0. sign-up trigger: account_type from the auth metadata ==='
select name, account_type, role from public.users order by name;

\echo ''
\echo '=== A. the professional creates a draft through the RPC ==='
set role authenticated;
set request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select public.save_resource('{"id":null,"type":"dance_school","name":"Ballet de Madrid"}'::jsonb) as rid \gset
select status, slug, completeness_pct, next_field, next_step, jsonb_array_length(missing_fields) as missing
from public.resources_enriched where id = :'rid';

\echo ''
\echo '=== B. skipping the optional basics moves on to the country ==='
select public.save_resource(jsonb_build_object('id', :'rid',
  'skipped_fields', jsonb_build_array('founded_year','founder_name'))) is not null as saved;
select next_field, next_step from public.resources_enriched where id = :'rid';

\echo ''
\echo '=== C. the region rules ==='
select test_expect_error(format($q$ select public.save_resource(jsonb_build_object('id', %L,
  'country_iso_code','ES','region_scope','fixed',
  'region_ids', (select jsonb_agg(id) from public.regions where country_iso_code='ES' and slug in ('madrid','galicia')))) $q$,
  :'rid'), 'fixed with 2 regions');
select test_expect_error(format($q$ select public.save_resource(jsonb_build_object('id', %L,
  'country_iso_code','ES','region_scope','multiple',
  'region_ids', (select jsonb_agg(id) from public.regions where country_iso_code='ES' and slug='madrid'))) $q$,
  :'rid'), 'multiple with 1 region');
select test_expect_error(format($q$ select public.save_resource(jsonb_build_object('id', %L,
  'country_iso_code','ES','region_scope','multiple',
  'region_ids', (select jsonb_agg(id) from public.regions where country_iso_code='ES'))) $q$,
  :'rid'), 'multiple with 4 regions');
select test_expect_error(format($q$ select public.save_resource(jsonb_build_object('id', %L,
  'country_iso_code','ES','region_scope','nationwide',
  'region_ids', (select jsonb_agg(id) from public.regions where country_iso_code='ES' and slug='madrid'))) $q$,
  :'rid'), 'nationwide with a region');
select test_expect_error(format($q$ select public.save_resource(jsonb_build_object('id', %L,
  'country_iso_code','ES','region_scope','fixed',
  'region_ids', (select jsonb_agg(id) from public.regions where country_iso_code='FR'))) $q$,
  :'rid'), 'a region of another country');

\echo ''
\echo '=== D. fixed with exactly one region works ==='
select public.save_resource(jsonb_build_object('id', :'rid',
  'country_iso_code','ES','region_scope','fixed',
  'region_ids', (select jsonb_agg(id) from public.regions where country_iso_code='ES' and slug='madrid'))) is not null as saved;
select region_scope, placement_rank, regions->0->>'name' as region, next_field
from public.resources_enriched where id = :'rid';

\echo ''
\echo '=== E. "no fixed address" wins over an address in the same payload ==='
select public.save_resource(jsonb_build_object('id', :'rid', 'no_fixed_address', true, 'address', 'Calle Falsa 123')) is not null as saved;
select no_fixed_address, address, next_field from public.resources_enriched where id = :'rid';

\echo ''
\echo '=== F. an incomplete listing cannot be sent for review ==='
select test_expect_error(format($q$ select public.save_resource(jsonb_build_object('id', %L, 'status','pending_review')) $q$,
  :'rid'), 'pending_review while incomplete');

\echo ''
\echo '=== G. filling the rest ==='
select public.save_resource(jsonb_build_object('id', :'rid',
  'emails', jsonb_build_array(jsonb_build_object('email','hola@balletmadrid.es','label','Reservas')),
  'professional_experience', '20 anos formando bailarines',
  'teaching_method', 'Vaganova',
  'discipline_ids', (select jsonb_agg(id) from public.disciplines where slug in ('ballet','pointe')),
  'student_goals', jsonb_build_array('vocational','professional'),
  'logo_url', 'https://example.com/logo.png',
  'description', 'Escuela de ballet en Madrid')) is not null as saved;
select completeness_pct, next_field, missing_fields from public.resources_enriched where id = :'rid';

\echo ''
\echo '=== H. review yes, publishing no ==='
select public.save_resource(jsonb_build_object('id', :'rid', 'status','pending_review')) is not null as saved;
select status, published_at from public.resources_enriched where id = :'rid';
select test_expect_error(format($q$ select public.save_resource(jsonb_build_object('id', %L, 'status','published')) $q$,
  :'rid'), 'publishing as its owner');
select test_expect_error(format($q$ update public.resources set verified = true where id = %L $q$,
  :'rid'), 'verifying as its owner');

\echo ''
\echo '=== I. one account, one listing ==='
select test_expect_error($q$ select public.save_resource('{"id":null,"type":"photographer","name":"Otra cosa"}'::jsonb) $q$,
  'a second listing for the same account');

\echo ''
\echo '=== J. another professional cannot see or touch the draft ==='
set request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select count(*) as sees_it from public.resources_enriched where id = :'rid';
select test_expect_error(format($q$ select public.save_resource(jsonb_build_object('id', %L, 'name','Secuestrada')) $q$,
  :'rid'), 'writing somebody elses listing');

\echo ''
\echo '=== K. the admin publishes it ==='
set request.jwt.claims = '{"sub":"99999999-9999-9999-9999-999999999999","role":"authenticated"}';
select public.save_resource(jsonb_build_object('id', :'rid', 'status','published')) is not null as saved;
select status, (published_at is not null) as has_published_at, verified from public.resources_enriched where id = :'rid';

\echo ''
\echo '=== L. a nationwide photographer, in every region of its country ==='
set request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select public.save_resource('{"id":null,"type":"photographer","name":"Foto Nacional"}'::jsonb) as rid2 \gset
select public.save_resource(jsonb_build_object('id', :'rid2',
  'country_iso_code','ES','region_scope','nationwide',
  'emails', jsonb_build_array(jsonb_build_object('email','foto@nacional.es')),
  'professional_experience','Fotografia de danza',
  'relation_to_dance','Bailarin retirado',
  'photography_work_types', jsonb_build_array('live_theater','indoor_studio'),
  'images', jsonb_build_array(
    jsonb_build_object('image_url','https://e.com/1.jpg'),
    jsonb_build_object('image_url','https://e.com/2.jpg'),
    jsonb_build_object('image_url','https://e.com/3.jpg')),
  'logo_url','https://e.com/logo.png',
  'description','Fotografo de danza',
  'status','pending_review')) is not null as saved;
set request.jwt.claims = '{"sub":"99999999-9999-9999-9999-999999999999","role":"authenticated"}';
select public.save_resource(jsonb_build_object('id', :'rid2', 'status','published')) is not null as published_by_admin;
set request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select g.slug as region, r.name, p.placement_rank
from public.resource_region_placements p
join public.regions g on g.id = p.region_id
join public.resources r on r.id = p.resource_id
order by g.slug, p.placement_rank;

\echo ''
\echo '=== M. a published photographer cannot drop to 2 photos ==='
select test_expect_error(format($q$ select public.save_resource(jsonb_build_object('id', %L,
  'images', jsonb_build_array(
    jsonb_build_object('image_url','https://e.com/1.jpg'),
    jsonb_build_object('image_url','https://e.com/2.jpg')))) $q$,
  :'rid2'), 'a published photographer with 2 photos');

\echo ''
\echo '=== N. moving country drops the regions that no longer apply ==='
set request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select public.save_resource('{"id":null,"type":"physiotherapist","name":"Fisio Movil"}'::jsonb) as rid3 \gset
select public.save_resource(jsonb_build_object('id', :'rid3','country_iso_code','ES','region_scope','fixed',
  'region_ids', (select jsonb_agg(id) from public.regions where slug='cataluna'))) is not null as saved;
select public.save_resource(jsonb_build_object('id', :'rid3','country_iso_code','FR')) is not null as moved;
select country_iso_code, region_scope, jsonb_array_length(regions) as regions, next_field
from public.resources_enriched where id = :'rid3';

\echo ''
\echo '=== O. what an anonymous visitor sees ==='
reset role;
set role anon;
set request.jwt.claims = '{"role":"anon"}';
select count(*) as published_visible from public.resources_enriched;
select count(*) as emails_visible from public.resource_emails;
select count(*) as skipped_visible from public.resource_skipped_fields;
select count(*) as type_fields_visible from public.resource_type_fields;
reset role;

\echo ''
\echo '=== P. resources_in_region: the listing order ==='
set role anon;
set request.jwt.claims = '{"role":"anon"}';
select r.name, r.type, r.placement_rank, r.verified
from public.resources_in_region((select id from public.regions where slug = 'madrid')) r;
select count(*) as only_photographers
from public.resources_in_region((select id from public.regions where slug = 'madrid'), 'photographer');
select count(*) as in_galicia
from public.resources_in_region((select id from public.regions where slug = 'galicia'));
reset role;
