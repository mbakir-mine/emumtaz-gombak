-- Jana kelas sesi 2027 berdasarkan semua kelas sesi 2026.
-- Contoh: 2026 Tahun 1 - 1 SAIDINA ABU BAKAR
-- menjadi 2027 Tahun 2 - 2 SAIDINA ABU BAKAR.

insert into classes (kod_sekolah, tahun_akademik, tahun, nama_kelas, status)
select
  c.kod_sekolah,
  2027 as tahun_akademik,
  c.tahun + 1 as tahun,
  upper((c.tahun + 1)::text || ' ' || regexp_replace(c.nama_kelas, '^\s*\d+\s*', '')) as nama_kelas,
  'AKTIF' as status
from classes c
where c.tahun_akademik = 2026
  and c.tahun < 6
on conflict (kod_sekolah, tahun_akademik, tahun, nama_kelas) do nothing;

select
  kod_sekolah,
  tahun_akademik,
  tahun,
  nama_kelas,
  status
from classes
where tahun_akademik = 2027
order by kod_sekolah, tahun, nama_kelas;
