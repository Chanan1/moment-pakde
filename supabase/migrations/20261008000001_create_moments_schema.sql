-- Migration: 20261008000001_create_moments_schema.sql
-- Skema untuk Moment, Foto, Tag, Reaksi, dan Komentar

-- 1. Tabel moments
create table if not exists public.moments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  caption text not null default '',
  moment_date date not null default current_date,
  location text,
  status text not null default 'published' check (status in ('published', 'hidden', 'removed')),
  reaction_count int not null default 0,
  comment_count int not null default 0,
  report_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Tabel moment_photos
create table if not exists public.moment_photos (
  id uuid primary key default gen_random_uuid(),
  moment_id uuid not null references public.moments(id) on delete cascade,
  storage_path text not null,
  width int not null,
  height int not null,
  blurhash text,
  alt_text text,
  position smallint not null check (position >= 0 and position < 5),
  unique (moment_id, position)
);

-- 3. Tabel tags dan moment_tags
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  slug citext not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.moment_tags (
  moment_id uuid not null references public.moments(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (moment_id, tag_id)
);

-- 4. Tabel moment_reactions
create table if not exists public.moment_reactions (
  moment_id uuid not null references public.moments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null check (emoji in ('love', 'haha', 'sad', 'fire', 'pray')),
  created_at timestamptz not null default now(),
  primary key (moment_id, user_id)
);

-- 5. Tabel comments
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  moment_id uuid not null references public.moments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(body) >= 1 and length(body) <= 500),
  status text not null default 'published' check (status in ('published', 'hidden', 'removed')),
  report_count int not null default 0,
  created_at timestamptz not null default now()
);

-- 6. Indexes untuk performa kueri feed & pencarian
create index on public.moments (status, created_at desc, id desc);
create index on public.moments (user_id, created_at desc);
create index on public.moments (moment_date);
create index on public.moment_photos (moment_id, position);
create index on public.comments (moment_id, created_at asc);
create index on public.tags (slug);

-- 7. Functions & Triggers untuk hitungan denormalisasi & updated_at
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_moments_updated_at
  before update on public.moments
  for each row execute function public.update_updated_at_column();

-- Trigger hitungan reaksi moment
create or replace function public.handle_moment_reaction_change()
returns trigger
language plpgsql
security definer
as $$
begin
  if (tg_op = 'INSERT') then
    update public.moments
    set reaction_count = reaction_count + 1
    where id = new.moment_id;
  elsif (tg_op = 'DELETE') then
    update public.moments
    set reaction_count = greatest(0, reaction_count - 1)
    where id = old.moment_id;
  end if;
  return null;
end;
$$;

create trigger on_moment_reaction_changed
  after insert or delete on public.moment_reactions
  for each row execute function public.handle_moment_reaction_change();

-- Trigger hitungan komentar moment
create or replace function public.handle_moment_comment_change()
returns trigger
language plpgsql
security definer
as $$
begin
  if (tg_op = 'INSERT') then
    update public.moments
    set comment_count = comment_count + 1
    where id = new.moment_id;
  elsif (tg_op = 'DELETE') then
    update public.moments
    set comment_count = greatest(0, comment_count - 1)
    where id = old.moment_id;
  end if;
  return null;
end;
$$;

create trigger on_moment_comment_changed
  after insert or delete on public.comments
  for each row execute function public.handle_moment_comment_change();

-- 8. Enable Row Level Security (RLS) di semua tabel baru
alter table public.moments enable row level security;
alter table public.moment_photos enable row level security;
alter table public.tags enable row level security;
alter table public.moment_tags enable row level security;
alter table public.moment_reactions enable row level security;
alter table public.comments enable row level security;

-- 9. Kebijakan RLS

-- moments RLS
create policy "Moments are viewable if published or owned or by moderator"
  on public.moments
  for select
  using (
    status = 'published'
    or auth.uid() = user_id
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'moderator')
    )
  );

create policy "Users can insert moments if not banned"
  on public.moments
  for insert
  with check (
    auth.uid() = user_id
    and not exists (
      select 1 from public.profiles
      where id = auth.uid() and is_banned = true
    )
  );

create policy "Users can update their own moments"
  on public.moments
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own moments or admins can delete"
  on public.moments
  for delete
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- moment_photos RLS
create policy "Photos are viewable if parent moment is viewable"
  on public.moment_photos
  for select
  using (
    exists (
      select 1 from public.moments m
      where m.id = moment_photos.moment_id
      and (
        m.status = 'published'
        or m.user_id = auth.uid()
        or exists (
          select 1 from public.profiles
          where id = auth.uid() and role in ('admin', 'moderator')
        )
      )
    )
  );

create policy "Moment owner can insert photos"
  on public.moment_photos
  for insert
  with check (
    exists (
      select 1 from public.moments m
      where m.id = moment_photos.moment_id and m.user_id = auth.uid()
    )
  );

create policy "Moment owner can delete photos"
  on public.moment_photos
  for delete
  using (
    exists (
      select 1 from public.moments m
      where m.id = moment_photos.moment_id and m.user_id = auth.uid()
    )
  );

-- tags & moment_tags RLS
create policy "Tags are viewable by everyone"
  on public.tags
  for select
  using (true);

create policy "Authenticated users can insert tags"
  on public.tags
  for insert
  with check (auth.uid() is not null);

create policy "Moment tags are viewable by everyone"
  on public.moment_tags
  for select
  using (true);

create policy "Moment owner can attach tags"
  on public.moment_tags
  for insert
  with check (
    exists (
      select 1 from public.moments m
      where m.id = moment_tags.moment_id and m.user_id = auth.uid()
    )
  );

create policy "Moment owner can detach tags"
  on public.moment_tags
  for delete
  using (
    exists (
      select 1 from public.moments m
      where m.id = moment_tags.moment_id and m.user_id = auth.uid()
    )
  );

-- moment_reactions RLS
create policy "Reactions are viewable by everyone"
  on public.moment_reactions
  for select
  using (true);

create policy "Authenticated users can add reactions"
  on public.moment_reactions
  for insert
  with check (
    auth.uid() = user_id
    and not exists (
      select 1 from public.profiles
      where id = auth.uid() and is_banned = true
    )
  );

create policy "Users can update their reaction"
  on public.moment_reactions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can remove their reaction"
  on public.moment_reactions
  for delete
  using (auth.uid() = user_id);

-- comments RLS
create policy "Comments are viewable if published or owned"
  on public.comments
  for select
  using (
    status = 'published'
    or auth.uid() = user_id
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'moderator')
    )
  );

create policy "Authenticated users can comment if not banned"
  on public.comments
  for insert
  with check (
    auth.uid() = user_id
    and not exists (
      select 1 from public.profiles
      where id = auth.uid() and is_banned = true
    )
  );

create policy "Users can delete own comments, or moment owner or admin"
  on public.comments
  for delete
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.moments m
      where m.id = comments.moment_id and m.user_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'moderator')
    )
  );

-- 10. Storage Buckets & Policies
insert into storage.buckets (id, name, public)
values ('moments', 'moments', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Moments storage is publicly accessible"
  on storage.objects
  for select
  using (bucket_id = 'moments');

create policy "Authenticated users can upload to moments bucket in own folder"
  on storage.objects
  for insert
  with check (
    bucket_id = 'moments'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own uploaded photos"
  on storage.objects
  for delete
  using (
    bucket_id = 'moments'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );
