-- Run after 001_initial.sql
-- Lets room creators delete their meet spots; app admins can delete any room.
-- Add yourself: insert into public.app_admins (user_id) values ('YOUR_AUTH_USER_UUID');

create table if not exists public.app_admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.app_admins enable row level security;

drop policy if exists app_admins_select_self on public.app_admins;
create policy app_admins_select_self on public.app_admins for select to authenticated using (
  user_id = auth.uid ()
);

drop policy if exists topics_delete_creator on public.topics;
create policy topics_delete_creator on public.topics for delete to authenticated using (
  created_by = auth.uid ()
);

drop policy if exists topics_delete_admin on public.topics;
create policy topics_delete_admin on public.topics for delete to authenticated using (
  exists (
    select 1
    from public.app_admins a
    where a.user_id = auth.uid ()
  )
);

-- 001 defined this without created_by; Postgres requires DROP before changing OUT columns.
drop function if exists public.list_topics_feed ();

create function public.list_topics_feed ()
returns table (
  id uuid,
  title text,
  lat double precision,
  lng double precision,
  created_at timestamptz,
  created_by uuid,
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
    t.created_by,
    (
      select count(*)::bigint
      from public.messages m
      where m.topic_id = t.id
    ),
    (
      select count(*)::bigint
      from public.topic_members tm
      where tm.topic_id = t.id
    )
  from public.topics t
  order by t.created_at desc;
$$;

grant execute on function public.list_topics_feed () to authenticated;
