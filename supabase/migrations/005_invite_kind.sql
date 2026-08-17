-- Store invite type so accepted accounts can start as staff or team.

alter table public.invites
  add column if not exists user_kind text not null default 'staff'
    check (user_kind in ('staff', 'team'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  invited_kind text;
begin
  invited_kind := coalesce(new.raw_user_meta_data ->> 'user_kind', 'staff');
  if invited_kind not in ('staff', 'team') then
    invited_kind := 'staff';
  end if;

  insert into public.profiles (id, email, full_name, first_name, last_name, user_kind)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    coalesce(new.raw_user_meta_data ->> 'first_name', split_part(coalesce(new.raw_user_meta_data ->> 'full_name', ''), ' ', 1)),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    invited_kind
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
