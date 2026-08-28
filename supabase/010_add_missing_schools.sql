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

-- Pengguna sekolah perlu didaftarkan menggunakan email sebenar melalui aplikasi.
