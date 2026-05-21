-- Import helper for BYP7010 SRA AS SIDDIQIN students.
-- Steps:
-- 1. In Supabase Table Editor, create/import CSV outputs/byp7010_classes.csv into a temporary table named import_byp7010_classes.
-- 2. Import CSV outputs/byp7010_students.csv into a temporary table named import_byp7010_students.
-- 3. Run this SQL.

insert into classes (kod_sekolah, tahun_akademik, tahun, nama_kelas, status)
select
  kod_sekolah,
  tahun_akademik::int,
  tahun::int,
  upper(trim(nama_kelas)),
  coalesce(nullif(status, ''), 'AKTIF')
from import_byp7010_classes
on conflict (kod_sekolah, tahun_akademik, tahun, nama_kelas) do update set
  status = excluded.status;

insert into students (mykid, nama_murid, jantina, kod_sekolah, class_id, status)
select
  s.mykid,
  upper(trim(s.nama_murid)),
  s.jantina,
  s.kod_sekolah,
  c.id as class_id,
  coalesce(nullif(s.status, ''), 'AKTIF')
from import_byp7010_students s
join classes c
  on c.kod_sekolah = s.kod_sekolah
 and c.tahun_akademik = 2026
 and c.nama_kelas = upper(trim(s.nama_kelas))
on conflict (mykid) do update set
  nama_murid = excluded.nama_murid,
  jantina = excluded.jantina,
  kod_sekolah = excluded.kod_sekolah,
  class_id = excluded.class_id,
  status = excluded.status;

select 'classes' as item, count(*) as total
from classes
where kod_sekolah = 'BYP7010'
union all
select 'students' as item, count(*) as total
from students
where kod_sekolah = 'BYP7010';

