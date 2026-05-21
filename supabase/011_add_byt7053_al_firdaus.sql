-- Add the 77th school from SIMPENI list.

insert into schools (kod_sekolah, nama_sekolah, kategori, daerah, status)
values
  ('BYT7053', 'KAFA AL-FIRDAUS', 'KAFAI', 'GOMBAK', 'AKTIF')
on conflict (kod_sekolah) do update set
  nama_sekolah = excluded.nama_sekolah,
  kategori = excluded.kategori,
  daerah = excluded.daerah,
  status = excluded.status;

insert into app_users (email, nama, role, kod_sekolah, status)
values
  ('byt7053@emumtaz.local', 'ADMIN KAFA AL-FIRDAUS', 'ADMIN_SEKOLAH', 'BYT7053', 'AKTIF')
on conflict (email, role, kod_sekolah) do update set
  nama = excluded.nama,
  status = excluded.status;

