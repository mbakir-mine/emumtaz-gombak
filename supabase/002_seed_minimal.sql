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

insert into app_users (email, nama, role, kod_sekolah, status)
values
  ('owner@emumtaz.local', 'Pemilik e-Mumtaz Gombak', 'OWNER', null, 'AKTIF'),
  ('daerah@emumtaz.local', 'Admin Daerah Gombak', 'ADMIN_DAERAH', null, 'AKTIF'),
  ('admin.byp7001@emumtaz.local', 'Admin SRA Taman Permata', 'ADMIN_SEKOLAH', 'BYP7001', 'AKTIF')
on conflict (email, role, kod_sekolah) do update set
  nama = excluded.nama,
  status = excluded.status;

