-- e-Mumtaz Gombak: profil sistem untuk akaun demo.
-- Cara guna:
-- 1. Cipta akaun demo dahulu di Supabase Authentication > Users.
-- 2. Guna password 12345678 dan pastikan email confirmed.
-- 3. Run SQL ini di SQL Editor.
--
-- Email demo:
-- demo.daerah@mumtaz.gombak
-- demo.zon.barat@mumtaz.gombak
-- demo.zon.tengah@mumtaz.gombak
-- demo.zon.timur@mumtaz.gombak
-- demo.admin.sekolah@mumtaz.gombak
-- demo.guru.kelas@mumtaz.gombak
-- demo.guru.subjek@mumtaz.gombak

delete from public.app_users
where email like 'demo.%@emumtaz.local'
   or email like 'demo.%@mumtaz.gombak';

insert into public.app_users (
  email,
  nama,
  role,
  kod_sekolah,
  zon,
  status,
  allowed_nav
)
values
  ('demo.daerah@mumtaz.gombak', 'DEMO ADMIN DAERAH', 'ADMIN_DAERAH', null, null, 'AKTIF', null),
  ('demo.zon.barat@mumtaz.gombak', 'DEMO ADMIN ZON BARAT', 'ADMIN_ZON', null, 'BARAT', 'AKTIF', null),
  ('demo.zon.tengah@mumtaz.gombak', 'DEMO ADMIN ZON TENGAH', 'ADMIN_ZON', null, 'TENGAH', 'AKTIF', null),
  ('demo.zon.timur@mumtaz.gombak', 'DEMO ADMIN ZON TIMUR', 'ADMIN_ZON', null, 'TIMUR', 'AKTIF', null),
  ('demo.admin.sekolah@mumtaz.gombak', 'DEMO ADMIN SEKOLAH', 'ADMIN_SEKOLAH', 'BYP7010', null, 'AKTIF', null),
  ('demo.guru.kelas@mumtaz.gombak', 'DEMO GURU KELAS', 'GURU_KELAS', 'BYP7010', null, 'AKTIF', null),
  ('demo.guru.subjek@mumtaz.gombak', 'DEMO GURU SUBJEK', 'GURU_SUBJEK', 'BYP7010', null, 'AKTIF', null);

select
  email,
  nama,
  role,
  coalesce(kod_sekolah, zon, 'SEMUA') as akses,
  status
from public.app_users
where email like 'demo.%@mumtaz.gombak'
order by role, email;
