-- Invites: 7-day accept link, 30-day unused purge. Default role is staff.

alter table public.profiles
  add column if not exists user_kind text not null default 'staff'
    check (user_kind in ('admin', 'team', 'staff'));

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text not null,
  token_hash text not null unique,
  invited_by uuid references public.profiles (id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at timestamptz not null,
  purge_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists invites_email_idx on public.invites (email);
create index if not exists invites_status_idx on public.invites (status);

alter table public.invites enable row level security;

drop policy if exists "Admins read invites" on public.invites;
create policy "Admins read invites"
  on public.invites for select
  using (public.is_admin());

drop policy if exists "Admins insert invites" on public.invites;
create policy "Admins insert invites"
  on public.invites for insert
  with check (public.is_admin());

drop policy if exists "Admins update invites" on public.invites;
create policy "Admins update invites"
  on public.invites for update
  using (public.is_admin());

-- New auth users are always staff unless an admin later changes user_kind.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, user_kind)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    'staff'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
