-- Tambah pilihan Percubaan PSRA dalam jadual peperiksaan utama.
-- Sekolah yang muncul untuk PSRA masih dikawal melalui school_module_access.

insert into public.exams (kod_peperiksaan, nama_peperiksaan, tahun_akademik, status)
values
  ('PSRA1', 'Percubaan PSRA 1', 2026, 'DIBUKA'),
  ('PSRA2', 'Percubaan PSRA 2', 2026, 'DIBUKA')
on conflict (kod_peperiksaan, tahun_akademik) do update set
  nama_peperiksaan = excluded.nama_peperiksaan,
  status = excluded.status;
