-- Menu-onderdelen per persoon (Team Zeverrock). Run in Supabase SQL Editor.

alter table public.profiles
  add column if not exists modules text[] not null default '{}';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, first_name, last_name, user_kind, modules)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    coalesce(new.raw_user_meta_data ->> 'first_name', split_part(coalesce(new.raw_user_meta_data ->> 'full_name', ''), ' ', 1)),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    'staff',
    '{}'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
