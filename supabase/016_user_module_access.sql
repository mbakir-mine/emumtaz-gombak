-- e-Mumtaz Gombak: kawalan akses modul ikut pengguna.
-- Run sekali di Supabase SQL Editor.

alter table app_users
add column if not exists allowed_nav text[];

comment on column app_users.allowed_nav is
'Senarai key modul yang dibenarkan untuk pengguna. NULL bermaksud guna akses default berdasarkan role.';

select
  email,
  nama,
  role,
  allowed_nav
from app_users
order by role, nama
limit 20;
