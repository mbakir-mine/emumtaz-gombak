-- Add Sekolah Rendah Islam Irsyadiyah as the SRI school category.

insert into schools (kod_sekolah, nama_sekolah, kategori, daerah, status)
values
  ('BJJ7011', 'SEKOLAH RENDAH ISLAM IRSYADIYAH', 'SRI', 'GOMBAK', 'AKTIF')
on conflict (kod_sekolah) do update set
  nama_sekolah = excluded.nama_sekolah,
  kategori = excluded.kategori,
  daerah = excluded.daerah,
  status = excluded.status;
