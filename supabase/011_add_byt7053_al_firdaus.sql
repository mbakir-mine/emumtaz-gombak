-- Add the 77th school from SIMPENI list.

insert into schools (kod_sekolah, nama_sekolah, kategori, daerah, status)
values
  ('BYT7053', 'KAFA AL-FIRDAUS', 'KAFAI', 'GOMBAK', 'AKTIF')
on conflict (kod_sekolah) do update set
  nama_sekolah = excluded.nama_sekolah,
  kategori = excluded.kategori,
  daerah = excluded.daerah,
  status = excluded.status;

-- Pengguna sekolah perlu didaftarkan menggunakan email sebenar melalui aplikasi.
