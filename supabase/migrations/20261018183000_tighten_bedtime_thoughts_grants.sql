-- Tighten privileges on the already-created public bedtime guestbook table.
-- RLS policies still govern which rows anon/authenticated can read or insert.
revoke all privileges on table public.bedtime_thoughts from anon, authenticated;
grant select, insert on table public.bedtime_thoughts to anon, authenticated;
