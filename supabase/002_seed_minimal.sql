-- e-Mumtaz Gombak minimal seed data
-- Run after 001_emumtaz_schema.sql.

insert into schools (kod_sekolah, nama_sekolah, kategori, daerah, status)
values
  ('BYP7001', 'SRA TAMAN PERMATA', 'SRA', 'GOMBAK', 'AKTIF'),
  ('BYP7002', 'SRA KG SG TUA BHARU', 'SRA', 'GOMBAK', 'AKTIF'),
  ('BYT7001', 'KAFA INTEGRASI AN-NUR (JHEOA)', 'KAFAI', 'GOMBAK', 'AKTIF')
on conflict (kod_sekolah) do update set
  nama_sekolah = excluded.nama_sekolah,
  kategori = excluded.kategori,
  daerah = excluded.daerah,
  status = excluded.status;

insert into exams (kod_peperiksaan, nama_peperiksaan, tahun_akademik, status)
values
  ('UPSA', 'Ujian Pertengahan Semester Akademik', 2026, 'DIBUKA'),
  ('UASA', 'Ujian Akhir Semester Akademik', 2026, 'DIBUKA')
on conflict (kod_peperiksaan, tahun_akademik) do update set
  nama_peperiksaan = excluded.nama_peperiksaan,
  status = excluded.status;

-- Pengguna sistem tidak lagi diseed dengan email dummy.
