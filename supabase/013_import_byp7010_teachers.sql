-- Import helper for BYP7010 teachers.
-- Steps:
-- 1. Import outputs/byp7010_guru_app_users.csv into a temporary table named import_byp7010_guru_app_users.
-- 2. Run this SQL.

insert into app_users (email, nama, role, kod_sekolah, status)
select
  lower(trim(email)),
  upper(trim(nama)),
  role::user_role,
  kod_sekolah,
  coalesce(nullif(status, ''), 'AKTIF')
from import_byp7010_guru_app_users
on conflict (email, role, kod_sekolah) do update set
  nama = excluded.nama,
  status = excluded.status;

select role, count(*) as total
from app_users
where kod_sekolah = 'BYP7010'
group by role
order by role;

