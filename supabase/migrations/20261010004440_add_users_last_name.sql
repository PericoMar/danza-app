-- The redesigned /profile screen edits first and last name separately.
-- `name` keeps its role as the first/display name (NOT NULL, seeded from the
-- email by handle_new_auth_user), so existing rows and readers are untouched;
-- `last_name` is optional and starts empty for everyone.
alter table public.users
  add column if not exists last_name text;
