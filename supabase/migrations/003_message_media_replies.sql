-- Replies + image/GIF attachments on messages.
-- Run after 002_topic_delete.sql

alter table public.messages
  add column if not exists reply_to_id uuid references public.messages (id) on delete set null,
  add column if not exists media_url text,
  add column if not exists media_type text check (
    media_type is null
    or media_type in ('image', 'gif')
  );

alter table public.messages drop constraint if exists messages_body_check;

alter table public.messages add constraint messages_body_check check (
  char_length(body) <= 4000
  and (
    char_length(trim(body)) > 0
    or media_url is not null
  )
);

create index if not exists messages_reply_to_idx on public.messages (reply_to_id);

insert into storage.buckets (id, name, public)
values ('tea-media', 'tea-media', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists tea_media_select on storage.objects;
create policy tea_media_select on storage.objects for select to authenticated using (
  bucket_id = 'tea-media'
);

drop policy if exists tea_media_insert on storage.objects;
create policy tea_media_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'tea-media'
);
