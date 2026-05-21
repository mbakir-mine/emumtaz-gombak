-- Add missing schools to e-Mumtaz Gombak.

insert into schools (kod_sekolah, nama_sekolah, kategori, daerah, status)
values
  ('BBA7228', 'KAFA INTEGRASI SUNGAI PUSU', 'KAFAI', 'GOMBAK', 'AKTIF'),
  ('BYP7001', 'SRA TAMAN PERMATA', 'SRA', 'GOMBAK', 'AKTIF')
on conflict (kod_sekolah) do update set
  nama_sekolah = excluded.nama_sekolah,
  kategori = excluded.kategori,
  daerah = excluded.daerah,
  status = excluded.status;

insert into app_users (email, nama, role, kod_sekolah, status)
values
  ('bba7228@emumtaz.local', 'ADMIN KAFA INTEGRASI SUNGAI PUSU', 'ADMIN_SEKOLAH', 'BBA7228', 'AKTIF'),
  ('byp7001@emumtaz.local', 'ADMIN SRA TAMAN PERMATA', 'ADMIN_SEKOLAH', 'BYP7001', 'AKTIF')
on conflict (email, role, kod_sekolah) do update set
  nama = excluded.nama,
  status = excluded.status;

