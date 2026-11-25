-- Safety net (CLAUDE.md §6): every table in the public schema, now and in
-- future migrations, must have row-level security enabled.
begin;
create extension if not exists pgtap with schema extensions;
select plan(2);

select is_empty(
  $$ select c.relname::text
     from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity $$,
  'every public table has row-level security enabled'
);

-- A table with RLS on but anon/authenticated grants and no policy at all is
-- usually a mistake; list them so a new table without policies is noticed.
select is_empty(
  $$ select c.relname::text
     from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind in ('r', 'p')
       and not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname)
       and (has_table_privilege('anon', c.oid, 'select') or has_table_privilege('authenticated', c.oid, 'select')) $$,
  'no public table is granted to API roles without any policy'
);

select * from finish();
rollback;
