-- User profiles (display name, bio, avatar).
-- Run after 003_message_media_replies.sql

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (
    char_length(trim(display_name)) > 0
    and char_length(display_name) <= 40
  ),
  bio text not null default '' check (char_length(bio) <= 200),
  avatar_url text,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (true);

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert to authenticated with check (
  auth.uid () = user_id
);

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated using (
  auth.uid () = user_id
) with check (auth.uid () = user_id);

create index if not exists profiles_display_name_idx on public.profiles (display_name);
