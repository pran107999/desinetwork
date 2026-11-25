-- A0.3: master data (cities, categories, category fields) and user profiles.
-- Timestamps are timestamptz (UTC). Money is stored in integer cents.

------------------------------------------------------------------------------
-- Shared helpers
------------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create type public.field_type as enum ('text', 'number', 'money', 'select', 'bool', 'date');
create type public.user_role as enum ('user', 'moderator', 'admin');
create type public.user_status as enum ('active', 'suspended', 'banned');

------------------------------------------------------------------------------
-- Cities: city-only location model (D9). A country column can be added later
-- without touching listings.
------------------------------------------------------------------------------

create table public.cities (
  id bigint generated always as identity primary key,
  name text not null check (length(trim(name)) > 0),
  state_label text not null check (length(trim(state_label)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger cities_set_updated_at
  before update on public.cities
  for each row execute function public.set_updated_at();

------------------------------------------------------------------------------
-- Categories: two levels (FR-CAT-1). parent_id is null for top-level ones.
-- price_label null means listings in this category have no price.
------------------------------------------------------------------------------

create table public.categories (
  id bigint generated always as identity primary key,
  parent_id bigint references public.categories (id) on delete restrict,
  name text not null check (length(trim(name)) > 0),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  price_label text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_parent_slug_unique unique nulls not distinct (parent_id, slug),
  constraint categories_not_own_parent check (parent_id is null or parent_id <> id)
);

create index categories_parent_id_idx on public.categories (parent_id);

-- Keep the taxonomy at exactly two levels.
create or replace function public.categories_check_depth()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.parent_id is not null and exists (
    select 1 from public.categories p where p.id = new.parent_id and p.parent_id is not null
  ) then
    raise exception 'categories can only be two levels deep';
  end if;
  return new;
end;
$$;

create trigger categories_check_depth
  before insert or update of parent_id on public.categories
  for each row execute function public.categories_check_depth();

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

------------------------------------------------------------------------------
-- Category fields (FR-CAT-2): extra fields are data, not hard-coded forms.
-- A field can belong to a top-level category (shared by all its
-- subcategories) or to one subcategory. A form shows parent + own fields.
-- options: for select fields, a JSON array of {"value", "label"}.
------------------------------------------------------------------------------

create table public.category_fields (
  id bigint generated always as identity primary key,
  category_id bigint not null references public.categories (id) on delete cascade,
  key text not null check (key ~ '^[a-z][a-z0-9_]*$'),
  label text not null check (length(trim(label)) > 0),
  type public.field_type not null,
  options jsonb,
  required boolean not null default false,
  filterable boolean not null default false,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint category_fields_key_unique unique (category_id, key),
  constraint category_fields_select_has_options check (
    type <> 'select'
    or (jsonb_typeof(options) = 'array' and jsonb_array_length(options) > 0)
  )
);

create index category_fields_category_id_idx on public.category_fields (category_id);

create trigger category_fields_set_updated_at
  before update on public.category_fields
  for each row execute function public.set_updated_at();

------------------------------------------------------------------------------
-- Profiles: one per auth user, created automatically on sign-up.
------------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  photo_url text,
  city_id bigint references public.cities (id) on delete set null,
  phone_verified boolean not null default false,
  role public.user_role not null default 'user',
  status public.user_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_city_id_idx on public.profiles (city_id);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Runs as the table owner so sign-up works even though users cannot insert
-- profiles themselves. Only the display name is copied from sign-up data;
-- role and status always start at their safe defaults.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')), '')
  );
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

------------------------------------------------------------------------------
-- Row-level security. Master data: anyone may read active rows; nobody can
-- write through the API (admins edit via the secret key until T5.9).
-- Profiles: RLS on with no policies yet, so the API sees nothing.
-- Owner policies arrive in A0.4.
------------------------------------------------------------------------------

alter table public.cities enable row level security;
alter table public.categories enable row level security;
alter table public.category_fields enable row level security;
alter table public.profiles enable row level security;

create policy "Active cities are public"
  on public.cities for select
  to anon, authenticated
  using (is_active);

create policy "Active categories are public"
  on public.categories for select
  to anon, authenticated
  using (is_active);

create policy "Active category fields are public"
  on public.category_fields for select
  to anon, authenticated
  using (is_active);

-- Explicit grants so behaviour is the same locally and in the cloud,
-- whatever the project's default table exposure is.
revoke all on public.cities, public.categories, public.category_fields, public.profiles
  from anon, authenticated;
grant select on public.cities, public.categories, public.category_fields to anon, authenticated;
grant select, insert, update, delete
  on public.cities, public.categories, public.category_fields, public.profiles
  to service_role;
