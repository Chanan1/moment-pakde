-- Migrasi 3: Tabel Moderation Logs dan Kebijakan Admin Laporan
-- Sesuai docs/DATABASE.md dan docs/TECH_SPEC.md

-- 1. Tabel moderation_logs
create table if not exists public.moderation_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id) on delete cascade,
  action text not null check (action in ('review', 'publish', 'hide', 'restore', 'remove', 'ban', 'block', 'dismiss', 'settings')),
  target_type text not null check (target_type in ('confession', 'moment', 'comment', 'reply', 'user', 'sender', 'settings')),
  target_id text not null,
  note text,
  created_at timestamptz not null default now()
);

-- Indeks efisiensi query audit log admin
create index if not exists idx_moderation_logs_admin on public.moderation_logs(admin_id);
create index if not exists idx_moderation_logs_target on public.moderation_logs(target_type, target_id);
create index if not exists idx_moderation_logs_created_at on public.moderation_logs(created_at desc);

-- 2. Aktifkan RLS
alter table public.moderation_logs enable row level security;

-- Kebijakan RLS moderation_logs: hanya admin dan moderator
create policy "Moderation logs readable and insertable by staff"
  on public.moderation_logs
  for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'moderator')
    )
  );

-- 3. Tambahan RLS policy untuk tabel reports (memperbolehkan update status laporan oleh moderator)
create policy "Moderators can update reports"
  on public.reports
  for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'moderator')
    )
  );
