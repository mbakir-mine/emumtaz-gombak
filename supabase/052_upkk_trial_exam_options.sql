-- Tambah pilihan Percubaan UPKK dalam jadual peperiksaan utama.
-- Sekolah yang muncul untuk UPKK masih dikawal melalui school_module_access.

insert into public.exams (kod_peperiksaan, nama_peperiksaan, tahun_akademik, status)
values
  ('UPKK1', 'Percubaan UPKK 1', 2026, 'DIBUKA'),
  ('UPKK2', 'Percubaan UPKK 2', 2026, 'DIBUKA')
on conflict (kod_peperiksaan, tahun_akademik) do update set
  nama_peperiksaan = excluded.nama_peperiksaan,
  status = excluded.status;

select kod_peperiksaan, nama_peperiksaan, tahun_akademik, status
from public.exams
where kod_peperiksaan in ('UPKK1', 'UPKK2')
  and tahun_akademik = 2026
order by kod_peperiksaan;
