-- The newsletter keeps one source of truth, and it isn't this database.
--
-- `newsletter_subscriptions` carried `status` and `unsubscribed_at`, which means
-- it claimed to know whether a person is subscribed. beehiiv knows that, and
-- only beehiiv does: most people unsubscribe from the footer of an email, which
-- never reaches our endpoints. Anything stored here could only drift.
--
-- What beehiiv does *not* keep is the evidence that someone consented: the IP,
-- the user agent, and which of our two forms they used. Article 7(1) GDPR asks
-- us to be able to demonstrate consent, and the privacy policy promises it, so
-- that part stays — as what it actually is, an append-only log of events.
--
--   newsletter_subscriptions (current state)  ->  newsletter_consents (events)
--
-- One row per act of consent, never updated, never deleted except to honour an
-- erasure request, and never read to answer "is this person subscribed".
-- Unsubscribing writes nothing here: it doesn't undo the fact that on a given
-- day this person agreed. A person who subscribes, leaves and comes back has
-- two rows, because that is two separate consents.

-- ---------------------------------------------------------------------------
-- Where the consent was given. A closed set: these are our own forms, and a new
-- entry point should be a deliberate migration rather than a new free-text
-- value nobody notices. 'unknown' is for a payload we can't place.
-- ---------------------------------------------------------------------------
create type public.newsletter_source as enum (
  'newsletter_page',
  'newsletter_modal',
  'unknown'
);

create table public.newsletter_consents (
  id                     uuid                     primary key default gen_random_uuid(),
  email                  text                     not null,
  source                 public.newsletter_source not null,
  consented_at           timestamptz              not null default now(),
  consent_ip             inet,
  consent_user_agent     text,
  -- The subscription this consent produced in beehiiv, to tie the two together
  -- when someone asks what we hold on them. NULL when beehiiv wasn't reachable.
  beehiiv_subscription_id text,
  created_at             timestamptz              not null default now(),
  -- Same rule as the app's isValidEmail and the audition_emails CHECK.
  constraint newsletter_consents_email_format
    check (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint newsletter_consents_email_lowercase
    check (email = lower(email))
);

-- Deliberately NOT unique on email: several consents per person is the point.
-- This index is for answering "what do you hold about me" and erasure requests.
create index newsletter_consents_email_idx
  on public.newsletter_consents using btree (email);
-- For retention sweeps and "who consented in this period".
create index newsletter_consents_consented_at_idx
  on public.newsletter_consents using btree (consented_at);

comment on table public.newsletter_consents is
  'Append-only record of each newsletter sign-up made through our own forms: the evidence of consent that beehiiv does not store. Not a subscriber list — beehiiv is the source of truth for who receives the newsletter.';
comment on column public.newsletter_consents.source is
  'Which of our forms the person used. Imports and sign-ups made inside beehiiv never reach this table.';

-- There is no updated_at and no trigger: nothing in this table ever changes.

-- ---------------------------------------------------------------------------
-- Carry the existing consents over. Rows that had unsubscribed come too: the
-- consent happened, and the log records what happened.
-- ---------------------------------------------------------------------------
insert into public.newsletter_consents
  (email, source, consented_at, consent_ip, consent_user_agent, created_at)
select
  lower(btrim(s.email)),
  case s.source
    when 'newsletter_page'  then 'newsletter_page'::public.newsletter_source
    when 'newsletter_modal' then 'newsletter_modal'::public.newsletter_source
    else 'unknown'::public.newsletter_source
  end,
  s.consent_at,
  s.consent_ip,
  s.consent_user_agent,
  s.created_at
from public.newsletter_subscriptions s;

-- Stop before dropping anything if the copy didn't come out whole. The whole
-- migration runs in one transaction, so raising here leaves the old table alone.
do $$
declare
  v_before integer;
  v_after  integer;
  v_lost   integer;
begin
  select count(*) into v_before from public.newsletter_subscriptions;
  select count(*) into v_after  from public.newsletter_consents;

  if v_before <> v_after then
    raise exception
      'newsletter consent log: copied % of % rows. Not dropping the old table.',
      v_after, v_before;
  end if;

  -- Every row today is newsletter_page or newsletter_modal. If that changed
  -- since this was written, the provenance would silently become 'unknown'.
  select count(*) into v_lost
    from public.newsletter_consents where source = 'unknown';

  if v_lost > 0 then
    raise exception
      'newsletter consent log: % rows have a source this migration does not know. Add it to the newsletter_source enum first.',
      v_lost;
  end if;
end;
$$;

drop table public.newsletter_subscriptions;

-- ---------------------------------------------------------------------------
-- RLS. This is compliance evidence, not app data: nothing in the client reads
-- it. Admins can look; the functions under /api write it with the service role,
-- which bypasses RLS. With no insert/update/delete policy, nobody else can.
--
-- The old table also carried blanket grants to `anon` (including TRUNCATE, which
-- RLS does not gate). Not reachable through PostgREST, but it shouldn't have
-- been there; the new table only grants what it needs.
-- ---------------------------------------------------------------------------
alter table public.newsletter_consents enable row level security;

create policy "newsletter consents select admin only"
  on public.newsletter_consents
  for select to authenticated
  using (public.is_admin());

revoke all on table public.newsletter_consents from anon, authenticated;
grant select on table public.newsletter_consents to authenticated;
