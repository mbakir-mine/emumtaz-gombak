create or replace function private.can_read_security_audit()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_owner();
$$;

revoke all on function private.can_read_security_audit() from public, anon;
grant execute on function private.can_read_security_audit() to authenticated;
