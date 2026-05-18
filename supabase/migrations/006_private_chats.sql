-- Private DMs between users in a tea room (request → accept → chat).
-- Run after 005_admin_setup_note.sql

create table if not exists public.dm_requests (
  id uuid primary key default gen_random_uuid (),
  topic_id uuid not null references public.topics (id) on delete cascade,
  from_user_id uuid not null references auth.users (id) on delete cascade,
  to_user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (
    status in ('pending', 'accepted', 'rejected')
  ),
  created_at timestamptz not null default now(),
  constraint dm_requests_no_self check (from_user_id <> to_user_id),
  constraint dm_requests_unique_pair unique (topic_id, from_user_id, to_user_id)
);

create table if not exists public.dm_threads (
  id uuid primary key default gen_random_uuid (),
  topic_id uuid not null references public.topics (id) on delete cascade,
  user_a_id uuid not null references auth.users (id) on delete cascade,
  user_b_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint dm_threads_ordered check (user_a_id < user_b_id),
  constraint dm_threads_unique_pair unique (topic_id, user_a_id, user_b_id)
);

create table if not exists public.dm_messages (
  id uuid primary key default gen_random_uuid (),
  thread_id uuid not null references public.dm_threads (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (
    char_length(trim(body)) > 0
    and char_length(body) <= 4000
  ),
  created_at timestamptz not null default now()
);

create index if not exists dm_requests_to_user_idx on public.dm_requests (to_user_id, status);
create index if not exists dm_requests_from_user_idx on public.dm_requests (from_user_id);
create index if not exists dm_threads_topic_idx on public.dm_threads (topic_id);
create index if not exists dm_messages_thread_created_idx on public.dm_messages (thread_id, created_at asc);

alter table public.dm_requests enable row level security;
alter table public.dm_threads enable row level security;
alter table public.dm_messages enable row level security;

drop policy if exists dm_requests_select on public.dm_requests;
create policy dm_requests_select on public.dm_requests for select to authenticated using (
  from_user_id = auth.uid ()
  or to_user_id = auth.uid ()
);

drop policy if exists dm_requests_insert on public.dm_requests;
create policy dm_requests_insert on public.dm_requests for insert to authenticated with check (
  from_user_id = auth.uid ()
  and from_user_id <> to_user_id
);

drop policy if exists dm_requests_update on public.dm_requests;
create policy dm_requests_update on public.dm_requests for update to authenticated using (
  to_user_id = auth.uid ()
) with check (to_user_id = auth.uid ());

drop policy if exists dm_threads_select on public.dm_threads;
create policy dm_threads_select on public.dm_threads for select to authenticated using (
  user_a_id = auth.uid ()
  or user_b_id = auth.uid ()
);

drop policy if exists dm_threads_insert on public.dm_threads;
create policy dm_threads_insert on public.dm_threads for insert to authenticated with check (
  user_a_id = auth.uid ()
  or user_b_id = auth.uid ()
);

drop policy if exists dm_messages_select on public.dm_messages;
create policy dm_messages_select on public.dm_messages for select to authenticated using (
  exists (
    select 1
    from public.dm_threads t
    where
      t.id = thread_id
      and (
        t.user_a_id = auth.uid ()
        or t.user_b_id = auth.uid ()
      )
  )
);

drop policy if exists dm_messages_insert on public.dm_messages;
create policy dm_messages_insert on public.dm_messages for insert to authenticated with check (
  sender_id = auth.uid ()
  and exists (
    select 1
    from public.dm_threads t
    where
      t.id = thread_id
      and (
        t.user_a_id = auth.uid ()
        or t.user_b_id = auth.uid ()
      )
  )
);

create or replace function public.accept_dm_request (req_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.dm_requests%rowtype;
  ua uuid;
  ub uuid;
  tid uuid;
begin
  select * into req
  from public.dm_requests
  where
    id = req_id
    and to_user_id = auth.uid ()
    and status = 'pending';

  if not found then
    raise exception 'Request not found or already handled';
  end if;

  update public.dm_requests
  set status = 'accepted'
  where id = req_id;

  if req.from_user_id < req.to_user_id then
    ua := req.from_user_id;
    ub := req.to_user_id;
  else
    ua := req.to_user_id;
    ub := req.from_user_id;
  end if;

  insert into public.dm_threads (topic_id, user_a_id, user_b_id)
  values (req.topic_id, ua, ub)
  on conflict (topic_id, user_a_id, user_b_id) do update
  set topic_id = excluded.topic_id
  returning id into tid;

  return tid;
end;
$$;

grant execute on function public.accept_dm_request (uuid) to authenticated;
