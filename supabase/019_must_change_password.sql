-- e-Mumtaz Gombak: force first-login password change for admin-created users.

alter table public.app_users
  add column if not exists must_change_password boolean not null default false;

comment on column public.app_users.must_change_password is
  'True apabila pengguna perlu menukar password sementara selepas login pertama.';

-- Pastikan akaun sedia ada tidak terkunci selepas migration.
update public.app_users
set must_change_password = false
where must_change_password is null;

select 'must_change_password ready' as status;
