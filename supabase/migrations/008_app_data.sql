-- Shared JSON store for Backstage app state (sponsors, planning, social, …).
-- Run in the Supabase SQL Editor.

create table if not exists public.app_data (
  key text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_data enable row level security;

drop policy if exists "Authenticated read app_data" on public.app_data;
create policy "Authenticated read app_data"
  on public.app_data for select
  to authenticated
  using (true);

drop policy if exists "Authenticated insert app_data" on public.app_data;
create policy "Authenticated insert app_data"
  on public.app_data for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated update app_data" on public.app_data;
create policy "Authenticated update app_data"
  on public.app_data for update
  to authenticated
  using (true);

drop policy if exists "Authenticated delete app_data" on public.app_data;
create policy "Authenticated delete app_data"
  on public.app_data for delete
  to authenticated
  using (true);
