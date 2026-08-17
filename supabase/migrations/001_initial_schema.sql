-- Backstage: festival management database
-- Run in Supabase SQL Editor (step 5)

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type app_module as enum (
  'documents',
  'staff',
  'sponsors',
  'finance',
  'social',
  'tickets',
  'assets',
  'settings'
);

create type invoice_status as enum ('draft', 'sent', 'paid', 'cancelled');
create type post_status as enum ('draft', 'scheduled', 'published', 'cancelled');
create type voucher_status as enum ('pending', 'issued', 'used', 'cancelled');

-- ---------------------------------------------------------------------------
-- Festivals (jaarlijkse edities)
-- ---------------------------------------------------------------------------
create table public.festivals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  year int not null,
  start_date date,
  end_date date,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  unique (name, year)
);

-- ---------------------------------------------------------------------------
-- Profiles (gekoppeld aan Supabase Auth)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Rollen & rechten
-- ---------------------------------------------------------------------------
create table public.roles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  is_system boolean not null default true
);

create table public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles (id) on delete cascade,
  module app_module not null,
  can_view boolean not null default false,
  can_edit boolean not null default false,
  can_admin boolean not null default false,
  unique (role_id, module)
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete cascade,
  festival_id uuid references public.festivals (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, role_id, festival_id)
);

-- ---------------------------------------------------------------------------
-- Medewerkers (met optionele login via profiles.user_id)
-- ---------------------------------------------------------------------------
create table public.staff_members (
  id uuid primary key default gen_random_uuid(),
  festival_id uuid not null references public.festivals (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  department text,
  role_title text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Documentcategorieën (jullie Drive-mappen)
-- ---------------------------------------------------------------------------
create table public.document_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  parent_id uuid references public.document_categories (id) on delete set null,
  sort_order int not null default 0
);

-- ---------------------------------------------------------------------------
-- Documenten + versies
-- ---------------------------------------------------------------------------
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  festival_id uuid not null references public.festivals (id) on delete cascade,
  category_id uuid not null references public.document_categories (id) on delete restrict,
  title text not null,
  description text,
  tags text[] not null default '{}',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  version_number int not null,
  storage_path text not null,
  file_name text not null,
  file_size bigint,
  mime_type text,
  change_note text,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (document_id, version_number)
);

-- ---------------------------------------------------------------------------
-- Brand assets (logo's, brandbook, downloads)
-- ---------------------------------------------------------------------------
create table public.brand_assets (
  id uuid primary key default gen_random_uuid(),
  festival_id uuid not null references public.festivals (id) on delete cascade,
  name text not null,
  asset_type text not null check (asset_type in ('logo', 'brandbook', 'template', 'photo', 'other')),
  storage_path text not null,
  file_name text not null,
  mime_type text,
  version int not null default 1,
  is_downloadable boolean not null default true,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Sponsors & facturen
-- ---------------------------------------------------------------------------
create table public.sponsors (
  id uuid primary key default gen_random_uuid(),
  festival_id uuid not null references public.festivals (id) on delete cascade,
  company_name text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  package_tier text,
  amount numeric(10, 2),
  status text not null default 'prospect' check (status in ('prospect', 'confirmed', 'paid', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sponsor_invoices (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid not null references public.sponsors (id) on delete cascade,
  invoice_number text not null,
  amount numeric(10, 2) not null,
  status invoice_status not null default 'draft',
  due_date date,
  sent_at timestamptz,
  paid_at timestamptz,
  storage_path text,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (sponsor_id, invoice_number)
);

-- ---------------------------------------------------------------------------
-- Social media kalender
-- ---------------------------------------------------------------------------
create table public.social_media_posts (
  id uuid primary key default gen_random_uuid(),
  festival_id uuid not null references public.festivals (id) on delete cascade,
  title text not null,
  content text,
  platforms text[] not null default '{}',
  scheduled_at timestamptz,
  status post_status not null default 'draft',
  media_paths text[] not null default '{}',
  assigned_to uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Vrijkaarten & drankbonnen
-- ---------------------------------------------------------------------------
create table public.complimentary_tickets (
  id uuid primary key default gen_random_uuid(),
  festival_id uuid not null references public.festivals (id) on delete cascade,
  recipient_name text not null,
  recipient_email text,
  ticket_type text not null default 'guest',
  quantity int not null default 1 check (quantity > 0),
  status voucher_status not null default 'pending',
  issued_by uuid references public.profiles (id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create table public.drink_vouchers (
  id uuid primary key default gen_random_uuid(),
  festival_id uuid not null references public.festivals (id) on delete cascade,
  recipient_name text not null,
  recipient_email text,
  voucher_type text not null default 'standard',
  quantity int not null default 1 check (quantity > 0),
  status voucher_status not null default 'pending',
  issued_by uuid references public.profiles (id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Helper: permissie-check
-- ---------------------------------------------------------------------------
create or replace function public.has_permission(
  p_module app_module,
  p_action text default 'view'
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_allowed boolean := false;
begin
  if v_user_id is null then
    return false;
  end if;

  select exists (
    select 1
    from public.user_roles ur
    join public.role_permissions rp on rp.role_id = ur.role_id
    where ur.user_id = v_user_id
      and rp.module = p_module
      and (
        (p_action = 'view' and rp.can_view)
        or (p_action = 'edit' and rp.can_edit)
        or (p_action = 'admin' and rp.can_admin)
      )
  )
  into v_allowed;

  return coalesce(v_allowed, false);
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_permission('settings'::app_module, 'admin');
$$;

-- Auto profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.festivals enable row level security;
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.staff_members enable row level security;
alter table public.document_categories enable row level security;
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.brand_assets enable row level security;
alter table public.sponsors enable row level security;
alter table public.sponsor_invoices enable row level security;
alter table public.social_media_posts enable row level security;
alter table public.complimentary_tickets enable row level security;
alter table public.drink_vouchers enable row level security;

-- Profiles
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins manage profiles"
  on public.profiles for all
  using (public.is_admin());

-- Festivals
create policy "Authenticated users can view festivals"
  on public.festivals for select
  to authenticated
  using (true);

create policy "Admins manage festivals"
  on public.festivals for all
  using (public.is_admin());

-- Roles & permissions (read for authenticated, write for admin)
create policy "Authenticated can read roles"
  on public.roles for select to authenticated using (true);

create policy "Admins manage roles"
  on public.roles for all using (public.is_admin());

create policy "Authenticated can read role permissions"
  on public.role_permissions for select to authenticated using (true);

create policy "Admins manage role permissions"
  on public.role_permissions for all using (public.is_admin());

create policy "Users can read own roles"
  on public.user_roles for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Admins manage user roles"
  on public.user_roles for all using (public.is_admin());

-- Document categories (everyone authenticated can read)
create policy "Authenticated can read categories"
  on public.document_categories for select to authenticated using (true);

create policy "Admins manage categories"
  on public.document_categories for all using (public.is_admin());

-- Generic module policies
create policy "Documents view"
  on public.documents for select to authenticated
  using (public.has_permission('documents', 'view'));

create policy "Documents edit"
  on public.documents for all to authenticated
  using (public.has_permission('documents', 'edit'));

create policy "Document versions view"
  on public.document_versions for select to authenticated
  using (public.has_permission('documents', 'view'));

create policy "Document versions edit"
  on public.document_versions for all to authenticated
  using (public.has_permission('documents', 'edit'));

create policy "Staff view"
  on public.staff_members for select to authenticated
  using (public.has_permission('staff', 'view') or auth.uid() = user_id);

create policy "Staff edit"
  on public.staff_members for all to authenticated
  using (public.has_permission('staff', 'edit'));

create policy "Assets view"
  on public.brand_assets for select to authenticated
  using (public.has_permission('assets', 'view'));

create policy "Assets edit"
  on public.brand_assets for all to authenticated
  using (public.has_permission('assets', 'edit'));

create policy "Sponsors view"
  on public.sponsors for select to authenticated
  using (public.has_permission('sponsors', 'view'));

create policy "Sponsors edit"
  on public.sponsors for all to authenticated
  using (public.has_permission('sponsors', 'edit'));

create policy "Invoices view"
  on public.sponsor_invoices for select to authenticated
  using (public.has_permission('finance', 'view'));

create policy "Invoices edit"
  on public.sponsor_invoices for all to authenticated
  using (public.has_permission('finance', 'edit'));

create policy "Social view"
  on public.social_media_posts for select to authenticated
  using (public.has_permission('social', 'view'));

create policy "Social edit"
  on public.social_media_posts for all to authenticated
  using (public.has_permission('social', 'edit'));

create policy "Tickets view"
  on public.complimentary_tickets for select to authenticated
  using (public.has_permission('tickets', 'view'));

create policy "Tickets edit"
  on public.complimentary_tickets for all to authenticated
  using (public.has_permission('tickets', 'edit'));

create policy "Vouchers view"
  on public.drink_vouchers for select to authenticated
  using (public.has_permission('tickets', 'view'));

create policy "Vouchers edit"
  on public.drink_vouchers for all to authenticated
  using (public.has_permission('tickets', 'edit'));

-- ---------------------------------------------------------------------------
-- Seed: rollen
-- ---------------------------------------------------------------------------
insert into public.roles (slug, name, description) values
  ('admin', 'Administrator', 'Volledige toegang tot alle modules'),
  ('bestuur', 'Bestuur', 'Bestuur en statuten, verslagen'),
  ('finance', 'Financiën', 'Sponsors, facturen, budgetten'),
  ('social', 'Social media', 'Social kalender en promo'),
  ('operations', 'Operaties', 'Leveranciers, terrein, security'),
  ('volunteers', 'Vrijwilligers', 'Vrijwilligersbeheer'),
  ('viewer', 'Lezer', 'Alleen lezen in toegewezen modules');

-- Admin: alles
insert into public.role_permissions (role_id, module, can_view, can_edit, can_admin)
select r.id, m.module, true, true, true
from public.roles r
cross join (values
  ('documents'::app_module),
  ('staff'::app_module),
  ('sponsors'::app_module),
  ('finance'::app_module),
  ('social'::app_module),
  ('tickets'::app_module),
  ('assets'::app_module),
  ('settings'::app_module)
) as m(module)
where r.slug = 'admin';

-- Finance
insert into public.role_permissions (role_id, module, can_view, can_edit, can_admin)
select r.id, m.module,
  true,
  m.module in ('sponsors', 'finance'),
  false
from public.roles r
cross join (values
  ('documents'::app_module),
  ('sponsors'::app_module),
  ('finance'::app_module)
) as m(module)
where r.slug = 'finance';

-- Social
insert into public.role_permissions (role_id, module, can_view, can_edit, can_admin)
select r.id, m.module, true, m.module in ('social', 'assets'), false
from public.roles r
cross join (values
  ('social'::app_module),
  ('assets'::app_module),
  ('documents'::app_module)
) as m(module)
where r.slug = 'social';

-- Viewer: read-only documents + assets
insert into public.role_permissions (role_id, module, can_view, can_edit, can_admin)
select r.id, m.module, true, false, false
from public.roles r
cross join (values
  ('documents'::app_module),
  ('assets'::app_module)
) as m(module)
where r.slug = 'viewer';

-- ---------------------------------------------------------------------------
-- Seed: documentcategorieën (jullie Drive-mappen)
-- ---------------------------------------------------------------------------
insert into public.document_categories (slug, name, sort_order) values
  ('bands-pa', 'Bands + PA', 1),
  ('bestuur-statuten', 'Bestuur en Statuten', 2),
  ('bnip', 'BNIP', 3),
  ('brandweer', 'Brandweer Zone centrum', 4),
  ('cashless', 'Cashless', 5),
  ('drinks-catering', 'Drinks + Catering', 6),
  ('financien', 'Financiën', 7),
  ('fotos', 'Foto''s', 8),
  ('gemeente', 'Gemeente', 9),
  ('security', 'Key Force Security', 10),
  ('leveranciers-terrein', 'Leveranciers en terrein', 11),
  ('netwerk-it', 'Netwerk en IT', 12),
  ('social-promo', 'Social Media + promo', 13),
  ('tickets', 'Tickets', 14),
  ('verslagen', 'Verslagen', 15),
  ('verzekeringen', 'Verzekeringen', 16),
  ('vrijwilligers', 'Vrijwilligers', 17),
  ('webshop', 'Webshop', 18);

-- ---------------------------------------------------------------------------
-- Seed: eerste festival editie (pas aan)
-- ---------------------------------------------------------------------------
insert into public.festivals (name, year, is_active)
values ('Backstage Festival', extract(year from now())::int, true);
