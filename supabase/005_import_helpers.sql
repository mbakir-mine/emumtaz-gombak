-- e-Mumtaz Gombak import helper examples
-- Use these after importing CSV files into temporary staging tables.
-- Do not run the whole file blindly. Pick the section you need.

-- 1. Example: insert classes from a temporary table named import_classes
-- Expected columns:
-- kod_sekolah, tahun_akademik, tahun, nama_kelas, status
/*
insert into classes (kod_sekolah, tahun_akademik, tahun, nama_kelas, status)
select
  kod_sekolah,
  tahun_akademik::int,
  tahun::int,
  upper(trim(nama_kelas)),
  coalesce(nullif(status, ''), 'AKTIF')
from import_classes
on conflict (kod_sekolah, tahun_akademik, tahun, nama_kelas) do update set
  status = excluded.status;
*/

-- 2. Example: insert students from a temporary table named import_students
-- Expected columns:
-- mykid, nama_murid, jantina, kod_sekolah, nama_kelas, status
/*
insert into students (mykid, nama_murid, jantina, kod_sekolah, class_id, status)
select
  s.mykid,
  s.nama_murid,
  s.jantina,
  s.kod_sekolah,
  c.id as class_id,
  coalesce(nullif(s.status, ''), 'AKTIF')
from import_students s
join classes c
  on c.kod_sekolah = s.kod_sekolah
 and c.nama_kelas = upper(trim(s.nama_kelas))
on conflict (mykid) do update set
  nama_murid = excluded.nama_murid,
  jantina = excluded.jantina,
  kod_sekolah = excluded.kod_sekolah,
  class_id = excluded.class_id,
  status = excluded.status;
*/

-- 3. Example: insert teachers/users from import_app_users
-- Expected columns:
-- email, nama, role, kod_sekolah, status
/*
insert into app_users (email, nama, role, kod_sekolah, status)
select
  lower(trim(email)),
  nama,
  role::user_role,
  nullif(kod_sekolah, ''),
  coalesce(nullif(status, ''), 'AKTIF')
from import_app_users
on conflict (email, role, kod_sekolah) do update set
  nama = excluded.nama,
  status = excluded.status;
*/
