create or replace function private.matches_current_user(target_auth_user_id uuid, target_email text)
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select target_auth_user_id = (select auth.uid())
    or (
      (select auth.uid()) is not null
      and target_email is not null
      and lower(target_email) = lower(coalesce(
        current_setting('request.jwt.claims', true)::jsonb ->> 'email',
        (select auth.jwt() ->> 'email'),
        ''
      ))
    );
$function$;
