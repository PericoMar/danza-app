-- Lets admins switch an audition off by hand (e.g. an "always open" call the
-- company has stopped running) without deleting it. The company page only
-- shows active auditions. Existing rows default to active, so nothing that is
-- visible today disappears.
alter table public.auditions
  add column if not exists is_active boolean not null default true;
