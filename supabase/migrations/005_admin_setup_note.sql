-- Optional: register yourself as app admin so you can close any tea room.
-- Run in Supabase SQL editor after signing in with Google once.
--
-- 1. Find your user id: Authentication → Users → copy your UUID
-- 2. Uncomment and run (replace YOUR_USER_UUID):

-- insert into public.app_admins (user_id)
-- values ('YOUR_USER_UUID')
-- on conflict (user_id) do nothing;

-- Also add the same UUID to .env.local:
-- NEXT_PUBLIC_APP_ADMIN_USER_IDS=YOUR_USER_UUID
