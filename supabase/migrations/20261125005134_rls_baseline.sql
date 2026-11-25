-- A0.4: baseline row-level security for profiles.
--
--   Signed-in user  read own profile; update own display_name, photo_url, city_id
--   Moderator/admin read every profile (active staff only)
--   Signed-out      nothing
--   Nobody (API)    insert or delete profiles; change role, status,
--                   phone_verified or timestamps
--
-- Profiles are created by the sign-up trigger (A0.3) and deleted with the
-- auth user (T2.8). Role/status/phone_verified change only through trusted
-- server code using the secret key (phone check T2.3b, admin tools MVP 5).

------------------------------------------------------------------------------
-- is_staff(): true when the signed-in user is an active moderator or admin.
-- SECURITY DEFINER so policies on profiles can call it without recursing
-- into profiles' own RLS. Reused by later policies (reports, moderation).
------------------------------------------------------------------------------

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('moderator', 'admin')
      and p.status = 'active'
  );
$$;

revoke all on function public.is_staff() from public, anon;
grant execute on function public.is_staff() to authenticated;

------------------------------------------------------------------------------
-- Grants: column-level, so the database itself refuses changes to role,
-- status, phone_verified, id and timestamps (not just the app).
------------------------------------------------------------------------------

grant select on public.profiles to authenticated;
grant update (display_name, photo_url, city_id) on public.profiles to authenticated;

------------------------------------------------------------------------------
-- Policies
------------------------------------------------------------------------------

create policy "Users read their own profile; staff read all"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or (select public.is_staff()));

create policy "Users update their own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
