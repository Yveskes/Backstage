-- Activity feed: likes, comments, and new members.
-- Run in the Supabase SQL editor if this table does not exist yet.

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('comment', 'reaction', 'member_joined')),
  actor_id text,
  actor_name text not null,
  title text not null,
  body text not null,
  href text,
  category text not null default 'medewerkers',
  source_id text not null,
  audience text[] not null default array['admin', 'team'],
  created_at timestamptz not null default now(),
  unique (source_id)
);

create index if not exists activity_events_created_at_idx
  on public.activity_events (created_at desc);

alter table public.activity_events enable row level security;

drop policy if exists "Authenticated read activity" on public.activity_events;
create policy "Authenticated read activity"
  on public.activity_events for select
  to authenticated
  using (true);

drop policy if exists "Authenticated insert activity" on public.activity_events;
create policy "Authenticated insert activity"
  on public.activity_events for insert
  to authenticated
  with check (true);
