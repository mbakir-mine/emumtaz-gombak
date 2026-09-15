delete from public.app_users
where lower(email) = 'irsyadiyah@gmail.com'
  and role::text = 'OWNER'
  and auth_user_id is null;
