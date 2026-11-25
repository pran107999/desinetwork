-- Review fixes for the A0.3 taxonomy (found before A0.4):
-- 1. The two-level rule only checked the new parent, so a category that
--    already had subcategories could be moved under another one (3 levels).
-- 2. A subcategory could define a field key its parent already defines,
--    so the post-ad form would show the field twice.
-- 3. Subcategories stored a copy of the parent's price label, which would
--    go stale when an admin renames it. The label now lives on the parent only.

------------------------------------------------------------------------------
-- 1. Two levels, checked in both directions
------------------------------------------------------------------------------

create or replace function public.categories_check_depth()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.parent_id is null then
    return new;
  end if;
  if exists (
    select 1 from public.categories p where p.id = new.parent_id and p.parent_id is not null
  ) then
    raise exception 'categories can only be two levels deep (parent is already a subcategory)';
  end if;
  if tg_op = 'UPDATE' and exists (
    select 1 from public.categories c where c.parent_id = new.id
  ) then
    raise exception 'categories can only be two levels deep (category has subcategories)';
  end if;
  return new;
end;
$$;

------------------------------------------------------------------------------
-- 3. Price label only on top-level categories
------------------------------------------------------------------------------

update public.categories set price_label = null where parent_id is not null;

alter table public.categories
  add constraint categories_price_label_top_level_only
  check (parent_id is null or price_label is null);

------------------------------------------------------------------------------
-- 2. A field key is unique across a category and its subcategories
--    (siblings may share a key, e.g. "beds" on House and Condo).
------------------------------------------------------------------------------

create or replace function public.category_fields_check_key()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_parent_id bigint;
begin
  select c.parent_id into v_parent_id from public.categories c where c.id = new.category_id;

  if v_parent_id is not null then
    -- Subcategory field: the parent must not already define this key.
    if exists (
      select 1 from public.category_fields f
      where f.category_id = v_parent_id and f.key = new.key
    ) then
      raise exception 'field "%" is already defined on the parent category', new.key;
    end if;
  else
    -- Top-level field: none of its subcategories may already define this key.
    if exists (
      select 1 from public.category_fields f
      join public.categories c on c.id = f.category_id
      where c.parent_id = new.category_id and f.key = new.key and f.id is distinct from new.id
    ) then
      raise exception 'field "%" is already defined on a subcategory', new.key;
    end if;
  end if;
  return new;
end;
$$;

create trigger category_fields_check_key
  before insert or update of key, category_id on public.category_fields
  for each row execute function public.category_fields_check_key();

-- Moving a subcategory to a new parent must not create a duplicate either.
create or replace function public.categories_check_field_keys()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.parent_id is not null and exists (
    select 1
    from public.category_fields own
    join public.category_fields parent_f
      on parent_f.category_id = new.parent_id and parent_f.key = own.key
    where own.category_id = new.id
  ) then
    raise exception 'subcategory has a field already defined on the new parent';
  end if;
  return new;
end;
$$;

create trigger categories_check_field_keys
  before update of parent_id on public.categories
  for each row execute function public.categories_check_field_keys();
