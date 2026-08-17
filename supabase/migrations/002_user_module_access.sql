-- New logins default to staff (lowest access).
-- Only admin may change user_kind or assign modules.

alter table public.profiles
  add column if not exists user_kind text not null default 'staff'
    check (user_kind in ('admin', 'team', 'staff'));

create table if not exists public.user_module_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  module text not null,
  created_at timestamptz not null default now(),
  unique (user_id, module)
);

alter table public.user_module_access enable row level security;

create policy "Users can read own module access"
  on public.user_module_access for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Admins manage module access"
  on public.user_module_access for all
  using (public.is_admin());
