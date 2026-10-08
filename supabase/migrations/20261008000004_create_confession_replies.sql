-- Migrasi 4: Balasan Anonim Confess (confession_replies)
-- Sesuai docs/DATABASE.md dan docs/API.md

-- 1. Tabel confession_replies
create table if not exists public.confession_replies (
  id uuid primary key default gen_random_uuid(),
  confession_id uuid not null references public.confessions(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  status text not null default 'published' check (status in ('pending', 'published', 'hidden', 'removed')),
  auto_flags text[] not null default '{}',
  reviewed_at timestamptz,
  sender_hash text not null,
  report_count int not null default 0,
  created_at timestamptz not null default now()
);

-- Indeks efisiensi pemanggilan balasan per confess
create index if not exists idx_confession_replies_confession on public.confession_replies(confession_id, created_at asc);

-- 2. View Publik untuk menjamin kerahasiaan sender_hash
create or replace view public.public_confession_replies as
select
  id,
  confession_id,
  body,
  created_at
from public.confession_replies
where status = 'published';

-- 3. Row Level Security
alter table public.confession_replies enable row level security;

create policy "Published replies readable by everyone"
  on public.confession_replies
  for select
  using (
    status = 'published'
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'moderator')
    )
  );

create policy "Moderators can update replies"
  on public.confession_replies
  for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'moderator')
    )
  );
