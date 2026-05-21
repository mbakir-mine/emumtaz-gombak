-- e-Mumtaz Gombak system settings
-- Run this in Supabase SQL Editor.

create table if not exists system_settings (
  key text primary key,
  value text not null,
  description text,
  updated_at timestamptz not null default now()
);

insert into system_settings (key, value, description)
values
  ('tahun_murid_min', '1', 'Tahun murid paling rendah dalam sistem'),
  ('tahun_murid_max', '6', 'Tahun murid paling tinggi dalam sistem'),
  ('tahun_akademik_aktif', '2026', 'Tahun akademik aktif semasa'),
  ('sistem_tahap', 'TAHUN_1_HINGGA_6', 'Sistem disetkan untuk Tahun 1 hingga Tahun 6'),
  ('nama_sistem', 'e-Mumtaz Gombak', 'Nama rasmi sistem')
on conflict (key) do update set
  value = excluded.value,
  description = excluded.description,
  updated_at = now();

