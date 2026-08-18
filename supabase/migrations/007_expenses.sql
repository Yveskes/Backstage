-- Expense claims for Team Zeverrock.
-- Run in the Supabase SQL editor if this table does not exist yet.

create table if not exists public.expense_claims (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  user_name text not null,
  user_email text not null,
  title text not null,
  amount_cents integer not null check (amount_cents > 0),
  note text not null default '',
  expense_date date not null,
  status text not null default 'submitted'
    check (status in ('submitted', 'paid', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists expense_claims_created_at_idx
  on public.expense_claims (created_at desc);

alter table public.expense_claims enable row level security;

drop policy if exists "Authenticated read expenses" on public.expense_claims;
create policy "Authenticated read expenses"
  on public.expense_claims for select
  to authenticated
  using (true);

drop policy if exists "Authenticated insert expenses" on public.expense_claims;
create policy "Authenticated insert expenses"
  on public.expense_claims for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated update expenses" on public.expense_claims;
create policy "Authenticated update expenses"
  on public.expense_claims for update
  to authenticated
  using (true);
