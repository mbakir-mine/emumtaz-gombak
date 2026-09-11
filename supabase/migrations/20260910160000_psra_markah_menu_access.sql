-- Selaraskan modul sekolah dan pilihan peperiksaan PSRA.
-- Migration ini tidak memadam data dan selamat dijalankan sekali sahaja.

begin;

alter table public.school_module_access
  drop constraint if exists school_module_access_module_key_check;

alter table public.school_module_access
  add constraint school_module_access_module_key_check check (
    module_key in (
      'TAKWIM',
      'KEHADIRAN_HARIAN',
      'AMAL_KHAIR',
      'JADUAL_WAKTU',
      'RPH_AI',
      'AKSES_IBU_BAPA',
      'PELAPORAN_PBD',
      'PENILAIAN_UPKK',
      'KHALIFAH_MUDA',
      'PERCUBAAN_PSRA',
      'PERCUBAAN_UPKK'
    )
  );

insert into public.exams (kod_peperiksaan, nama_peperiksaan, tahun_akademik, status)
values
  ('PSRA1', 'Percubaan PSRA 1', extract(year from current_date)::integer, 'DIBUKA'),
  ('PSRA2', 'Percubaan PSRA 2', extract(year from current_date)::integer, 'DIBUKA')
on conflict (kod_peperiksaan, tahun_akademik) do update
set nama_peperiksaan = excluded.nama_peperiksaan,
    status = excluded.status;

commit;
