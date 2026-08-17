-- Split names so messages can always use first name.

alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text;

alter table public.invites
  add column if not exists first_name text,
  add column if not exists last_name text;

update public.profiles
set
  first_name = coalesce(first_name, split_part(full_name, ' ', 1)),
  last_name = coalesce(
    last_name,
    nullif(btrim(substr(full_name, length(split_part(full_name, ' ', 1)) + 1)), '')
  )
where first_name is null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, first_name, last_name, user_kind)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    coalesce(new.raw_user_meta_data ->> 'first_name', split_part(coalesce(new.raw_user_meta_data ->> 'full_name', ''), ' ', 1)),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    'staff'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
