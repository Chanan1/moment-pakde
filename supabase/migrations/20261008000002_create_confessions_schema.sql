-- Migration: 20261008000002_create_confessions_schema.sql
-- Skema Confessions, Reaksi Anonim, Laporan, Pengirim Terblokir, dan App Settings

-- 1. Tabel confessions
create table if not exists public.confessions (
  id uuid primary key default gen_random_uuid(),
  short_id text not null unique,
  body text not null check (length(body) >= 10 and length(body) <= 1000),
  recipient text check (recipient is null or length(recipient) <= 60),
  category text not null check (category in ('naksir', 'terima_kasih', 'curhat', 'minta_maaf', 'unek_unek', 'lainnya')),
  status text not null default 'published' check (status in ('pending', 'published', 'hidden', 'removed')),
  removal_reason text,
  sender_hash text not null,
  secret_code_hash text,
  auto_flags text[] not null default '{}',
  reviewed_at timestamptz,
  reaction_count int not null default 0,
  report_count int not null default 0,
  created_at timestamptz not null default now(),
  published_at timestamptz
);

-- 2. Tabel confession_reactions
create table if not exists public.confession_reactions (
  confession_id uuid not null references public.confessions(id) on delete cascade,
  device_hash text not null,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (confession_id, device_hash)
);

-- 3. Tabel reports
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('moment', 'comment', 'confession', 'reply')),
  target_id uuid not null,
  reason text not null check (reason in ('spam', 'bullying', 'doxxing', 'company', 'sexual', 'other')),
  note text,
  reporter_key text not null,
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  unique (target_type, target_id, reporter_key)
);

-- 4. Tabel blocked_senders
create table if not exists public.blocked_senders (
  sender_hash text primary key,
  reason text,
  blocked_by uuid references public.profiles(id),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- 5. Tabel app_settings
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null
);

-- Seed pengaturan bawaan
insert into public.app_settings (key, value)
values
  ('confess_autohide_threshold', '3'::jsonb),
  ('confess_paused', 'false'::jsonb)
on conflict (key) do nothing;

-- 6. View Publik Confessions (Menyembunyikan sender_hash & secret_code_hash)
create or replace view public.public_confessions as
select
  id,
  short_id,
  body,
  recipient,
  category,
  reaction_count,
  report_count,
  created_at,
  published_at
from public.confessions
where status = 'published';

-- 7. Indexes
create index on public.confessions (status, published_at desc, id desc);
create index on public.confessions (status, created_at) where status = 'pending';
create index on public.confessions (report_count desc, created_at desc)
  where reviewed_at is null and status in ('published', 'hidden');
create index on public.reports (status, created_at) where status = 'open';

-- 8. Triggers
-- Trigger hitungan reaksi confess
create or replace function public.handle_confession_reaction_change()
returns trigger
language plpgsql
security definer
as $$
begin
  if (tg_op = 'INSERT') then
    update public.confessions
    set reaction_count = reaction_count + 1
    where id = new.confession_id;
  elsif (tg_op = 'DELETE') then
    update public.confessions
    set reaction_count = greatest(0, reaction_count - 1)
    where id = old.confession_id;
  end if;
  return null;
end;
$$;

create trigger on_confession_reaction_changed
  after insert or delete on public.confession_reactions
  for each row execute function public.handle_confession_reaction_change();

-- Trigger laporan & auto-hide
create or replace function public.handle_report_autohide()
returns trigger
language plpgsql
security definer
as $$
declare
  threshold int := 3;
begin
  select coalesce((value->>0)::int, 3) into threshold
  from public.app_settings
  where key = 'confess_autohide_threshold';

  if (new.target_type = 'confession') then
    update public.confessions
    set
      report_count = report_count + 1,
      status = case when report_count + 1 >= threshold then 'hidden' else status end,
      reviewed_at = case when report_count + 1 >= threshold then null else reviewed_at end
    where id = new.target_id;
  elsif (new.target_type = 'moment') then
    update public.moments
    set
      report_count = report_count + 1,
      status = case when report_count + 1 >= threshold then 'hidden' else status end
    where id = new.target_id;
  end if;
  return new;
end;
$$;

create trigger on_report_inserted
  after insert on public.reports
  for each row execute function public.handle_report_autohide();

-- 9. Row Level Security
alter table public.confessions enable row level security;
alter table public.confession_reactions enable row level security;
alter table public.reports enable row level security;
alter table public.blocked_senders enable row level security;
alter table public.app_settings enable row level security;

-- Confessions RLS (Hanya boleh dibaca dari view publik atau oleh admin)
create policy "Published confessions readable by everyone"
  on public.confessions
  for select
  using (
    status = 'published'
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'moderator')
    )
  );

-- Admin dan moderator RLS
create policy "Moderators can manage confessions"
  on public.confessions
  for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'moderator')
    )
  );

create policy "Reports accessible by moderators"
  on public.reports
  for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'moderator')
    )
  );

create policy "Blocked senders managed by moderators"
  on public.blocked_senders
  for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'moderator')
    )
  );

create policy "App settings readable by everyone"
  on public.app_settings
  for select
  using (true);

create policy "App settings editable by admins only"
  on public.app_settings
  for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
