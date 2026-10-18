-- Pip's public bedtime guestbook.
-- Public visitors can read and submit entries; RLS prevents edits and deletes.
create table if not exists public.bedtime_thoughts (
  id uuid primary key default gen_random_uuid(),
  name text not null
    check (char_length(btrim(name)) between 1 and 40),
  thought text not null
    check (char_length(btrim(thought)) between 1 and 280),
  stamp text not null default '⭐'
    check (stamp in ('⭐', '☁️', '🦄', '🎀')),
  created_at timestamptz not null default now()
);

create index if not exists bedtime_thoughts_created_at_idx
  on public.bedtime_thoughts (created_at desc);

alter table public.bedtime_thoughts enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert on table public.bedtime_thoughts to anon, authenticated;
revoke update, delete, truncate on table public.bedtime_thoughts from anon, authenticated;

drop policy if exists "Anyone can read bedtime thoughts" on public.bedtime_thoughts;
create policy "Anyone can read bedtime thoughts"
  on public.bedtime_thoughts
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Visitors can submit valid bedtime thoughts" on public.bedtime_thoughts;
create policy "Visitors can submit valid bedtime thoughts"
  on public.bedtime_thoughts
  for insert
  to anon, authenticated
  with check (
    char_length(btrim(name)) between 1 and 40
    and char_length(btrim(thought)) between 1 and 280
    and stamp in ('⭐', '☁️', '🦄', '🎀')
  );
