-- Extension citext untuk username case-insensitive
create extension if not exists citext;

-- Tabel profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username citext unique,
  display_name text,
  avatar_url text,
  bio text,
  role text not null default 'user' check (role in ('user', 'moderator', 'admin')),
  is_banned boolean not null default false,
  created_at timestamptz not null default now()
);

-- Aktifkan RLS
alter table public.profiles enable row level security;

-- Kebijakan RLS untuk profiles
create policy "Profiles are viewable by everyone"
  on public.profiles
  for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select p.role from public.profiles p where p.id = auth.uid())
    and is_banned = (select p.is_banned from public.profiles p where p.id = auth.uid())
  );

create policy "Users can delete their own profile"
  on public.profiles
  for delete
  using (auth.uid() = id);

-- Fungsi & trigger saat user baru mendaftar (Google / Email)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  raw_username text;
  clean_username text;
  final_username text;
begin
  raw_username := split_part(new.email, '@', 1);
  clean_username := lower(regexp_replace(coalesce(raw_username, 'user'), '[^a-z0-9_.]', '_', 'g'));
  if length(clean_username) < 3 then
    clean_username := 'user_' || clean_username;
  end if;
  final_username := clean_username || '_' || substr(new.id::text, 1, 4);

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    final_username,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', raw_username),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Trigger pada auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
