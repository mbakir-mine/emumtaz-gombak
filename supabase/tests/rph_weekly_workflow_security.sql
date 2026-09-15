begin;

do $$
declare
  table_name text;
  rls_enabled boolean;
begin
  foreach table_name in array array[
    'rph_weekly_submissions',
    'rph_weekly_submission_items',
    'rph_weekly_reviews'
  ] loop
    select c.relrowsecurity into rls_enabled
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = table_name;

    if rls_enabled is distinct from true then
      raise exception 'RLS tidak aktif untuk public.%', table_name;
    end if;
    if has_table_privilege('anon', format('public.%I', table_name), 'SELECT') then
      raise exception 'Anon tidak sepatutnya boleh membaca public.%', table_name;
    end if;
    if not has_table_privilege('authenticated', format('public.%I', table_name), 'SELECT') then
      raise exception 'Authenticated memerlukan SELECT untuk public.%', table_name;
    end if;
    if has_table_privilege('authenticated', format('public.%I', table_name), 'INSERT,UPDATE,DELETE') then
      raise exception 'Tulisan terus tidak sepatutnya dibenarkan pada public.%', table_name;
    end if;
  end loop;

  if not has_function_privilege(
    'authenticated',
    'public.transition_rph_weekly_submission(uuid,text,date,uuid,text,text)',
    'EXECUTE'
  ) then
    raise exception 'Authenticated memerlukan EXECUTE untuk RPC aliran e-RPH';
  end if;
  if has_function_privilege(
    'anon',
    'public.transition_rph_weekly_submission(uuid,text,date,uuid,text,text)',
    'EXECUTE'
  ) then
    raise exception 'Anon tidak sepatutnya boleh melaksanakan RPC aliran e-RPH';
  end if;
  if not exists (
    select 1 from pg_trigger
    where tgname = 'rph_submission_content_lock' and not tgisinternal
  ) then
    raise exception 'Trigger kunci kandungan RPH tidak ditemui';
  end if;
end;
$$;

rollback;

select 'RLS, grants, RPC dan trigger aliran e-RPH lulus' as result;
