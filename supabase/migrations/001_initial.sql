-- Meet & Greet — run in Supabase SQL Editor (or via CLI migrations).
-- After apply: Authentication → Providers → enable "Anonymous sign-ins".

create extension if not exists "uuid-ossp";

create table public.topics (
  id uuid primary key default gen_random_uuid (),
  title text not null check (char_length(trim(title)) > 0),
  lat double precision not null,
  lng double precision not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);

create table public.topic_members (
  topic_id uuid not null references public.topics (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (topic_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid (),
  topic_id uuid not null references public.topics (id) on delete cascade,
  author_name text not null default 'Guest',
  body text not null check (
    char_length(trim(body)) > 0
    and char_length(body) <= 4000
  ),
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index messages_topic_created_idx on public.messages (topic_id, created_at asc);

create table public.sport_meetups (
  id uuid primary key default gen_random_uuid (),
  sport text not null,
  title text not null,
  needed_players integer not null check (needed_players between 2 and 100),
  lat double precision not null,
  lng double precision not null,
  slot_label text not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);

create table public.sport_meetup_members (
  meetup_id uuid not null references public.sport_meetups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (meetup_id, user_id)
);

alter table public.topics enable row level security;
alter table public.topic_members enable row level security;
alter table public.messages enable row level security;
alter table public.sport_meetups enable row level security;
alter table public.sport_meetup_members enable row level security;

create policy topics_select on public.topics for select to authenticated using (true);

create policy topics_insert on public.topics for insert to authenticated with check (
  auth.uid () is not null
);

create policy topic_members_select on public.topic_members for select to authenticated using (true);

create policy topic_members_insert on public.topic_members for insert to authenticated with check (
  auth.uid () = user_id
);

create policy messages_select on public.messages for select to authenticated using (true);

create policy messages_insert on public.messages for insert to authenticated with check (
  auth.uid () is not null
  and user_id = auth.uid ()
);

create policy sport_select on public.sport_meetups for select to authenticated using (true);

create policy sport_insert on public.sport_meetups for insert to authenticated with check (
  auth.uid () is not null
);

create policy sport_members_select on public.sport_meetup_members for select to authenticated using (true);

create policy sport_members_insert on public.sport_meetup_members for insert to authenticated with check (
  auth.uid () = user_id
);

create or replace function public.list_topics_feed ()
returns table (
  id uuid,
  title text,
  lat double precision,
  lng double precision,
  created_at timestamptz,
  message_count bigint,
  join_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    t.id,
    t.title,
    t.lat,
    t.lng,
    t.created_at,
    (
      select count(*)::bigint
      from public.messages m
      where
        m.topic_id = t.id
    ),
    (
      select count(*)::bigint
      from public.topic_members tm
      where
        tm.topic_id = t.id
    )
  from public.topics t
  order by t.created_at desc;
$$;

grant execute on function public.list_topics_feed () to authenticated;

create or replace function public.list_sport_meetups_feed ()
returns table (
  id uuid,
  sport text,
  title text,
  needed_players integer,
  lat double precision,
  lng double precision,
  slot_label text,
  created_at timestamptz,
  joined_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    m.id,
    m.sport,
    m.title,
    m.needed_players,
    m.lat,
    m.lng,
    m.slot_label,
    m.created_at,
    (
      select count(*)::bigint
      from public.sport_meetup_members sm
      where
        sm.meetup_id = m.id
    )
  from public.sport_meetups m
  order by m.created_at desc;
$$;

grant execute on function public.list_sport_meetups_feed () to authenticated;

create or replace function public.join_sport_meetup (p_meetup_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  cap integer;
  cnt integer;
begin
  select
    needed_players into strict cap
  from
    public.sport_meetups
  where
    id = p_meetup_id;

  select
    count(*)::int into cnt
  from
    public.sport_meetup_members
  where
    meetup_id = p_meetup_id;

  if cnt >= cap then
    return jsonb_build_object('ok', false, 'reason', 'full');
  end if;

  insert into public.sport_meetup_members (meetup_id, user_id)
  values (p_meetup_id, auth.uid ())
  on conflict do nothing;

  select
    count(*)::int into cnt
  from
    public.sport_meetup_members
  where
    meetup_id = p_meetup_id;

  return jsonb_build_object('ok', true, 'joined_count', cnt);
end;
$$;

grant execute on function public.join_sport_meetup (uuid) to authenticated;

alter publication supabase_realtime add table public.topics;

alter publication supabase_realtime add table public.messages;

alter publication supabase_realtime add table public.topic_members;

alter publication supabase_realtime add table public.sport_meetups;

alter publication supabase_realtime add table public.sport_meetup_members;
