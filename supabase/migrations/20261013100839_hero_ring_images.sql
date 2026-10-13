-- Photos for the image ring in the Companies hero, managed by admins from
-- /admin/settings.
--
-- The files live in the `media` bucket under `hero-ring/` (its existing
-- policies already give admins write access and everyone read access). Each
-- path is unique, so the files never change once uploaded. While the table is
-- empty the app shows the photos bundled with it.

create table public.hero_ring_images (
  id         uuid primary key default gen_random_uuid(),
  image_url  text not null,
  position   integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hero_ring_images_image_url_not_blank check (btrim(image_url) <> ''),
  constraint hero_ring_images_position_non_negative check (position >= 0)
);

comment on table public.hero_ring_images is 'Photos orbiting in the Companies hero ring. Empty = the app''s bundled photos.';
comment on column public.hero_ring_images.position is 'Order around the ring, 0 first. Ties fall back to created_at.';

create index hero_ring_images_position_idx on public.hero_ring_images (position, created_at);

create trigger handle_hero_ring_images_updated_at
  before update on public.hero_ring_images
  for each row execute function extensions.moddatetime('updated_at');

-- ---------------------------------------------------------------------------
-- RLS: public read (the landing is public), admin write.
-- ---------------------------------------------------------------------------
alter table public.hero_ring_images enable row level security;

create policy "hero ring images select public" on public.hero_ring_images
  for select to public using (true);
create policy "hero ring images insert admin only" on public.hero_ring_images
  for insert to authenticated with check (public.is_admin());
create policy "hero ring images update admin only" on public.hero_ring_images
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "hero ring images delete admin only" on public.hero_ring_images
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- reorder_hero_ring_images: sets every photo's position from the order of
-- `p_ids` in one statement, so the ring never shows a half-applied order.
-- ---------------------------------------------------------------------------
create or replace function public.reorder_hero_ring_images(p_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can reorder hero ring images' using errcode = '42501';
  end if;

  update public.hero_ring_images h
  set position = o.ordinality - 1
  from unnest(p_ids) with ordinality as o(id, ordinality)
  where h.id = o.id;
end;
$$;

revoke all on function public.reorder_hero_ring_images(uuid[]) from public, anon;
grant execute on function public.reorder_hero_ring_images(uuid[]) to authenticated;
